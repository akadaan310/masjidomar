import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

// Admin-only CSV of an event's registrations (no names or emails; references and consent flags only).
export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user?.roles.includes("admin") || (user.mfaRequired && user.aal !== "aal2")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = z.uuid().safeParse(request.nextUrl.searchParams.get("event"));
  if (!id.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_registrations")
    .select("id, status, party_size, contact_consent, reminder_opt_in, created_at")
    .eq("event_id", id.data)
    .order("created_at");
  if (error) return NextResponse.json({ error: "Failed" }, { status: 500 });
  const rows = [["reference", "status", "party_size", "contact_consent", "reminder_opt_in", "registered_at"], ...(data ?? []).map((r) => [r.id.slice(0, 8), r.status, r.party_size, r.contact_consent, r.reminder_opt_in, r.created_at])];
  const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="registrations-${id.data.slice(0, 8)}.csv"`, "Cache-Control": "private, no-store" },
  });
}
