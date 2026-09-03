"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listMessages, setMessageHandled, type ContactMessage } from "@/lib/messages";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { formatDate } from "@/lib/dates";

/* Contact-form enquiries.
 *
 * These were written to the `messages` table and emailed onward, and that
 * was it — no page in the console read them. So a lead only really existed
 * in whoever's inbox the notification reached, and when that address turned
 * out not to exist, leads were landing nowhere anybody looked.
 *
 * This is the copy of record: the row is written before the email is
 * attempted (see POST /api/messages), so an enquiry shows up here whether
 * the notification email worked or not.
 */

type Tab = "new" | "handled" | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "new", label: "Needs a reply" },
  { value: "handled", label: "Handled" },
  { value: "all", label: "All" },
];

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("new");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listMessages()
      .then(setMessages)
      .catch((err) => setError(errorMessage(err, "The server did not respond. Please try again.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      new: messages.filter((m) => !m.handled).length,
      handled: messages.filter((m) => m.handled).length,
      all: messages.length,
    }),
    [messages],
  );

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return messages.filter((m) => {
      if (tab === "new" && m.handled) return false;
      if (tab === "handled" && !m.handled) return false;
      if (!term) return true;
      return [m.name, m.email, m.subject, m.message].join(" ").toLowerCase().includes(term);
    });
  }, [messages, tab, q]);

  async function toggleHandled(m: ContactMessage) {
    const next = !m.handled;
    /* Optimistic, rolled back on failure — the same pattern as the recruiter
       toggles, so a slow connection doesn't make the tick feel broken. */
    setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, handled: next } : x)));
    setBusyId(m.id);
    try {
      await setMessageHandled(m.id, next);
    } catch (err) {
      setMessages((list) => list.map((x) => (x.id === m.id ? { ...x, handled: !next } : x)));
      setError(errorMessage(err, "Could not update that enquiry."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">Inbox</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">Enquiries</h1>
          <p className="mt-1 text-xs text-muted">
            Everything sent through the contact form on jobfolder.com.
            {counts.new > 0 && ` ${counts.new} still to answer.`}
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input h-9 pl-9 text-xs"
            placeholder="Search name, email, message…"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="13"
            height="13"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={`rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.value
                ? "border-primary bg-primary text-white"
                : "border-line bg-white text-ink hover:border-ink/25"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 tabular-nums ${tab === t.value ? "text-white/70" : "text-muted"}`}
            >
              {counts[t.value]}
            </span>
          </button>
        ))}
      </div>

      {error && <LoadError what="enquiries" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">
            {messages.length === 0 ? "No enquiries yet" : "Nothing here"}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {messages.length === 0
              ? "Messages sent through the contact form will appear here."
              : "No enquiry matches this filter or search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((m) => (
            <li
              key={m.id}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                m.handled ? "border-line" : "border-primary/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {m.subject || "(no subject)"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {m.name || "(no name)"}
                    {" · "}
                    <a href={`mailto:${m.email}`} className="text-primary hover:underline">
                      {m.email}
                    </a>
                    {" · "}
                    {formatDate(m.createdAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!m.handled && (
                    <span className="rounded-pill bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      New
                    </span>
                  )}
                  <a
                    href={`mailto:${m.email}?subject=${encodeURIComponent(
                      `Re: ${m.subject || "your enquiry"}`,
                    )}`}
                    className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                  >
                    Reply
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleHandled(m)}
                    disabled={busyId === m.id}
                    className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      m.handled
                        ? "border border-line text-muted hover:border-ink/25 hover:text-ink"
                        : "bg-primary text-white hover:bg-primary-dark"
                    }`}
                  >
                    {m.handled ? "Reopen" : "Mark handled"}
                  </button>
                </div>
              </div>

              {/* whitespace-pre-wrap: the sender's line breaks are the only
                  structure a plain-text message has. */}
              {m.message && (
                <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm leading-relaxed text-ink">
                  {m.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
