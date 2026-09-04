"use client";

import { useMemo, useState } from "react";
import type { SiteLead } from "@/lib/siteLeads";
import { formatDate } from "@/lib/dates";
import { SortSelect } from "@/components/SortSelect";
import { applySort, textAsc, textDesc, dateDesc, dateAsc, type SortOption } from "@/lib/sorting";

/* The list of microsite enquiries, shared by the admin console and the
   recruiter's own dashboard. The two differ only in whether the recruiter
   who caught the lead is worth naming — for the recruiter it's always
   themselves — so that's a flag rather than a second copy of this file. */

type Tab = "new" | "handled" | "all";

const TABS: { value: Tab; label: string }[] = [
  { value: "new", label: "Needs a reply" },
  { value: "handled", label: "Handled" },
  { value: "all", label: "All" },
];

const SORTS: SortOption<SiteLead>[] = [
  { value: "newest", label: "Newest first", compare: dateDesc((l) => l.createdAt) },
  { value: "oldest", label: "Oldest first", compare: dateAsc((l) => l.createdAt) },
  { value: "az", label: "Name A–Z", compare: textAsc((l) => l.name) },
  { value: "za", label: "Name Z–A", compare: textDesc((l) => l.name) },
];

export function LeadList({
  leads,
  showRecruiter,
  onToggleHandled,
  emptyTitle,
  emptyBody,
}: {
  leads: SiteLead[];
  showRecruiter: boolean;
  onToggleHandled: (lead: SiteLead, next: boolean) => Promise<void>;
  emptyTitle: string;
  emptyBody: string;
}) {
  const [tab, setTab] = useState<Tab>("new");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("newest");
  const [busyId, setBusyId] = useState<number | null>(null);

  const counts = useMemo(
    () => ({
      new: leads.filter((l) => !l.handled).length,
      handled: leads.filter((l) => l.handled).length,
      all: leads.length,
    }),
    [leads],
  );

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const matched = leads.filter((l) => {
      if (tab === "new" && l.handled) return false;
      if (tab === "handled" && !l.handled) return false;
      if (!term) return true;
      return [l.name, l.email, l.phone, l.message, l.recruiterName ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
    return applySort(matched, SORTS, sort);
  }, [leads, tab, q, sort]);

  async function toggle(lead: SiteLead) {
    setBusyId(lead.id);
    try {
      await onToggleHandled(lead, !lead.handled);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.value
                  ? "border-primary bg-primary text-white"
                  : "border-line bg-white text-ink hover:border-ink/25"
              }`}
            >
              {t.label}
              <span
                className={`ml-1.5 tabular-nums ${tab === t.value ? "text-white/70" : "text-muted"}`}
              >
                {counts[t.value]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
        <SortSelect options={SORTS} value={sort} onChange={setSort} className="h-9" />
        <div className="relative w-full max-w-xs">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input h-9 pl-9 text-xs"
            placeholder="Search name, email, message…"
          />
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            width="13"
            height="13"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden
          >
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.8" />
            <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
          <h2 className="font-bold text-ink">{leads.length === 0 ? emptyTitle : "Nothing here"}</h2>
          <p className="mt-1 text-sm text-muted">
            {leads.length === 0 ? emptyBody : "No lead matches this filter or search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {shown.map((lead) => (
            <li
              key={lead.id}
              className={`rounded-xl border bg-white p-4 transition-colors ${
                lead.handled ? "border-line" : "border-primary/30"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {lead.name || "(no name given)"}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    <a href={`mailto:${lead.email}`} className="text-primary hover:underline">
                      {lead.email}
                    </a>
                    {lead.phone ? ` · ${lead.phone}` : ""}
                    {" · "}
                    {formatDate(lead.createdAt)}
                  </p>
                  {showRecruiter && (
                    <p className="mt-1 truncate text-xs text-muted">
                      via{" "}
                      <span className="font-semibold text-ink">
                        {lead.recruiterName || lead.recruiterEmail}
                      </span>
                      &rsquo;s site
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!lead.handled && (
                    <span className="rounded-pill bg-primary-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                      New
                    </span>
                  )}
                  <a
                    href={`mailto:${lead.email}?subject=${encodeURIComponent("Re: your enquiry")}`}
                    className="rounded-pill border border-line px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                  >
                    Reply
                  </a>
                  <button
                    type="button"
                    onClick={() => toggle(lead)}
                    disabled={busyId === lead.id}
                    className={`rounded-pill px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      lead.handled
                        ? "border border-line text-muted hover:border-ink/25 hover:text-ink"
                        : "bg-primary text-white hover:bg-primary-dark"
                    }`}
                  >
                    {lead.handled ? "Reopen" : "Mark handled"}
                  </button>
                </div>
              </div>

              {/* whitespace-pre-wrap: the sender's line breaks are the only
                  structure a plain-text message has. */}
              {lead.message && (
                <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm leading-relaxed text-ink">
                  {lead.message}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
