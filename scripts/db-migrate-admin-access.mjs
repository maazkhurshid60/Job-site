/* One-off, additive migration: admin activity tracking, invites, audit log.
 *
 *   node --env-file=.env.local scripts/db-migrate-admin-access.mjs
 *
 * Safe to re-run — checks information_schema before the ALTER, and the two
 * new tables use CREATE TABLE IF NOT EXISTS. Never touches existing rows.
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
      WHERE table_schema = ? AND table_name = 'admins' AND column_name = 'last_active_at'`,
    [process.env.MYSQL_DATABASE],
  );

  if (existing.length) {
    console.log("  admins.last_active_at already exists — nothing to do.");
  } else {
    console.log("  Adding admins.last_active_at...");
    await conn.query(
      `ALTER TABLE admins ADD COLUMN last_active_at DATETIME(3) NULL AFTER note`,
    );
    console.log("  Done.");
  }

  console.log("  Creating admin_invites (if missing)...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_invites (
      email             VARCHAR(320) NOT NULL,
      invited_by_name   VARCHAR(255) NOT NULL DEFAULT '',
      invited_by_email  VARCHAR(320) NOT NULL DEFAULT '',
      created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  console.log("  Creating admin_audit_log (if missing)...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      action       ENUM('grant','revoke','invite','invite_claimed','invite_cancelled') NOT NULL,
      actor_uid    VARCHAR(128) NULL,
      actor_name   VARCHAR(255) NOT NULL DEFAULT '',
      actor_email  VARCHAR(320) NOT NULL DEFAULT '',
      target_uid   VARCHAR(128) NULL,
      target_name  VARCHAR(255) NOT NULL DEFAULT '',
      target_email VARCHAR(320) NOT NULL DEFAULT '',
      created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_admin_audit_created (created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);

  console.log("  Done.");
} finally {
  await conn.end();
}
