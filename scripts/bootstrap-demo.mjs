#!/usr/bin/env node
// Masjid Omar — demo account bootstrap. LOCAL OR EXPLICITLY-AUTHORISED STAGING ONLY.
//
// Creates (or rotates) three demo accounts — admin-demo, imam-demo, member-demo — on
// example.test addresses, with fresh random passwords on every run, assigns staff roles, and
// seeds clearly-labelled demo question fixtures. Credentials are written ONLY to the gitignored
// DEMO_ACCESS.txt (mode 0600). Passwords are never printed.
//
// Safety switches (all required):
//   DEMO_MODE=true
//   DEMO_TARGET_CONFIRM=I-CONFIRM-THIS-IS-NOT-PRODUCTION
//   Target host must be localhost/127.0.0.1, OR equal DEMO_STAGING_HOST (an operator-owned
//   staging project), and must NOT appear in PRODUCTION_SUPABASE_HOSTS.
//
// Usage: node --env-file=.env.local scripts/bootstrap-demo.mjs

import { randomBytes } from "node:crypto";
import { writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const CONFIRM = "I-CONFIRM-THIS-IS-NOT-PRODUCTION";

function fail(msg) {
  console.error(`\n✖ bootstrap-demo refused: ${msg}\n`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const secret = process.env.SUPABASE_SECRET_KEY ?? "";
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (process.env.CI) fail("will not run in CI (credentials must never reach build logs).");
if (process.env.DEMO_MODE !== "true") fail("DEMO_MODE must be exactly 'true'.");
if (process.env.DEMO_TARGET_CONFIRM !== CONFIRM) fail(`DEMO_TARGET_CONFIRM must be exactly '${CONFIRM}'.`);
if (!url || !secret) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");

let host;
try {
  host = new URL(url).hostname;
} catch {
  fail("NEXT_PUBLIC_SUPABASE_URL is not a valid URL.");
}
const prodHosts = (process.env.PRODUCTION_SUPABASE_HOSTS ?? "").split(",").map((h) => h.trim()).filter(Boolean);
if (prodHosts.includes(host)) fail(`${host} is listed in PRODUCTION_SUPABASE_HOSTS.`);
const isLocal = ["localhost", "127.0.0.1", "::1", "host.docker.internal"].includes(host);
if (!isLocal && process.env.DEMO_STAGING_HOST !== host) {
  fail(`${host} is not local. For an operator-owned staging project set DEMO_STAGING_HOST=${host} explicitly.`);
}

const supabase = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

// Extra guard: a masjid that has left concept mode is treated as production.
let settings = null;
let settingsErr = null;
for (let attempt = 0; attempt < 10; attempt++) {
  // The API's schema cache can lag a few seconds behind `supabase db reset`.
  ({ data: settings, error: settingsErr } = await supabase.from("site_settings").select("concept_mode").maybeSingle());
  if (!settingsErr) break;
  await new Promise((r) => setTimeout(r, 1000));
}
if (settingsErr) fail(`could not read site_settings (are migrations applied?): ${settingsErr.message}`);
if (settings && settings.concept_mode === false) fail("site_settings.concept_mode is false — this instance looks live/official.");

function password() {
  // 24 random bytes (~192 bits) + guaranteed character classes for the password policy.
  return `${randomBytes(24).toString("base64url")}-Aa9`;
}

const ACCOUNTS = [
  { key: "admin-demo", email: "admin-demo@example.test", name: "Admin (demo)", roles: ["admin"] },
  { key: "imam-demo", email: "imam-demo@example.test", name: "Imam (demo)", roles: ["imam"] },
  { key: "member-demo", email: "member-demo@example.test", name: "Member (demo)", roles: [] },
];

async function findUser(email) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit;
    if (data.users.length < 200) return null;
  }
  return null;
}

const results = [];
for (const acct of ACCOUNTS) {
  const pw = password();
  let user = await findUser(acct.email);
  if (user) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password: pw, email_confirm: true, ban_duration: "none" });
    if (error) fail(`could not rotate ${acct.key}: ${error.message}`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: acct.email,
      password: pw,
      email_confirm: true,
      user_metadata: { display_name: acct.name, privacy_consent: "true" },
    });
    if (error) fail(`could not create ${acct.key}: ${error.message}`);
    user = data.user;
  }
  await supabase.from("profiles").update({ display_name: acct.name, status: "active", privacy_consent_at: new Date().toISOString() }).eq("id", user.id);
  // Roles: revoke anything not intended, then grant intended roles (bootstrap is the trusted path).
  await supabase.from("staff_roles").update({ revoked_at: new Date().toISOString() }).eq("user_id", user.id).is("revoked_at", null).not("role", "in", `(${acct.roles.join(",") || "none"})`);
  for (const role of acct.roles) {
    const { data: existing } = await supabase.from("staff_roles").select("id").eq("user_id", user.id).eq("role", role).is("revoked_at", null).maybeSingle();
    if (!existing) {
      const { error } = await supabase.from("staff_roles").insert({ user_id: user.id, role });
      if (error) fail(`could not grant ${role} to ${acct.key}: ${error.message}`);
    }
  }
  await supabase.from("audit_events").insert({ action: "demo.bootstrap", target_type: "user", target_id: user.id, metadata: { account: acct.key, roles: acct.roles } });
  results.push({ ...acct, id: user.id, password: pw });
}

