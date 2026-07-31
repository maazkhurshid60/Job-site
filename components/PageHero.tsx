import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";
import type { Photo } from "./images";

/* Shared hero for the marketing pages.
 *
 * Every inner page used to open with the same text-only block on a flat grey
 * band, which left a lot of empty space and made /recruiters, /how-it-works and
 * /contact look interchangeable. This gives each one a photograph and a shape,
 * while keeping the type scale and pill buttons the rest of the site uses.
 *
 * `priority` is on because this image is always the page's LCP element — it is
 * above the fold on every viewport, so lazy-loading it would only delay it. */

export type HeroAction = { label: string; href: string };

export function PageHero({
  eyebrow,
  title,
  lead,
  photo,
  actions = [],
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  photo: Photo;
  actions?: HeroAction[];
  /** Optional extra content under the buttons (stats, contact details…). */
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-white pt-6 pb-12 sm:pb-16">
      <Container>
        <div className="relative overflow-hidden rounded-3xl bg-blue-brand-soft md:rounded-[40px]">
          {/* Soft brand wash — keeps the panel from reading as a flat grey box. */}
          <div className="pointer-events-none absolute inset-0 opacity-60" aria-hidden>
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-blue-brand-light blur-3xl" />
            <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-cream-deep blur-3xl" />
          </div>

          <div className="relative grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:p-16">
            <div className="hero-rise min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                {eyebrow}
              </span>
              <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-ink sm:text-4xl lg:text-[2.75rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
                {lead}
              </p>

              {actions.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-3">
                  {actions.map((a, i) => (
                    <Link
                      key={a.href}
                      href={a.href}
                      className={
                        i === 0
                          ? "inline-flex items-center justify-center rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-brand-dark hover:shadow-md"
                          : "inline-flex items-center justify-center rounded-pill border border-gray-200 bg-white px-7 py-3 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-brand hover:text-blue-brand"
                      }
                    >
                      {a.label}
                    </Link>
                  ))}
                </div>
              )}

              {children}
            </div>

            {/* Photo. Fixed aspect so the panel height doesn't jump between
                pages as different images load. */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5 lg:aspect-[5/4]">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* A full-width photograph used to break up long stretches of text. Decorative
   framing only — the caption carries the meaning, so it sits in the markup
   rather than being burned into the image. */
export function PhotoBand({
  photo,
  caption,
  className = "",
}: {
  photo: Photo;
  caption?: string;
  className?: string;
}) {
  return (
    <Container className={className}>
      <figure className="relative overflow-hidden rounded-3xl">
        <div className="relative aspect-[21/9] w-full">
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="object-cover"
          />
        </div>
        {caption && (
          <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-6 pb-5 pt-16 text-sm font-medium text-white sm:px-8">
            {caption}
          </figcaption>
        )}
      </figure>
    </Container>
  );
}
