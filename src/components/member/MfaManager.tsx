"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string; factor_type: string };

export function MfaManager() {
  const router = useRouter();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [level, setLevel] = useState<{ current: string | null; next: string | null }>({ current: null, next: null });
  const [enrolling, setEnrolling] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState<{ error?: string; ok?: string }>({});

  async function load() {
    const supabase = createClient();
    const [{ data: f }, { data: aal }] = await Promise.all([supabase.auth.mfa.listFactors(), supabase.auth.mfa.getAuthenticatorAssuranceLevel()]);
    setFactors(((f?.all ?? []) as Factor[]).filter((x) => x.factor_type === "totp"));
    setLevel({ current: aal?.currentLevel ?? null, next: aal?.nextLevel ?? null });
  }
  useEffect(() => {
    const id = setTimeout(load, 0);
    return () => clearTimeout(id);
  }, []);

  async function startEnroll() {
    setMsg({});
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
    if (error || !data) return setMsg({ error: "Could not start enrolment. Two-step verification may be disabled on this server." });
    setEnrolling({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
  }

  async function verify(factorId: string) {
    setMsg({});
    if (!/^\d{6}$/.test(code)) return setMsg({ error: "Enter the 6-digit code from your authenticator app." });
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) return setMsg({ error: "That code didn't work. Check your device clock and try again." });
    setEnrolling(null);
    setCode("");
    setMsg({ ok: "Verified. This session now has two-step verification." });
    await load();
    router.refresh();
  }

  async function remove(id: string) {
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: id });
    setMsg(error ? { error: "Removing a factor requires a verified (two-step) session." } : { ok: "Removed." });
    await load();
  }

  const verified = factors.filter((f) => f.status === "verified");
  const needsChallenge = level.next === "aal2" && level.current !== "aal2" && verified.length > 0;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Session level: <strong>{level.current === "aal2" ? "two-step verified" : "password only"}</strong>
      </p>
      {needsChallenge && (
        <div className="rounded-2xl bg-sage-100 p-5">
          <p className="font-semibold text-pine">Enter a code to verify this session</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <label htmlFor="code-v" className="sr-only">6-digit code</label>
            <input id="code-v" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.trim())} className="input max-w-40" />
            <button className="btn btn-primary" onClick={() => verify(verified[0].id)}>Verify</button>
          </div>
        </div>
      )}
      <ul className="space-y-2">
        {verified.map((f) => (
          <li key={f.id} className="flex items-center justify-between rounded-xl border border-pine/10 px-4 py-3">
            <span>{f.friendly_name ?? "Authenticator app"} · active</span>
            <button className="btn btn-ghost text-sm" onClick={() => remove(f.id)}>Remove</button>
          </li>
        ))}
      </ul>
      {enrolling ? (
        <div className="space-y-4 rounded-2xl border border-pine/10 p-5">
          <p>Scan this code with an authenticator app (e.g. Google Authenticator, 1Password, Authy), then enter the 6-digit code.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrolling.qr} alt="QR code for your authenticator app" className="size-48 rounded-lg bg-white p-2" />
          <p className="text-xs text-muted">Can&apos;t scan? Enter this key manually: <code className="break-all">{enrolling.secret}</code></p>
          <div className="flex flex-wrap gap-2">
            <label htmlFor="code-e" className="sr-only">6-digit code</label>
            <input id="code-e" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.trim())} className="input max-w-40" />
            <button className="btn btn-primary" onClick={() => verify(enrolling.id)}>Confirm</button>
          </div>
        </div>
      ) : (
        verified.length === 0 && <button className="btn btn-primary" onClick={startEnroll}>Set up two-step verification</button>
      )}
      {msg.error && <p role="alert" className="rounded-xl bg-danger/5 p-3 text-sm font-semibold text-danger">{msg.error}</p>}
      {msg.ok && <p role="status" className="rounded-xl bg-sage-100 p-3 text-sm font-semibold text-pine">{msg.ok}</p>}
    </div>
  );
}
