/* Lets an enquiry thread receive replies, not just send them.
 *
 *   node --env-file=.env.local scripts/db-migrate-inbound-replies.mjs
 *
 * Additive and idempotent. Two columns:
 *
 *   messages.reply_token — a random secret per thread. Replies are addressed
 *     to enquiry-<id>-<token>@<inbound domain>, so an inbound email can be
 *     matched to its thread with certainty. The token matters because anyone
 *     can email that address: without it, guessing sequential ids would let a
 *     stranger post into someone else's conversation.
 *
 *   message_replies.direction — 'out' for what we sent, 'in' for what came
 *     back. VARCHAR, not ENUM: adding an ENUM value later needs a migration,
 *     and a missing one under STRICT_ALL_TABLES surfaces as a 500 on a write
 *     that already half succeeded. This codebase has been bitten twice.
 *
 * Existing rows get a token and direction='out', which is what they are.
 */

import mysql from "mysql2/promise";
import { randomBytes } from "node:crypto";

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectTimeout: 15_000,
  ...(process.env.MYSQL_SSL === "true" ? { ssl: { rejectUnauthorized: true } } : {}),
});

async function hasColumn(table, column) {
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
    [process.env.MYSQL_DATABASE, table, column],
  );
  return row.n > 0;
}

try {
  if (await hasColumn("messages", "reply_token")) {
    console.log("  messages.reply_token — already there");
  } else {
    await conn.query(`ALTER TABLE messages ADD COLUMN reply_token CHAR(24) NOT NULL DEFAULT ''`);
    await conn.query(`ALTER TABLE messages ADD KEY idx_messages_reply_token (reply_token)`);
    console.log("  messages.reply_token — added");
  }

  /* Backfill anything without one, including rows added between deploys.
     Done per-row because each needs its own secret. */
  const [blank] = await conn.query(`SELECT id FROM messages WHERE reply_token = ''`);
  for (const row of blank) {
    await conn.execute(`UPDATE messages SET reply_token = ? WHERE id = ?`, [
      randomBytes(12).toString("hex"),
      row.id,
    ]);
  }
  if (blank.length) console.log(`  backfilled ${blank.length} reply token(s)`);

  if (await hasColumn("message_replies", "direction")) {
    console.log("  message_replies.direction — already there");
  } else {
    await conn.query(
      `ALTER TABLE message_replies ADD COLUMN direction VARCHAR(8) NOT NULL DEFAULT 'out'`,
    );
    console.log("  message_replies.direction — added (existing rows are 'out')");
  }

  /* An inbound reply has no admin behind it, so admin_uid must be nullable.
     It already is — this just states the expectation loudly if that changes. */
  const [[uidCol]] = await conn.query(
    `SELECT is_nullable AS nullable FROM information_schema.columns
      WHERE table_schema = ? AND table_name = 'message_replies' AND column_name = 'admin_uid'`,
    [process.env.MYSQL_DATABASE],
  );
  if (uidCol.nullable !== "YES") {
    throw new Error("message_replies.admin_uid must be nullable — inbound replies have no admin.");
  }

  console.log("Done.");
} finally {
  await conn.end();
}
