import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { guides, getGuide } from "@/lib/hiringGuides";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Hiring Guides" };

  const url = `/hiring-guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.summary,
    keywords: guide.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.summary,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.summary,
    },
  };
}

export default async function HiringGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const others = guides.filter((g) => g.slug !== guide.slug).slice(0, 2);

  /* No datePublished/dateModified: we have no editorial dates to assert, and a
     fabricated one is worse than an absent one. Add them when the guides get
     real publication dates. */
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.summary,
    url: absoluteUrl(`/hiring-guides/${guide.slug}`),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@id": absoluteUrl("/#organization") },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": absoluteUrl(`/hiring-guides/${guide.slug}`),
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "Hiring guides",
        item: absoluteUrl("/hiring-guides"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: guide.title,
        item: absoluteUrl(`/hiring-guides/${guide.slug}`),
      },
    ],
  };

  return (
    <>
      <JsonLd schema={[articleSchema, breadcrumbSchema]} />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <Link
              href="/hiring-guides"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-blue-brand"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Hiring guides
            </Link>

            <h1 className="mt-6 max-w-3xl text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
              {guide.title}
            </h1>
            <p className="mt-2 text-sm font-semibold text-blue-brand">
              {guide.readingTime}
            </p>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {guide.intro}
            </p>
          </Container>
        </section>

        {/* Body */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl">
              {/* On-page contents — helps readers and gives crawlers the
                  section headings as internal anchors. */}
              <nav
                aria-label="On this page"
                className="rounded-3xl border border-gray-100 bg-gray-50/50 p-6"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                  On this page
                </p>
                <ul className="mt-4 space-y-2">
                  {guide.sections.map((s) => (
                    <li key={s.heading}>
                      <a
                        href={`#${slugify(s.heading)}`}
                        className="text-sm font-semibold text-muted transition-colors hover:text-blue-brand"
                      >
                        {s.heading}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="mt-12 space-y-12">
                {guide.sections.map((s) => (
                  <div key={s.heading} id={slugify(s.heading)} className="scroll-mt-24">
                    <h2 className="text-xl font-bold text-ink sm:text-2xl">
                      {s.heading}
                    </h2>
                    {s.body.map((p) => (
                      <p key={p.slice(0, 40)} className="mt-4 leading-relaxed text-muted">
                        {p}
                      </p>
                    ))}
                    {s.bullets && (
                      <ul className="mt-5 space-y-2.5">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex gap-3 text-muted">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-brand" />
                            <span className="leading-relaxed">{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-16 rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-8 text-center">
                <p className="text-lg font-bold text-ink">
                  Hiring for a role like this?
                </p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                  We put a network of specialist recruiters on the brief and
                  screen every candidate before you see them. You pay only on the
                  hire.
                </p>
                <Link
                  href="/contact"
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
                >
                  Talk to us about hiring
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Related guides */}
        <section className="border-t border-gray-100 bg-gray-50/40 py-16">
          <Container>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-blue-brand">
              Keep reading
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {others.map((g) => (
                <Link
                  key={g.slug}
                  href={`/hiring-guides/${g.slug}`}
                  className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-brand/20 hover:shadow-lg"
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-brand">
                    {g.readingTime}
                  </span>
                  <h3 className="mt-3 text-lg font-bold text-ink group-hover:text-blue-brand">
                    {g.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {g.summary}
                  </p>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}

/** Heading → anchor id, for the on-page contents links. */
function slugify(heading: string) {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
