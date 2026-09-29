/* Adds `spam` and `spam_reason` to `messages`.
 *
 *   node --env-file=.env.local scripts/db-migrate-message-spam.mjs
 *
 * Additive and idempotent. Run it BEFORE deploying the spam scoring, or the
 * contact form breaks outright: createMessage inserts both columns, and an
 * INSERT naming a column that does not exist fails, which would turn every
 * genuine enquiry into a 500.
 *
 * Existing rows default to spam = false, so nothing already in the inbox is
 * hidden by this. Backfilling old spam is deliberately not done here — the
 * client has already deleted most of it by hand, and re-scoring months of
 * history risks flagging real enquiries nobody is watching for any more.
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
  const [cols] = await conn.query(
    `SELECT column_name AS name FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'messages'`,
    [process.env.MYSQL_DATABASE],
  );
  const have = new Set(cols.map((c) => c.name));

  if (have.has("spam")) {
    console.log("messages.spam — already present");
  } else {
    await conn.query(
      "ALTER TABLE messages ADD COLUMN spam BOOLEAN NOT NULL DEFAULT FALSE AFTER sleeping",
    );
    console.log("messages.spam — added");
  }

  if (have.has("spam_reason")) {
    console.log("messages.spam_reason — already present");
  } else {
    await conn.query(
      "ALTER TABLE messages ADD COLUMN spam_reason VARCHAR(255) NULL AFTER spam",
    );
    console.log("messages.spam_reason — added");
  }

  const [[{ n }]] = await conn.query("SELECT COUNT(*) AS n FROM messages");
  console.log(`messages table holds ${n} row(s); all default to spam = false.`);
} finally {
  await conn.end();
}
