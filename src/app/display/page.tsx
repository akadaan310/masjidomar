import { z } from "zod";
import { getDisplayPayload } from "@/lib/display";
import { DisplayBoard } from "@/components/display/DisplayBoard";

export default async function DisplayPage({ searchParams }: { searchParams: Promise<{ preview?: string; quiet?: string }> }) {
  const sp = await searchParams;
  const previewId = sp.preview && z.uuid().safeParse(sp.preview).success ? sp.preview : null;
  const payload = await getDisplayPayload(previewId);
  return <DisplayBoard initial={payload} previewId={payload.preview ? previewId : null} />;
}
