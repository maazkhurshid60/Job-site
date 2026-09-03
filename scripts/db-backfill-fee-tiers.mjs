/* Sets a recruiter fee on every job that hasn't got one.
 *
 *   node --env-file=.env.local scripts/db-backfill-fee-tiers.mjs          # dry run
 *   node --env-file=.env.local scripts/db-backfill-fee-tiers.mjs --apply
 *
 * Every job on the board had fee_tier NULL, so recruiters saw roles with no
 * fee attached — the one number the whole proposition rests on. The tier
 * comes from the published salary (see feeTierForSalary in lib/feeTiers.ts);
 * roles with no published range get the "general" tier.
 *
 * Only touches rows where fee_tier IS NULL, so a tier an admin has already
 * chosen is never overwritten.
 */

import mysql from "mysql2/promise";

const APPLY = process.argv.includes("--apply");

/* Mirrors feeTierForSalary in lib/feeTiers.ts. Duplicated because this is a
   plain .mjs script and can't import the TypeScript module — if the
   thresholds move there, move them here too. */
function feeTierForSalary(salaryMin, salaryMax) {
  const top = salaryMax ?? salaryMin;
  if (top === null) return "general";
  if (top < 120_000) return "standard";
  if (top < 170_000) return "professional";
  return "specialized";
}

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
  const [rows] = await conn.query(
    `SELECT id, title, salary_min, salary_max, status FROM jobs WHERE fee_tier IS NULL`,
  );
  const counts = {};
  for (const row of rows) {
    const tier = feeTierForSalary(row.salary_min, row.salary_max);
    counts[tier] = (counts[tier] ?? 0) + 1;
    if (row.salary_max !== null) {
      console.log(`  ${tier.padEnd(12)} ${row.title} (up to $${(row.salary_max / 1000)}k)`);
    }
    if (APPLY) await conn.execute(`UPDATE jobs SET fee_tier = ? WHERE id = ?`, [tier, row.id]);
  }
  console.log(`\n${APPLY ? "Set" : "Would set"} a tier on ${rows.length} job(s):`);
  for (const [tier, n] of Object.entries(counts).sort()) console.log(`  ${n} × ${tier}`);
  if (!APPLY) console.log("\nDry run — pass --apply to write.");
} finally {
  await conn.end();
}
