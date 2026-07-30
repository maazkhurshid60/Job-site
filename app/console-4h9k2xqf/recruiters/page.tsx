"use client";

import { useEffect, useMemo, useState } from "react";
import { listAllUsers, type UserProfile } from "@/lib/users";
import { listAllSubmissions, type Submission } from "@/lib/submissions";
import { Loader } from "@/components/Loader";
import { formatDate } from "@/lib/dates";

function fmtDate(u: UserProfile): string {
  return formatDate(u.createdAt);
}

export default function AdminRecruitersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    Promise.all([listAllUsers(), listAllSubmissions()])
      .then(([u, s]) => {
        setUsers(u);
        setSubs(s);
      })
      .catch(() =>
        setError("Could not load recruiters. Check your Firestore rules."),
      )
      .finally(() => setLoading(false));
  }, []);

  // How many candidates each recruiter has submitted.
  const countByRecruiter = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of subs) m.set(s.recruiterId, (m.get(s.recruiterId) ?? 0) + 1);
    return m;
  }, [subs]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;
    return users.filter((u) =>
      [u.name, u.email, u.company, u.headline, u.location]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [users, q]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow uppercase">People</p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
            Recruiters
          </h1>
          <p className="mt-1 text-sm text-muted">
            Everyone who has signed up to refer candidates. {users.length} total.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="input h-10 w-full max-w-xs"
          placeholder="Search name, company, location…"
        />
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">No recruiters</h2>
          <p className="mt-1 text-sm text-muted">
            {users.length === 0
              ? "Recruiters who sign up will appear here."
              : "No recruiters match your search."}
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
          <p className="truncate font-bold text-ink">{user.name || "Unnamed"}</p>
          {user.headline && (
            <p className="truncate text-sm text-muted">{user.headline}</p>
          )}
          <span className="mt-1 inline-flex rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            {submissions} candidate{submissions === 1 ? "" : "s"}
          </span>
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
