import { Container } from "./ui";

export function Testimonial() {
  return (
    <section className="bg-white">
      <Container className="py-16 lg:py-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow uppercase text-center">Client stories</p>

          <figure className="relative mt-6 overflow-hidden rounded-3xl border border-gray-100 bg-blue-brand-soft/50 px-8 py-12 shadow-sm sm:px-14 sm:py-14">
            {/* decorative quotation mark */}
            <span
              aria-hidden
              className="pointer-events-none absolute -top-4 left-6 select-none font-serif text-[120px] leading-none text-blue-brand/15"
            >
              &ldquo;
            </span>

            <blockquote className="relative text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
              With the reach of a recruiting network, JobFolder cut our
              dependence on in-house sourcing — we filled two hard-to-fill PE
              roles in under a month, and never once sifted a bad résumé.
            </blockquote>

            <figcaption className="mt-8 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-brand/10 text-blue-brand font-extrabold text-sm">
                MA
              </span>
              <div>
                <p className="font-semibold text-ink">Engineering Hiring Manager</p>
                <p className="text-sm text-muted">Transportation Design Firm</p>
              </div>
            </figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
