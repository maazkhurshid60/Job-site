import type { Metadata } from "next";
import { InfoPage, ComingSoon } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "Press — JobFolder",
  description: "Press and media resources for JobFolder.",
};

export default function PressPage() {
  return (
    <InfoPage
      eyebrow="Company"
      title="Press & Media"
      intro="Writing about JobFolder? We'd love to help."
    >
      <ComingSoon
        message="Our press kit is on the way. In the meantime, for media enquiries, brand assets, or interviews, get in touch and we'll get right back to you."
        ctaLabel="Contact us"
        ctaHref="/contact"
      />
    </InfoPage>
  );
}
