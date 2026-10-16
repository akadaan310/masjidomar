import type { Metadata } from "next";
import { pageGuard } from "@/components/staff/guard";
import { getSiteSettings } from "@/lib/site";
import { ActionForm } from "@/components/forms/ActionForm";
import { Field, SelectField, Check } from "@/components/staff/Field";
import { saveSettings } from "@/app/actions/admin";

export const metadata: Metadata = { title: "Settings · Administration" };

export default async function AdminSettings() {
  const denied = await pageGuard(["admin"], "site settings");
  if (denied) return denied;
  const { settings: s } = await getSiteSettings();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl text-pine">Settings</h1>
        <p className="text-muted">Each save records a full before/after revision. Information marked &ldquo;verified&rdquo; is what appears publicly.</p>
      </header>
      <ActionForm action={saveSettings} submitLabel="Save settings" className="space-y-6">
        <section className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-pine">Identity &amp; contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name (English)" name="orgNameEn" defaultValue={s.org_name_en} maxLength={80} />
            <Field label="Name (Arabic)" name="orgNameAr" defaultValue={s.org_name_ar} maxLength={80} dir="rtl" />
            <Field label="Street address" name="addressLine" defaultValue={s.address_line} />
            <Field label="City" name="city" defaultValue={s.city} />
            <Field label="State" name="region" defaultValue={s.region} />
            <Field label="ZIP" name="postalCode" defaultValue={s.postal_code} />
            <Field label="Latitude (prayer calculation)" name="latitude" type="number" defaultValue={s.latitude} />
            <Field label="Longitude" name="longitude" type="number" defaultValue={s.longitude} />
            <Field label="Phone" name="phone" defaultValue={s.phone} />
            <Field label="Public email" name="email" type="email" defaultValue={s.email} />
          </div>
          <Check name="phoneVerified" label="Phone confirmed by masjid leadership — show the Call button" defaultChecked={s.phone_verified} />
          <Check name="emailVerified" label="Email confirmed — show publicly" defaultChecked={s.email_verified} />
          <p className="text-xs text-muted">Time zone is locked to America/New_York.</p>
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-pine">Visitor information</h2>
          <Field label="Accessibility information" name="accessibilityInfo" rows={3} defaultValue={s.accessibility_info} maxLength={1500} />
          <Check name="accessibilityVerified" label="Verified on site — publish" defaultChecked={s.accessibility_verified} />
          <Field label="Parking information" name="parkingInfo" rows={3} defaultValue={s.parking_info} maxLength={1500} />
          <Check name="parkingVerified" label="Verified — publish" defaultChecked={s.parking_verified} />
          <Field label="Giving / support information" name="givingInfo" rows={3} defaultValue={s.giving_info} maxLength={1500} hint="Only details formally approved by masjid leadership. No payment is processed by this site." />
          <Check name="givingVerified" label="Approved by masjid leadership — publish" defaultChecked={s.giving_verified} />
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-pine">Imam desk</h2>
          <Field label="Availability note (also editable by imams)" name="imamHoursNote" defaultValue={s.imam_hours_note} maxLength={300} />
          <Field label="Support escalation link (https)" name="supportEscalationUrl" defaultValue={s.support_escalation_url} hint="e.g. a vetted counselling or crisis resource" />
          <Check name="imamSharedQueue" label="Shared queue: unassigned questions are visible to every imam" defaultChecked={s.imam_shared_queue} />
          <Field label="Question retention (days)" name="questionRetentionDays" type="number" min={30} max={3650} defaultValue={s.question_retention_days} hint="Policy value shown in the privacy notice; see docs for the purge procedure." />
        </section>
        <section className="card space-y-4 p-6">
          <h2 className="font-display text-2xl text-pine">Security, language &amp; publishing</h2>
          <Check name="requireStaffMfa" label="Require two-step verification (TOTP) for all staff actions" defaultChecked={s.require_staff_mfa} />
          <div className="grid gap-4 sm:grid-cols-3">
            <SelectField label="Default language" name="defaultLanguage" defaultValue={s.default_language} options={[["en", "English"], ["ar", "العربية"]]} />
            <SelectField label="Notifications" name="notificationMode" defaultValue={s.notification_mode} options={[["none", "Off"], ["outbox_only", "Queue only (no provider configured)"]]} />
            <SelectField label="Homepage hero image" name="heroSource" defaultValue={s.hero_source} options={[["concept", "Concept visualization (demo only)"], ["approved_photo", "Approved photograph"], ["none", "Pattern, no photo"]]} />
          </div>
          <Check name="conceptMode" label={<><strong>Concept / preview mode</strong> — preview banner, sample content visible, demo prayer banner, no search indexing.</>} defaultChecked={s.concept_mode} />
          <Check name="allowIndexing" label="Allow search engines (only takes effect outside concept mode)" defaultChecked={s.allow_indexing} />
          <div className="rounded-xl bg-warning-bg p-4 text-sm text-warning-ink">
            <label htmlFor="launchConfirm" className="font-bold">To turn concept mode off, type: I have written approval from masjid leadership</label>
            <input id="launchConfirm" name="launchConfirm" className="input mt-2" autoComplete="off" />
          </div>
        </section>
      </ActionForm>
      <section className="card p-6 text-sm text-muted">
        <h2 className="font-display text-2xl text-pine">Backups &amp; logs</h2>
        <p className="mt-2">Database backups are managed by your Supabase plan (Dashboard → Database → Backups). See <code>docs/DEPLOYMENT_HANDOFF.md</code> for restore drills, and the audit log for every privileged change.</p>
      </section>
    </div>
  );
}
