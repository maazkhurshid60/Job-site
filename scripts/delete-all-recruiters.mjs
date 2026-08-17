/* One-off: back up every row in `users` (recruiters) to a JSON file, then
 * delete them all.
 *
 *   node --env-file=.env.local scripts/delete-all-recruiters.mjs
 *
 * Does NOT touch `admins`. Does NOT touch Firebase Auth accounts — those are
 * separate; GET /api/me recreates a blank profile row the next time any of
 * these people log in (see lib/auth.tsx / DashboardGate.tsx).
 *
 * FKs are ON DELETE SET NULL for submissions.recruiter_id, files.owner_uid,
 * and submission_messages.sender_uid, so this is safe to run without
 * touching those tables first — they just lose recruiter attribution.
 */

import mysql from "mysql2/promise";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const cfg = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectTimeout: 15_000,
  ...(process.env.MYSQL_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
};

if (!cfg.host) {
  console.error("MYSQL_HOST is empty — check .env.local");
  process.exit(1);
}

const conn = await mysql.createConnection(cfg);

try {
  const [rows] = await conn.query("SELECT * FROM `users`");
  console.log(`Found ${rows.length} recruiter row(s) in \`users\`.`);

  const backupDir = path.join(process.cwd(), "backups");
  await mkdir(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `users-backup-${stamp}.json`);
  await writeFile(backupPath, JSON.stringify(rows, null, 2), "utf8");
  console.log(`Backed up to ${backupPath}`);

  const [result] = await conn.query("DELETE FROM `users`");
  console.log(`Deleted ${result.affectedRows} row(s) from \`users\`.`);
} finally {
  await conn.end();
}
