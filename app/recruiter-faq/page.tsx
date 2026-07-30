import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, InfoSection } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { CONTACT_EMAIL } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Recruiter FAQ — Referral Commission & Split Fees",
  description:
    "How referring candidates on JobFolder works: when the referral commission is paid, how much roles are worth, who owns a candidate, what happens if two recruiters submit the same person, and why it's free to join.",
  keywords: [
    "recruiter referral commission",
    "how split placement fees work",
    "refer a candidate earn commission",
    "split fee recruiting FAQ",
    "candidate ownership recruiting",
  ],
  alternates: { canonical: "/recruiter-faq" },
  openGraph: {
    title: "Recruiter FAQ — Referral Commission & Split Fees",
    description:
      "When you get paid, how much roles are worth, who owns a candidate, and why joining is free.",
    url: "/recruiter-faq",
  },
};

/* Single source for both the rendered FAQ and the FAQPage schema, so the
   structured data can never drift from the visible answers — mismatched FAQ
   markup is exactly what Google penalises. Answers are plain strings for that
   reason; anything needing links is rendered as its own section below. */
const faqs = [
  {
    question: "How do I refer a candidate?",
    answer:
      "Find an open role, enter your candidate's details, and upload their CV. That's it — you're recorded as the referrer for that candidate on that role, with no further steps and nothing to chase.",
  },
  {
    question: "When do I get paid?",
    answer:
      "You earn the referral commission when your referred candidate is selected and placed by the hiring client. The commission for each role is published on the listing itself, so you know what a placement is worth before you spend any time on it.",
  },
  {
    question: "How much can I earn per placement?",
    answer:
      "It varies by role, seniority and discipline. Every listing publishes its referral commission up front, so there are never any surprises and you can pick the roles worth your time before you refer anyone. Senior and licensed engineering roles generally carry the larger commissions, because they are the harder searches.",
  },
  {
    question: "Does it cost anything to join?",
    answer:
      "No. It's free to join and free to refer. There are no membership fees, no retainers, no desk fees and no upfront costs of any kind. There is no mechanism by which you pay JobFolder anything — you only ever earn.",
  },
  {
    question: "Who screens the candidates?",
    answer:
      "Our principal recruiter screens every referred candidate and coordinates the entire process with the client. You focus on finding the right person from your network; we handle the screening, the client relationship, scheduling and the close.",
  },
  {
    question: "What happens if two recruiters refer the same candidate?",
    answer:
      "Every submission is recorded against the recruiter who made it and timestamped when it is created, so who referred whom and when is a matter of record rather than of argument. Where the same candidate reaches us twice for the same role, we resolve it on that record and will always tell both recruiters what we have decided and why.",
  },
  {
    question: "Do I have to be an agency recruiter to join?",
    answer:
      "No. Independent and freelance recruiters, agency recruiters with their own desk, and industry people with strong professional networks all refer through JobFolder. What matters is that you can reach qualified people in a discipline, not what your business card says.",
  },
  {
    question: "Which disciplines have the most roles?",
    answer:
      "The board leans heavily toward infrastructure and the built environment: civil, transportation and DOT, structural, MEP, water resources and hydrology, CEI and construction inspection, and project management across the AEC sector. There is also a steady stream of software, DevOps, data and cleared government roles.",
  },
  {
    question: "Do I keep contact with my candidate?",
    answer:
      "You remain the referrer of record throughout, and you can follow the status of every candidate you have submitted from your dashboard. Client-facing coordination — interviews, feedback, offer — runs through our recruiter, so the client keeps a single point of contact and you are not chasing scheduling.",
  },
  {
    question: "Are these real roles or aggregated listings?",
    answer:
      "Every role is a live brief from an actual hiring client. Nothing on the board is scraped or aggregated from elsewhere, so you will not refer into a position that was quietly filled three months ago.",
  },
  {
    question: "What if my candidate isn't right for that role?",
    answer:
      "Nothing is lost. Screening happens before anything reaches the client, so a mismatch costs you the few minutes it took to submit rather than damaging a client relationship. Where a candidate is strong but wrong for that particular brief, they may well fit another role on the board.",
  },
  {
    question: "How is this different from a normal split fee arrangement?",
    answer:
      "Two things. The split is published on the role before you submit anyone, rather than negotiated after a placement. And you do not manage the client at all — no scheduling, no chasing feedback, no closing. You source; we run the process.",
  },
];

export default function RecruiterFaqPage() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <JsonLd schema={faqSchema} />
      <InfoPage
        eyebrow="Resources"
        title="Recruiter FAQ"
        intro="Everything about referring candidates and earning commission on JobFolder — when you get paid, what roles are worth, and who owns what."
      >
        {faqs.map((f) => (
          <InfoSection key={f.question} heading={f.question}>
            <p>{f.answer}</p>
          </InfoSection>
        ))}

        <InfoSection heading="Still have questions?">
          <p>
            Email us any time at{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="font-semibold text-blue-brand hover:underline"
            >
              {CONTACT_EMAIL}
            </a>{" "}
            or use the{" "}
            <Link
              href="/contact"
              className="font-semibold text-blue-brand hover:underline"
            >
              contact page
            </Link>
            . If you&apos;d rather just get started, you can{" "}
            <Link
              href="/recruiters/apply"
              className="font-semibold text-blue-brand hover:underline"
            >
              join the network
            </Link>{" "}
            or{" "}
            <Link
              href="/jobs"
              className="font-semibold text-blue-brand hover:underline"
            >
              browse open roles and their commissions
            </Link>{" "}
            first.
          </p>
        </InfoSection>
      </InfoPage>
    </>
  );
}
