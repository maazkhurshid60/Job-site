import type { Metadata } from "next";
import { InfoPage, ComingSoon } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Careers — JobFolder",
  description: "Join the team building JobFolder.",
};

export default function CareersPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Careers at JobFolder"
      intro="We're building a better way to recruit — the reach of a network with the judgement of an agency."
    >
      <ComingSoon
        message="We don't have any open positions listed just yet, but we're always keen to hear from talented people. Reach out and tell us how you'd like to help."
        ctaLabel="Get in touch"
        ctaHref="/contact"
      />
    </InfoPage>
  );
}
