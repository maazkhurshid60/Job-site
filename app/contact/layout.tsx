import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Our Engineering Recruiters",
  description:
    "Tell us the engineering, transportation or DOT roles you're hiring for and we'll come back with a plan — usually within one business day. No retainer, no upfront cost.",
  keywords: [
    "contact engineering recruiters",
    "request talent",
    "hire civil engineers",
    "DOT staffing enquiry",
  ],
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Our Engineering Recruiters",
    description:
      "Tell us the roles you're hiring for and we'll come back with a plan — usually within one business day.",
    url: "/contact",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
