/* One-off, additive migration: adds the `candidates` table (a recruiter's
 * saved candidate pool, separate from `submissions`).
 *
 *   node --env-file=.env.local scripts/db-migrate-candidates.mjs
 *
 * Safe to re-run — CREATE TABLE IF NOT EXISTS, never touches existing rows.
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
  console.log("  Creating candidates (if missing)...");
  await conn.query(`
    CREATE TABLE IF NOT EXISTS candidates (
      id           VARCHAR(64)  NOT NULL,
      recruiter_id VARCHAR(128) NOT NULL,
      name         VARCHAR(255) NOT NULL DEFAULT '',
      email        VARCHAR(320) NOT NULL DEFAULT '',
      phone        VARCHAR(64)  NOT NULL DEFAULT '',
      notes        MEDIUMTEXT,
      cv_file_id   CHAR(36)     NULL,
      created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                                ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (id),
      KEY idx_candidates_recruiter (recruiter_id, created_at DESC),
      UNIQUE KEY uq_candidates_recruiter_email (recruiter_id, email),
      CONSTRAINT fk_candidates_recruiter FOREIGN KEY (recruiter_id)
        REFERENCES users (uid) ON DELETE CASCADE,
      CONSTRAINT fk_candidates_cv FOREIGN KEY (cv_file_id)
        REFERENCES files (id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
  `);
  console.log("  Done.");
} finally {
  await conn.end();
}
