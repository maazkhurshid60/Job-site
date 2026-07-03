import { Container, Eyebrow } from "./ui";
import type { ReactNode } from "react";

const steps = [
  {
    title: "Tell us the role, once",
    body: "Brief us on the hire and the bounty. We translate it into a clear spec and put our specialist recruiter network to work — no job-board spam, no chasing.",
    art: <SourceArt />,
  },
  {
    title: "We screen every submission",
    body: "Recruiters submit candidates to us, not to you. Our team vets each one against your brief, so nothing reaches your desk until it has cleared our bar.",
    art: <ScreenArt />,
    href: "#companies",
  },
  {
    title: "You meet a curated shortlist",
    body: "You review a short, pre-qualified list and stay with one point of contact from first intro to signed offer. Pay only when the hire is confirmed.",
    art: <HireArt />,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-white">
      <Container className="py-16 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
            The reach of a marketplace, the judgement of an agency
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title}>
              <div className="rounded-2xl border border-line bg-white p-3 shadow-[0_16px_40px_-28px_rgba(23,19,15,0.35)]">
                {/* window chrome */}
                <div className="mb-3 flex items-center gap-1.5 px-2 pt-1">
                  <span className="h-2 w-2 rounded-full bg-coral" />
                  <span className="h-2 w-2 rounded-full bg-lime" />
                  <span className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="grid h-40 place-items-center rounded-xl bg-cream/60">
                  {s.art}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{s.body}</p>
                  {s.href && (
                    <a
                      href={s.href}
                      className="mt-3 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
                    >
                      Learn more →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* Lightweight inline illustrations in the brand palette */
function Frame({ children }: { children: ReactNode }) {
  return <svg width="180" height="120" viewBox="0 0 180 120" fill="none">{children}</svg>;
}

function SourceArt() {
  return (
    <Frame>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${18 + i * 52} 34)`}>
          <rect width="44" height="52" rx="8" fill="#fff" stroke="#ece5db" />
          <circle cx="22" cy="18" r="9" fill={["#ee5b3f", "#1e9e63", "#c0d64e"][i]} />
          <rect x="10" y="34" width="24" height="4" rx="2" fill="#ece5db" />
          <rect x="14" y="42" width="16" height="4" rx="2" fill="#ece5db" />
        </g>
      ))}
    </Frame>
  );
}

function ScreenArt() {
  return (
    <Frame>
      <rect x="24" y="20" width="132" height="24" rx="6" fill="#fff" stroke="#ece5db" />
      <rect x="24" y="52" width="132" height="24" rx="6" fill="#fff" stroke="#ece5db" />
      <rect x="24" y="84" width="132" height="24" rx="6" fill="#fff" stroke="#ece5db" />
      <circle cx="40" cy="32" r="6" fill="#1e9e63" />
      <circle cx="40" cy="64" r="6" fill="#ee5b3f" />
      <circle cx="40" cy="96" r="6" fill="#1e9e63" />
      <path d="M37 32l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37 96l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </Frame>
  );
}

function HireArt() {
  return (
    <Frame>
      <rect x="46" y="24" width="88" height="72" rx="10" fill="#fff" stroke="#ece5db" />
      <circle cx="90" cy="52" r="16" fill="#e5f3ea" />
      <path d="M83 52l5 5 9-10" stroke="#1e9e63" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="66" y="76" width="48" height="6" rx="3" fill="#ece5db" />
    </Frame>
  );
}