// Demo question fixtures for member-demo (clearly labelled, replaced on every run).
const member = results.find((r) => r.key === "member-demo");
const imam = results.find((r) => r.key === "imam-demo");
await supabase.from("questions").delete().eq("asker_id", member.id).eq("is_sample", true);
const { data: q1, error: qErr } = await supabase
  .from("questions")
  .insert({
    asker_id: member.id,
    category: "community",
    subject: "[Demo] Is there a quiet place to pray with a toddler?",
    body: "[Demo fixture — invented for a private demonstration] I sometimes visit with my two-year-old. Is there a part of the hall where we won't disturb others, or a better time to come?",
    language: "en",
    show_name_to_imam: true,
    faq_consent: true,
    is_sample: true,
  })
  .select("id")
  .single();
if (qErr) fail(`could not create demo question: ${qErr.message}`);
await supabase.from("question_status_history").insert({ question_id: q1.id, to_status: "submitted", changed_by_kind: "member", changed_by: member.id });

const { data: q2 } = await supabase
  .from("questions")
  .insert({
    asker_id: member.id,
    category: "worship",
    subject: "[Demo] Joining the congregation late",
    body: "[Demo fixture — invented] If I arrive after the prayer has started, what should I do?",
    language: "en",
    status: "answered",
    assigned_imam_id: imam.id,
    is_sample: true,
    last_staff_activity_at: new Date().toISOString(),
  })
  .select("id")
  .single();
if (q2) {
  await supabase.from("question_messages").insert({
    question_id: q2.id,
    author_id: imam.id,
    author_kind: "imam",
    kind: "answer",
    body: "[Demo reply — placeholder text, not a religious ruling. In the live system the imam writes every reply personally.]",
    published_at: new Date().toISOString(),
  });
  await supabase.from("question_status_history").insert([
    { question_id: q2.id, to_status: "submitted", changed_by_kind: "member", changed_by: member.id },
    { question_id: q2.id, from_status: "submitted", to_status: "answered", changed_by_kind: "imam", changed_by: imam.id },
  ]);
}

const lines = [
  "MASJID OMAR — DEMO ACCESS (LOCAL / STAGING ONLY)",
  `Generated: ${new Date().toISOString()}  ·  Target: ${host}`,
  "Passwords rotate every time scripts/bootstrap-demo.mjs runs. Never share, commit or screenshot this file.",
  "",
  ...results.flatMap((r) => [
    `[${r.key}]  roles: ${r.roles.join(", ") || "member"}`,
    `  sign in:  ${siteUrl}${r.key === "admin-demo" ? "/admin/login" : r.key === "imam-demo" ? "/imam/login" : "/login"}`,
    `  email:    ${r.email}`,
    `  password: ${r.password}`,
    "",
  ]),
  "Revoke immediately: re-run this script (rotates passwords), or disable the accounts in /admin/members,",
  "or delete them in Supabase Auth. Remove all demo data before any public launch (see SECRETS_CHECKLIST.md).",
];
const out = resolve(process.cwd(), "DEMO_ACCESS.txt");
writeFileSync(out, lines.join("\n") + "\n", { mode: 0o600 });
chmodSync(out, 0o600);
console.log(`✔ Demo accounts ready on ${host}. Credentials written to ${out} (mode 0600). Passwords are not printed.`);
