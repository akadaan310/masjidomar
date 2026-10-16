// Request-level security tests against the LOCAL Supabase stack (npx supabase start + db reset).
// Each actor uses the public publishable key with its own session — exactly what a browser or a
// hand-crafted API call could do. The service key is used only for fixture setup and checks.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import type { Database } from "@/lib/database.types";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
const SECRET = process.env.SUPABASE_SECRET_KEY ?? "";
const run = Boolean(ANON && SECRET && /127\.0\.0\.1|localhost/.test(URL_));
const d = run ? describe : describe.skip;

type Role = Database["public"]["Enums"]["staff_role"];
const svc = () => createClient<Database>(URL_, SECRET, { auth: { persistSession: false } });
const anon = () => createClient<Database>(URL_, ANON, { auth: { persistSession: false } });
const tag = randomBytes(4).toString("hex");
const created: string[] = [];
const Q = (subject: string, extra: Partial<Record<string, unknown>> = {}) => ({
  p_category: "other" as const,
  p_subject: subject,
  p_body: "A private question body that is long enough.",
  p_language: "en" as const,
  p_is_sensitive: false,
  p_show_name: false,
  p_faq_consent: false,
  ...extra,
});

async function makeUser(name: string, roles: Role[] = [], meta: Record<string, string> = {}) {
  const email = `${name}-${tag}@example.test`;
  const password = `${randomBytes(12).toString("base64url")}Aa9`;
  const admin = svc();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { display_name: name, ...meta } });
  if (error) throw error;
  created.push(data.user.id);
  for (const role of roles) await admin.from("staff_roles").insert({ user_id: data.user.id, role });
  const client = anon();
  const { error: e2 } = await client.auth.signInWithPassword({ email, password });
  if (e2) throw e2;
  return { id: data.user.id, client, email };
}
type Actor = Awaited<ReturnType<typeof makeUser>>;

