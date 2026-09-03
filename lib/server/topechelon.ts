import "server-only";
import { query, execute } from "@/lib/db";
import { createJob } from "@/lib/server/repo";
import { feeTierForSalary } from "@/lib/feeTiers";
import {
  EMPLOYMENT_TYPE_MAP,
  fetchJobIds,
  fetchJobPosting,
  mapWithConcurrency,
} from "../../scripts/topechelon-scrape.mjs";

/* Imports Metro Associates' live postings from its Top Echelon careers portal
   into the `jobs` table. This is the DB-touching half; the scraping/parsing
   itself lives in scripts/topechelon-scrape.mjs, shared with the CLI script
   (scripts/scrape-topechelon-jobs.mjs, for manual/scheduled runs) so a fix to
   category rules or JSON-LD parsing doesn't have to be made twice.

   Called from app/api/admin/jobs/sync-topechelon/route.ts — the admin
   console's "Sync Top Echelon" button.

   Each Top Echelon job has a stable UUID; it's stored as `te-<uuid>`, so
   re-running this is safe — an id already in the table is skipped, never
   overwritten. That also means an admin's edits to an imported job (category,
   status, added salary, etc.) survive future re-runs.

   New jobs land as status='draft' by default — same as a job an admin creates
   by hand — so nothing scraped goes live on the public board without a human
   looking at it first. */

export type TopEchelonSyncResult = {
  found: number;
  added: number;
  skipped: number;
  failed: number;
  closed: number;
  addedJobs: { title: string; location: string; category: string }[];
  closedJobs: { title: string; location: string }[];
};

export async function runTopEchelonSync(
  { publish = false }: { publish?: boolean } = {},
): Promise<TopEchelonSyncResult> {
  const teIds: string[] = await fetchJobIds();

  /* Guard the close-out step below. An empty list is never a legitimate
     "Metro has no open roles" signal — the portal has always listed dozens —
     so it means the fetch returned an error page or the markup changed.
     Closing every imported job on the back of that would take the whole
     board down, so refuse to act on it at all. */
  if (teIds.length === 0) {
    throw new Error(
      "Top Echelon returned no jobs — treating that as a failed fetch rather than an empty portal. Nothing was changed.",
    );
  }

  const existingRows = await query<{ id: string }>(
    `SELECT id FROM jobs WHERE id LIKE 'te-%'`,
  );
  const existingIds = new Set(existingRows.map((r) => r.id));

  const newIds = teIds.filter((teId) => !existingIds.has(`te-${teId}`));
  const skipped = teIds.length - newIds.length;

  const postings = await mapWithConcurrency(newIds, 5, fetchJobPosting);

  const addedJobs: TopEchelonSyncResult["addedJobs"] = [];
  let failed = 0;

  for (let i = 0; i < newIds.length; i++) {
    const job = postings[i];
    if (!job) {
      failed++;
      continue;
    }
    await createJob(
      {
        title: job.title,
        company: job.company,
        category: job.category,
        location: job.location,
        remote: false,
        employmentType: EMPLOYMENT_TYPE_MAP["Direct Hire"],
        salaryMin: null,
        salaryMax: null,
        bounty: null,
        /* Top Echelon doesn't publish a salary range, so this always resolves
           to the "no range published" tier. Derived rather than hardcoded so
           that if the parser ever starts picking up a range, the fee follows
           it without a second change here. Imported jobs used to land with
           feeTier: null, which showed recruiters a role with no fee at all —
           the one number that makes them act. */
        feeTier: feeTierForSalary(null, null),
        description: job.description,
        responsibilities: "",
        requirements: "",
        faqs: "[]",
        screeningQuestions: "[]",
        hiringStages: "[]",
        status: publish ? "open" : "draft",
      },
      `te-${job.teId}`,
    );
    addedJobs.push({ title: job.title, location: job.location, category: job.category });
  }

  /* Close out roles Metro has taken down. Without this the sync only ever
     grows the board: a filled role vanishes from the portal but stays
     'open' here forever, so people keep applying to it.

     Closed rather than deleted — a job row may already have submissions
     hanging off it, and an admin can reopen one if it comes back. Drafts
     get closed too, not just open roles: a draft whose source posting is
     already gone should not be sitting in the review queue waiting to be
     published. */
  const livePortalIds = new Set(teIds.map((teId) => `te-${teId}`));
  const goneRows = await query<{ id: string; title: string; location: string }>(
    `SELECT id, title, location FROM jobs
      WHERE id LIKE 'te-%' AND status <> 'closed'`,
  );
  const gone = goneRows.filter((r) => !livePortalIds.has(r.id));

  for (const row of gone) {
    await execute(`UPDATE jobs SET status = 'closed' WHERE id = ?`, [row.id]);
  }

  return {
    found: teIds.length,
    added: addedJobs.length,
    skipped,
    failed,
    closed: gone.length,
    addedJobs,
    closedJobs: gone.map((r) => ({ title: r.title, location: r.location })),
  };
}
