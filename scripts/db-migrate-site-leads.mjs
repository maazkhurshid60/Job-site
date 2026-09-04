/* Creates the `site_leads` table — enquiries sent from a recruiter's public
 * microsite at /sites/[slug].
 *
 *   node --env-file=.env.local scripts/db-migrate-site-leads.mjs
 *
 * Additive and idempotent (CREATE TABLE IF NOT EXISTS).
 *
 * Until now the microsite's contact section was a mailto: link, so a visitor
 * emailed the recruiter directly and nothing was recorded anywhere — neither
 * the recruiter nor an admin had any record that the enquiry existed. This
 * table is the record.
 *
 * ON DELETE CASCADE: a lead belongs to the recruiter whose site captured it.
 * If the account goes, so does the lead — there is no other party it could
 * sensibly belong to, and leaving orphans would break the admin list.
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
      WHERE table_schema = ? AND table_name = 'site_leads'`,
    [process.env.MYSQL_DATABASE],
  );
  if (existing.n > 0) {
    console.log("site_leads — already exists, nothing to do.");
  } else {
    await conn.query(`
      CREATE TABLE site_leads (
        id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        recruiter_id VARCHAR(128) NOT NULL,
        name         VARCHAR(255) NOT NULL DEFAULT '',
        email        VARCHAR(320) NOT NULL DEFAULT '',
        phone        VARCHAR(64)  NOT NULL DEFAULT '',
        message      MEDIUMTEXT,
        ip           VARCHAR(64)  NULL,
        handled      BOOLEAN      NOT NULL DEFAULT FALSE,
        created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_site_leads_recruiter (recruiter_id, created_at DESC),
        KEY idx_site_leads_created (created_at DESC),
        KEY idx_site_leads_ip_created (ip, created_at),
        CONSTRAINT fk_site_leads_recruiter FOREIGN KEY (recruiter_id)
          REFERENCES users(uid) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("site_leads — created.");
  }
} finally {
  await conn.end();
}
