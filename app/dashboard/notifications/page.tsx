"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
 * opened it — which is what makes it worth an admin's time to send.
 */

type Tab = "unread" | "all";

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("unread");

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

  /* Land on Unread when there is something to read, otherwise on All — so an
     empty tab is never the first thing anyone sees. Runs once, after the
     first load, rather than fighting the tab the recruiter then picks. */
  const [settled, setSettled] = useState(false);
  if (!loading && !settled) {
    setSettled(true);
    if (unread === 0) setTab("all");
  }

  const shown = useMemo(
    () => (tab === "unread" ? items.filter((n) => !n.read) : items),
    [items, tab],
  );

  /* Marking read is an explicit act — clicking the alert. An earlier version
     did it on hover, which never fires on a touch screen and fires by
     accident when scrolling past on a desktop. */
  async function readOne(n: Notification) {
    if (n.read) return;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    try {
      await markNotificationRead(n.id);
    } catch {
      // Silent rollback: the message is on screen either way, and an error
      // banner over a read receipt is noise nobody can act on.
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
            {unread > 0
              ? `${unread} unread message${unread === 1 ? "" : "s"} from the JobFolder team.`
              : "Messages from the JobFolder team."}
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

      {items.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {([
            { value: "unread" as const, label: "Unread", n: unread },
            { value: "all" as const, label: "All", n: items.length },
          ]).map((t) => (
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
              <span className={`ml-1.5 tabular-nums ${tab === t.value ? "text-white/70" : "text-muted"}`}>
                {t.n}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && <LoadError what="your alerts" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-primary-soft text-primary">
            <BellIcon />
          </div>
          <h2 className="mt-3 font-bold text-ink">
            {items.length === 0 ? "Nothing yet" : "All caught up"}
          </h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            {items.length === 0
              ? "Messages from the JobFolder team will appear here."
              : "You've read everything. Switch to All to look back over them."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((n) => (
            <li key={n.id}>
              {/* The whole card is the read affordance — an unread alert you
                  have visibly opened shouldn't still be asking for a click on
                  a separate control. */}
              <div
                onClick={() => readOne(n)}
                className={`relative overflow-hidden rounded-xl border bg-white p-4 transition-all ${
                  n.read
                    ? "border-line"
                    : "cursor-pointer border-primary/40 shadow-[0_2px_12px_rgba(34,79,168,0.08)] hover:border-primary"
                }`}
              >
                {!n.read && (
                  <span className="absolute inset-y-0 left-0 w-1 bg-primary" aria-hidden />
                )}

                <div className="flex items-start gap-3 pl-1">
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      n.read ? "bg-cream text-muted" : "bg-primary-soft text-primary"
                    }`}
                  >
                    <BellIcon />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className={`text-[15px] leading-snug text-ink ${n.read ? "font-semibold" : "font-bold"}`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <span className="shrink-0 rounded-pill bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {n.authorName || "JobFolder"} &middot; {formatDate(n.createdAt)}
                    </p>

                    {/* whitespace-pre-wrap: the sender's line breaks are the
                        only structure a plain-text message has. */}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                      {n.body}
                    </p>

                    {/* Relative paths only. A stored absolute URL would turn
                        any alert into an open redirect off the platform. */}
                    {n.link.startsWith("/") && (
                      <Link
                        href={n.link}
                        onClick={() => readOne(n)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-pill bg-primary px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-dark"
                      >
                        Open
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden>
                          <path d="M4 10h12M11 5l5 5-5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path
        d="M10 3a4 4 0 00-4 4v3l-1.5 2.5h11L14 10V7a4 4 0 00-4-4zM8.5 16a1.5 1.5 0 003 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
