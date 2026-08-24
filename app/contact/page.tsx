"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Recaptcha } from "@/components/Recaptcha";
import { Container, Eyebrow } from "@/components/ui";
import { photo } from "@/components/images";
import { sendMessage } from "@/lib/messages";

export default function ContactPage() {
  // Pre-fills from a job's "Ask a question" link (?subject=…). Read during
  // the initial render, not an effect, so it doesn't cause a second pass.
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: searchParams.get("subject") ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  // Bumped on every failed attempt to remount <Recaptcha> — its tokens are
  // single-use and the widget can't reset itself in place (see Recaptcha.tsx).
  const [recaptchaAttempt, setRecaptchaAttempt] = useState(0);
  const recaptchaRequired = Boolean(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await sendMessage({ ...form, recaptchaToken });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message. Please try again.");
      setRecaptchaToken(null);
      setRecaptchaAttempt((n) => n + 1);
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-cream">
        <Container className="grid gap-12 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <Eyebrow>Contact</Eyebrow>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-ink">
              Let&apos;s talk about your hiring
            </h1>
            <p className="mt-4 max-w-md text-muted">
              Tell us the roles you&apos;re hiring for and we&apos;ll get back to
              you with how JobFolder can help — usually within one
              business day.
            </p>
            <div className="relative mt-10 aspect-[5/3] w-full max-w-md overflow-hidden rounded-2xl shadow-lg ring-1 ring-black/5">
              <Image
                src={photo.interviewHandshake.src}
                alt={photo.interviewHandshake.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 28rem"
                className="object-cover"
              />
            </div>
          </div>

          <div>
            {done ? (
              <div className="rounded-2xl border border-line bg-white p-8 text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-soft text-primary">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M5 13l4 4 10-11" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2 className="mt-4 text-lg font-bold text-ink">
                  Message sent
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Thanks — we&apos;ll be in touch shortly.
                </p>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="rounded-2xl border border-line bg-white p-6"
              >
                <div className="grid gap-4">
                  <Field label="Your name">
                    <input
                      className="input"
                      required
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Jordan Lee"
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      className="input"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="you@company.com"
                    />
                  </Field>
                  <Field label="Subject">
                    <input
                      className="input"
                      required
                      value={form.subject}
                      onChange={(e) => set("subject", e.target.value)}
                      placeholder="Hiring 2 engineers"
                    />
                  </Field>
                  <Field label="Message">
                    <textarea
                      className="input min-h-32 resize-y"
                      required
                      value={form.message}
                      onChange={(e) => set("message", e.target.value)}
                      placeholder="A little about the roles and timeline…"
                    />
                  </Field>
                </div>

                <div className="mt-4">
                  <Recaptcha key={recaptchaAttempt} onChange={setRecaptchaToken} />
                </div>

                {error && (
                  <p className="mt-4 rounded-lg bg-coral-soft px-3 py-2 text-sm text-coral">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || (recaptchaRequired && !recaptchaToken)}
                  className="mt-6 w-full rounded-pill bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
                >
                  {submitting ? "Sending…" : "Send message"}
                </button>
              </form>
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Field({
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
