"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Re-renders the page from server state when a prayer schedule is published (Supabase Realtime on
 * the public prayer_publications table), with a polling fallback if Realtime is unavailable.
 */
export function PrayerAutoRefresh({ pollMs = 5 * 60_000 }: { pollMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | null = null;
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
      channel = supabase
        .channel("public-prayer-board")
        .on("postgres_changes", { event: "*", schema: "public", table: "prayer_publications" }, () => router.refresh())
        .subscribe();
    } catch {
      // Realtime not configured — polling below still keeps the page fresh.
    }
    const id = setInterval(() => router.refresh(), pollMs);
    return () => {
      clearInterval(id);
      if (supabase && channel) supabase.removeChannel(channel);
    };
  }, [router, pollMs]);
  return null;
}
