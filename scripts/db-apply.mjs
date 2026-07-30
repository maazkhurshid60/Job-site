/* Apply db/schema.sql to the configured MySQL database.
 *
 *   node --env-file=.env.local scripts/db-apply.mjs
 *
 * Refuses to run against a database that already has tables unless you pass
 * --force, so it can't silently clobber live data. --force DROPs the existing
 * tables first, in FK-safe order.
 */

import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

const force = process.argv.includes("--force");

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectTimeout: 15_000,
  // The schema is a single file of many statements.
  multipleStatements: true,
  ...(process.env.MYSQL_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
});

try {
  const [existing] = await conn.query(
    `SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = ?`,
    [process.env.MYSQL_DATABASE],
  );

  if (existing.length && !force) {
    console.error(
      `\n  Database already has ${existing.length} table(s): ` +
        `${existing.map((t) => t.name).join(", ")}\n\n` +
        `  Re-run with --force to DROP them and rebuild. That deletes all data.\n`,
    );
    process.exit(1);
  }

  if (existing.length && force) {
    console.log(`  Dropping ${existing.length} existing table(s)...`);
    await conn.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const t of existing) {
      await conn.query(`DROP TABLE IF EXISTS \`${t.name}\``);
    }
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  const sqlPath = path.join(process.cwd(), "db", "schema.sql");
  const sql = await fs.readFile(sqlPath, "utf8");

  console.log(`  Applying ${sqlPath}...`);
  await conn.query(sql);

  const [after] = await conn.query(
    `SELECT table_name AS name FROM information_schema.tables
      WHERE table_schema = ? ORDER BY table_name`,
    [process.env.MYSQL_DATABASE],
  );

  console.log(`\n  Done. ${after.length} tables created:`);
  for (const t of after) console.log(`    ${t.name}`);
  console.log("");
} finally {
  await conn.end();
}