d("RLS & privilege boundaries (live local database)", () => {
  let memberA: Actor, memberB: Actor, imam: Actor, admin: Actor, sneaky: Actor;
  let qid: string;

  beforeAll(async () => {
    await svc().from("site_settings").update({ imam_shared_queue: true, concept_mode: true }).eq("id", true);
    memberA = await makeUser("member-a");
    memberB = await makeUser("member-b");
    imam = await makeUser("imam", ["imam"]);
    admin = await makeUser("admin", ["admin"]);
    sneaky = await makeUser("sneaky", [], { role: "admin", roles: "admin", is_admin: "true" });
    const { data, error } = await memberA.client.rpc(
      "submit_question",
      Q("Private matter", { p_category: "family", p_body: "This is a private question for the imam only.", p_is_sensitive: true }),
    );
    if (error) throw error;
    qid = data as string;
  });

  afterAll(async () => {
    const s = svc();
    for (const id of created) await s.auth.admin.deleteUser(id);
    await s.from("site_settings").update({ imam_shared_queue: true, concept_mode: true }).eq("id", true);
  });

  it("anon cannot read any private table", async () => {
    const a = anon();
    for (const t of [
      "questions",
      "question_messages",
      "question_internal_notes",
      "audit_events",
      "staff_roles",
      "profiles",
      "event_registrations",
      "volunteer_inquiries",
      "data_requests",
      "settings_revisions",
    ] as const) {
      const { data } = await a.from(t).select("*").limit(5);
      expect(data ?? [], t).toHaveLength(0);
    }
  });

  it("anon cannot call privileged or member RPCs", async () => {
    expect((await anon().rpc("admin_member_list", {})).error).not.toBeNull();
    expect((await anon().rpc("submit_question", Q("anon question"))).error).not.toBeNull();
  });

  it("signup metadata can never grant a role; clients cannot write staff_roles", async () => {
    expect((await sneaky.client.rpc("my_roles")).data).toEqual([]);
    expect((await sneaky.client.from("staff_roles").insert({ user_id: sneaky.id, role: "admin" })).error).not.toBeNull();
    expect((await sneaky.client.rpc("admin_grant_role", { p_user_id: sneaky.id, p_role: "admin" })).error?.message).toMatch(/forbidden/);
  });

  it("members cannot change protected profile columns", async () => {
    expect((await memberA.client.from("profiles").update({ status: "disabled" }).eq("id", memberA.id)).error).not.toBeNull();
    expect((await memberA.client.from("profiles").update({ display_name: "A" }).eq("id", memberA.id)).error).toBeNull();
  });

  it("a member reads their own question; another member cannot read, reply or close it (IDOR)", async () => {
    expect((await memberA.client.from("questions").select("id, body").eq("id", qid)).data).toHaveLength(1);
    expect((await memberB.client.from("questions").select("id").eq("id", qid)).data).toHaveLength(0);
    expect((await memberB.client.rpc("member_reply", { p_question_id: qid, p_body: "hijack" })).error?.message).toMatch(/forbidden/);
    expect((await memberB.client.rpc("member_close_question", { p_question_id: qid })).error?.message).toMatch(/forbidden/);
  });

  it("administrators see metadata only — no subject, body or asker", async () => {
    expect((await admin.client.from("questions").select("id, body").eq("id", qid)).data).toHaveLength(0);
    const row = ((await admin.client.rpc("admin_question_queue", { p_limit: 100 })).data ?? []).find((r) => r.id === qid);
    expect(row).toBeTruthy();
    expect(Object.keys(row!)).not.toEqual(expect.arrayContaining(["body"]));
    expect(Object.keys(row!)).not.toEqual(expect.arrayContaining(["subject"]));
  });

  it("break-glass access requires a reason and is audited without question text", async () => {
    expect((await admin.client.rpc("admin_open_question", { p_question_id: qid, p_reason: "because" })).error).not.toBeNull();
    const ok = await admin.client.rpc("admin_open_question", { p_question_id: qid, p_reason: "Safeguarding review requested by board" });
    expect(ok.data?.[0]?.body).toContain("private question");
    const audit = await admin.client.from("audit_events").select("action, metadata").eq("target_id", qid).eq("action", "question.break_glass");
    expect(audit.data?.length).toBeGreaterThan(0);
    expect(JSON.stringify(audit.data)).not.toContain("private question for the imam");
    // Members/imams cannot use break-glass
    expect((await imam.client.rpc("admin_open_question", { p_question_id: qid, p_reason: "Safeguarding review requested by board" })).error).not.toBeNull();
  });

  it("imam workflow: drafts and notes stay private; the sent answer reaches only the asker", async () => {
    const item = ((await imam.client.rpc("imam_inbox", {})).data ?? []).find((r) => r.id === qid);
    expect(item?.excerpt).toBe("");
    expect(item?.asker_label).toBe("Member (name private)");
    expect((await imam.client.rpc("imam_acknowledge", { p_question_id: qid })).error).toBeNull();
    expect((await imam.client.rpc("imam_save_draft", { p_question_id: qid, p_body: "Draft reply", p_kind: "answer" })).error).toBeNull();
    expect((await memberA.client.from("question_messages").select("id").eq("question_id", qid).eq("is_draft", true)).data).toHaveLength(0);
    expect((await imam.client.rpc("imam_add_note", { p_question_id: qid, p_body: "internal" })).error).toBeNull();
    expect((await memberA.client.from("question_internal_notes").select("id").eq("question_id", qid)).data).toHaveLength(0);
    expect((await imam.client.rpc("imam_send_draft", { p_question_id: qid, p_allow_followups: true })).error).toBeNull();
    const msgs = await memberA.client.from("question_messages").select("body").eq("question_id", qid);
    expect(msgs.data?.map((m) => m.body)).toContain("Draft reply");
    expect((await memberA.client.from("questions").select("status").eq("id", qid).single()).data?.status).toBe("answered");
    expect((await memberB.client.from("question_messages").select("id").eq("question_id", qid)).data).toHaveLength(0);
  });

  it("FAQ proposals from a question require the asker's consent", async () => {
    const { error } = await imam.client.rpc("imam_propose_faq", {
      p_question_id: qid,
      p_question_text: "General question?",
      p_answer_md: "General answer.",
      p_category: "family",
      p_language: "en",
    });
    expect(error?.message).toMatch(/consent/);
  });

  it("imam cannot edit settings, grant roles, read audit logs or list members", async () => {
    const s = await imam.client.from("site_settings").update({ concept_mode: false }).eq("id", true).select();
    expect(s.data ?? []).toHaveLength(0);
    expect((await imam.client.rpc("admin_grant_role", { p_user_id: imam.id, p_role: "admin" })).error).not.toBeNull();
    expect((await imam.client.from("audit_events").select("id").limit(1)).data).toHaveLength(0);
    expect((await imam.client.rpc("admin_member_list", {})).error).not.toBeNull();
    expect((await svc().from("site_settings").select("concept_mode").single()).data?.concept_mode).toBe(true);
  });

  it("imam loses access to unassigned questions when the shared queue is off", async () => {
    const { data: q2 } = await memberA.client.rpc("submit_question", Q("Second"));
    await svc().from("site_settings").update({ imam_shared_queue: false }).eq("id", true);
    expect((await imam.client.from("questions").select("id").eq("id", q2 as string)).data).toHaveLength(0);
    await admin.client.rpc("admin_assign_question", { p_question_id: q2 as string, p_imam_id: imam.id });
    expect((await imam.client.from("questions").select("id").eq("id", q2 as string)).data).toHaveLength(1);
    await svc().from("site_settings").update({ imam_shared_queue: true }).eq("id", true);
  });

  it("question submission is rate limited (3 per hour)", async () => {
    const results = [];
    for (let i = 0; i < 3; i++) results.push(await memberB.client.rpc("submit_question", Q(`Question ${i}`)));
    const fourth = await memberB.client.rpc("submit_question", Q("Question 4"));
    expect(results.every((r) => !r.error)).toBe(true);
    expect(fourth.error?.message).toMatch(/rate_limited/);
  });

  it("role changes are audited and admins cannot change their own roles", async () => {
    expect((await admin.client.rpc("admin_grant_role", { p_user_id: admin.id, p_role: "imam" })).error?.message).toMatch(/cannot_change_own_roles/);
    expect((await admin.client.rpc("admin_grant_role", { p_user_id: memberB.id, p_role: "editor" })).error).toBeNull();
    const audit = await admin.client.from("audit_events").select("metadata").eq("target_id", memberB.id).eq("action", "role.grant");
    expect(audit.data?.[0]?.metadata).toMatchObject({ role: "editor" });
    expect((await admin.client.rpc("admin_revoke_role", { p_user_id: memberB.id, p_role: "editor" })).error).toBeNull();
  });

  it("audit log is append-only, even for the service role", async () => {
    const del = await svc().from("audit_events").delete().eq("action", "role.grant").select();
    expect(del.error?.message).toMatch(/append_only/);
  });

  it("prayer drafts are private, published schedules immutable, publishing needs verification", async () => {
    const { data: draftId, error } = await admin.client.rpc("create_prayer_draft", { p_from: "00000000-0000-4000-8000-000000000001" });
    expect(error).toBeNull();
    expect((await anon().from("prayer_publications").select("id").eq("id", draftId as string)).data).toHaveLength(0);
    expect((await imam.client.from("iqamah_schedules").insert({ publication_id: draftId as string, prayer: "fajr", weekday: 2, mode: "fixed", time_of_day: "06:00" })).error).not.toBeNull();
    expect((await admin.client.from("prayer_publications").update({ status: "published" }).eq("id", draftId as string)).error).not.toBeNull();
    expect((await admin.client.rpc("publish_prayer_publication", { p_id: draftId as string, p_verified: false })).error?.message).toMatch(/verification_required/);
    const locked = await admin.client
      .from("iqamah_schedules")
      .insert({ publication_id: "00000000-0000-4000-8000-000000000001", prayer: "fajr", weekday: 1, mode: "fixed", time_of_day: "06:00" });
    expect(locked.error?.message).toMatch(/publication_locked/);
    await admin.client.from("prayer_publications").delete().eq("id", draftId as string);
  });

  it("sample content disappears from public view when concept mode is turned off", async () => {
    expect(((await anon().from("announcements").select("id").eq("is_sample", true)).data ?? []).length).toBeGreaterThan(0);
    await svc().from("site_settings").update({ concept_mode: false }).eq("id", true);
    const after = await anon().from("announcements").select("id").eq("is_sample", true);
    const pubs = await anon().from("prayer_publications").select("id").eq("is_sample", true);
    await svc().from("site_settings").update({ concept_mode: true }).eq("id", true);
    expect(after.data).toHaveLength(0);
    expect(pubs.data).toHaveLength(0);
  });

  it("member-only announcements are hidden from anon", async () => {
    await svc().from("announcements").insert({ slug: `members-${tag}`, title: "Members only note", audience: "members", status: "published" });
    expect((await anon().from("announcements").select("id").eq("slug", `members-${tag}`)).data).toHaveLength(0);
    expect((await memberA.client.from("announcements").select("id").eq("slug", `members-${tag}`)).data).toHaveLength(1);
    await svc().from("announcements").delete().eq("slug", `members-${tag}`);
  });

  it("deleted accounts take their private records with them", async () => {
    const temp = await makeUser("temp");
    const { data: tq } = await temp.client.rpc("submit_question", Q("Temp"));
    await svc().auth.admin.deleteUser(temp.id);
    expect((await imam.client.from("questions").select("id").eq("id", tq as string)).data).toHaveLength(0);
    expect((await svc().from("questions").select("id").eq("id", tq as string)).data).toHaveLength(0);
  });

  it("deleting a staff account that published a schedule and wrote audit events succeeds (FK anonymisation)", async () => {
    const tempAdmin = await makeUser("tempadmin", ["admin"]);
    const { data: draftId } = await tempAdmin.client.rpc("create_prayer_draft", { p_from: "00000000-0000-4000-8000-000000000001" });
    const pub = await tempAdmin.client.rpc("publish_prayer_publication", { p_id: draftId as string, p_verified: true });
    expect(pub.error).toBeNull();
    const del = await svc().auth.admin.deleteUser(tempAdmin.id);
    expect(del.error).toBeNull();
    const row = await svc().from("prayer_publications").select("status, published_by").eq("id", draftId as string).single();
    expect(row.data).toMatchObject({ status: "published", published_by: null });
  });

  it("disabled accounts lose staff powers immediately", async () => {
    const tempStaff = await makeUser("tempstaff", ["imam"]);
    await admin.client.rpc("admin_set_account_status", { p_user_id: tempStaff.id, p_status: "disabled" });
    expect((await tempStaff.client.rpc("imam_inbox", {})).error?.message).toMatch(/forbidden/);
  });

  it("RSVP enforces capacity atomically, hides other registrants and promotes the waitlist", async () => {
    const { data: ev } = await svc()
      .from("events")
      .insert({
        slug: `cap-${tag}`,
        title: "Capacity test",
        starts_at: new Date(Date.now() + 86_400_000).toISOString(),
        ends_at: new Date(Date.now() + 90_000_000).toISOString(),
        capacity: 1,
        rsvp_enabled: true,
        waitlist_enabled: true,
        status: "published",
      })
      .select("id")
      .single();
    const args = { p_event_id: ev!.id, p_party_size: 1, p_contact_consent: false, p_reminder_opt_in: false };
    expect((await memberA.client.rpc("rsvp_event", args)).data).toBe("confirmed");
    expect((await memberB.client.rpc("rsvp_event", args)).data).toBe("waitlisted");
    const visible = (await memberB.client.from("event_registrations").select("user_id").eq("event_id", ev!.id)).data ?? [];
    expect(visible.every((r) => r.user_id === memberB.id)).toBe(true);
    await memberA.client.rpc("cancel_rsvp", { p_event_id: ev!.id });
    expect((await memberB.client.from("event_registrations").select("status").eq("event_id", ev!.id).single()).data?.status).toBe("confirmed");
    await svc().from("events").delete().eq("id", ev!.id);
  });
});
