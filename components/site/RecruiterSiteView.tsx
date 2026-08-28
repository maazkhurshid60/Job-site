import Link from "next/link";
import type { RecruiterSite } from "@/lib/recruiterSite";
import { siteTheme } from "@/lib/siteThemes";
import { SocialIcon, type SocialKind } from "@/components/SocialLinks";

/* Renders one recruiter's free one-page site. Used in two places that must
   stay visually identical: the live preview in the site builder wizard, and
   the actual public page at /sites/[slug] — so "what a theme/template looks
   like" is defined here exactly once. Deliberately does NOT reuse JobFolder's
   own Navbar/Footer or SocialLinkList styling: the whole point of this perk
   is that it reads as the recruiter's own site, not another JobFolder page.

   Visual language borrows from nickjain.org (the actual example linked from
   the career-site pitch page): oversized name typography, an accent square
   offset behind the photo, a floating "current role" badge, and a dark
   "Where I've worked" band — but every accent color below is the recruiter's
   chosen theme, not nickjain's fixed yellow. */

type SiteRecruiter = {
  name: string;
  headline: string;
  bio: string;
  photoURL: string;
  phone: string;
  email: string;
  location: string;
  linkedin: string;
  website: string;
  twitter: string;
  facebook: string;
  instagram: string;
};

type SiteContent = Pick<
  RecruiterSite,
  | "template" | "theme" | "tagline" | "intro" | "specialisms" | "highlights"
  | "stats" | "expertise" | "experience" | "ctaLabel" | "ctaUrl"
>;

export function RecruiterSiteView({
  site,
  recruiter,
}: {
  site: SiteContent;
  recruiter: SiteRecruiter;
}) {
  const theme = siteTheme(site.theme);
  const name = recruiter.name || "Your name";
  const tagline = site.tagline || recruiter.headline || "Recruiter";
  const intro = site.intro || recruiter.bio;
  const initial = name.charAt(0).toUpperCase();
  const currentJob = site.experience.find((e) => e.current) ?? site.experience[0];

  const socials: { kind: SocialKind; value: string }[] = (
    [
      ["linkedin", recruiter.linkedin],
      ["website", recruiter.website],
      ["twitter", recruiter.twitter],
      ["facebook", recruiter.facebook],
      ["instagram", recruiter.instagram],
    ] as [SocialKind, string][]
  )
    .filter(([, value]) => value.trim())
    .map(([kind, value]) => ({ kind, value }));

  const vars = {
    "--site-accent": theme.accent,
    "--site-accent-dark": theme.accentDark,
    "--site-accent-soft": theme.accentSoft,
  } as React.CSSProperties;

  const hasCta = Boolean(site.ctaLabel.trim() && site.ctaUrl.trim());

  const layoutProps: LayoutProps = {
    name,
    tagline,
    intro,
    initial,
    photoURL: recruiter.photoURL,
    hasCta,
    ctaLabel: site.ctaLabel,
    ctaUrl: site.ctaUrl,
    specialisms: site.specialisms,
    highlights: site.highlights,
    stats: site.stats,
    expertise: site.expertise,
    experience: site.experience,
    currentJob,
    socials,
    recruiter,
  };

  return (
    <div style={vars} className="min-h-screen bg-white">
      {site.template === "bold" ? <BoldLayout {...layoutProps} /> : <ClassicLayout {...layoutProps} />}
      <SiteFooter />
    </div>
  );
}

type LayoutProps = {
  name: string;
  tagline: string;
  intro: string;
  initial: string;
  photoURL: string;
  hasCta: boolean;
  ctaLabel: string;
  ctaUrl: string;
  specialisms: string[];
  highlights: string[];
  stats: RecruiterSite["stats"];
  expertise: RecruiterSite["expertise"];
  experience: RecruiterSite["experience"];
  currentJob: RecruiterSite["experience"][number] | undefined;
  socials: { kind: SocialKind; value: string }[];
  recruiter: SiteRecruiter;
};

