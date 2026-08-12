import Image from "next/image";
import Link from "next/link";
import { Container } from "./ui";
import { FEE_TIERS } from "@/lib/feeTiers";
import { photo } from "./images";

/* Homepage-specific — deliberately not the shared <Recruiters> band (used
   with different copy on /contact, /press, etc.). This one exists to make
   the $1k/$2k/$3k tier system itself the pitch, and to explain — not just
   state — why the number changes from role to role. */
export function RecruiterFeeSection() {
  return (
    <section className="relative overflow-hidden bg-blue-brand-dark py-16 lg:py-24">
      {/* Background photograph, heavily darkened — texture behind the pitch
          rather than competing with it. */}
      <div className="absolute inset-0" aria-hidden>
        <Image
          src={photo.steelBeams.src}
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-brand-dark via-blue-brand-dark/95 to-blue-brand-dark" />
      </div>

      <Container className="relative">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-lime">For recruiters</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            One placement can pay up to $3,000
          </h2>
          <p className="mt-5 leading-7 text-white/70">
            You already recruit. You already know candidates. JobFolder gives
            you additional positions to work without requiring you to find
            the client. You source the talent. We manage the employer
            relationship. You earn the published recruiter fee when your
            candidate is hired.
          </p>
        </div>
 
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {FEE_TIERS.map((t) => (
            <div key={t.value} className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
              <p className="text-3xl font-extrabold text-lime">${t.amount.toLocaleString()}</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {t.label.replace("Search", "Positions")}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/60">{t.blurb}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-lime">
            Why the fee changes by position
          </p>
          <p className="mt-3 leading-7 text-white/70">
            JobFolder sets the fee before a position is opened to the
            network, based on how hard the role is to fill — candidate
            availability, required licenses or clearances, and how senior
            or specialized the search is. The number shown on the position
            is exactly what you earn. There&apos;s nothing to negotiate and
            nothing hidden behind it.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-white/50">
          No membership fee. No cost to submit a candidate. You&apos;re paid
          only when your candidate is hired.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-lime px-8 py-3.5 text-sm font-bold text-ink transition-colors hover:bg-lime/90"
          >
            Join Free
          </Link>
          <Link
            href="/how-it-works"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            See how it works
          </Link>
        </div>
      </Container>
    </section>
  );
}
