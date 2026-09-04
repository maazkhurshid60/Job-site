/* Turns contact-form enquiries into something a recruiter can follow.
 *
 *   node --env-file=.env.local scripts/db-migrate-enquiry-threads.mjs
 *
 * Two additions, both idempotent:
 *
 *   messages.sender_uid  — who sent it, when they were signed in. Until now
 *     an enquiry was anonymous even from a logged-in recruiter, so they had
 *     no way to see what they'd sent or whether it had been answered.
 *     Nullable because the form is public and most senders won't have an
 *     account; ON DELETE SET NULL so closing an account keeps the enquiry
 *     (we may still owe someone a reply) while dropping the link.
 *
 *   message_replies — what an admin wrote back. Previously "Reply" was a
 *     mailto: link, so the answer left no trace: no second admin could tell
 *     whether a lead had been handled or what was said, and the sender had
 *     nowhere to read it.
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
  const db = process.env.MYSQL_DATABASE;

  /* Aliased: information_schema returns COLUMN_NAME uppercase, so reading
     row.column_name gives undefined and the guard never matches. */
  const [[col]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'messages' AND column_name = 'sender_uid'`,
    [db],
  );
  if (col.n > 0) {
    console.log("  messages.sender_uid — already there");
  } else {
    await conn.query(`ALTER TABLE messages ADD COLUMN sender_uid VARCHAR(128) NULL AFTER email`);
    await conn.query(`ALTER TABLE messages ADD KEY idx_messages_sender (sender_uid, created_at DESC)`);
    /* No foreign key on purpose — see db-migrate-drop-reply-admin-fk.mjs.
       `admins` and `users` are separate tables, so an admin using the public
       contact form has no matching row and the constraint would reject the
       submission outright. */
    console.log("  messages.sender_uid — added");
  }

  const [[tbl]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.tables
      WHERE table_schema = ? AND table_name = 'message_replies'`,
    [db],
  );
  if (tbl.n > 0) {
    console.log("  message_replies — already there");
  } else {
    await conn.query(`
      CREATE TABLE message_replies (
        id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        message_id   BIGINT UNSIGNED NOT NULL,
        -- Who replied. Kept as a snapshot of name/email as well as the uid so
        -- the thread still reads correctly after an admin leaves.
        admin_uid    VARCHAR(128) NULL,
        admin_name   VARCHAR(255) NOT NULL DEFAULT '',
        admin_email  VARCHAR(320) NOT NULL DEFAULT '',
        body         MEDIUMTEXT   NOT NULL,
        created_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        PRIMARY KEY (id),
        KEY idx_message_replies_message (message_id, created_at),
        CONSTRAINT fk_replies_message FOREIGN KEY (message_id)
          REFERENCES messages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
    console.log("  message_replies — created");
  }
  console.log("Done.");
} finally {
  await conn.end();
}
