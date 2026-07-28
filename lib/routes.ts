/* Admin lives at an unguessable base path (a light layer on top of the real
   protection: Firebase Auth + Firestore rules).

   To change it: edit ADMIN_BASE below AND rename the matching folder
   `app/<slug>` so the two stay in sync. */
export const ADMIN_BASE = "/console-4h9k2xqf";

export const adminRoutes = {
  base: ADMIN_BASE, // dashboard overview
  login: `${ADMIN_BASE}/login`,
  setup: `${ADMIN_BASE}/setup`,
  jobs: `${ADMIN_BASE}/jobs`,
  newJob: `${ADMIN_BASE}/jobs/new`,
  editJob: (id: string) => `${ADMIN_BASE}/jobs/${id}/edit`,
  submissions: `${ADMIN_BASE}/submissions`,
  recruiters: `${ADMIN_BASE}/recruiters`,
};
