import type { Metadata } from "next";
import { InfoPage, InfoSection } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Recruiter FAQ — JobFolder",
  description: "Common questions about referring candidates and earning commission on JobFolder.",
};

export default function RecruiterFaqPage() {
  return (
    <InfoPage
      eyebrow="Resources"
      title="Recruiter FAQ"
      intro="Everything you need to know about referring candidates and earning commission on JobFolder."
    >
      <InfoSection heading="How do I refer a candidate?">
        <p>
          Find an open role, enter your candidate&apos;s details, and upload
          their CV. You&apos;re then locked in as the referrer for that
          candidate — no other steps needed.
        </p>
      </InfoSection>

      <InfoSection heading="When do I get paid?">
        <p>
          You earn the referral commission when your referred candidate is
          selected and placed by the hiring client. The commission for each role
          is shown right on the listing, so you always know what a placement is
          worth.
        </p>
      </InfoSection>

      <InfoSection heading="How much can I earn?">
        <p>
          It varies by role. Every listing publishes its referral commission up
          front, so there are never any surprises — you can pick the roles worth
          your time before you refer.
        </p>
      </InfoSection>

      <InfoSection heading="Does it cost anything to join?">
        <p>
          No. It&apos;s free to join and free to refer. There are no retainers
          and no upfront fees — you only ever earn, never pay, to be part of the
          network.
        </p>
      </InfoSection>

      <InfoSection heading="Who screens the candidates?">
        <p>
          Our principal recruiter screens every referred candidate and
          coordinates the whole process with the client, so you can focus on
          finding great people from your network.
        </p>
      </InfoSection>

      <InfoSection heading="Still have questions?">
        <p>
          Reach out any time at{" "}
          <a href="mailto:hello@jobfolder.com" className="text-blue-brand hover:underline">
            hello@jobfolder.com
          </a>{" "}
          or through our{" "}
          <a href="/contact" className="text-blue-brand hover:underline">
            contact page
          </a>
          .
        </p>
      </InfoSection>
    </InfoPage>
  );
}