function ClassicLayout({
  name, tagline, intro, initial, photoURL, hasCta, ctaLabel, ctaUrl,
  specialisms, highlights, stats, expertise, experience, socials, recruiter,
}: LayoutProps) {
  return (
    <>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
        <div className="flex justify-center">
          <Eyebrow tagline={tagline} location={recruiter.location} />
        </div>
        <div className="mt-4 flex justify-center">
          <Avatar initial={initial} photoURL={photoURL} size="h-28 w-28" />
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-ink sm:text-5xl">
          {name}
        </h1>
        {intro && (
          <p className="mx-auto mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-ink/75">
            {intro}
          </p>
        )}
        {specialisms.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Specialisms items={specialisms} />
          </div>
        )}
        {hasCta && (
          <div className="mt-7">
            <Cta label={ctaLabel} url={ctaUrl} />
          </div>
        )}
        {stats.length > 0 && (
          <div className="mt-10 border-t border-line pt-8">
            <Stats items={stats} />
          </div>
        )}
      </div>

      {expertise.length > 0 && (
        <div className="border-t border-line px-6 py-12">
          <div className="mx-auto max-w-xl">
            <SectionLabel>Core expertise</SectionLabel>
            <div className="mt-5">
              <ExpertiseBars items={expertise} />
            </div>
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <DarkBand title="Where I've worked">
          <ExperienceTimeline items={experience} dark />
        </DarkBand>
      )}

      {highlights.length > 0 && (
        <div className="border-y border-[var(--site-accent-soft)] bg-[var(--site-accent-soft)]/40 px-6 py-12">
          <div className="mx-auto max-w-xl">
            <SectionLabel>Track record</SectionLabel>
            <div className="mt-5">
              <Highlights items={highlights} />
            </div>
          </div>
        </div>
      )}

      <div className="px-6 py-12 text-center">
        {socials.length > 0 && (
          <div className="flex justify-center">
            <Socials items={socials} />
          </div>
        )}
        <div className="mt-4 flex justify-center">
          <ContactLines recruiter={recruiter} />
        </div>
      </div>
    </>
  );
}

function BoldLayout({
  name, tagline, intro, initial, photoURL, hasCta, ctaLabel, ctaUrl,
  specialisms, highlights, stats, expertise, experience, currentJob, socials, recruiter,
}: LayoutProps) {
  return (
    <>
      <div className="mx-auto max-w-5xl px-6 pb-14 pt-16 sm:pt-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
          <div className="lg:col-span-7">
            <Eyebrow tagline={tagline} location={recruiter.location} />
            <h1 className="mt-5 text-5xl font-black leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              {name}
            </h1>
            {intro && (
              <p className="mt-6 max-w-lg whitespace-pre-line text-base leading-7 text-ink/70">
                {intro}
              </p>
            )}
            <div className="mt-7 flex flex-wrap items-center gap-4">
              {hasCta && <Cta label={ctaLabel} url={ctaUrl} />}
              {socials.length > 0 && <Socials items={socials} />}
            </div>
            {stats.length > 0 && (
              <div className="mt-10 border-t border-line pt-7">
                <Stats items={stats} />
              </div>
            )}
          </div>
          <div className="lg:col-span-5">
            <PhotoCard initial={initial} photoURL={photoURL} currentJob={currentJob} />
          </div>
        </div>
      </div>

      {specialisms.length > 0 && (
        <div className="border-t border-line px-6 py-8">
          <div className="mx-auto flex max-w-5xl justify-center">
            <Specialisms items={specialisms} />
          </div>
        </div>
      )}

      {expertise.length > 0 && (
        <div className="border-t border-line bg-cream/30 px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Core expertise</SectionLabel>
            <div className="mt-6">
              <ExpertiseBars items={expertise} />
            </div>
          </div>
        </div>
      )}

      {experience.length > 0 && (
        <DarkBand title="Where I've worked">
          <ExperienceTimeline items={experience} dark />
        </DarkBand>
      )}

      {highlights.length > 0 && (
        <div className="border-t border-line px-6 py-14">
          <div className="mx-auto max-w-3xl">
            <SectionLabel>Track record</SectionLabel>
            <div className="mt-6">
              <Highlights items={highlights} />
            </div>
          </div>
        </div>
      )}

      <div className="border-t border-line px-6 py-14 text-center">
        <SectionLabel>Get in touch</SectionLabel>
        <div className="mt-4">
          <ContactLines recruiter={recruiter} />
        </div>
      </div>
    </>
  );
}

