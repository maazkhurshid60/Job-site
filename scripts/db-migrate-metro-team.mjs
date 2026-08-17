/* One-off, additive migration: adds users.metro_team_member.
 *
 *   node --env-file=.env.local scripts/db-migrate-metro-team.mjs
 *
 * Checks information_schema first rather than relying on
 * ADD COLUMN IF NOT EXISTS, which this host's MySQL rejected — so it's still
 * safe to re-run and never touches existing rows.
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
      WHERE table_schema = ? AND table_name = 'users' AND column_name = 'metro_team_member'`,
    [process.env.MYSQL_DATABASE],
  );

  if (existing.length) {
    console.log("  users.metro_team_member already exists — nothing to do.");
  } else {
    console.log("  Adding users.metro_team_member...");
    await conn.query(
      `ALTER TABLE users
         ADD COLUMN metro_team_member BOOLEAN NOT NULL DEFAULT FALSE AFTER photo_url`,
    );
    console.log("  Done.");
  }
} finally {
  await conn.end();
}
