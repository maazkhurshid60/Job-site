/* Connectivity check for the FreeHostia MySQL database.
 *
 *   node --env-file=.env.local scripts/db-check.mjs
 *
 * Answers, in order, the questions that decide whether this setup is viable:
 *   1. Is the host reachable from here at all? (Remote MySQL enabled?)
 *   2. Do the credentials work?
 *   3. What is max_connections — i.e. how big can the pool safely be?
 *   4. Has the schema been applied?
 *
 * Every failure maps to a specific fix rather than a raw driver error.
 */

import mysql from "mysql2/promise";

const cfg = {
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectTimeout: 15_000,
  ...(process.env.MYSQL_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
};

const EXPECTED_TABLES = [
  "admins",
  "jobs",
  "messages",
  "settings",
  "submissions",
  "users",
];

function fail(message, hint) {
  console.error(`\n  FAILED  ${message}`);
  if (hint) console.error(`\n${hint}\n`);
  process.exit(1);
}

if (!cfg.host) {
  fail(
    "MYSQL_HOST is empty.",
    `  This is the step that is still outstanding.

  In the FreeHostia panel, click the "Remote MySQL" icon on the
  patnov13_jobfolder row. The panel's "MySQL Server: localhost" is the value
  for PHP running on their box — it will not work from here.

  Two things to note down:
    - the hostname it gives you  -> MYSQL_HOST in .env.local
    - what the access-host field accepts:
        * "%" / "any host"      -> works with Vercel
        * specific IPs only     -> Vercel cannot be whitelisted (no fixed
                                   egress IP); the app would need a host that
                                   has one.`,
  );
}

console.log(`\n  Connecting to ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
console.log(`  TLS: ${process.env.MYSQL_SSL === "true" ? "on" : "OFF"}\n`);

let conn;
try {
  conn = await mysql.createConnection(cfg);
  console.log("  OK      Connected — remote access is working.");
} catch (err) {
  const code = err.code ?? "";

  if (code === "ETIMEDOUT" || code === "ENOTFOUND" || code === "ECONNREFUSED") {
    fail(
      `Could not reach the server (${code}).`,
      `  Either Remote MySQL is not enabled for this database, or this machine's
  IP is not on its access list, or MYSQL_HOST is wrong.

  Add your current IP in the panel's Remote MySQL dialog and retry.`,
    );
  }

  if (code === "ER_ACCESS_DENIED_ERROR") {
    fail(
      "The server answered, but rejected the credentials.",
      `  Good news: the network path works, so Remote MySQL is on. Check
  MYSQL_USER and MYSQL_PASSWORD in .env.local. On FreeHostia the username is
  usually identical to the database name (patnov13_jobfolder).`,
    );
  }

  if (code === "ER_NOT_SUPPORTED_AUTH_MODE" || /public key/i.test(err.message)) {
    fail(
      "Authentication plugin handshake failed.",
      `  MySQL 8.4 uses caching_sha2_password. Set MYSQL_SSL=true if the host
  supports TLS — that is the correct fix. Sending credentials unencrypted is
  the fallback, not the goal.`,
    );
  }

  fail(`${code || "Connection error"}: ${err.message}`);
}

try {
  const [[version]] = await conn.query(
    "SELECT VERSION() AS version, @@max_connections AS maxConnections",
  );
  console.log(`  OK      MySQL ${version.version}`);
  console.log(`  INFO    max_connections = ${version.maxConnections}`);

  const suggested = Math.max(2, Math.min(5, Math.floor(version.maxConnections / 10)));
  console.log(
    `  INFO    Suggested MYSQL_POOL_SIZE: ${suggested} ` +
      `(serverless opens a pool per warm instance — leave headroom)`,
  );

  const [[{ enc }]] = await conn.query(
    "SHOW SESSION STATUS LIKE 'Ssl_cipher'",
  ).then(([rows]) => [[{ enc: rows[0]?.Value || "" }]]);
  console.log(
    enc
      ? `  OK      Connection is encrypted (${enc})`
      : `  WARN    Connection is NOT encrypted — credentials and candidate data
          cross the internet in the clear. Try MYSQL_SSL=true.`,
  );

  const [tables] = await conn.query(
    `SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = ?`,
    [cfg.database],
  );
  const found = tables.map((t) => t.name).sort();
  const missing = EXPECTED_TABLES.filter((t) => !found.includes(t));

  if (found.length === 0) {
    console.log(
      `\n  INFO    Database is empty. Apply the schema next:
          import db/schema.sql via phpMyAdmin, or pipe it in with the mysql CLI.`,
    );
  } else if (missing.length) {
    console.log(`\n  WARN    Missing tables: ${missing.join(", ")}`);
  } else {
    console.log(`\n  OK      All ${EXPECTED_TABLES.length} tables present.`);
    for (const t of EXPECTED_TABLES) {
      const [[{ n }]] = await conn.query(
        `SELECT COUNT(*) AS n FROM \`${t}\``,
      );
      console.log(`          ${t.padEnd(12)} ${n} rows`);
    }
  }

  console.log("");
} finally {
  await conn.end();
}
