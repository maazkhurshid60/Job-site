import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Container } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { howSteps, getStep } from "@/lib/howItWorks";
import { absoluteUrl } from "@/lib/seo";

export function generateStaticParams() {
  return howSteps.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const step = getStep(slug);
  if (!step) return { title: "How it works" };

  const url = `/how-it-works/${step.slug}`;
  return {
    title: step.title,
    description: step.intro,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: step.title,
      description: step.intro,
      url,
    },
  };
}

export default async function HowItWorksStepPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const step = getStep(slug);
  if (!step) notFound();

  const others = howSteps.filter((s) => s.slug !== step.slug);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: "How it works",
        item: absoluteUrl("/how-it-works"),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: step.title,
        item: absoluteUrl(`/how-it-works/${step.slug}`),
      },
    ],
  };

  return (
    <>
      <JsonLd schema={breadcrumbSchema} />
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="border-b border-gray-100 bg-gray-50/40 py-16 sm:py-20">
          <Container>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-blue-brand"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              How it works
            </Link>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-brand-soft text-blue-brand">
                {step.icon}
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                {step.title}
              </h1>
            </div>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
              {step.intro}
            </p>
          </Container>
        </section>

        {/* Body sections */}
        <section className="py-16 sm:py-20">
          <Container>
            <div className="mx-auto max-w-2xl space-y-10">
              {step.sections.map((sec) => (
                <div key={sec.heading}>
                  <h2 className="text-xl font-bold text-ink">{sec.heading}</h2>
                  <p className="mt-3 leading-relaxed text-muted">{sec.body}</p>
                </div>
              ))}

              {/* CTA */}
              <div className="rounded-3xl border border-blue-brand-light bg-blue-brand-soft p-8 text-center">
                <p className="text-lg font-bold text-ink">Ready to get started?</p>
                <Link
                  href={step.cta.href}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-pill bg-blue-brand px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-brand-dark"
                >
                  {step.cta.label}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Container>
        </section>

        {/* Other steps */}
        <section className="border-t border-gray-100 bg-gray-50/40 py-16">
          <Container>
            <h2 className="text-center text-sm font-bold uppercase tracking-wider text-blue-brand">
              Keep exploring
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {others.map((s) => (
                <Link
                  key={s.slug}
                  href={`/how-it-works/${s.slug}`}
                  className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-brand/20 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-brand-soft text-blue-brand transition-colors group-hover:bg-blue-brand group-hover:text-white">
                    {s.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-ink group-hover:text-blue-brand">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {s.summary}
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
