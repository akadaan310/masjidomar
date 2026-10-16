import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { pageGuard } from "@/components/staff/guard";
import { ActionForm } from "@/components/forms/ActionForm";
import { Field, SelectField, Check } from "@/components/staff/Field";
import { setMediaApproval, uploadMedia } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Photos & media · Administration" };

export default async function AdminMedia() {
  const denied = await pageGuard(["admin", "editor"], "media library");
  if (denied) return denied;
  const supabase = await createClient();
  const { data: media } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Photos &amp; media</h1>
        <p className="text-muted">Every image records its source, credit, rights and consent. AI concept art is always labelled on the public site and only shown in concept mode.</p>
      </header>
      <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {(media ?? []).map((m) => (
          <li key={m.id} className="card overflow-hidden">
            <div className="relative aspect-video bg-sand">
              <Image src={m.storage_path} alt={m.alt_text} fill sizes="400px" className="object-cover" unoptimized={m.storage_path.startsWith("http")} />
            </div>
            <div className="space-y-1 p-4 text-sm">
              <p className="font-semibold text-pine">{m.alt_text}</p>
              <p className="text-muted">{m.credit}</p>
              <p className="flex flex-wrap gap-1 pt-1">
                <span className="badge bg-sand text-pine">{m.source.replace("_", " ")}</span>
                {m.ai_generated && <span className="badge bg-warning-bg text-warning-ink">AI-assisted</span>}
                <span className="badge bg-sage-100 text-pine">rights {m.rights_cleared ? "cleared" : "not cleared"}</span>
                <span className="badge bg-sage-100 text-pine">consent: {m.people_consent.replace("_", " ")}</span>
                <span className={`badge ${m.publish_approved ? "bg-evergreen text-ivory" : "bg-pine/10 text-muted"}`}>{m.publish_approved ? "approved" : "not approved"}</span>
              </p>
              <ActionForm action={setMediaApproval} submitLabel={m.publish_approved ? "Withdraw" : "Approve for publishing"} buttonClassName="btn btn-secondary mt-2 min-h-9 text-xs" className="">
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="approve" value={m.publish_approved ? "0" : "1"} />
              </ActionForm>
            </div>
          </li>
        ))}
      </ul>
      <section className="card max-w-3xl p-6">
        <h2 className="font-display text-2xl text-pine">Upload a photo</h2>
        <p className="text-sm text-muted">Max 5 MB · JPEG, PNG, WebP or AVIF. Don&apos;t upload screenshots of social media or photos of people without their consent.</p>
        <ActionForm action={uploadMedia} submitLabel="Upload" className="mt-4 space-y-4" resetOnSuccess>
          <div>
            <label className="field-label" htmlFor="file">Image</label>
            <input id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="input" />
          </div>
          <Field label="Alt text (describe the image for screen readers)" name="altText" maxLength={300} required />
          <Field label="Arabic alt text (optional)" name="altTextAr" maxLength={300} dir="rtl" />
          <Field label="Credit / source" name="credit" maxLength={200} required hint="e.g. “Photo supplied by Masjid Omar, used with permission”" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Source" name="source" options={[["mosque_supplied", "Supplied by the masjid"], ["commissioned", "Commissioned photographer"], ["ai_concept", "AI concept image"]]} />
            <SelectField label="People pictured" name="peopleConsent" options={[["not_applicable", "No identifiable people"], ["obtained", "Consent obtained"], ["pending", "Consent pending"]]} />
          </div>
          <Check name="rightsCleared" label="We have the right to publish this image." />
          <Check name="publishApproved" label="Approve for public use now." />
        </ActionForm>
      </section>
    </div>
  );
}
