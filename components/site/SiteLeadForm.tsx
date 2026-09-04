"use client";

import { useState } from "react";
import { sendSiteLead } from "@/lib/siteLeads";

/* The contact form on a recruiter's public microsite.
 *
 * The contact section used to be a mailto: link, which meant an enquiry went
 * straight into the recruiter's personal inbox and left no record anywhere —
 * so neither they nor an admin could tell how much work the site was
 * actually bringing in. This captures the enquiry first, then emails it on.
 *
 * `slug` is null in the site-builder preview, where posting a real lead
 * would be wrong. The form still renders (the recruiter needs to see what
 * visitors will see) but doesn't submit.
 */
export function SiteLeadForm({ slug }: { slug: string | null }) {
  const preview = slug === null;

  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (preview || sending) return;

    setSending(true);
    setError(null);
    try {
      await sendSiteLead(slug, form);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSending(false);
    }
  }

  /* Replacing the form entirely, rather than showing a message above it,
     so nobody sends the same enquiry twice wondering if it worked. */
  if (sent) {
    return (
      <div className="mx-auto mt-6 max-w-md rounded-xl border border-[var(--site-accent)]/30 bg-[var(--site-accent-soft)]/50 p-6 text-center">
        <p className="text-sm font-semibold text-ink">Thanks — your message is on its way.</p>
        <p className="mt-1 text-sm text-ink/70">You&rsquo;ll get a reply at {form.email}.</p>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/40 focus:border-[var(--site-accent)]";

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-6 max-w-md text-left">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className={field}
          placeholder="Your name"
          value={form.name}
          onChange={set("name")}
          autoComplete="name"
          maxLength={255}
        />
        <input
          className={field}
          type="email"
          required
          placeholder="Email address"
          value={form.email}
          onChange={set("email")}
          autoComplete="email"
          maxLength={320}
        />
      </div>
      <input
        className={`${field} mt-3`}
        placeholder="Phone (optional)"
        value={form.phone}
        onChange={set("phone")}
        autoComplete="tel"
        maxLength={64}
      />
      <textarea
        className={`${field} mt-3 min-h-28 resize-y`}
        required
        placeholder="How can I help?"
        value={form.message}
        onChange={set("message")}
      />

      {error && <p className="mt-3 text-sm text-coral">{error}</p>}

      <button
        type="submit"
        disabled={sending || preview}
        className="mt-4 w-full rounded-lg bg-[var(--site-accent)] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {preview ? "Preview — form is live on your published site" : sending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