function Eyebrow({ tagline, location }: { tagline: string; location: string }) {
  if (!tagline && !location) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-widest text-muted lg:justify-start">
      <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--site-accent)]" aria-hidden />
      <span>
        {tagline}
        {tagline && location ? " · " : ""}
        {location}
      </span>
    </div>
  );
}

function PhotoCard({
  initial, photoURL, currentJob,
}: { initial: string; photoURL: string; currentJob: RecruiterSite["experience"][number] | undefined }) {
  return (
    <div className="relative mx-auto max-w-[320px]">
      <div
        className="absolute -right-5 top-6 aspect-4/5 w-full rounded-3xl bg-[var(--site-accent)]"
        aria-hidden
      />
      <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.18)]">
        {photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-[var(--site-accent-soft)] text-6xl font-black text-[var(--site-accent-dark)]">
            {initial}
          </div>
        )}
      </div>
      {currentJob && (currentJob.company || currentJob.role) && (
        <div className="absolute -bottom-5 -left-6 z-10 flex max-w-[85%] items-center gap-3 rounded-2xl border border-line bg-white px-4 py-3 shadow-lg">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--site-accent-soft)] text-xs font-black text-[var(--site-accent-dark)]">
            {(currentJob.company || currentJob.role).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-ink">{currentJob.company || currentJob.role}</p>
            <p className="truncate text-[11px] text-muted">
              {currentJob.company ? currentJob.role : currentJob.period}
              {currentJob.company && currentJob.period ? ` · ${currentJob.period}` : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({
  initial, photoURL, size, ring,
}: { initial: string; photoURL: string; size: string; ring?: boolean }) {
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-[var(--site-accent-soft)] text-2xl font-bold text-[var(--site-accent-dark)] ${
        ring ? "ring-4 ring-white/40" : ""
      }`}
    >
      {photoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}

function Cta({ label, url, light }: { label: string; url: string; light?: boolean }) {
  const href = /^https?:\/\/|^mailto:|^tel:/i.test(url) ? url : `https://${url}`;
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`inline-flex rounded-pill px-6 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90 ${
        light ? "bg-white text-[var(--site-accent-dark)]" : "bg-[var(--site-accent)] text-white"
      }`}
    >
      {label}
    </a>
  );
}

function Specialisms({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap justify-center gap-2">
      {items.map((s, i) => (
        <li
          key={i}
          className="rounded-pill bg-[var(--site-accent-soft)] px-3 py-1 text-xs font-semibold text-[var(--site-accent-dark)]"
        >
          {s}
        </li>
      ))}
    </ul>
  );
}

