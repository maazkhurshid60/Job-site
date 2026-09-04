"use client";

import { useCallback, useEffect, useState } from "react";
import { listAllSiteLeads, setSiteLeadHandled, type SiteLead } from "@/lib/siteLeads";
import { LeadList } from "@/components/leads/LeadList";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";

/* Enquiries caught by recruiters' public microsites.
 *
 * Kept separate from the Enquiries page (the jobfolder.com contact form)
 * because these belong to a specific recruiter: the notification goes to
 * them, they see the lead on their own dashboard, and this page is the
 * oversight view — how much work the microsite perk is actually generating,
 * and whether anyone is answering.
 */
export default function AdminSiteLeadsPage() {
  const [leads, setLeads] = useState<SiteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listAllSiteLeads()
      .then(setLeads)
      .catch((err) => setError(errorMessage(err, "The server did not respond. Please try again.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(lead: SiteLead, next: boolean) {
    // Optimistic, rolled back on failure.
    setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, handled: next } : l)));
    try {
      await setSiteLeadHandled(lead.id, next, "admin");
    } catch (err) {
      setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, handled: !next } : l)));
      setError(errorMessage(err, "Could not update that lead."));
    }
  }

  const unanswered = leads.filter((l) => !l.handled).length;

  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow uppercase">Inbox</p>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">Recruiter site leads</h1>
        <p className="mt-1 text-xs text-muted">
          Enquiries sent through recruiters&rsquo; public sites. The recruiter is emailed each
          one and sees it on their dashboard; this is the whole picture.
          {unanswered > 0 && ` ${unanswered} still to answer.`}
        </p>
      </div>

      {error && <LoadError what="leads" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <LeadList
          leads={leads}
          showRecruiter
          onToggleHandled={toggle}
          emptyTitle="No site leads yet"
          emptyBody="When someone uses the contact form on a recruiter's site, the enquiry appears here."
        />
      )}
    </div>
  );
}
