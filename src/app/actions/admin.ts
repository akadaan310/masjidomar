"use server";
import { revalidatePath } from "next/cache";
import { createClient as createPlainClient } from "@supabase/supabase-js";
import { fromZonedTime } from "date-fns-tz";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { assertRole } from "@/lib/auth";
import { friendlyDbError } from "@/lib/db-errors";
import { publicEnv } from "@/lib/env";
import {
  announcementSchema,
  displaySchema,
  eventSchema,
  faqSchema,
  firstError,
  mediaSchema,
  programSchema,
  settingsSchema,
  volunteerOppSchema,
} from "@/lib/validation";
import type { FormState } from "@/app/actions/auth";

const TZ = "America/New_York";
const local = (v: string) => (v ? fromZonedTime(v.length === 16 ? `${v}:00` : v, TZ).toISOString() : null);

function ok(paths: string[], message: string): FormState {
  paths.forEach((p) => revalidatePath(p));
  return { ok: true, message };
}

// ---------------------------------------------------------------- announcements
export async function saveAnnouncement(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "editor"]);
  const parsed = announcementSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const a = parsed.data;
  const row = {
    slug: a.slug,
    title: a.title,
    title_ar: a.titleAr,
    body_md: a.body,
    body_ar_md: a.bodyAr,
    urgency: a.urgency,
    audience: a.audience,
    status: a.status,
    publish_at: local(a.publishAt) ?? new Date().toISOString(),
    expires_at: local(a.expiresAt),
    show_on_display: a.showOnDisplay,
  };
  const supabase = await createClient();
  const { error } = a.id ? await supabase.from("announcements").update(row).eq("id", a.id) : await supabase.from("announcements").insert(row);
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/announcements", "/announcements", "/", "/display"], a.status === "published" ? "Saved and published (respecting the publish time)." : "Saved.");
}

export async function deleteAnnouncement(fd: FormData) {
  await assertRole(["admin", "editor"]);
  const supabase = await createClient();
  await supabase.from("announcements").delete().eq("id", z.uuid().parse(fd.get("id")));
  ok(["/admin/announcements", "/announcements", "/"], "");
}

// ---------------------------------------------------------------- programs & events
export async function saveProgram(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "editor"]);
  const parsed = programSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const p = parsed.data;
  const row = {
    slug: p.slug,
    title: p.title,
    title_ar: p.titleAr,
    summary: p.summary,
    description_md: p.description,
    category: p.category,
    schedule_note: p.scheduleNote,
    audience_note: p.audienceNote,
    status: p.status,
  };
  const supabase = await createClient();
  const { error } = p.id ? await supabase.from("programs").update(row).eq("id", p.id) : await supabase.from("programs").insert(row);
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/programs", "/programs", "/"], "Program saved.");
}

export async function saveEvent(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "editor"]);
  const parsed = eventSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const e = parsed.data;
  const row = {
    slug: e.slug,
    title: e.title,
    title_ar: e.titleAr,
    description_md: e.description,
    starts_at: local(e.startsAt)!,
    ends_at: local(e.endsAt)!,
    location: e.location,
    capacity: e.capacity === "" ? null : e.capacity,
    rsvp_enabled: e.rsvpEnabled,
    waitlist_enabled: e.waitlistEnabled,
    status: e.status,
    cancel_note: e.cancelNote,
    program_id: e.programId || null,
  };
  const supabase = await createClient();
  const { error } = e.id ? await supabase.from("events").update(row).eq("id", e.id) : await supabase.from("events").insert(row);
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/programs", "/programs", "/", "/display"], e.status === "cancelled" ? "Event marked cancelled. Registrants keep their record." : "Event saved.");
}

// ---------------------------------------------------------------- volunteering
export async function saveOpportunity(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "editor"]);
  const parsed = volunteerOppSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const v = parsed.data;
  const row = { title: v.title, title_ar: v.titleAr, description_md: v.description, commitment: v.commitment, status: v.status };
  const supabase = await createClient();
  const { error } = v.id ? await supabase.from("volunteer_opportunities").update(row).eq("id", v.id) : await supabase.from("volunteer_opportunities").insert(row);
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/volunteer", "/volunteer", "/"], "Opportunity saved.");
}

