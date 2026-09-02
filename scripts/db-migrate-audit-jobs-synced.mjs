/* One-off, additive migration: adds 'jobs_synced' to admin_audit_log.action.
 *
 *   node --env-file=.env.local scripts/db-migrate-audit-jobs-synced.mjs
 *
 * Missing this is why POST /api/admin/jobs/sync-topechelon 500ed in
 * production: the sync itself succeeds, but the logAdminAction() call right
 * after it tries to insert action='jobs_synced' into a column whose MySQL
 * ENUM never actually got this value added (only the TS AdminAuditAction
 * type did) — strict SQL mode (see lib/db.ts) rejects it outright.
 *
 * Checks information_schema first, same reasoning as
 * db-migrate-recruiter-verified.mjs — safe to re-run.
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
  // Aliased — information_schema.columns reports COLUMN_TYPE in whatever
  // case the server's catalog uses regardless of how it's typed in the
  // SELECT list (see scripts/db-migrate-verification-video.mjs for the same
  // gotcha caught there).
  const [[actionColumn]] = await conn.query(
    `SELECT column_type AS col_type FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'admin_audit_log' AND column_name = 'action'`,
    [process.env.MYSQL_DATABASE],
  );

  if (actionColumn?.col_type?.includes("'jobs_synced'")) {
    console.log("  admin_audit_log.action already includes 'jobs_synced' — nothing to do.");
  } else {
    console.log("  Adding 'jobs_synced' to admin_audit_log.action...");
    await conn.query(
      `ALTER TABLE admin_audit_log MODIFY COLUMN action ENUM(
         'grant','revoke','invite','invite_claimed','invite_cancelled',
         'recruiter_verified','recruiter_unverified',
         'recruiter_suspended','recruiter_reinstated',
         'site_builder_unlocked','site_builder_locked',
         'job_deleted','jobs_synced','submission_status_changed','profile_reminder_sent'
       ) NOT NULL`,
    );
    console.log("  Done.");
  }
} finally {
  await conn.end();
}
