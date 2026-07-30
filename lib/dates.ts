/* Timestamps arrive from the API as ISO-8601 strings (MySQL DATETIME read with
   dateStrings: true), where they used to be Firestore Timestamps with .toDate()
   and .toMillis(). These helpers are the single place that conversion happens.

   MySQL hands back "2026-07-30 21:42:00.000" — a space, and no timezone
   marker. Safari and some engines refuse that format outright, and the ones
   that accept it treat it as local time rather than UTC. Both are fixed here by
   normalising to "2026-07-30T21:42:00.000Z" before parsing; the connection and
   the schema both store UTC. */

export function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;

  const normalised = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;

  const date = new Date(normalised);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toMillis(value: string | null | undefined): number {
  return toDate(value)?.getTime() ?? 0;
}

/** Short absolute date, e.g. "30 Jul 2026". Falls back to an em dash. */
export function formatDate(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Relative age, e.g. "3 days ago". */
export function timeAgo(value: string | null | undefined): string {
  const date = toDate(value);
  if (!date) return "recently";

  const m = Math.floor((Date.now() - date.getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""} ago`;
}
