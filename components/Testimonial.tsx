import Image from "next/image";
import { Container } from "./ui";
import { img } from "./images";

export function Testimonial() {
  return (
    <section className="bg-white">
      <Container className="py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* portrait cluster */}
          <div className="relative order-last lg:order-first">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-4/5 overflow-hidden rounded-2xl bg-sage-soft">
                <Image
                  src={img.clientPortraitA}
                  alt="A hiring manager at their desk"
                  fill
                  sizes="(max-width: 1024px) 45vw, 260px"
                  className="object-cover"
                />
              </div>
              <div className="relative mt-8 aspect-4/5 overflow-hidden rounded-2xl bg-cream-deep">
                <Image
                  src={img.clientPortraitB}
                  alt="A team member reviewing candidates"
                  fill
                  sizes="(max-width: 1024px) 45vw, 260px"
                  className="object-cover"
                />
              </div>
            </div>
            <span className="absolute -bottom-3 left-8 h-8 w-8 rotate-12 rounded-[30%] bg-lime" />
          </div>

          <div>
            <p className="eyebrow uppercase">Client stories</p>
            <blockquote className="mt-4 text-2xl font-bold leading-snug tracking-tight text-ink sm:text-3xl">
              &ldquo;With the reach of a recruiting network, Metro Associates cut
              our dependence on in-house sourcing — we filled two hard-to-fill PE
              roles in under a month, and never once sifted a bad résumé.&rdquo;
            </blockquote>
            <div className="mt-6 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-blue-brand/10 text-blue-brand font-extrabold text-sm">
                MA
              </span>
              <div>
                <p className="font-semibold text-ink">Engineering Hiring Manager</p>
                <p className="text-sm text-muted">Transportation Design Firm</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
