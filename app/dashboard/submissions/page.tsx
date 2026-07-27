"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import {
  listSubmissionsByRecruiter,
  type Submission,
} from "@/lib/submissions";
import { SubmissionBadge, money } from "@/components/dashboard/parts";
import { Loader } from "@/components/Loader";

export default function MySubmissionsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listSubmissionsByRecruiter(user.uid)
      .then(setSubs)
      .catch(() => setError("Could not load your submissions."))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            My submissions
          </h1>
          <p className="mt-1 text-sm text-muted">
            {loading ? "Loading…" : `${subs.length} submitted`}
          </p>
        </div>
        <Link
          href="/jobs"
          className="rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
        >
          Browse roles
        </Link>
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid h-40 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : subs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">No submissions yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
            Browse open roles and submit your first candidate to get started.
          </p>
          <Link
            href="/jobs"
            className="mt-5 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Browse roles
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Candidate</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 font-semibold">Bounty</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {subs.map((s) => (
                <tr key={s.id} className="hover:bg-cream/40">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{s.candidateName}</p>
                    <p className="text-xs text-muted">{s.candidateEmail}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{s.jobTitle}</p>
                    <p className="text-xs text-muted">{s.company}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {s.status === "hired" ? (
                      <span className="font-semibold text-primary">
                        {money(s.bounty)}
                      </span>
                    ) : (
                      money(s.bounty)
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <SubmissionBadge status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
