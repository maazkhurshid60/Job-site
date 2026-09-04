"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listMyEnquiries, type ContactMessage } from "@/lib/messages";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { formatDate } from "@/lib/dates";

/* What this recruiter has asked us, and what we said back.
 *
 * Before this, an enquiry sent through the contact form vanished from the
 * sender's point of view: no copy, no status, and the answer arrived as an
 * email from whichever mail client an admin happened to use. Signed-in
 * senders are now recorded against the message (see POST /api/messages), so
 * the thread has a home.
 *
 * Only shows enquiries sent while signed in — anything sent logged-out has
 * no account attached to it, which the empty state says plainly rather than
 * leaving someone to wonder where their message went.
 */
export default function MyEnquiriesPage() {
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listMyEnquiries()
      .then(setItems)
      .catch((err) => setError(errorMessage(err, "The server did not respond. Please try again.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const awaiting = items.filter((m) => m.replies.length === 0).length;

  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow uppercase">Support</p>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">My enquiries</h1>
        <p className="mt-1 text-xs text-muted">
          Messages you&rsquo;ve sent the JobFolder team, and our replies.
          {awaiting > 0 && ` ${awaiting} awaiting a response.`}
        </p>
      </div>

      {error && <LoadError what="your enquiries" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">Nothing here yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            Anything you send us through the{" "}
            <Link href="/contact" className="text-primary hover:underline">
              contact form
            </Link>{" "}
            while signed in shows up here, along with our reply. Messages sent
            before you signed in aren&rsquo;t linked to your account.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((m) => (
            <li key={m.id} className="rounded-xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {m.subject || "(no subject)"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Sent {formatDate(m.createdAt)}</p>
                </div>
                <span
                  className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    m.replies.length > 0 ? "bg-sage-soft text-ink" : "bg-coral-soft text-coral"
                  }`}
                >
                  {m.replies.length > 0 ? "Answered" : "Awaiting reply"}
                </span>
              </div>

              {m.message && (
                <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm leading-relaxed text-ink">
                  {m.message}
                </p>
              )}

              {m.replies.map((r) => (
                <div key={r.id} className="mt-3 rounded-lg bg-primary-soft/50 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    {r.adminName || "JobFolder"} replied · {formatDate(r.createdAt)}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
                    {r.body}
                  </p>
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
