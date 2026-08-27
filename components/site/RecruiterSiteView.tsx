import Link from "next/link";
import type { RecruiterSite } from "@/lib/recruiterSite";
import { siteTheme } from "@/lib/siteThemes";
import { SocialIcon, type SocialKind } from "@/components/SocialLinks";

/* Renders one recruiter's free one-page site. Used in two places that must
   stay visually identical: the live preview in the site builder wizard, and
   the actual public page at /sites/[slug] — so "what a theme/template looks
   like" is defined here exactly once. Deliberately does NOT reuse JobFolder's
   own Navbar/Footer or SocialLinkList styling: the whole point of this perk
   is that it reads as the recruiter's own site, not another JobFolder page. */

type SiteRecruiter = {
  name: string;
  headline: string;
  bio: string;
  photoURL: string;
  phone: string;
  email: string;
  linkedin: string;
  website: string;
  twitter: string;
  facebook: string;
  instagram: string;
};

type SiteContent = Pick<
  RecruiterSite,
  "template" | "theme" | "tagline" | "intro" | "specialisms" | "highlights" | "ctaLabel" | "ctaUrl"
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

  return (
    <div style={vars} className="min-h-screen bg-white">
      {site.template === "bold" ? (
        <BoldLayout
          name={name}
          tagline={tagline}
          intro={intro}
          initial={initial}
          photoURL={recruiter.photoURL}
          hasCta={hasCta}
          ctaLabel={site.ctaLabel}
          ctaUrl={site.ctaUrl}
          specialisms={site.specialisms}
          highlights={site.highlights}
          socials={socials}
          recruiter={recruiter}
        />
      ) : (
        <ClassicLayout
          name={name}
          tagline={tagline}
          intro={intro}
          initial={initial}
          photoURL={recruiter.photoURL}
          hasCta={hasCta}
          ctaLabel={site.ctaLabel}
          ctaUrl={site.ctaUrl}
          specialisms={site.specialisms}
          highlights={site.highlights}
          socials={socials}
          recruiter={recruiter}
        />
      )}
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
  socials: { kind: SocialKind; value: string }[];
  recruiter: SiteRecruiter;
};

function ClassicLayout({
  name, tagline, intro, initial, photoURL, hasCta, ctaLabel, ctaUrl,
  specialisms, highlights, socials, recruiter,
}: LayoutProps) {
  return (
    <>
      <div className="mx-auto max-w-2xl px-6 py-16 text-center sm:py-20">
        <div className="flex justify-center">
          <Avatar initial={initial} photoURL={photoURL} size="h-28 w-28" />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          {name}
        </h1>
        <p className="mt-1.5 text-base font-semibold text-[var(--site-accent)]">{tagline}</p>
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
      </div>

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
  specialisms, highlights, socials, recruiter,
}: LayoutProps) {
  return (
    <>
      <div className="bg-[var(--site-accent)] px-6 py-16 text-center text-white sm:py-20">
        <div className="flex justify-center">
          <Avatar initial={initial} photoURL={photoURL} size="h-24 w-24" ring />
        </div>
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">{name}</h1>
        <p className="mt-1.5 text-base text-white/85">{tagline}</p>
        {hasCta && (
          <div className="mt-6 flex justify-center">
            <Cta label={ctaLabel} url={ctaUrl} light />
          </div>
        )}
        {socials.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Socials items={socials} light />
          </div>
        )}
      </div>

      <div className="mx-auto grid max-w-4xl gap-10 px-6 py-14 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          {intro && (
            <p className="whitespace-pre-line text-base leading-7 text-ink/80">{intro}</p>
          )}
          {highlights.length > 0 && (
            <div className="mt-8">
              <SectionLabel>Track record</SectionLabel>
              <div className="mt-3">
                <Highlights items={highlights} />
              </div>
            </div>
          )}
        </div>
        <aside className="space-y-6">
          {specialisms.length > 0 && (
            <div>
              <SectionLabel>Specialisms</SectionLabel>
              <div className="mt-3">
                <Specialisms items={specialisms} />
              </div>
            </div>
          )}
          <div>
            <SectionLabel>Get in touch</SectionLabel>
            <div className="mt-3">
              <ContactLines recruiter={recruiter} />
            </div>
          </div>
        </aside>
      </div>
    </>
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
    <ul className="flex flex-wrap items-center justify-center gap-3">
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
