"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdminAuditLog, type AdminAuditEntry, type AdminAuditAction } from "@/lib/users";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { formatDate, timeAgo } from "@/lib/dates";

const ACTION_LABEL: Record<AdminAuditAction, string> = {
  grant: "Granted",
  revoke: "Revoked",
  invite: "Invited",
  invite_claimed: "Invite claimed",
  invite_cancelled: "Invite cancelled",
};

const ACTION_STYLE: Record<AdminAuditAction, string> = {
  grant: "bg-sage-soft text-ink",
  invite_claimed: "bg-sage-soft text-ink",
  revoke: "bg-coral-soft text-coral",
  invite_cancelled: "bg-cream text-muted",
  invite: "bg-primary-soft text-primary",
};

export default function AdminAuditLogPage() {
  const [entries, setEntries] = useState<AdminAuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listAdminAuditLog());
    } catch (err) {
      setError(errorMessage(err, "The server didn't respond. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <p className="eyebrow uppercase">Access</p>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
          Audit log
        </h1>
        <p className="mt-1 text-xs text-muted">
          Every grant, revoke, and invite against the admin allow-list, most
          recent first.
        </p>
      </div>

      {error && <LoadError what="the audit log" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : error ? null : entries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">No activity yet</h2>
          <p className="mt-1 text-sm text-muted">
            Granting or revoking admin access will show up here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3 px-4 py-3.5">
              <span
                className={`mt-0.5 inline-flex shrink-0 rounded-pill px-2.5 py-0.5 text-xs font-semibold ${ACTION_STYLE[entry.action]}`}
              >
                {ACTION_LABEL[entry.action]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <span className="font-semibold">
                    {entry.targetName || entry.targetEmail || "Unknown"}
                  </span>
                  {entry.action === "invite" && " was invited"}
                  {entry.action === "invite_cancelled" && "'s invite was cancelled"}
                  {entry.action === "invite_claimed" && " claimed a pending invite"}
                  {entry.action === "grant" && " was granted admin access"}
                  {entry.action === "revoke" && " had admin access revoked"}
                  {entry.action !== "invite_claimed" && (
                    <>
                      {" "}by{" "}
                      <span className="font-semibold">
                        {entry.actorName || entry.actorEmail || "system"}
                      </span>
                    </>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-muted" title={formatDate(entry.createdAt)}>
                  {timeAgo(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
