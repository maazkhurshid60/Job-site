import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { CONTACT_EMAIL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy — JobFolder",
  description: "How JobFolder collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy Policy"
      intro="This policy explains what information JobFolder collects, how we use it, and the choices you have."
      updated="July 27, 2026"
    >
      <p>
        JobFolder (&quot;we&quot;, &quot;us&quot;) operates a recruiting
        marketplace that connects candidates, referrers, and hiring clients. We
        take your privacy seriously and only collect the data we need to run the
        service.
      </p>

      <InfoSection heading="Information we collect">
        <p>
          We collect information you provide directly — such as your name, email
          address, and any candidate details or CVs you submit — as well as
          basic technical data (like your IP address and browser type) when you
          use the site.
        </p>
      </InfoSection>

      <InfoSection heading="How we use your information">
        <p>
          We use your information to operate the marketplace: to show relevant
          roles, process applications and referrals, coordinate with hiring
          clients, pay out referral commissions, and communicate with you about
          your account and submissions.
        </p>
      </InfoSection>

      <InfoSection heading="Sharing">
        <p>
          When you apply for or refer a candidate to a role, the relevant
          details are shared with our recruiter and the hiring client for that
          role. We do not sell your personal data. We may use trusted service
          providers (for example, hosting and email delivery) who process data
          on our behalf under appropriate safeguards.
        </p>
      </InfoSection>

      <InfoSection heading="Your rights">
        <p>
          You may request access to, correction of, or deletion of your personal
          data at any time. To do so, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </InfoSection>

      <InfoSection heading="Contact">
        <p>
          Questions about this policy? Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-brand hover:underline">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
