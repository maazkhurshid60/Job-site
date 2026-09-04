/* Comparators for the list pages.
 *
 * Written once because the same three questions come up on every list —
 * alphabetical, newest, oldest — and hand-rolling them per page is how you
 * end up with one list where blank names sort to the top and another where
 * they sort to the bottom.
 */

export type SortOption<T> = {
  value: string;
  label: string;
  compare: (a: T, b: T) => number;
};

/* Blank values always sink, whichever direction is asked for.
 *
 * A recruiter with no name yet is not "first alphabetically" in any sense a
 * reader means — they're missing data, and floating them to the top of an
 * A–Z pushes the real answers off the screen. */
function emptyLast(a: string, b: string): number | null {
  const ae = !a.trim();
  const be = !b.trim();
  if (ae && be) return 0;
  if (ae) return 1;
  if (be) return -1;
  return null;
}

/** A→Z. localeCompare with base sensitivity, so "Álvarez" files under A and
    case doesn't split otherwise-identical names apart. */
export function textAsc<T>(get: (x: T) => string) {
  return (a: T, b: T): number => {
    const av = get(a) ?? "";
    const bv = get(b) ?? "";
    return emptyLast(av, bv) ?? av.localeCompare(bv, undefined, { sensitivity: "base" });
  };
}

/** Z→A. Not `-textAsc`: that would also invert the blanks-last rule. */
export function textDesc<T>(get: (x: T) => string) {
  return (a: T, b: T): number => {
    const av = get(a) ?? "";
    const bv = get(b) ?? "";
    return emptyLast(av, bv) ?? bv.localeCompare(av, undefined, { sensitivity: "base" });
  };
}

/* ISO-8601 strings from MySQL. Null (no timestamp) is treated as the
   beginning of time, so undated rows sit at the bottom of "newest" rather
   than jumping to the top. */
function time(value: string | null | undefined): number {
  return value ? new Date(value).getTime() : 0;
}

export function dateDesc<T>(get: (x: T) => string | null | undefined) {
  return (a: T, b: T): number => time(get(b)) - time(get(a));
}

export function dateAsc<T>(get: (x: T) => string | null | undefined) {
  return (a: T, b: T): number => time(get(a)) - time(get(b));
}

export function numberDesc<T>(get: (x: T) => number) {
  return (a: T, b: T): number => get(b) - get(a);
}

export function numberAsc<T>(get: (x: T) => number) {
  return (a: T, b: T): number => get(a) - get(b);
}

/** Applies the chosen option, leaving the input array untouched. */
export function applySort<T>(rows: T[], options: SortOption<T>[], value: string): T[] {
  const chosen = options.find((o) => o.value === value);
  return chosen ? [...rows].sort(chosen.compare) : rows;
}
