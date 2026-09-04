/* Drops two foreign keys that pointed admin/sender uids at users(uid).
 *
 *   node --env-file=.env.local scripts/db-migrate-drop-reply-admin-fk.mjs
 *
 * `admins` and `users` are separate tables — an admin is not necessarily a
 * recruiter, and on a normal console the admin has no row in `users` at all.
 * Both constraints therefore rejected perfectly valid writes:
 *
 *   message_replies.fk_replies_admin — every admin reply failed with
 *     ER_NO_REFERENCED_ROW_2, surfacing as a 500 and the generic
 *     "Something went wrong."
 *
 *   messages.fk_messages_sender — worse: the PUBLIC contact form 500s for
 *     any signed-in admin, and for a brand-new account whose profile row
 *     hasn't been created yet (that happens on GET /api/me, which a visitor
 *     going straight to /contact may not have hit).
 *
 * Both columns stay, as plain traceability. That's already how
 * admin_audit_log.actor_uid works — no FK — and it's why admin_name and
 * admin_email are snapshotted beside admin_uid: the thread must read
 * correctly whether or not the uid still resolves. A uid that resolves to
 * nothing simply matches no rows when scoping someone's own list.
 *
 * Idempotent — checks for each constraint before dropping it.
 */

import mysql from "mysql2/promise";

const TARGETS = [
  { table: "message_replies", constraint: "fk_replies_admin" },
  { table: "messages", constraint: "fk_messages_sender" },
];

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
  for (const { table, constraint } of TARGETS) {
    const [[row]] = await conn.query(
      `SELECT COUNT(*) AS n FROM information_schema.table_constraints
        WHERE table_schema = ? AND table_name = ? AND constraint_name = ?`,
      [process.env.MYSQL_DATABASE, table, constraint],
    );
    if (row.n === 0) {
      console.log(`  ${table}.${constraint} — already gone`);
    } else {
      await conn.query(`ALTER TABLE ${table} DROP FOREIGN KEY ${constraint}`);
      console.log(`  ${table}.${constraint} — dropped`);
    }
  }
  console.log("Done.");
} finally {
  await conn.end();
}
