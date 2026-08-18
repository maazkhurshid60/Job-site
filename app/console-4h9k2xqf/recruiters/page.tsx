"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminRoutes } from "@/lib/routes";
import { listAllUsers, type UserProfile } from "@/lib/users";
import { listAllSubmissions, type Submission } from "@/lib/submissions";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";
import { formatDate } from "@/lib/dates";

function fmtDate(u: UserProfile): string {
  return formatDate(u.createdAt);
}

const STATUS_TABS = ["all", "pending", "verified"] as const;
type StatusTab = (typeof STATUS_TABS)[number];
const STATUS_TAB_LABEL: Record<StatusTab, string> = {
  all: "All",
  pending: "Pending verification",
  verified: "Verified",
};

export default function AdminRecruitersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<StatusTab>("all");

  useEffect(() => {
    Promise.all([listAllUsers(), listAllSubmissions()])
      .then(([u, s]) => {
        setUsers(u);
        setSubs(s);
      })
      .catch((err) =>
        setError(errorMessage(err, "The server didn't respond. Please try again.")),
      )
      .finally(() => setLoading(false));
  }, []);

  // How many candidates each recruiter has submitted.
  const countByRecruiter = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of subs) m.set(s.recruiterId, (m.get(s.recruiterId) ?? 0) + 1);
    return m;
  }, [subs]);

  const statusCounts = useMemo(() => {
    const pending = users.filter((u) => !u.verified).length;
    return { all: users.length, pending, verified: users.length - pending };
  }, [users]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return users.filter((u) => {
      if (status === "pending" && u.verified) return false;
      if (status === "verified" && !u.verified) return false;
      if (!term) return true;
      return [u.name, u.email, u.company, u.headline, u.location]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [users, q, status]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">People</p>
          <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">
            Recruiters
          </h1>
          <p className="mt-1 text-xs text-muted">
            Everyone who has signed up to refer candidates. {users.length} total.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input h-9 w-full max-w-xs text-xs"
          placeholder="Search name, company, location…"
        />
      </div>

      {users.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                status === s
                  ? "border-ink bg-ink text-white"
                  : "border-line text-muted hover:text-ink"
              }`}
            >
              {STATUS_TAB_LABEL[s]}
              <span
                className={`grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                  status === s ? "bg-white/20 text-white" : "bg-cream text-muted"
                }`}
              >
                {statusCounts[s]}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <LoadError
          what="recruiters"
          message={error}
          onRetry={() => window.location.reload()}
        />
      )}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : error ? null : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">No recruiters</h2>
          <p className="mt-1 text-sm text-muted">
            {users.length === 0
              ? "Recruiters who sign up will appear here."
              : "No recruiters match your search or filter."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((u) => (
            <RecruiterCard
              key={u.uid}
              user={u}
              submissions={countByRecruiter.get(u.uid) ?? 0}
              joined={fmtDate(u)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecruiterCard({
  user,
  submissions,
  joined,
}: {
  user: UserProfile;
  submissions: number;
  joined: string;
}) {
  const initial = (user.name || user.email || "R").charAt(0).toUpperCase();
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary-soft text-lg font-bold text-primary">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.name}
              className="h-full w-full object-cover"
            />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <Link
            href={`${adminRoutes.recruiters}/${encodeURIComponent(user.uid)}`}
            className="block truncate font-bold text-ink hover:text-primary"
          >
            {user.name || "Unnamed"}
          </Link>
          {user.headline && (
            <p className="truncate text-sm text-muted">{user.headline}</p>
          )}
          <div className="mt-1 flex flex-wrap gap-1.5">
            <span className="inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
              {submissions} candidate{submissions === 1 ? "" : "s"}
            </span>
            <span
              className={`inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold ${
                user.verified ? "bg-sage-soft text-ink" : "bg-coral-soft text-coral"
              }`}
            >
              {user.verified ? "Verified" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Email">
          <a href={`mailto:${user.email}`} className="text-primary hover:underline">
            {user.email}
          </a>
        </Row>
        {user.phone && <Row label="Phone">{user.phone}</Row>}
        {user.company && <Row label="Company">{user.company}</Row>}
        {user.location && <Row label="Location">{user.location}</Row>}
        {user.linkedin && (
          <Row label="LinkedIn">
            <a
              href={user.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              View profile
            </a>
          </Row>
        )}
        <Row label="Joined">{joined}</Row>
      </dl>

      {user.bio && (
        <p className="mt-3 border-t border-line pt-3 text-sm text-muted">
          {user.bio}
        </p>
      )}

      <Link
        href={`${adminRoutes.recruiters}/${encodeURIComponent(user.uid)}`}
        className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
      >
        View recruiter →
      </Link>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd className="min-w-0 flex-1 truncate text-ink">{children}</dd>
    </div>
  );
}
