import type { Job } from "@/lib/jobs";

/* Human-readable salary line for a job. Returns "Competitive" when unset. */
export function formatPay(job: Pick<Job, "salaryMin" | "salaryMax">): string {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const { salaryMin: min, salaryMax: max } = job;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  if (min != null) return `From ${fmt(min)}`;
  if (max != null) return `Up to ${fmt(max)}`;
  return "Competitive";
}
