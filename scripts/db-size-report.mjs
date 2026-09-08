/* What is actually in the JobFolder MySQL database, and how big.
 *
 *   node --env-file=.env.local scripts/db-size-report.mjs
 *
 * Read-only. Written to answer a specific question: the FreeHostia control
 * panel reports this database as 0 MB, which cannot be right if the files
 * table is holding CVs, avatars and recruiter videos as MEDIUMBLOBs.
 *
 * information_schema.TABLES is itself only an estimate for InnoDB — it comes
 * from cached statistics and can lag badly or read zero after a restore — so
 * the blob total is also measured directly with SUM(byte_size), which is
 * exact.
 */
import mysql from "mysql2/promise";

const c = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  ssl: process.env.MYSQL_SSL === "true" ? {} : undefined,
});

const mb = (n) => (Number(n || 0) / 1048576).toFixed(2).padStart(9) + " MB";

const [ver] = await c.query("SELECT VERSION() AS v, DATABASE() AS d");
console.log(`\n${ver[0].d} on MySQL ${ver[0].v}\n`);

const [tables] = await c.query(
  `SELECT TABLE_NAME AS t, TABLE_ROWS AS rows_est, DATA_LENGTH AS data_len, INDEX_LENGTH AS idx_len
     FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY DATA_LENGTH DESC`,
);

console.log("  table                     rows(est)   data        index");
let totalData = 0, totalIdx = 0;
for (const t of tables) {
  totalData += Number(t.data_len || 0);
  totalIdx += Number(t.idx_len || 0);
  console.log(`  ${t.t.padEnd(24)} ${String(t.rows_est ?? "?").padStart(9)}  ${mb(t.data_len)} ${mb(t.idx_len)}`);
}
console.log(`  ${"".padEnd(24)} ${"".padStart(9)}  ${mb(totalData)} ${mb(totalIdx)}   <- information_schema estimate`);

/* Exact counts. TABLE_ROWS above is an estimate and can be wildly off. */
console.log("\n  exact row counts");
for (const t of tables) {
  const [[r]] = await c.query(`SELECT COUNT(*) AS n FROM \`${t.t}\``);
  console.log(`  ${t.t.padEnd(24)} ${String(r.n).padStart(9)}`);
}

const [[hasFiles]] = await c.query(
  `SELECT COUNT(*) AS n FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'files'`,
);
if (hasFiles.n) {
  console.log("\n  files table, by kind (byte_size summed directly — exact)");
  const [kinds] = await c.query(
    `SELECT kind, COUNT(*) AS n, SUM(byte_size) AS bytes, MAX(byte_size) AS biggest,
            SUM(LENGTH(data)) AS actual
       FROM files GROUP BY kind ORDER BY bytes DESC`,
  );
  if (kinds.length === 0) console.log("  (no rows)");
  for (const k of kinds) {
    console.log(
      `  ${String(k.kind).padEnd(10)} ${String(k.n).padStart(5)} files  declared ${mb(k.bytes)}  stored ${mb(k.actual)}  largest ${mb(k.biggest)}`,
    );
  }
}

await c.end();
