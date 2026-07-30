import "server-only";
import mysql from "mysql2/promise";

/* MySQL connection pool for the FreeHostia database.

   SERVER ONLY. The `server-only` import above turns any accidental import from
   a client component into a build error rather than a leaked password.

   Why a pool, and why such a small one: each serverless invocation that runs
   cold opens its own pool, and shared hosting caps concurrent connections far
   lower than a dedicated server. A large pool per instance multiplied by
   however many instances Vercel spins up will exhaust that cap and start
   throwing ER_CON_COUNT_ERROR. Keep MYSQL_POOL_SIZE small; raise it only if you
   know the server's max_connections and have headroom. */

declare global {
  // Reused across hot reloads in dev and warm invocations in prod, so we don't
  // leak a new pool on every request.
  var __jobfolderPool: mysql.Pool | undefined;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to .env.local (and to the Vercel project's environment variables before deploying).`,
    );
  }
  return value;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host: required("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: required("MYSQL_DATABASE"),
    user: required("MYSQL_USER"),
    password: required("MYSQL_PASSWORD"),

    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE ?? 3),
    maxIdle: 1,
    // Shared hosts drop idle connections aggressively; retiring ours first
    // avoids handing a dead socket to a query.
    idleTimeout: 30_000,
    enableKeepAlive: true,
    connectTimeout: 15_000,

    // DATETIME columns come back as strings rather than JS Dates in the
    // server's timezone, so a value is never silently shifted in transit.
    dateStrings: true,
    timezone: "Z",

    /* VERIFIED 2026-07-30: mysql.freehostia.com answers
       HANDSHAKE_NO_SSL_SUPPORT — the server does not offer TLS at all, so this
       currently always resolves to an unencrypted connection. Every query
       therefore sends the password and any candidate data across the public
       internet in plaintext. Kept as a flag so flipping MYSQL_SSL is all that's
       needed if the database ever moves to a host that supports it. */
    ...(process.env.MYSQL_SSL === "true"
      ? { ssl: { rejectUnauthorized: true } }
      : {}),
  });
}

export function getPool(): mysql.Pool {
  if (!globalThis.__jobfolderPool) {
    const pool = createPool();

    /* This server's global sql_mode is only NO_ENGINE_SUBSTITUTION — it is NOT
       strict. Without strict mode MySQL "succeeds" on bad input by silently
       coercing it: an out-of-range INT is clamped to the column maximum and an
       overlong string is truncated, both with only a warning. That was already
       observed in practice — a salary of 11225879852654 migrated in as
       4294967295 with no error raised.

       Silent corruption of salary and commission figures is far worse than a
       failed write, so every pooled connection opts into strict mode for its
       own session. Global config is not ours to change on shared hosting. */
    pool.on("connection", (conn) => {
      conn.query(
        "SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'",
      );
    });

    globalThis.__jobfolderPool = pool;
  }
  return globalThis.__jobfolderPool;
}

/* What a prepared statement will accept. Deliberately narrow: an arbitrary
   object reaching a query is almost always a bug (a whole row passed where one
   column was meant), and this catches it at compile time. */
export type SqlParam = string | number | boolean | Date | Buffer | null;

/** Run a SELECT. Always pass values via `params` — never interpolate into SQL. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params);
  return rows as T[];
}

/** Run a SELECT expected to match at most one row. */
export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params: SqlParam[] = [],
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Run an INSERT/UPDATE/DELETE. */
export async function execute(
  sql: string,
  params: SqlParam[] = [],
): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().execute(sql, params);
  return result as mysql.ResultSetHeader;
}

/** Run several statements atomically on a single connection. */
export async function transaction<T>(
  fn: (conn: mysql.PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}
