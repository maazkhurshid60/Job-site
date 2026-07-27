import { Container, Button } from "./ui";

export function CTA() {
  return (
    <section id="pricing" className="relative overflow-hidden bg-white">
      <Container className="py-20 text-center lg:py-28">
        {/* decorative shapes */}
        <span className="pointer-events-none absolute left-10 top-16 hidden h-10 w-10 rotate-12 rounded-[30%] bg-coral lg:block" />
        <span className="pointer-events-none absolute right-16 top-24 hidden h-8 w-8 rounded-full bg-primary lg:block" />
        <span className="pointer-events-none absolute bottom-16 right-24 hidden h-9 w-9 -rotate-12 rounded-[30%] bg-lime lg:block" />

        <div className="mx-auto max-w-2xl">
          <p className="eyebrow uppercase">Pay on the hire</p>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Let&apos;s grow together
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-muted">
            No retainers and no upfront fees. JobFolder helps companies of
            all sizes hire — you only pay a success fee once the right person
            signs. Tell us your role and we&apos;ll take it from there.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button href="/signup">Get started free</Button>
            <Button href="/contact" variant="outline">
              Talk to us
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
