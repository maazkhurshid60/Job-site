/* Adds the 'general' fee tier ($1,500) to the fee_tier ENUMs.
 *
 *   node --env-file=.env.local scripts/db-migrate-fee-tier-general.mjs
 *
 * Additive and idempotent — re-running is a no-op. Two columns carry the
 * tier: jobs.fee_tier, and submissions.fee_tier which snapshots the tier at
 * submission time so a later re-tiering can't change what a recruiter was
 * promised. Both need the value or a submission against a 'general' job
 * fails on insert under STRICT_ALL_TABLES.
 */

import mysql from "mysql2/promise";

const TARGETS = [
  { table: "jobs", column: "fee_tier" },
  { table: "submissions", column: "fee_tier" },
];
const NEW_TYPE = "ENUM('standard','general','professional','specialized') NULL";

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
  const db = process.env.MYSQL_DATABASE;
  for (const { table, column } of TARGETS) {
    /* Aliased: information_schema returns COLUMN_TYPE uppercase, so reading
       row.column_type gives undefined and the check silently never matches. */
    const [[row]] = await conn.query(
      `SELECT column_type AS col_type FROM information_schema.columns
        WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
      [db, table, column],
    );
    if (!row) {
      console.log(`  ${table}.${column} — no such column, skipping`);
      continue;
    }
    if (row.col_type.includes("'general'")) {
      console.log(`  ${table}.${column} — already has 'general'`);
      continue;
    }
    await conn.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${NEW_TYPE}`);
    console.log(`  ${table}.${column} — added 'general'`);
  }
  console.log("Done.");
} finally {
  await conn.end();
}
