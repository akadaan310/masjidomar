import type { Metadata } from "next";
import { ProsePage } from "@/components/site/ProsePage";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <ProsePage eyebrow="Terms" title="Terms of use" note="Draft terms — to be reviewed and adopted by masjid leadership before public launch.">
      <h2>Guidance, not a service guarantee</h2>
      <p>Replies from the imam are general religious guidance from a person. They are not legal, medical, financial or emergency advice, and response times vary.</p>
      <h2>Respectful use</h2>
      <p>Please be respectful. Do not submit other people&apos;s private information, harassment, spam or unlawful content. Accounts may be disabled for misuse.</p>
      <h2>Content</h2>
      <p>Schedules, programs and announcements are published by masjid administrators. If something looks wrong, please tell the masjid.</p>
      <h2>Emergencies</h2>
      <p>This site is not monitored around the clock. In an emergency call 911; for a mental-health crisis call or text 988.</p>
    </ProsePage>
  );
}
