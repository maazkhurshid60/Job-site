import {
  SUBMISSION_STATUS_LABEL,
  type SubmissionStatus,
} from "@/lib/submissions";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const badgeTone: Record<SubmissionStatus, string> = {
  submitted: "bg-line text-muted",
  screening: "bg-coral-soft text-coral",
  approved: "bg-primary-soft text-primary",
  client_review: "bg-primary-soft text-primary",
  hired: "bg-primary text-white",
  rejected: "bg-coral-soft text-coral",
};

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  return (
    <span
      className={`inline-flex rounded-pill px-2.5 py-0.5 text-xs font-semibold ${badgeTone[status]}`}
    >
      {SUBMISSION_STATUS_LABEL[status]}
    </span>
  );
}

export function money(n: number | null | undefined): string {
  return n != null ? `$${n.toLocaleString()}` : "—";
}
