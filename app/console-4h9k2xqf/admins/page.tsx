"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listAdminAccess, addAdmin, removeAdmin, cancelAdminInvite,
  type AdminAccount, type AdminInvite,
} from "@/lib/users";
import { adminRoutes } from "@/lib/routes";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { formatDate, timeAgo } from "@/lib/dates";

export default function AdminAdminsPage() {
  const { user, refreshProfile } = useAuth();
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addNotice, setAddNotice] = useState<string | null>(null);

  const [removingUid, setRemovingUid] = useState<string | null>(null);
  const [cancellingEmail, setCancellingEmail] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { admins, invites } = await listAdminAccess();
      setAdmins(admins);
      setInvites(invites);
    } catch (err) {
      setError(errorMessage(err, "The server didn't respond. Please try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onAdd(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    setAddNotice(null);
    const trimmed = email.trim();
    if (!trimmed) return;
    // The one privilege-escalating action on this page with no undo button
    // short of another admin revoking it — every other toggle here confirms,
    // this should too. Can't show the matched account's name up front (that
    // requires the lookup this same request performs), so this confirms
    // intent on the email itself.
    if (!confirm(
      `Grant admin access to ${trimmed}? If that's an existing account, they'll have full admin control of this console immediately.`,
    )) {
      return;
    }
    setAdding(true);
    try {
      const result = await addAdmin(trimmed);
      if (result.kind === "admin") {
        setAdmins((list) => [...list, result.admin]);
        setAddNotice(`${result.admin.name || result.admin.email} now has admin access.`);
      } else {
        setInvites((list) => [...list, result.invite]);
        setAddNotice(`No account yet for ${result.invite.email} — they'll get admin access the moment they sign up.`);
      }
      setEmail("");
    } catch (err) {
      setAddError(errorMessage(err, "Could not add that admin."));
    } finally {
      setAdding(false);
    }
  }

  async function onRemove(admin: AdminAccount) {
    const isSelf = admin.uid === user?.uid;
    if (
      !confirm(
        isSelf
          ? "Remove your own admin access? You'll be signed out of the console immediately."
          : `Remove admin access for ${admin.name || admin.email || admin.uid}?`,
      )
    ) {
      return;
    }
    setRemovingUid(admin.uid);
    try {
      await removeAdmin(admin.uid);
      setAdmins((list) => list.filter((a) => a.uid !== admin.uid));
      /* Picks up the now-stale isAdmin=true in useAuth(), which is what
         ConsoleGate redirects on — the clean way to leave the console the
         moment your own access is gone, rather than sitting on a page that's
         about to start failing every request with 403. */
      if (isSelf) await refreshProfile();
    } catch (err) {
      alert(errorMessage(err, "Could not remove that admin."));
    } finally {
      setRemovingUid(null);
    }
  }

  async function onCancelInvite(invite: AdminInvite) {
    if (!confirm(`Cancel the pending invite for ${invite.email}?`)) return;
    setCancellingEmail(invite.email);
    try {
      await cancelAdminInvite(invite.email);
      setInvites((list) => list.filter((i) => i.email !== invite.email));
    } catch (err) {
      alert(errorMessage(err, "Could not cancel that invite."));
    } finally {
      setCancellingEmail(null);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow uppercase">Access</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
            Admins
          </h1>
          <p className="mt-1 text-xs text-muted">
            Everyone with console access, and anyone invited but not signed up
            yet.
          </p>
        </div>
        <Link
          href={adminRoutes.auditLog}
          className="shrink-0 text-xs font-semibold text-primary hover:text-primary-dark"
        >
          View audit log →
        </Link>
      </div>

      <form
        onSubmit={onAdd}
        className="mb-5 flex flex-wrap items-start gap-2 rounded-2xl border border-line bg-white p-4"
      >
        <div className="min-w-0 flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input h-9 text-xs"
            placeholder="name@example.com"
            required
          />
          {addError && <p className="mt-1.5 text-xs text-coral">{addError}</p>}
          {addNotice && <p className="mt-1.5 text-xs text-sage">{addNotice}</p>}
        </div>
        <button
          type="submit"
          disabled={adding}
          className="h-9 shrink-0 rounded-pill bg-primary px-4 text-xs font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
        >
          {adding ? "Adding…" : "Grant admin"}
        </button>
      </form>

      {error && <LoadError what="admins" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : error ? null : (
        <>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white">
            {admins.map((admin) => {
              const isSelf = admin.uid === user?.uid;
              return (
                <li key={admin.uid} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {(admin.name || admin.email || "A").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {admin.name || admin.email || "Unnamed"}
                      {isSelf && <span className="ml-1.5 text-xs font-normal text-muted">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {admin.email || admin.uid} · Admin since {formatDate(admin.createdAt)}
                      {" · "}
                      {admin.lastActiveAt ? `Active ${timeAgo(admin.lastActiveAt)}` : "Never signed in"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemove(admin)}
                    disabled={removingUid === admin.uid || admins.length <= 1}
                    title={admins.length <= 1 ? "Can't remove the last admin" : undefined}
                    className="shrink-0 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-coral hover:border-coral disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {removingUid === admin.uid ? "Removing…" : "Remove"}
                  </button>
                </li>
              );
            })}
          </ul>

          {invites.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted">
                Pending invites
              </p>
              <ul className="divide-y divide-line rounded-2xl border border-dashed border-line bg-white">
                {invites.map((invite) => (
                  <li key={invite.email} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream text-xs font-bold text-muted">
                      {invite.email.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{invite.email}</p>
                      <p className="truncate text-xs text-muted">
                        Not signed up yet · Invited by {invite.invitedByName || invite.invitedByEmail}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onCancelInvite(invite)}
                      disabled={cancellingEmail === invite.email}
                      className="shrink-0 rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:border-coral hover:text-coral disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {cancellingEmail === invite.email ? "Cancelling…" : "Cancel"}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
