/* Removes the source agency's name from JobFolder's own job board.
 *
 *   node --env-file=.env.local scripts/db-scrub-agency-branding.mjs
 *   node --env-file=.env.local scripts/db-scrub-agency-branding.mjs --apply
 *
 * Imported roles arrived with the recruiting agency listed as the hiring
 * organization, so every card on the public board carried that agency's
 * name. JobFolder is its own brand and shouldn't advertise anyone else's.
 *
 * "Confidential Client" rather than blank: it's what these postings say
 * about themselves (most carry a "Confidential search — do not repost"
 * line), so it reads as deliberate instead of as missing data. An admin can
 * set a real client name per job in the wizard; scraping won't overwrite it.
 *
 * Descriptions are matched on the full agency name only. Plain "Metro" is
 * left alone on purpose — in this data it's geography ("Twin Cities Metro
 * Area", "New York metro area", "Los Angeles Metro"), and a blind
 * search-and-replace would mangle four live listings.
 */

import mysql from "mysql2/promise";

const APPLY = process.argv.includes("--apply");
const AGENCY = "Metro Associates";
const REPLACEMENT = "Confidential Client";

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
  const [byCompany] = await conn.query(
    `SELECT id, title, status FROM jobs WHERE company LIKE ?`,
    [`%${AGENCY}%`],
  );
  const live = byCompany.filter((r) => r.status === "open").length;
  console.log(`company field: ${byCompany.length} job(s) name the agency (${live} of them public).`);

  const [byDescription] = await conn.query(
    `SELECT id, title, status FROM jobs WHERE description LIKE ?`,
    [`%${AGENCY}%`],
  );
  console.log(`description text: ${byDescription.length} job(s) name the agency.`);
  for (const r of byDescription) console.log(`   • ${r.title} [${r.status}]`);

  if (APPLY) {
    const [c] = await conn.execute(`UPDATE jobs SET company = ? WHERE company LIKE ?`, [
      REPLACEMENT,
      `%${AGENCY}%`,
    ]);
    const [d] = await conn.execute(
      `UPDATE jobs SET description = REPLACE(description, ?, ?) WHERE description LIKE ?`,
      [AGENCY, "Our client", `%${AGENCY}%`],
    );
    console.log(`\nUpdated ${c.affectedRows} company field(s) and ${d.affectedRows} description(s).`);

    const [[left]] = await conn.query(
      `SELECT COUNT(*) AS n FROM jobs WHERE company LIKE ? OR description LIKE ?`,
      [`%${AGENCY}%`, `%${AGENCY}%`],
    );
    console.log(`Remaining references to "${AGENCY}" anywhere in jobs: ${left.n}`);
  } else {
    console.log(`\nDry run — pass --apply to write.`);
  }
} finally {
  await conn.end();
}
