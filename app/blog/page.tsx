import type { Metadata } from "next";
import { InfoPage, ComingSoon } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Blog — JobFolder",
  description: "Insights on hiring, referrals, and technical recruiting.",
};

export default function BlogPage() {
  return (
    <InfoPage
      eyebrow="Resources"
      title="The JobFolder Blog"
      intro="Insights on hiring, referrals, and technical recruiting — coming soon."
    >
      <ComingSoon
        message="We're putting together articles on smarter hiring, making the most of referrals, and landing technical roles. Check back soon, or browse open roles in the meantime."
        ctaLabel="Browse open roles"
        ctaHref="/jobs"
      />
    </InfoPage>
  );
}
