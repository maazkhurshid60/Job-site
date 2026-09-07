/* Adds a "sleeping" state to contact enquiries.
 *
 *   node --env-file=.env.local scripts/db-migrate-message-sleep.mjs
 *
 * Additive and idempotent — one boolean column, default FALSE, so every
 * existing enquiry stays exactly where it is.
 *
 * Why a third state rather than a delete: an enquiry that isn't worth
 * answering now (a cold pitch, a thread waiting on someone else, a lead to
 * revisit next quarter) still has to leave the two working lists, or "Needs
 * a reply" stops meaning anything and stops being read. Deleting would take
 * the record with it — including the sender's own copy at
 * /dashboard/enquiries, which we don't own. Sleeping keeps the row and every
 * reply on it, and it comes straight back the moment they write again (see
 * addInboundReply, which clears this alongside `handled`).
 *
 * Deliberately a separate column from `handled` rather than one status enum:
 * the two answer different questions — "have we replied?" and "are we
 * looking at this now?" — and a thread can honestly be both handled and
 * asleep. Collapsing them would lose that, and an ENUM would need another
 * migration the next time a state is added. This codebase has been bitten by
 * ENUM additions twice.
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

async function hasColumn(table, column) {
  const [[row]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = ? AND table_name = ? AND column_name = ?`,
    [process.env.MYSQL_DATABASE, table, column],
  );
  return row.n > 0;
}

try {
  if (await hasColumn("messages", "sleeping")) {
    console.log("  messages.sleeping — already there");
  } else {
    await conn.query(
      `ALTER TABLE messages ADD COLUMN sleeping BOOLEAN NOT NULL DEFAULT FALSE AFTER handled`,
    );
    console.log("  messages.sleeping — added (every existing enquiry stays awake)");
  }

  const [[counts]] = await conn.query(
    `SELECT COUNT(*) AS total,
            SUM(sleeping = TRUE) AS asleep,
            SUM(handled = FALSE AND sleeping = FALSE) AS needs_reply
       FROM messages`,
  );
  console.log(
    `  ${counts.total} enquiries — ${Number(counts.needs_reply ?? 0)} need a reply, ` +
      `${Number(counts.asleep ?? 0)} asleep`,
  );

  console.log("Done.");
} finally {
  await conn.end();
}
