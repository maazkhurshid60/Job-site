"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { SiteBuilderWizard } from "@/components/dashboard/SiteBuilderWizard";
import { PageLoader } from "@/components/Loader";

/* A benefit recruiters don't know about until they see it: land one hire
   through JobFolder and we'll build you a free personal recruiter website —
   your own place to show your track record, not just a profile on ours.

   Until an admin unlocks it (UserProfile.siteBuilderEnabled), this is just
   the pitch below. Once unlocked, the pitch is replaced by the actual
   self-serve builder — see SiteBuilderWizard. */
export default function CareerSitePage() {
  const { profile, profileLoading } = useAuth();

  if (profileLoading) return <PageLoader />;
  if (profile?.siteBuilderEnabled) return <SiteBuilderWizard />;

  return (
    <div>
      <div className="mb-6">
        <p className="eyebrow uppercase">Recruiter perk</p>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
          Your own recruiter website — on us
        </h1>
        <p className="mt-1.5 max-w-2xl text-xs leading-5 text-muted">
          Land your first confirmed placement through JobFolder, and we&apos;ll
          design and host a personal website for you, free — your own domain
          presence to show candidates and clients the recruiter behind the
          results, not just another profile buried in an agency directory.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-bold text-ink">How it works</h2>
          <ol className="mt-3 space-y-3">
            <Step n={1} title="Refer and place a candidate">
              Submit candidates for any open role and get one hired — that&apos;s
              the only requirement.
            </Step>
            <Step n={2} title="Tell us a bit about your brand">
              Your name, headshot, specialisms and track record — most of this
              is already on{" "}
              <Link href="/dashboard/profile" className="font-semibold text-primary hover:underline">
                your profile
              </Link>
              .
            </Step>
            <Step n={3} title="We design, build and host it">
              A clean, fast, one-page recruiter site — live on a domain of
              your choice, at no cost to you.
            </Step>
          </ol>
          <p className="mt-4 text-[11px] text-muted">
            Already have your own website or domain? Send it over and
            we&apos;ll point your new site there instead of a JobFolder
            subdomain.
          </p>
          <Link
            href="/contact?subject=Recruiter website — free site perk"
            className="mt-3 inline-block rounded-pill bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark"
          >
            Ask about your free site
          </Link>
        </div>

        {/* example */}
        <div className="rounded-2xl border border-line bg-white p-5">
          <h2 className="text-sm font-bold text-ink">See an example</h2>
          <p className="mt-1 text-xs text-muted">
            This is the kind of site we build — live, real, and built for one
            of our recruiters.
          </p>
          <a
            href="https://nickjain.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-3 block overflow-hidden rounded-xl border border-line transition-colors hover:border-primary"
          >
            <div className="flex items-center gap-2 border-b border-line bg-cream/60 px-3.5 py-2">
              <span className="h-2 w-2 rounded-full bg-coral/60" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-lime/60" aria-hidden />
              <span className="h-2 w-2 rounded-full bg-primary/40" aria-hidden />
              <span className="ml-2 truncate text-[11px] text-muted">nickjain.org</span>
            </div>
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-wide text-primary">
                Recruiter website example
              </p>
              <p className="mt-1.5 text-base font-extrabold text-ink">Nick Jain</p>
              <p className="text-xs text-muted">Recruitment Specialist</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                A personal site with his own story, placements and a direct
                way for candidates and clients to reach him — built and
                hosted the same way yours would be.
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary group-hover:underline">
                Visit nickjain.org
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
                  <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
        {n}
      </span>
      <div>
        <p className="text-xs font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted">{children}</p>
      </div>
    </li>
  );
}
