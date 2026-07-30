import { apiFetch } from "./api";
import { JOB_CATEGORIES } from "./jobs";

/* Job categories are admin-editable and live in MySQL at
   settings.setting_key = 'jobCategories'. The hardcoded JOB_CATEGORIES from
   lib/jobs.ts is the seed / fallback used if a read fails, so the job board and
   wizard always have a sensible list.

   The old Firestore version also exported subscribeCategories(), a live
   onSnapshot listener. It had no callers — every call site used the one-shot
   read below — so it is not reimplemented here. Polling an HTTP endpoint to
   recreate a subscription nobody used would be pure overhead. */

export const DEFAULT_CATEGORIES: string[] = [...JOB_CATEGORIES];

/** Returns the saved list, or the defaults if none is set or the read fails. */
export async function getCategories(): Promise<string[]> {
  try {
    const list = await apiFetch<string[]>("/api/categories");
    return list.length ? list : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

/* Admin write. The server does the trimming, blank-dropping and
   case-insensitive de-duping, so the rules can't drift between callers. */
export async function saveCategories(list: string[]): Promise<void> {
  await apiFetch("/api/categories", {
    method: "PUT",
    body: { list },
    auth: true,
  });
}