export async function setInquiryStatus(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const parsed = z.object({ id: z.uuid(), status: z.enum(["new", "contacted", "closed"]), note: z.string().trim().max(2000).default("") }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.from("volunteer_inquiries").update({ status: parsed.data.status }).eq("id", parsed.data.id);
  if (error) return { error: friendlyDbError(error) };
  if (parsed.data.note) {
    const user = await assertRole(["admin"]);
    const { error: e2 } = await supabase.from("volunteer_inquiry_notes").insert({ inquiry_id: parsed.data.id, body: parsed.data.note, author_id: user.id });
    if (e2) return { error: friendlyDbError(e2) };
  }
  return ok(["/admin/volunteer"], "Updated.");
}

// ---------------------------------------------------------------- FAQ moderation
export async function reviewFaqProposal(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "moderator"]);
  const parsed = z.object({ id: z.uuid(), decision: z.enum(["approve", "reject"]), note: z.string().trim().max(600).default("") }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("review_faq_proposal", { p_id: parsed.data.id, p_approve: parsed.data.decision === "approve", p_note: parsed.data.note });
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/faq", "/faq"], parsed.data.decision === "approve" ? "Approved and published to the public FAQ." : "Rejected.");
}

export async function saveFaq(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "moderator"]);
  const parsed = faqSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const f = parsed.data;
  const supabase = await createClient();
  // Editing an approved entry keeps its imam approval only if the answer text is unchanged.
  if (f.id) {
    const { data: existing } = await supabase.from("public_faq").select("answer_md, approved_by_imam, is_sample").eq("id", f.id).maybeSingle();
    const answerChanged = existing && existing.answer_md !== f.answer;
    const { error } = await supabase
      .from("public_faq")
      .update({
        question: f.question,
        answer_md: f.answer,
        category: f.category,
        language: f.language,
        status: answerChanged && !existing?.is_sample ? "draft" : f.status,
        ...(answerChanged ? { approved_by_imam: null, approved_at: null } : {}),
      })
      .eq("id", f.id);
    if (error) return { error: friendlyDbError(error) };
    return ok(["/admin/faq", "/faq"], answerChanged ? "Saved. The answer changed, so it returned to draft until an imam approves it again." : "Saved.");
  }
  return { error: "New FAQ answers must come from an imam proposal." };
}

