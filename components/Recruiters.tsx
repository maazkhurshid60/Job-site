import { Container, Button } from "./ui";

const perks = [
  { stat: "Keep the bounty", label: "Earn a competitive split on every confirmed hire — paid promptly." },
  { stat: "Real briefs", label: "Work vetted, funded roles with a clear spec instead of cold job posts." },
  { stat: "No client chasing", label: "We handle the relationship and admin — you focus on great candidates." },
];

export function Recruiters() {
  return (
    <section id="recruiters" className="bg-cream">
      <Container className="py-16 lg:py-24">
        <div className="rounded-3xl bg-ink px-8 py-12 text-white sm:px-12 lg:px-16">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-lime">
              For recruiters
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Bring the candidates. We&apos;ll bring the roles.
            </h2>
            <p className="mt-4 text-white/70">
              Join the Metro Associates network and get matched to funded,
              well-defined roles. Submit your best people, and get paid when they
              land the job.
            </p>
          </div>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {perks.map((p) => (
              <div key={p.stat}>
                <p className="text-lg font-bold text-lime">{p.stat}</p>
                <p className="mt-2 text-sm leading-6 text-white/60">{p.label}</p>
              </div>
            ))}
          </div>

          <Button href="/recruiters/apply" className="mt-10 bg-lime text-ink hover:bg-lime/90">
            Join the network
          </Button>
        </div>
      </Container>
    </section>
  );
}
