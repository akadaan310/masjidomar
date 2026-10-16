"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { assertRole } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { firstError, iqamahRuleSchema, jumuahSchema, overrideSchema, publicationMetaSchema } from "@/lib/validation";
import type { FormState } from "@/app/actions/auth";

async function admin() {
  await assertRole(["admin"]);
  return createClient();
}

function refresh(msg: string): FormState {
  revalidatePath("/admin/prayer");
  revalidatePath("/prayer-times");
  revalidatePath("/display");
  revalidatePath("/");
  return { ok: true, message: msg };
}

export async function createDraft(_p: FormState, fd: FormData): Promise<FormState> {
  const from = fd.get("from");
  const supabase = await admin();
  const { error } = await supabase.rpc("create_prayer_draft", { p_from: from ? z.uuid().parse(from) : undefined });
  return error ? { error: friendlyDbError(error) } : refresh("Draft created. Nothing changes publicly until you publish.");
}

export async function saveDraftMeta(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = publicationMetaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const supabase = await admin();
  const { error } = await supabase
    .from("prayer_publications")
    .update({
      title: d.title,
      calculation_method: d.method,
      madhab: d.madhab,
      effective_from: d.effectiveFrom,
      notice: d.notice,
      adjustments: { fajr: d.adj_fajr, sunrise: d.adj_sunrise, dhuhr: d.adj_dhuhr, asr: d.adj_asr, maghrib: d.adj_maghrib, isha: d.adj_isha },
    })
    .eq("id", d.id)
    .eq("status", "draft");
  return error ? { error: friendlyDbError(error) } : refresh("Calculation settings saved to the draft.");
}

export async function saveIqamahRule(_p: FormState, fd: FormData): Promise<FormState> {
  const publicationId = z.uuid().safeParse(fd.get("publicationId"));
  const parsed = iqamahRuleSchema.safeParse(Object.fromEntries(fd));
  if (!publicationId.success || !parsed.success) return { error: parsed.success ? "Invalid draft" : firstError(parsed.error) };
  const r = parsed.data;
  const supabase = await admin();
  let del = supabase.from("iqamah_schedules").delete().eq("publication_id", publicationId.data).eq("prayer", r.prayer);
  del = r.weekday === null ? del.is("weekday", null) : del.eq("weekday", r.weekday);
  const { error: delErr } = await del;
  if (delErr) return { error: friendlyDbError(delErr) };
  const { error } = await supabase.from("iqamah_schedules").insert({
    publication_id: publicationId.data,
    prayer: r.prayer,
    weekday: r.weekday,
    mode: r.mode,
    time_of_day: r.mode === "fixed" ? r.time : null,
    offset_minutes: r.mode === "offset" ? Number(r.offset) : null,
  });
  return error ? { error: friendlyDbError(error) } : refresh("Iqamah rule saved to the draft.");
}

export async function deleteIqamahRule(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await admin();
  await supabase.from("iqamah_schedules").delete().eq("id", id);
  refresh("");
}

export async function addOverride(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = overrideSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const o = parsed.data;
  const supabase = await admin();
  const { error } = await supabase
    .from("prayer_overrides")
    .upsert(
      { publication_id: o.publicationId, on_date: o.onDate, prayer: o.prayer, iqamah_time: o.time, kind: o.kind, note: o.note },
      { onConflict: "publication_id,on_date,prayer" },
    );
  return error ? { error: friendlyDbError(error) } : refresh("Date override saved to the draft.");
}

export async function deleteOverride(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await admin();
  await supabase.from("prayer_overrides").delete().eq("id", id);
  refresh("");
}

export async function addJumuah(_p: FormState, fd: FormData): Promise<FormState> {
  const parsed = jumuahSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const j = parsed.data;
  const supabase = await admin();
  const { error } = await supabase.from("jumuah_sessions").insert({
    publication_id: j.publicationId,
    label: j.label,
    khutbah_time: j.khutbah,
    iqamah_time: j.iqamah,
    language: j.language,
    note: j.note,
    sort_order: j.sortOrder,
  });
  return error ? { error: friendlyDbError(error) } : refresh("Jumu'ah session added to the draft.");
}

export async function deleteJumuah(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await admin();
  await supabase.from("jumuah_sessions").delete().eq("id", id);
  refresh("");
}

export async function publishDraft(_p: FormState, fd: FormData): Promise<FormState> {
  const id = z.uuid().safeParse(fd.get("id"));
  if (!id.success) return { error: "Invalid draft." };
  const supabase = await admin();
  const { error } = await supabase.rpc("publish_prayer_publication", { p_id: id.data, p_verified: fd.get("verified") === "on" });
  return error ? { error: friendlyDbError(error) } : refresh("Published. The prayer page and masjid screen now show the new schedule.");
}

export async function discardDraft(fd: FormData) {
  const id = z.uuid().parse(fd.get("id"));
  const supabase = await admin();
  await supabase.from("prayer_publications").delete().eq("id", id).eq("status", "draft");
  refresh("");
}
