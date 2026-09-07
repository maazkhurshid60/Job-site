"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  getMessage,
  setMessageHandled,
  setMessageSleeping,
  replyToMessage,
  type ContactMessage,
} from "@/lib/messages";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { ReplyBox } from "@/components/admin/ReplyBox";
import { adminRoutes } from "@/lib/routes";
import { formatDate } from "@/lib/dates";

/* One enquiry, in full.
 *
 * The inbox list has to stay scannable, so a long thread was collapsed into
 * whatever fitted in a card and the reply box appeared inside a row that
 * moved under it as filters changed. A conversation deserves its own URL:
 * it can be linked to a colleague, kept open in a tab while you look
 * something up, and refreshed without losing your place.
 *
 * It reads through GET /api/messages/[id] rather than filtering the list
 * endpoint client-side — a page about one conversation shouldn't need every
 * enquiry ever sent to render.
 */
export default function EnquiryThreadPage() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);

  const [message, setMessage] = useState<ContactMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMessage(await getMessage(numericId));
      setNotFound(false);
    } catch (err) {
      /* A deleted or mistyped id is a 404, which is a different thing from
         the server being down — one deserves an explanation, the other a
         retry button. */
      const text = errorMessage(err, "The server did not respond. Please try again.");
      if (/no longer exists|not found/i.test(text)) setNotFound(true);
      else setError(text);
    } finally {
      setLoading(false);
    }
  }, [numericId]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(field: "handled" | "sleeping") {
    if (!message || busy) return;
    const next = !message[field];
    // Optimistic, rolled back on failure — same pattern as the inbox list.
    setMessage({ ...message, [field]: next });
    setBusy(true);
    setError(null);
    try {
      if (field === "handled") await setMessageHandled(message.id, next);
      else await setMessageSleeping(message.id, next);
      setNotice(
        field === "sleeping"
          ? next
            ? "Asleep. It stays out of the working lists until you wake it, or until they reply."
            : "Awake again."
          : next
            ? "Marked handled."
            : "Reopened.",
      );
    } catch (err) {
      setMessage({ ...message, [field]: !next });
      setError(errorMessage(err, "Could not update that enquiry."));
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(text: string) {
    if (!message) return;
    const { emailed } = await replyToMessage(message.id, text);
    // Replying marks it handled server-side, so re-read rather than guessing.
    await load();
    setNotice(
      emailed
        ? `Reply sent to ${message.email}.`
        : `Reply saved, but the email to ${message.email} didn't send. Check the Brevo settings.`,
    );
  }

  if (loading) {
    return (
      <div className="grid h-64 place-items-center rounded-2xl border border-line bg-white">
        <Loader />
      </div>
    );
  }

  if (notFound || !message) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
        <h1 className="font-bold text-ink">That enquiry no longer exists</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted">
          It may have been deleted. Everything still in the inbox is on the{" "}
          <Link href={adminRoutes.messages} className="text-primary hover:underline">
            enquiries list
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={adminRoutes.messages}
        className="text-xs font-semibold text-muted transition-colors hover:text-primary"
      >
        ← All enquiries
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow uppercase">Enquiry</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
            {message.subject || "(no subject)"}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {message.name || "(no name)"}
            {" · "}
            <a href={`mailto:${message.email}`} className="text-primary hover:underline">
              {message.email}
            </a>
            {" · "}
            {formatDate(message.createdAt)}
            {message.senderUid && " · has a JobFolder account"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => toggle("handled")}
            disabled={busy}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
              message.handled
                ? "border border-line text-muted hover:border-ink/25 hover:text-ink"
                : "bg-primary text-white hover:bg-primary-dark"
            }`}
          >
            {message.handled ? "Reopen" : "Mark handled"}
          </button>
          <button
            type="button"
            onClick={() => toggle("sleeping")}
            disabled={busy}
            className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {message.sleeping ? "Wake" : "Sleep"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {message.sleeping && (
          <span className="rounded-pill bg-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
            Asleep
          </span>
        )}
        <span
          className={`rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
            message.handled ? "bg-sage-soft text-ink" : "bg-primary-soft text-primary"
          }`}
        >
          {message.handled ? "Handled" : "Needs a reply"}
        </span>
        <span className="rounded-pill border border-line px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
          {message.replies.length} {message.replies.length === 1 ? "message" : "messages"} back
          and forth
        </span>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-primary/30 bg-primary-soft/50 px-4 py-3 text-sm text-ink">
          {notice}
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="ml-3 text-xs font-semibold text-primary hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && <div className="mt-4"><LoadError what="this enquiry" message={error} onRetry={load} /></div>}

      {/* The conversation, oldest first — theirs flush left on a neutral
          ground, ours indented and tinted, so who said what is readable
          without reading the names. */}
      <div className="mt-5 space-y-3">
        <article className="rounded-xl border border-line bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            {message.name || message.email} wrote · {formatDate(message.createdAt)}
          </p>
          {/* whitespace-pre-wrap: their line breaks are the only structure a
              plain-text message has. */}
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {message.message || "(no message body)"}
          </p>
        </article>

        {message.replies.map((r) => (
          <article
            key={r.id}
            className={
              r.direction === "in"
                ? "rounded-xl border border-line bg-cream/50 p-4"
                : "ml-6 rounded-xl border border-primary/20 bg-primary-soft/40 p-4"
            }
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                r.direction === "in" ? "text-muted" : "text-primary"
              }`}
            >
              {r.direction === "in"
                ? `${r.adminName || "They"} replied`
                : `${r.adminName || "JobFolder"} replied`}
              {" · "}
              {formatDate(r.createdAt)}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{r.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-line bg-white p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
          Reply to {message.name || message.email}
        </p>
        <ReplyBox onSend={sendReply} autoFocus={false} />
      </div>
    </div>
  );
}
