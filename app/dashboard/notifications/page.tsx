"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  listMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from "@/lib/notifications";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { formatDate } from "@/lib/dates";

/* Alerts from the JobFolder team.
 *
 * These exist because email leaves the product: it bounces, goes to spam, or
 * is deleted, and afterwards nobody can tell whether it was read. A message
 * here sits where the recruiter already signs in, and records when they
 * opened it — which is also what makes it worth an admin's time to send.
 */
export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listMyNotifications()
      .then((feed) => setItems(feed.items))
      .catch((err) => setError(errorMessage(err, "The server did not respond. Please try again.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const unread = items.filter((n) => !n.read).length;

  async function readOne(n: Notification) {
    if (n.read) return;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await markNotificationRead(n.id);
    } catch {
      // Silent: the message is on screen either way, and an error banner over
      // a read-receipt is noise the recruiter can do nothing about.
      setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: false } : x)));
    }
  }

  async function readAll() {
    const previous = items;
    setItems((list) => list.map((x) => ({ ...x, read: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      setItems(previous);
      setError(errorMessage(err, "Could not mark those as read."));
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow uppercase">Inbox</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">Alerts</h1>
          <p className="mt-1 text-xs text-muted">
            Messages from the JobFolder team.
            {unread > 0 && ` ${unread} unread.`}
          </p>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={readAll}
            className="rounded-pill border border-line px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
          >
            Mark all read
          </button>
        )}
      </div>

      {error && <LoadError what="your alerts" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">Nothing yet</h2>
          <p className="mt-1 text-sm text-muted">
            Messages from the JobFolder team will appear here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              onMouseEnter={() => readOne(n)}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                n.read ? "border-line" : "border-primary/40 bg-primary-soft/20"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {n.authorName || "JobFolder"} &middot; {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span className="shrink-0 rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    New
                  </span>
                )}
              </div>

              {/* whitespace-pre-wrap: the sender's line breaks are the only
                  structure a plain-text message has. */}
              <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm leading-relaxed text-ink">
                {n.body}
              </p>

              {/* Relative paths only. A stored absolute URL would turn any
                  notification into an open redirect off the platform. */}
              {n.link.startsWith("/") && (
                <Link
                  href={n.link}
                  onClick={() => readOne(n)}
                  className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  Open
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
                    <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
