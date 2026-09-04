/* Creates `notifications` — messages that appear in a recruiter's dashboard.
 *
 *   node --env-file=.env.local scripts/db-migrate-notifications.mjs
 *
 * Additive and idempotent.
 *
 * Until now the only way to reach a recruiter was email, which lands outside
 * the product: it can bounce, go to spam, or simply be deleted, and neither
 * side can see afterwards whether it was read. A notification sits in the
 * dashboard they already sign in to, and records when they opened it.
 *
 * Two deliberate choices, both learned the hard way this week:
 *
 *   `source` is a VARCHAR, not an ENUM. Adding a value to an ENUM under
 *   STRICT_ALL_TABLES needs a migration, and forgetting one shows up as a
 *   500 on an action that already half-succeeded. System-generated alerts
 *   (submission moved, new matching role) will want their own source values
 *   later, and none of them should need a schema change.
 *
 *   There is NO foreign key on the author. Admins live in `admins`, not
 *   `users`, so a constraint pointing at users(uid) would reject every
 *   notification an admin sends. The author's name is snapshotted instead,
 *   which is what the recruiter actually sees.
 */

import mysql from "mysql2/promise";

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
  const [[existing]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.tables
      WHERE table_schema = ? AND table_name = 'notifications'`,
    [process.env.MYSQL_DATABASE],
  );
  if (existing.n > 0) {
    console.log("notifications — already exists, nothing to do.");
  } else {
    await conn.query(`
      CREATE TABLE notifications (
        id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        recipient_uid VARCHAR(128) NOT NULL,
        title         VARCHAR(200)  NOT NULL,
        body          MEDIUMTEXT    NOT NULL,
        -- Optional in-app destination, e.g. /dashboard/jobs. Relative paths
        -- only; the UI refuses anything else rather than turning a
        -- notification into an open redirect.
        link          VARCHAR(512)  NOT NULL DEFAULT '',
        -- 'admin' today; system events get their own values later without a
        -- schema change. See the note above on why this isn't an ENUM.
        source        VARCHAR(32)   NOT NULL DEFAULT 'admin',
        author_name   VARCHAR(255)  NOT NULL DEFAULT '',
        read_at       DATETIME(3)   NULL,
        created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        -- Covers both reads: the unread count, and the recipient's list.
        KEY idx_notifications_recipient (recipient_uid, read_at, created_at DESC),
        CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_uid)
          REFERENCES users(uid) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("notifications — created.");
  }
} finally {
  await conn.end();
}
