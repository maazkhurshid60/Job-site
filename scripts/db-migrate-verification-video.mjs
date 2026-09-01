/* One-off, additive migration: adds video as a `files.kind`, and
 * users.verification_video_id.
 *
 *   node --env-file=.env.local scripts/db-migrate-verification-video.mjs
 *
 * Checks information_schema first, same reasoning as
 * db-migrate-recruiter-verified.mjs — safe to re-run, never touches existing
 * rows or files.
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
  /* Aliased: information_schema.columns reports COLUMN_TYPE in whatever case
     the server's catalog uses regardless of how it's typed in the SELECT list
     (confirmed uppercase against this host) — the alias pins the JS property
     name so this doesn't silently read undefined and re-run the ALTER every
     time. */
  const [[kindColumn]] = await conn.query(
    `SELECT column_type AS col_type FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'files' AND column_name = 'kind'`,
    [process.env.MYSQL_DATABASE],
  );

  if (kindColumn?.col_type?.includes("'video'")) {
    console.log("  files.kind already includes 'video' — nothing to do.");
  } else {
    console.log("  Adding 'video' to files.kind...");
    await conn.query(
      `ALTER TABLE files MODIFY COLUMN kind ENUM('cv','avatar','video') NOT NULL`,
    );
    console.log("  Done.");
  }

  const [existingColumn] = await conn.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'users' AND column_name = 'verification_video_id'`,
    [process.env.MYSQL_DATABASE],
  );

  if (existingColumn.length) {
    console.log("  users.verification_video_id already exists — nothing to do.");
  } else {
    console.log("  Adding users.verification_video_id...");
    await conn.query(
      `ALTER TABLE users
         ADD COLUMN verification_video_id CHAR(36) NULL AFTER photo_url`,
    );
    await conn.query(
      `ALTER TABLE users
         ADD KEY idx_users_verification_video (verification_video_id)`,
    );
    await conn.query(
      `ALTER TABLE users
         ADD CONSTRAINT fk_users_verification_video FOREIGN KEY (verification_video_id)
           REFERENCES files (id) ON DELETE SET NULL`,
    );
    console.log("  Done.");
  }
} finally {
  await conn.end();
}
