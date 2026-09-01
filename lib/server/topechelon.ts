import "server-only";
import { query } from "@/lib/db";
import { createJob } from "@/lib/server/repo";
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
  addedJobs: { title: string; location: string; category: string }[];
};

export async function runTopEchelonSync(
  { publish = false }: { publish?: boolean } = {},
): Promise<TopEchelonSyncResult> {
  const teIds: string[] = await fetchJobIds();

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
        feeTier: null,
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

  return { found: teIds.length, added: addedJobs.length, skipped, failed, addedJobs };
}
