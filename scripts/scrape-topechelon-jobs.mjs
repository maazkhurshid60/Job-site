/* Imports Metro Associates' live postings from its Top Echelon careers
 * portal into JobFolder's `jobs` table.
 *
 *   node --env-file=.env.local scripts/scrape-topechelon-jobs.mjs
 *   node --env-file=.env.local scripts/scrape-topechelon-jobs.mjs --publish
 *
 * The scraping/parsing itself lives in scripts/topechelon-scrape.mjs, shared
 * with lib/server/topechelon.ts — the same logic backs the admin console's
 * "Sync Top Echelon" button, so a fix here doesn't have to be made twice.
 *
 * Each Top Echelon job has a stable UUID; we store it as `te-<uuid>` (see
 * newId() in lib/server/repo.ts, which accepts a caller-supplied id), so
 * re-running this script is safe — an id already in the table is skipped,
 * never overwritten. That also means an admin's edits to an imported job
 * (category, status, added salary, etc.) survive future re-runs.
 *
 * New jobs land as status='draft' by default — same as a job an admin
 * creates by hand (see readJobWrite in app/api/admin/jobWrite.ts) — so
 * nothing scraped goes live on the public board without a human looking at
 * it first. Pass --publish to import as 'open' instead, once you trust the
 * mapping enough to skip that review step.
 */

import mysql from "mysql2/promise";
import {
  EMPLOYMENT_TYPE_MAP,
  fetchJobIds,
  fetchJobPosting,
} from "./topechelon-scrape.mjs";

const PUBLISH = process.argv.includes("--publish");

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: process.env.MYSQL_DATABASE,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    connectTimeout: 15_000,
    ...(process.env.MYSQL_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
  });

  try {
    console.log("Fetching Top Echelon portal listing...");
    const teIds = await fetchJobIds();
    console.log(`Found ${teIds.length} postings on the portal.`);

    const [existingRows] = await conn.query(
      `SELECT id FROM jobs WHERE id LIKE 'te-%'`,
    );
    const existingIds = new Set(existingRows.map((r) => r.id));

    let added = 0;
    let skipped = 0;
    let failed = 0;

    for (const teId of teIds) {
      const id = `te-${teId}`;
      if (existingIds.has(id)) {
        skipped++;
        continue;
      }

      const job = await fetchJobPosting(teId);
      if (!job) {
        console.warn(`  skip ${teId}: fetch or parse failed`);
        failed++;
        continue;
      }

      await conn.execute(
        `INSERT INTO jobs
           (id, title, company, category, location, remote, employment_type,
            salary_min, salary_max, bounty, fee_tier, description,
            responsibilities, requirements, faqs, screening_questions,
            hiring_stages, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          id, job.title, job.company, job.category, job.location,
          false, EMPLOYMENT_TYPE_MAP["Direct Hire"],
          null, null, null, null,
          job.description, "", "",
          JSON.stringify([]), JSON.stringify([]), JSON.stringify([]),
          PUBLISH ? "open" : "draft",
        ],
      );
      console.log(`  + ${job.title} — ${job.location} (${job.category})`);
      added++;
    }

    console.log(
      `\nDone. ${added} added, ${skipped} already imported, ${failed} failed.` +
      (added > 0 && !PUBLISH ? "\nNew jobs are drafts — review and publish them from the admin console." : ""),
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
