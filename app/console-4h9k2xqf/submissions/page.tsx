"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listAllSubmissions,
  setSubmissionStatus,
  SUBMISSION_STATUSES,
  SUBMISSION_STATUS_LABEL,
  type Submission,
  type SubmissionStatus,
} from "@/lib/submissions";
import { money } from "@/components/dashboard/parts";

const tone: Record<SubmissionStatus, string> = {
  submitted: "bg-line text-muted",
  screening: "bg-coral-soft text-coral",
  approved: "bg-primary-soft text-primary",
  client_review: "bg-primary-soft text-primary",
  hired: "bg-primary text-white",
  rejected: "bg-coral-soft text-coral",
};

export default function AdminSubmissionsPage() {
  const [subs, setSubs] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SubmissionStatus | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSubs(await listAllSubmissions());
    } catch {
      setError("Could not load submissions. Check your Firestore rules.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(sub: Submission, status: SubmissionStatus) {
    const prev = sub.status;
    setSubs((list) =>
      list.map((s) => (s.id === sub.id ? { ...s, status } : s)),
    );
    try {
      await setSubmissionStatus(sub.id, status);
    } catch {
      setSubs((list) =>
        list.map((s) => (s.id === sub.id ? { ...s, status: prev } : s)),
      );
      alert("Could not update status.");
    }
  }

  const shown =
    filter === "all" ? subs : subs.filter((s) => s.status === filter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          Submissions
        </h1>
        <p className="mt-1 text-sm text-muted">
          Screen recruiter submissions before they reach the client. Set a
          candidate to <span className="font-medium text-ink">Approved</span> or{" "}
          <span className="font-medium text-ink">With client</span> to surface
          them on the company&apos;s shortlist.
        </p>
      </div>

      {/* filter chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {(["all", ...SUBMISSION_STATUSES] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-pill px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
              filter === f
                ? "bg-ink text-white"
                : "border border-line text-muted hover:text-ink"
            }`}
          >
            {f === "all" ? "All" : SUBMISSION_STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-6 rounded-lg bg-coral-soft px-4 py-3 text-sm text-coral">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-line border-t-primary" />
        </div>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">Nothing here</h2>
          <p className="mt-1 text-sm text-muted">
            {subs.length === 0
              ? "Recruiter submissions will appear here for screening."
              : "No submissions match this filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Candidate</th>
                <th className="px-5 py-3 font-semibold">Role / client</th>
                <th className="px-5 py-3 font-semibold">Recruiter</th>
                <th className="px-5 py-3 font-semibold">Bounty</th>
                <th className="px-5 py-3 font-semibold">CV</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {shown.map((s) => (
                <tr key={s.id} className="align-top hover:bg-cream/40">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-ink">{s.candidateName}</p>
                    <p className="text-xs text-muted">{s.candidateEmail}</p>
                    {s.notes && (
                      <p className="mt-1 max-w-xs text-xs text-muted">
                        “{s.notes}”
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{s.jobTitle}</p>
                    <p className="text-xs text-muted">{s.company}</p>
                  </td>
                  <td className="px-5 py-4 text-muted">{s.recruiterName}</td>
                  <td className="px-5 py-4 text-muted">{money(s.bounty)}</td>
                  <td className="px-5 py-4">
                    <a
                      href={s.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-primary hover:text-primary-dark"
                    >
                      Open CV
                    </a>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold ${tone[s.status]}`}
                      >
                        {SUBMISSION_STATUS_LABEL[s.status]}
                      </span>
                      <select
                        value={s.status}
                        onChange={(e) =>
                          changeStatus(s, e.target.value as SubmissionStatus)
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs text-ink outline-none focus:border-primary"
                        aria-label="Change status"
                      >
                        {SUBMISSION_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {SUBMISSION_STATUS_LABEL[st]}
                          </option>
                        ))}
                      </select>
                    </div>
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
