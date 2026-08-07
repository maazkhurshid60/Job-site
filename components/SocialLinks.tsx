import Link from "next/link";

/* The recruiter-editable social fields, in the order they're shown everywhere
   they appear (profile form, admin recruiter view, submission sidebar) — one
   source of truth so a new network only has to be added once. */
export type SocialKind = "linkedin" | "website" | "twitter" | "facebook" | "instagram";

export const SOCIAL_FIELDS: { key: SocialKind; label: string; placeholder: string }[] = [
  { key: "website", label: "Website", placeholder: "https://your-agency.com" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/…" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/…" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
];

/* Monoline glyphs, not brand marks — kept visually consistent with the rest of
   the app's stroke icons (see DashboardGate) rather than pasting in four
   differently-styled brand logos. */
export function SocialIcon({ kind, className = "h-4 w-4" }: { kind: SocialKind; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (kind) {
    case "website":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="2.5" />
          <path d="M7.8 10.2v6M7.8 7.6v.01M12 16.2v-3.6c0-1.3.9-2.4 2.2-2.4 1.3 0 2 .9 2 2.4v3.6" />
        </svg>
      );
    case "twitter":
      return (
        <svg {...common}>
          <path d="M4 4l16 16M20 4 4 20" />
        </svg>
      );
    case "facebook":
      return (
        <svg {...common}>
          <path d="M14.5 21v-7h2.3l.4-3h-2.7V9c0-.9.3-1.5 1.6-1.5H17V4.9c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8.5v3H11v7" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
          <circle cx="12" cy="12" r="3.6" />
          <path d="M16.7 7.3h.01" />
        </svg>
      );
  }
}

/* A short host-name label for a social URL — "linkedin.com/in/jordan-lee"
   rather than the full https://… string, which is both cleaner and less
   likely to overflow the pill it sits in. Falls back to the raw value for
   anything that doesn't parse as a URL rather than hiding it. */
function shortLabel(value: string): string {
  try {
    const u = new URL(value);
    return `${u.host}${u.pathname !== "/" ? u.pathname : ""}`.replace(/\/$/, "");
  } catch {
    return value;
  }
}

/* Icon-led pills for read-only display (admin recruiter view, submission
   sidebar). Renders nothing when every field is empty, so callers don't need
   their own "does this recruiter have any socials" check. */
export function SocialLinkList({
  links,
  className = "",
}: {
  links: Partial<Record<SocialKind, string>>;
  className?: string;
}) {
  const present = SOCIAL_FIELDS.filter((f) => links[f.key]?.trim());
  if (present.length === 0) return null;

  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {present.map((f) => {
        const value = links[f.key]!.trim();
        const href = /^https?:\/\//i.test(value) ? value : `https://${value}`;
        return (
          <li key={f.key}>
            <Link
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-pill border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-primary hover:text-primary"
              title={value}
            >
              <SocialIcon kind={f.key} className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="truncate">{shortLabel(value)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
