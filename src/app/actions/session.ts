"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/validation";

export async function setLanguage(formData: FormData) {
  const lang = formData.get("lang") === "ar" ? "ar" : "en";
  const c = await cookies();
  c.set("lang", lang, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365, httpOnly: false });
  redirect(safeNext(String(formData.get("next") ?? "/")));
}

export async function signOut(formData: FormData) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(safeNext(String(formData.get("next") ?? "/"), "/"));
}
