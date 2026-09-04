import { apiFetch } from "./api";

/* Enquiries captured by a recruiter's public microsite (/sites/[slug]).
   Separate from lib/messages.ts, which is the jobfolder.com contact form:
   these belong to one recruiter, who sees them on their own dashboard. */

export type SiteLead = {
  id: number;
  recruiterId: string;
  /** Only present on the admin read — a recruiter already knows who they are. */
  recruiterName?: string;
  recruiterEmail?: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  handled: boolean;
  /** ISO-8601 string from MySQL, or null. */
  createdAt: string | null;
};

export type SiteLeadInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

/* Public: a visitor contacting the recruiter whose site they're on. The
   recruiter is resolved server-side from the slug, never sent from here. */
export async function sendSiteLead(slug: string, input: SiteLeadInput): Promise<void> {
  await apiFetch(`/api/sites/${encodeURIComponent(slug)}/leads`, {
    method: "POST",
    body: input,
  });
}

/** Admin: every microsite lead, across all recruiters. */
export function listAllSiteLeads(): Promise<SiteLead[]> {
  return apiFetch<SiteLead[]>("/api/admin/site-leads", { auth: true });
}

/** Recruiter: their own leads. */
export function listMySiteLeads(): Promise<SiteLead[]> {
  return apiFetch<SiteLead[]>("/api/me/leads", { auth: true });
}

export async function setSiteLeadHandled(
  id: number,
  handled: boolean,
  as: "admin" | "me",
): Promise<void> {
  const base = as === "admin" ? "/api/admin/site-leads" : "/api/me/leads";
  await apiFetch(`${base}/${id}`, { method: "PATCH", body: { handled }, auth: true });
}
