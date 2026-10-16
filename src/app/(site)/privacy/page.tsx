import type { Metadata } from "next";
import { ProsePage } from "@/components/site/ProsePage";
import { getSiteSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

export default async function PrivacyPage() {
  const { settings: s } = await getSiteSettings();
  return (
    <ProsePage eyebrow="Your privacy" title="Privacy notice" note="Draft notice — to be reviewed and adopted by masjid leadership before public launch.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account:</strong> your email address, an optional display name, your language preference and the date you accepted this notice. We do not ask for gender, sect, legal name, address or date of birth.</li>
        <li><strong>Questions to the imam:</strong> what you write, its category and your privacy choices.</li>
        <li><strong>RSVPs and volunteer interest:</strong> what you register for, party size and your contact consent.</li>
      </ul>
      <h2>Who can see it</h2>
      <ul>
        <li>Your private questions: you and authorised imam staff only. Administrators see counts and categories, not content. Exceptional access for safeguarding is logged with a written reason.</li>
        <li>RSVPs and volunteer interest: you and masjid administrators. Never shown publicly.</li>
        <li>We do not sell data, and this site uses no advertising or third-party analytics.</li>
      </ul>
      <h2>Your choices</h2>
      <ul>
        <li>Download all of your data at any time from <em>My community</em>.</li>
        <li>Request deletion of your account; deletion removes your questions and replies permanently.</li>
        <li>Email notifications are off unless you opt in.</li>
      </ul>
      <h2>Retention</h2>
      <p>Closed questions are kept for up to {s.question_retention_days} days unless you delete your account sooner, so you can refer back to answers.</p>
      <h2>Security</h2>
      <p>Data is stored with access controls enforced in the database itself; staff accounts can be required to use two-step verification.</p>
    </ProsePage>
  );
}
