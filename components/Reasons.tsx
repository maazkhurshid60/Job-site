import { Container, Button } from "./ui";

const reasons = [
  {
    title: "A whole network, not one desk",
    body: "Every role is worked by dozens of specialist recruiters at once — the reach of a marketplace without you managing any of them.",
  },
  {
    title: "We are the filter",
    body: "Candidates are vetted by our team before they reach you. No spray-and-pray submissions, no wading through unqualified profiles.",
  },
  {
    title: "One point of contact",
    body: "You deal with Metro Opportunities, start to finish. We coordinate every recruiter behind the scenes so you never have to.",
  },
  {
    title: "Pay on the hire",
    body: "No retainers, no upfront cost. Our fee and the recruiter bounty are settled only once your new hire is confirmed.",
  },
  {
    title: "Fast, without the noise",
    body: "A curated shortlist in days, not months — because the sourcing runs in parallel while we do the quality control.",
  },
  {
    title: "Expert brief, every time",
    body: "We turn your requirement into a sharp spec the network can act on, drawing on a decade of placements across roles.",
  },
];

export function Reasons() {
  return (
    <section id="companies" className="bg-cream">
      <Container className="py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="eyebrow uppercase">For companies</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              More reasons companies come to Metro Opportunities
            </h2>
            <p className="mt-4 max-w-md text-muted">
              Whether you&apos;re hiring your fifth employee or your five
              hundredth, you get one accountable partner and a shortlist you can
              trust.
            </p>
            <Button href="/signup" className="mt-8">
              Start hiring
            </Button>
          </div>

          <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {reasons.map((r) => (
              <div key={r.title}>
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft text-primary">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 8l3 3 7-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <h3 className="mt-3 font-bold text-ink">{r.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
