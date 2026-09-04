"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listMySiteLeads, setSiteLeadHandled, type SiteLead } from "@/lib/siteLeads";
import { LeadList } from "@/components/leads/LeadList";
import { Loader } from "@/components/Loader";
import { LoadError, errorMessage } from "@/components/admin/LoadError";

/* A recruiter's own enquiries, captured by the contact form on their public
   career site. They're emailed each one as it arrives; this is the record
   that survives a deleted email, and the place to mark one as dealt with. */
export default function MyLeadsPage() {
  const [leads, setLeads] = useState<SiteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    return listMySiteLeads()
      .then(setLeads)
      .catch((err) => setError(errorMessage(err, "The server did not respond. Please try again.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggle(lead: SiteLead, next: boolean) {
    setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, handled: next } : l)));
    try {
      await setSiteLeadHandled(lead.id, next, "me");
    } catch (err) {
      setLeads((list) => list.map((l) => (l.id === lead.id ? { ...l, handled: !next } : l)));
      setError(errorMessage(err, "Could not update that enquiry."));
    }
  }

  const unanswered = leads.filter((l) => !l.handled).length;

  return (
    <div>
      <div className="mb-5">
        <p className="eyebrow uppercase">Inbox</p>
        <h1 className="mt-1.5 text-xl font-extrabold tracking-tight text-ink">Enquiries</h1>
        <p className="mt-1 text-xs text-muted">
          People who contacted you through your{" "}
          <Link href="/dashboard/career-site" className="text-primary hover:underline">
            career site
          </Link>
          . You&rsquo;re emailed each one as it arrives.
          {unanswered > 0 && ` ${unanswered} still to answer.`}
        </p>
      </div>

      {error && <LoadError what="enquiries" message={error} onRetry={load} />}

      {loading ? (
        <div className="grid h-48 place-items-center rounded-2xl border border-line bg-white">
          <Loader />
        </div>
      ) : (
        <LeadList
          leads={leads}
          showRecruiter={false}
          onToggleHandled={toggle}
          emptyTitle="No enquiries yet"
          emptyBody="When someone uses the contact form on your career site, their message appears here."
        />
      )}
    </div>
  );
}
