import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildIcs } from "@/lib/ics";
import { plainExcerpt } from "@/lib/markdown";
import { publicEnv } from "@/lib/env";

// One-click calendar file for an approved (published or cancelled) event.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const clean = slug.replace(/\.ics$/, "");
  if (!/^[a-z0-9-]{1,80}$/.test(clean)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = await createClient();
  const { data: ev } = await supabase.from("events").select("id, slug, title, description_md, starts_at, ends_at, location, status, is_sample").eq("slug", clean).maybeSingle();
  if (!ev || (ev.status !== "published" && ev.status !== "cancelled")) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const ics = buildIcs({
    uid: `${ev.id}@masjid-omar`,
    title: `${ev.is_sample ? "[SAMPLE] " : ""}${ev.title}`,
    description: plainExcerpt(ev.description_md, 600),
    location: ev.location,
    startsAt: new Date(ev.starts_at),
    endsAt: new Date(ev.ends_at),
    url: `${publicEnv.siteUrl}/programs/events/${ev.slug}`,
    cancelled: ev.status === "cancelled",
  });
  return new NextResponse(ics, {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": `attachment; filename="${ev.slug}.ics"` },
  });
}
