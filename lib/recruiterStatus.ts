import { adminRoutes } from "./routes";

/* Shared between the admin recruiters list (the filter tiles) and AdminShell
   (the sidebar sub-links) so both point at the same four views. */

export const RECRUITER_STATUS_TABS = ["all", "pending", "verified", "suspended"] as const;
export type RecruiterStatusTab = (typeof RECRUITER_STATUS_TABS)[number];

export const RECRUITER_STATUS_LABEL: Record<RecruiterStatusTab, string> = {
  all: "All",
  pending: "Pending verification",
  verified: "Verified",
  suspended: "Suspended",
};

/* "all" carries ?status=all rather than being the bare path.
 *
 * The list reads its filter from useSearchParams, and dropping a query
 * string while staying on the same pathname is not reliably treated as a
 * navigation — clicking "All recruiters" from ?status=verified could leave
 * you on the filtered view. Every tab now differs in its query string, so
 * the transition is unambiguous.
 *
 * The bare path still works and still means "all", so old links and
 * bookmarks are unaffected. */
export function recruitersStatusHref(status: RecruiterStatusTab): string {
  return `${adminRoutes.recruiters}?status=${status}`;
}
