import Link from "next/link";
import type { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { Container } from "./ui";

/* Shared shell for simple content pages (legal + info). Keeps the Navbar,
   hero, and Footer consistent so every static page matches the brand. */
export function InfoPage({
  eyebrow,
  title,
  intro,
  updated,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            {eyebrow && (
              <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                {eyebrow}
              </span>
            )}
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {title}
            </h1>
            {intro && (
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
                {intro}
              </p>
            )}
            {updated && (
              <p className="mt-4 text-sm text-muted">Last updated: {updated}</p>
            )}
          </Container>
        </section>
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl space-y-8 text-muted leading-relaxed">
              {children}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* Reusable section block for legal/info copy. */
export function InfoSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-ink">{heading}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

/* "Coming soon" body for content pages that aren't populated yet. */
export function ComingSoon({
  message,
  ctaLabel = "Browse open roles",
  ctaHref = "/jobs",
}: {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white text-blue-brand shadow-sm">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>
      <p className="mx-auto mt-5 max-w-md text-ink">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href={ctaHref}
          className="inline-flex items-center justify-center gap-2 rounded-pill bg-blue-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
        >
          {ctaLabel}
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center justify-center gap-2 rounded-pill border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue-brand hover:text-blue-brand"
        >
          Get in touch
        </Link>
      </div>
    </div>
  );
}
