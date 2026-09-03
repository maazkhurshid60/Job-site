/* Makes the scraped Top Echelon set the live board, and retires the 30
 * hand-entered jobs that duplicate it.
 *
 *   node --env-file=.env.local scripts/db-retire-duplicate-jobs.mjs
 *   node --env-file=.env.local scripts/db-retire-duplicate-jobs.mjs --apply
 *
 * Background: 31 jobs were entered by hand on 25 Aug, then the scraper
 * imported the same roles from the portal on 31 Aug. Nothing linked the two
 * — the scraper only recognises its own `te-` ids — so 30 roles exist twice.
 * The scraped copies win: they stay in sync automatically, close themselves
 * when a role is filled, carry the full posting text, and name the company
 * (all 31 manual rows have a blank company).
 *
 * Duplicates are set to 'closed', NOT deleted. Same effect on the public
 * board, which only shows 'open', but every row stays recoverable and no
 * submission can be orphaned. Purge them later once you're happy.
 *
 * Requirements are carried over first: the manual rows have that field
 * filled and the scraped ones don't, so deleting outright would lose it.
 */

import mysql from "mysql2/promise";

const APPLY = process.argv.includes("--apply");

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
  const [all] = await conn.query("SELECT * FROM jobs");

  /* Portal titles carry stray double spaces ("QA QC  Manager"), so collapse
     whitespace before matching or two real duplicates look distinct. */
  const key = (r) =>
    `${r.title.replace(/\s+/g, " ").trim().toLowerCase()}|${r.location.replace(/\s+/g, " ").trim().toLowerCase()}`;

  const manual = all.filter((r) => !r.id.startsWith("te-"));
  const scrapedBy = new Map(all.filter((r) => r.id.startsWith("te-")).map((r) => [key(r), r]));

  const dupes = [];
  const orphans = [];
  for (const m of manual) {
    const twin = scrapedBy.get(key(m));
    if (twin) dupes.push({ manual: m, scraped: twin });
    else orphans.push(m);
  }

  console.log(`${manual.length} hand-entered jobs: ${dupes.length} duplicate a scraped role, ${orphans.length} do not.`);
  console.log("\nKept as-is (no scraped equivalent):");
  for (const o of orphans) console.log(`   • ${o.title} — ${o.location} [${o.status}]`);

  let carried = 0;
  for (const { manual: m, scraped: s } of dupes) {
    if (!(s.requirements || "").trim() && (m.requirements || "").trim()) {
      if (APPLY) await conn.execute("UPDATE jobs SET requirements = ? WHERE id = ?", [m.requirements, s.id]);
      carried++;
    }
  }
  console.log(`\nRequirements copied onto the scraped copy: ${carried}`);

  let retired = 0;
  for (const { manual: m } of dupes) {
    if (m.status === "closed") continue;
    if (APPLY) await conn.execute("UPDATE jobs SET status = 'closed' WHERE id = ?", [m.id]);
    retired++;
  }
  console.log(`${APPLY ? "Retired" : "Would retire"} ${retired} duplicate(s) to 'closed'.`);

  const [[{ n: drafts }]] = await conn.query(
    "SELECT COUNT(*) AS n FROM jobs WHERE id LIKE 'te-%' AND status = 'draft'",
  );
  if (APPLY) await conn.execute("UPDATE jobs SET status = 'open' WHERE id LIKE 'te-%' AND status = 'draft'");
  console.log(`${APPLY ? "Published" : "Would publish"} ${drafts} scraped draft(s).`);

  const [after] = await conn.query("SELECT status, COUNT(*) AS n FROM jobs GROUP BY status");
  console.log(`\n${APPLY ? "Board now" : "Board currently"}: ${JSON.stringify(after)}`);
  if (!APPLY) console.log("\nDry run — pass --apply to write.");
} finally {
  await conn.end();
}
