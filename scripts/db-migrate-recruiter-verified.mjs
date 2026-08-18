/* One-off, additive migration: adds users.verified.
 *
 *   node --env-file=.env.local scripts/db-migrate-recruiter-verified.mjs
 *
 * Checks information_schema first, same reasoning as
 * db-migrate-metro-team.mjs — safe to re-run, never touches existing rows.
 */

import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectTimeout: 15_000,
  ...(process.env.MYSQL_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
});

try {
  const [existing] = await conn.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'users' AND column_name = 'verified'`,
    [process.env.MYSQL_DATABASE],
  );

  if (existing.length) {
    console.log("  users.verified already exists — nothing to do.");
  } else {
    console.log("  Adding users.verified...");
    await conn.query(
      `ALTER TABLE users
         ADD COLUMN verified BOOLEAN NOT NULL DEFAULT FALSE AFTER metro_team_member`,
    );
    console.log("  Done.");
  }
} finally {
  await conn.end();
}
