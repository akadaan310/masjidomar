import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isBackendConfigured } from "@/lib/env";
import type { Database } from "@/lib/database.types";

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

/** Safe defaults used only if the backend is unreachable; flagged so the UI can say so. */
export const FALLBACK_SETTINGS: SiteSettings = {
  id: true,
  org_name_en: "Masjid Omar",
  org_name_ar: "مسجد عمر",
  address_line: "4801 E Busch Blvd",
  city: "Tampa",
  region: "FL",
  postal_code: "33617",
  latitude: 28.0337,
  longitude: -82.4012,
  timezone: "America/New_York",
  phone: "",
  phone_verified: false,
  email: "",
  email_verified: false,
  concept_mode: true,
  allow_indexing: false,
  hero_source: "concept",
  hero_media_id: null,
  accessibility_info: "",
  accessibility_verified: false,
  parking_info: "",
  parking_verified: false,
  giving_info: "",
  giving_verified: false,
  imam_hours_note: "",
  support_escalation_url: "",
  imam_shared_queue: true,
  require_staff_mfa: false,
  default_language: "en",
  secondary_language: "ar",
  question_retention_days: 730,
  notification_mode: "none",
  updated_at: new Date(0).toISOString(),
  updated_by: null,
};

export const getSiteSettings = cache(async (): Promise<{ settings: SiteSettings; live: boolean }> => {
  if (!isBackendConfigured()) return { settings: FALLBACK_SETTINGS, live: false };
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("site_settings").select("*").maybeSingle();
    return data ? { settings: data, live: true } : { settings: FALLBACK_SETTINGS, live: false };
  } catch {
    return { settings: FALLBACK_SETTINGS, live: false };
  }
});

export function fullAddress(s: SiteSettings) {
  return `${s.address_line}, ${s.city}, ${s.region} ${s.postal_code}`;
}

/** Google Maps search URL built from the address text (no API key, no tracking params). */
export function mapsUrl(s: SiteSettings) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.org_name_en}, ${fullAddress(s)}`)}`;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
