import type { Metadata } from "next";
import { InfoPage, ComingSoon } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Hiring Guides — JobFolder",
  description: "Practical guides for hiring engineering and technical talent.",
};

export default function HiringGuidesPage() {
  return (
    <InfoPage
      eyebrow="Resources"
      title="Hiring Guides"
      intro="Practical guides for hiring engineering and technical talent."
    >
      <ComingSoon
        message="We're writing step-by-step guides on scoping roles, screening candidates, and closing great hires. They'll land here soon."
        ctaLabel="Talk to us about hiring"
        ctaHref="/contact"
      />
    </InfoPage>
  );
}