// ---------------------------------------------------------------- question queue (metadata only)
export async function assignQuestion(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "moderator"]);
  const parsed = z.object({ id: z.uuid(), imamId: z.union([z.literal(""), z.uuid()]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_assign_question", { p_question_id: parsed.data.id, p_imam_id: (parsed.data.imamId || null) as string });
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/questions"], "Assignment updated.");
}

export type BreakGlassState = FormState & { content?: { subject: string; body: string; status: string } };
export async function breakGlassOpen(_p: BreakGlassState, fd: FormData): Promise<BreakGlassState> {
  await assertRole(["admin"]);
  const parsed = z.object({ id: z.uuid(), reason: z.string().trim().min(15).max(300) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Please describe why access is necessary (at least 15 characters)." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_open_question", { p_question_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error || !data?.[0]) return { error: friendlyDbError(error, "Could not open this question.") };
  return { ok: true, message: "Access recorded in the audit log.", content: { subject: data[0].subject, body: data[0].body, status: data[0].status } };
}

// ---------------------------------------------------------------- members & roles
/** Elevated verification: re-check the admin's own password without touching their session. */
async function verifyOwnPassword(email: string, password: string) {
  if (!password) return false;
  const verifier = createPlainClient(publicEnv.supabaseUrl, publicEnv.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await verifier.auth.signInWithPassword({ email, password });
  if (!error) await verifier.auth.signOut({ scope: "local" });
  return !error;
}

export async function changeRole(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await assertRole(["admin"]);
  const parsed = z
    .object({ userId: z.uuid(), role: z.enum(["admin", "imam", "editor", "moderator"]), op: z.enum(["grant", "revoke"]), password: z.string().max(128) })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!(await verifyOwnPassword(me.email, parsed.data.password))) return { error: "Please re-enter your own password to confirm this role change." };
  const supabase = await createClient();
  const { error } =
    parsed.data.op === "grant"
      ? await supabase.rpc("admin_grant_role", { p_user_id: parsed.data.userId, p_role: parsed.data.role })
      : await supabase.rpc("admin_revoke_role", { p_user_id: parsed.data.userId, p_role: parsed.data.role });
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/members"], `Role ${parsed.data.op === "grant" ? "granted" : "removed"}. Recorded in the audit log.`);
}

export async function setAccountStatus(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await assertRole(["admin"]);
  const parsed = z.object({ userId: z.uuid(), status: z.enum(["active", "disabled"]), password: z.string().max(128) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!(await verifyOwnPassword(me.email, parsed.data.password))) return { error: "Please re-enter your own password to confirm." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_status", { p_user_id: parsed.data.userId, p_status: parsed.data.status });
  if (error) return { error: friendlyDbError(error) };
  // Also block/unblock sign-in at the Auth layer (service role, server only, after the DB check passed).
  try {
    const svc = createServiceClient();
    await svc.auth.admin.updateUserById(parsed.data.userId, { ban_duration: parsed.data.status === "disabled" ? "876000h" : "none" });
  } catch {
    return ok(["/admin/members"], "Account status changed in the database. (Auth-level sign-in block could not be applied — check SUPABASE_SECRET_KEY.)");
  }
  return ok(["/admin/members"], parsed.data.status === "disabled" ? "Account disabled and signed out of staff access." : "Account re-enabled.");
}

export async function inviteStaff(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await assertRole(["admin"]);
  const parsed = z.object({ email: z.email(), password: z.string().max(128) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  if (!(await verifyOwnPassword(me.email, parsed.data.password))) return { error: "Please re-enter your own password to confirm." };
  try {
    const svc = createServiceClient();
    const { error } = await svc.auth.admin.inviteUserByEmail(parsed.data.email, { redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/reset-password` });
    if (error) return { error: "The invitation could not be sent (the address may already have an account)." };
  } catch {
    return { error: "Invitations require SUPABASE_SECRET_KEY on the server and a configured email provider." };
  }
  return ok(["/admin/members"], "Invitation sent. Once they accept, grant their role from the list below.");
}

export async function resolveDataRequest(_p: FormState, fd: FormData): Promise<FormState> {
  const me = await assertRole(["admin"]);
  const parsed = z
    .object({ id: z.uuid(), userId: z.union([z.literal(""), z.uuid()]), kind: z.enum(["export", "deletion"]), decision: z.enum(["completed", "rejected"]), password: z.string().max(128), note: z.string().max(500).default("") })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const r = parsed.data;
  if (!(await verifyOwnPassword(me.email, r.password))) return { error: "Please re-enter your own password to confirm." };
  if (r.userId === me.id && r.kind === "deletion") return { error: "Administrators cannot process deletion of their own account." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_data_request", { p_id: r.id, p_status: r.decision, p_note: r.note });
  if (error) return { error: friendlyDbError(error) };
  if (r.kind === "deletion" && r.decision === "completed" && r.userId) {
    try {
      const svc = createServiceClient();
      const { error: delErr } = await svc.auth.admin.deleteUser(r.userId);
      if (delErr) return { error: "Request marked completed, but deleting the auth user failed. Retry from the Supabase dashboard." };
    } catch {
      return { error: "Deleting accounts requires SUPABASE_SECRET_KEY on the server." };
    }
  }
  return ok(["/admin/members"], r.kind === "deletion" && r.decision === "completed" ? "Account and all of its questions were permanently deleted." : "Request resolved.");
}

// ---------------------------------------------------------------- settings & display
export async function saveSettings(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const parsed = settingsSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const s = parsed.data;
  if (!s.conceptMode && fd.get("launchConfirm") !== "I have written approval from masjid leadership") {
    return { error: "Leaving concept mode makes the site look official. Type the confirmation sentence exactly to proceed." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({
      org_name_en: s.orgNameEn,
      org_name_ar: s.orgNameAr,
      address_line: s.addressLine,
      city: s.city,
      region: s.region,
      postal_code: s.postalCode,
      latitude: s.latitude,
      longitude: s.longitude,
      phone: s.phone,
      phone_verified: s.phoneVerified,
      email: s.email,
      email_verified: s.emailVerified,
      concept_mode: s.conceptMode,
      allow_indexing: s.allowIndexing && !s.conceptMode,
      hero_source: s.heroSource,
      accessibility_info: s.accessibilityInfo,
      accessibility_verified: s.accessibilityVerified,
      parking_info: s.parkingInfo,
      parking_verified: s.parkingVerified,
      giving_info: s.givingInfo,
      giving_verified: s.givingVerified,
      imam_hours_note: s.imamHoursNote,
      support_escalation_url: s.supportEscalationUrl,
      imam_shared_queue: s.imamSharedQueue,
      require_staff_mfa: s.requireStaffMfa,
      default_language: s.defaultLanguage,
      question_retention_days: s.questionRetentionDays,
      notification_mode: s.notificationMode,
    })
    .eq("id", true);
  if (error) return { error: friendlyDbError(error) };
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. A revision was recorded." };
}

export async function saveDisplay(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin"]);
  const parsed = displaySchema.safeParse({ ...Object.fromEntries(fd), panels: fd.getAll("panels") });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const d = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("display_presets")
    .update({ panels: d.panels, quiet_mode: d.quietMode, language_mode: d.languageMode, theme: d.theme, show_seconds: d.showSeconds })
    .eq("id", true);
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/display", "/display"], "Screen updated. Connected screens refresh within a minute (instantly with Realtime).");
}

// ---------------------------------------------------------------- media
export async function uploadMedia(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "editor"]);
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image file." };
  if (file.size > 5 * 1024 * 1024) return { error: "Images must be 5 MB or smaller." };
  if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) return { error: "Use JPEG, PNG, WebP or AVIF." };
  const parsed = mediaSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const m = parsed.data;
  if (m.publishApproved && (!m.rightsCleared || m.peopleConsent === "pending")) {
    return { error: "An image can be approved for publishing only when rights are cleared and consent from anyone pictured is not pending." };
  }
  const supabase = await createClient();
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `uploads/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from("public-media").upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: "Upload failed. Check the storage bucket configuration." };
  const { data: pub } = supabase.storage.from("public-media").getPublicUrl(path);
  const { error } = await supabase.from("media_assets").insert({
    storage_path: pub.publicUrl,
    alt_text: m.altText,
    alt_text_ar: m.altTextAr,
    credit: m.credit,
    source: m.source,
    ai_generated: m.source === "ai_concept",
    people_consent: m.peopleConsent,
    rights_cleared: m.rightsCleared,
    privacy_tier: m.publishApproved ? "public" : "internal",
    publish_approved: m.publishApproved,
  });
  if (error) return { error: friendlyDbError(error) };
  return ok(["/admin/media"], "Uploaded with provenance recorded.");
}

export async function setMediaApproval(_p: FormState, fd: FormData): Promise<FormState> {
  await assertRole(["admin", "editor"]);
  const parsed = z.object({ id: z.uuid(), approve: z.enum(["0", "1"]) }).safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: "Invalid request." };
  const supabase = await createClient();
  const approve = parsed.data.approve === "1";
  const { error } = await supabase
    .from("media_assets")
    .update(approve ? { publish_approved: true, privacy_tier: "public" } : { publish_approved: false })
    .eq("id", parsed.data.id);
  if (error) return { error: friendlyDbError(error, "This image can't be approved until rights are cleared and consent is recorded.") };
  return ok(["/admin/media", "/"], approve ? "Approved for publishing." : "Withdrawn from publishing.");
}
