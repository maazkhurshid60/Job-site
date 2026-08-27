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

export function recruitersStatusHref(status: RecruiterStatusTab): string {
  return status === "all" ? adminRoutes.recruiters : `${adminRoutes.recruiters}?status=${status}`;
}
