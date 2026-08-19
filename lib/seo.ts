/* Shared SEO constants. Every page's metadata and every JSON-LD block reads
   from here so the brand name, domain, and description stay in one place.
   See SEO.md for the keyword map these terms come from. */

/** Production origin. Set NEXT_PUBLIC_SITE_URL before launch — canonical URLs
    and OG image paths are resolved against it. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://jobfolder.com"
).replace(/\/$/, "");

export const SITE_NAME = "JobFolder";

export const CONTACT_EMAIL = "hello@jobfolder.com";

/** One-line positioning used as the default meta description. */
export const SITE_DESCRIPTION =
  "JobFolder is an engineering recruiting agency for civil, transportation and DOT hiring. A network of specialist recruiters works every role, we screen every candidate ourselves, and you stay with one point of contact until the hire is made.";

/** Site-wide keyword pool. Individual pages narrow this to their own cluster. */
export const SITE_KEYWORDS = [
  "engineering recruiting agency",
  "civil engineering recruiters",
  "DOT staffing agency",
  "transportation engineering recruiters",
  "AEC recruiting firm",
  "structural engineering recruiters",
  "MEP engineering recruitment",
  "CEI inspection staffing",
  "engineering staffing agency",
  "split fee recruiting network",
];

/** Absolute URL for a site-relative path. */
export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/* ---------------------------------------------------------------- JSON-LD */

/** The organisation itself. EmploymentAgency is the precise schema.org type
    for a recruiting firm and is a subtype of LocalBusiness/Organization. */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EmploymentAgency",
  "@id": absoluteUrl("/#organization"),
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/jobfolder-logo.png"),
  description: SITE_DESCRIPTION,
  email: CONTACT_EMAIL,
  areaServed: { "@type": "Country", name: "United States" },
  knowsAbout: [
    "Civil engineering recruitment",
    "Transportation and DOT staffing",
    "Structural engineering recruitment",
    "MEP engineering recruitment",
    "CEI and construction inspection staffing",
    "AEC talent acquisition",
  ],
};

/** Enables the sitelinks search box when the job board is crawled. */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  publisher: { "@id": absoluteUrl("/#organization") },
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};
