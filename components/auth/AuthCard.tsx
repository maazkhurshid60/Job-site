import Link from "next/link";
import { Logo } from "@/components/Logo";

/* Centered card used by the public login / signup pages. On large screens an
   optional `aside` turns it into a two-up panel — the same dark-ink-plus-lime
   treatment as the homepage's "For recruiters" section (see Recruiters.tsx),
   so a visitor who has seen that section recognises the brand here rather
   than landing on a generic auth form. On mobile the aside is dropped and
   this collapses back to the original single-column card. */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
  aside,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen place-items-center bg-cream px-6 py-12">
      <div className={`w-full ${aside ? "max-w-4xl" : "max-w-md"}`}>
        <div className={`mb-8 flex justify-center ${aside ? "lg:hidden" : ""}`}>
          <Logo />
        </div>
        <div
          className={`overflow-hidden rounded-3xl border border-line bg-white shadow-[0_24px_60px_-30px_rgba(23,19,15,0.25)] ${
            aside ? "lg:grid lg:grid-cols-2" : ""
          }`}
        >
          {aside && (
            <div className="hidden flex-col justify-between bg-ink p-10 text-white lg:flex">
              {aside}
            </div>
          )}
          <div className="p-8 sm:p-10">
            {aside && (
              <div className="mb-6 hidden lg:block">
                <Logo />
              </div>
            )}
            <h1 className="text-xl font-extrabold tracking-tight text-ink">
              {title}
            </h1>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </div>
        </div>
        {footer && (
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        )}
        <p className="mt-4 text-center text-xs text-muted">
          <Link href="/" className="hover:text-ink">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

/* Shared labelled field. */
export function AuthField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
    </label>
  );
}

/* Same three perks as the homepage's recruiter pitch (Recruiters.tsx) — kept
   as one list so the claims stay identical wherever they're shown rather than
   drifting into two versions of "why join". */
const RECRUITER_PERKS = [
  { stat: "Keep the bounty", label: "Earn a competitive split on every confirmed hire — paid promptly." },
  { stat: "Real briefs", label: "Work vetted, funded roles with a clear spec instead of cold job posts." },
  { stat: "No client chasing", label: "We handle the relationship and admin — you focus on great candidates." },
];

/** The default `aside` content for the login / signup cards. */
export function RecruiterAside({
  eyebrow,
  headline,
  body,
}: {
  eyebrow: string;
  headline: string;
  body: string;
}) {
  return (
    <>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-lime">
          {eyebrow}
        </p>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight">
          {headline}
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/70">{body}</p>
      </div>
      <ul className="mt-10 space-y-6">
        {RECRUITER_PERKS.map((p) => (
          <li key={p.stat}>
            <p className="text-base font-bold text-lime">{p.stat}</p>
            <p className="mt-1 text-sm leading-6 text-white/60">{p.label}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
