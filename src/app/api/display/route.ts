import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDisplayPayload } from "@/lib/display";

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("preview");
  const preview = raw && z.uuid().safeParse(raw).success ? raw : null;
  try {
    const payload = await getDisplayPayload(preview);
    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