function Stats({ items, light }: { items: RecruiterSite["stats"]; light?: boolean }) {
  return (
    <div className="flex flex-wrap justify-center gap-8 lg:justify-start">
      {items.map((s, i) => (
        <div key={i}>
          <p className={`text-3xl font-black tabular-nums ${light ? "text-white" : "text-ink"}`}>
            {s.value}
          </p>
          <p className={`mt-1 text-xs ${light ? "text-white/70" : "text-muted"}`}>{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ExpertiseBars({ items }: { items: RecruiterSite["expertise"] }) {
  return (
    <div className="space-y-4 text-left">
      {items.map((e, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-ink">{e.skill}</span>
            <span className="font-semibold text-[var(--site-accent)]">{e.percent}%</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-pill bg-cream">
            <div
              className="h-full rounded-pill bg-[var(--site-accent)]"
              style={{ width: `${Math.max(0, Math.min(100, e.percent))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExperienceTimeline({ items, dark }: { items: RecruiterSite["experience"]; dark?: boolean }) {
  return (
    <ul className="space-y-6 text-left">
      {items.map((job, i) => (
        <li
          key={i}
          className={`border-l-2 pl-4 ${dark ? "border-[var(--site-accent-soft)]/30" : "border-[var(--site-accent-soft)]"}`}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className={`font-bold ${dark ? "text-white" : "text-ink"}`}>
              {job.role}
              {job.company && (
                <span className={dark ? "font-medium text-white/50" : "font-medium text-muted"}> · {job.company}</span>
              )}
            </p>
            {job.current && (
              <span
                className={`shrink-0 rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                  dark ? "bg-[var(--site-accent)] text-white" : "bg-[var(--site-accent-soft)] text-[var(--site-accent-dark)]"
                }`}
              >
                Current
              </span>
            )}
          </div>
          {job.period && (
            <p className={`mt-0.5 text-xs ${dark ? "text-white/40" : "text-muted"}`}>{job.period}</p>
          )}
          {job.bullets.length > 0 && (
            <ul className="mt-2.5 space-y-1.5">
              {job.bullets.map((b, bi) => (
                <li
                  key={bi}
                  className={`flex items-start gap-2 text-sm leading-6 ${dark ? "text-white/65" : "text-ink/75"}`}
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--site-accent)]" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3 text-left">
      {items.map((h, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-ink/80">
          <svg className="mt-1 h-4 w-4 shrink-0 text-[var(--site-accent)]" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M4 10l4 4 8-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{h}</span>
        </li>
      ))}
    </ul>
  );
}

function Socials({ items, light }: { items: { kind: SocialKind; value: string }[]; light?: boolean }) {
  return (
    <ul className="flex flex-wrap items-center gap-3">
      {items.map((s) => {
        const href = /^https?:\/\//i.test(s.value) ? s.value : `https://${s.value}`;
        return (
          <li key={s.kind}>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={
                light
                  ? "text-white/80 transition-colors hover:text-white"
                  : "text-ink/40 transition-colors hover:text-[var(--site-accent)]"
              }
            >
              <SocialIcon kind={s.kind} className="h-5 w-5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ContactLines({ recruiter }: { recruiter: SiteRecruiter }) {
  if (!recruiter.email && !recruiter.phone) return null;
  return (
    <dl className="space-y-1.5 text-center text-sm text-ink/70">
      {recruiter.email && (
        <div>
          <a href={`mailto:${recruiter.email}`} className="hover:text-[var(--site-accent)]">
            {recruiter.email}
          </a>
        </div>
      )}
      {recruiter.phone && (
        <div>
          <a href={`tel:${recruiter.phone}`} className="hover:text-[var(--site-accent)]">
            {recruiter.phone}
          </a>
        </div>
      )}
    </dl>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-center text-xs font-bold uppercase tracking-wider text-ink/45 lg:text-left">
      {children}
    </h2>
  );
}

/** A full-width dark band — the "Where I've worked" hallmark from nickjain.org,
    generalized to any accent color instead of a fixed yellow-on-navy. */
function DarkBand({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-ink px-6 py-14">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-xs font-bold uppercase tracking-wider text-[var(--site-accent)] lg:text-left">
          {title}
        </h2>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function SiteFooter() {
  return (
    <div className="border-t border-line/60 py-6 text-center text-[11px] text-muted">
      Site by{" "}
      <a
        href="https://jobfolder.com"
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold hover:underline"
      >
        JobFolder
      </a>
    </div>
  );
}
