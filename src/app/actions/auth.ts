"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema, safeNext, firstError } from "@/lib/validation";
import { throttle, clearThrottle } from "@/lib/throttle";
import { publicEnv } from "@/lib/env";
import { z } from "zod";

export type FormState = { ok?: boolean; error?: string; message?: string };

async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "local";
}

const PORTALS = {
  member: { roles: [] as string[], home: "/community" },
  admin: { roles: ["admin", "editor", "moderator"], home: "/admin" },
  imam: { roles: ["imam"], home: "/imam" },
} as const;

export async function login(portal: keyof typeof PORTALS, _prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Please enter your email and password." };
  const { email, password, next } = parsed.data;
  const ip = await clientIp();
  const key = `login:${ip}:${email.toLowerCase()}`;
  const gate = throttle(key, 6, 15 * 60_000);
  if (!gate.ok) return { error: `Too many attempts. Please wait ${Math.ceil(gate.retryAfterSec / 60)} minute(s) and try again.` };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    if (error?.code === "email_not_confirmed") return { error: "Please confirm your email address first — check your inbox for the verification link." };
    return { error: "That email and password combination didn't work." };
  }
  clearThrottle(key);

  const { data: profile } = await supabase.from("profiles").select("status").eq("id", data.user.id).maybeSingle();
  if (profile?.status === "disabled") {
    await supabase.auth.signOut();
    return { error: "This account has been disabled. Please contact the masjid office." };
  }

  const cfg = PORTALS[portal];
  if (cfg.roles.length > 0) {
    const { data: roles } = await supabase.rpc("my_roles");
    if (!(roles ?? []).some((r) => (cfg.roles as readonly string[]).includes(r))) {
      await supabase.auth.signOut();
      return {
        error:
          portal === "admin"
            ? "This account does not have administrator access. Members can sign in from the main sign-in page."
            : "This account is not authorised for the imam desk. Members can sign in from the main sign-in page.",
      };
    }
  }
  redirect(safeNext(next, cfg.home) === "/" ? cfg.home : safeNext(next, cfg.home));
}

export async function loginMember(prev: FormState, fd: FormData) {
  return login("member", prev, fd);
}
export async function loginAdmin(prev: FormState, fd: FormData) {
  return login("admin", prev, fd);
}
export async function loginImam(prev: FormState, fd: FormData) {
  return login("imam", prev, fd);
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({ ...Object.fromEntries(formData), consent: formData.get("consent") === "on" });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const ip = await clientIp();
  const gate = throttle(`signup:${ip}`, 5, 60 * 60_000);
  if (!gate.ok) return { error: "Too many sign-up attempts from this connection. Please try again later." };
  const { email, password, displayName, language } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${publicEnv.siteUrl}/auth/callback?next=/community`,
      // Only harmless profile hints. Roles are NEVER read from metadata.
      data: { display_name: displayName, preferred_language: language, privacy_consent: "true" },
    },
  });
  if (error) {
    if (error.code === "weak_password") return { error: "Please choose a stronger password." };
    if (error.code === "over_email_send_rate_limit") return { error: "Too many emails sent. Please try again in a little while." };
    return { error: "We couldn't create the account. If you already have one, try signing in or resetting your password." };
  }
  return { ok: true, message: "Check your email for a verification link. Once confirmed, you can sign in." };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = z.email().safeParse(formData.get("email"));
  if (!email.success) return { error: "Please enter a valid email address." };
  const ip = await clientIp();
  const gate = throttle(`reset:${ip}`, 5, 60 * 60_000);
  if (!gate.ok) return { error: "Too many requests. Please try again later." };
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, { redirectTo: `${publicEnv.siteUrl}/auth/callback?next=/reset-password` });
  // Same response whether or not the account exists (no account enumeration).
  return { ok: true, message: "If an account exists for that address, a reset link is on its way." };
}

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const pw = signupSchema.shape.password.safeParse(formData.get("password"));
  if (!pw.success) return { error: firstError(pw.error) };
  if (formData.get("password") !== formData.get("confirm")) return { error: "The passwords don't match." };
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: "Your reset link has expired. Please request a new one." };
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) return { error: "We couldn't update the password. Please request a new reset link." };
  return { ok: true, message: "Your password has been updated." };
}
