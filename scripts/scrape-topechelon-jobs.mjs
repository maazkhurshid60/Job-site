/* Imports Metro Associates' live postings from its Top Echelon careers
 * portal into JobFolder's `jobs` table.
 *
 *   node --env-file=.env.local scripts/scrape-topechelon-jobs.mjs
 *   node --env-file=.env.local scripts/scrape-topechelon-jobs.mjs --publish
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

const PORTAL_URL = "https://careers.topechelon.com/portals/3a7f6fd3-7cf7-447c-a20f-2354eb2031df";
const PUBLISH = process.argv.includes("--publish");

// ------------------------------------------------------------- category map

// Checked in order — first match wins. Built from the actual job titles on
// Metro's portal; extend this if a future title doesn't match anything and
// falls through to "Other".
const CATEGORY_RULES = [
  [/inspect/i, "CEI / Inspection"],
  [/bridge|structural/i, "Structural Engineering"],
  [/transportation|roadway|traffic|dot\b|ctdot|indot|ridot|txdot|adot/i, "Transportation / DOT"],
  [/mechanical.*plumbing|\bmep\b/i, "MEP Engineering"],
  [/electrical/i, "Electrical Engineering"],
  [/mechanical/i, "Mechanical Engineering"],
  [/water|hydrology|wastewater/i, "Water / Hydrology"],
  [/civil|land development|land surveyor|site (civil|engineer)/i, "Civil Engineering"],
  [/project manager|program manager/i, "Project Management"],
  [/architect/i, "Architecture (AEC)"],
];

function guessCategory(title) {
  for (const [pattern, category] of CATEGORY_RULES) {
    if (pattern.test(title)) return category;
  }
  return "Other";
}

const EMPLOYMENT_TYPE_MAP = {
  "Direct Hire": "Full-time",
  "Full-time": "Full-time",
  "Part-time": "Part-time",
  Contract: "Contract",
  Temporary: "Temporary",
  Internship: "Internship",
};

// ---------------------------------------------------------- HTML -> text

/** The JobPosting `description` is a small, well-formed HTML fragment (p/ul/
 *  li/h3/strong) — not arbitrary markup — so a handful of targeted
 *  replacements is enough; no HTML-parser dependency needed for this. */
function htmlToText(html) {
  return html
    .replace(/<h3[^>]*>/gi, "\n\n### ")
    .replace(/<\/h3>/gi, " ###\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --------------------------------------------------------------- scraping

async function fetchJobIds() {
  const res = await fetch(PORTAL_URL);
  if (!res.ok) throw new Error(`Portal fetch failed: ${res.status}`);
  const html = await res.text();
  const ids = [...html.matchAll(/\/jobs\/([a-f0-9-]{36})/g)].map((m) => m[1]);
  return [...new Set(ids)];
}

async function fetchJobPosting(teId) {
  const url = `${PORTAL_URL}/jobs/${teId}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  skip ${teId}: detail fetch ${res.status}`);
    return null;
  }
  const html = await res.text();
  const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!match) {
    console.warn(`  skip ${teId}: no JobPosting JSON-LD found`);
    return null;
  }

  let posting;
  try {
    posting = JSON.parse(match[1]);
  } catch (err) {
    console.warn(`  skip ${teId}: JSON-LD parse failed (${err.message})`);
    return null;
  }

  const addr = posting.jobLocation?.address ?? {};
  const location = [addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ");

  return {
    teId,
    title: posting.title ?? "Untitled role",
    company: posting.hiringOrganization?.name || "Metro Associates",
    category: guessCategory(posting.title ?? ""),
    location,
    description: htmlToText(posting.description ?? ""),
  };
}

// -------------------------------------------------------------------- db

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
