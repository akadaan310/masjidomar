import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "@/lib/env";

/**
 * Service-role client. SERVER ONLY. It bypasses RLS, so every caller must already have verified
 * that the signed-in user is an admin via a database role check (see requireRole in lib/auth).
 * Used solely for Supabase Auth admin operations (ban/unban, invite, delete user).
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!publicEnv.supabaseUrl || !key) {
    throw new Error("SUPABASE_SECRET_KEY is not configured on the server.");
  }
  return createClient<Database>(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
