import { Container } from "./ui";

const stats = [
  { value: "20K", label: "Hires made" },
  { value: "1.3M", label: "Candidates sourced" },
  { value: "8.5B", label: "In salaries placed" },
];

const companies = ["airbnb", "ShipBob", "DISCOVER", "Walmart", "Ramp"];

export function SocialProof() {
  return (
    <section className="bg-white">
      <Container className="py-16 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="eyebrow uppercase">About us</p>
            <h2 className="mt-3 max-w-md text-3xl font-extrabold tracking-tight text-ink">
              Where great companies hire great people
            </h2>
            <p className="mt-4 max-w-lg text-muted">
              Since 2012, the world&apos;s best companies have leaned on Metro
              Opportunities to find their next hire — without the noise of an open
              marketplace.
            </p>
          </div>

          <div className="flex gap-10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-x-10 gap-y-6 rounded-2xl border border-line bg-cream/50 px-8 py-6">
          {companies.map((c) => (
            <span
              key={c}
              className="text-lg font-bold tracking-tight text-ink/40"
            >
              {c}
            </span>
          ))}
        </div>
      </Container>
    </section>
  );
}
