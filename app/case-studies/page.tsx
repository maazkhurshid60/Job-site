import type { Metadata } from "next";
import { InfoPage, ComingSoon } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Case Studies — JobFolder",
  description: "Real placements and results from the JobFolder network.",
};

export default function CaseStudiesPage() {
  return (
    <InfoPage
      eyebrow="Resources"
      title="Case Studies"
      intro="Real placements and results from the JobFolder network."
    >
      <ComingSoon
        message="We're gathering stories from clients and recruiters who've filled tough roles through the network. They'll be published here soon."
        ctaLabel="Browse open roles"
        ctaHref="/jobs"
      />
    </InfoPage>
  );
}
