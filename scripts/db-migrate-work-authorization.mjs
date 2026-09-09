/* Records a candidate's right to work in the United States.
 *
 *   node --env-file=.env.local scripts/db-migrate-work-authorization.mjs
 *
 * Additive and idempotent — one VARCHAR column with a '' default, so the
 * submissions already in the table stay valid and readable.
 *
 * Why it is needed: a strong CV for a CTDOT resident-engineer role is still
 * a no if the role cannot sponsor and the candidate needs it. That was being
 * discovered on a call, or buried in a recruiter's free-text notes, or not
 * asked at all — after the CV had already been read.
 *
 * Why VARCHAR rather than ENUM: this codebase has been bitten twice by
 * needing a migration to add one ENUM value. The allowed codes live in
 * lib/workAuthorization.ts and are enforced at the API boundary, where
 * changing the list costs a deploy rather than a schema change.
 *
 * Why '' is allowed even though the field is required going forward: the two
 * submissions already in the table were made before anyone was asked, and ''
 * says exactly that. It is NOT the same as 'prefer_not_to_say', which is the
 * candidate's own answer. Collapsing those two would turn "we never asked"
 * into "they declined", which is a different fact about a real person.
 */

import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  ssl: process.env.MYSQL_SSL === "true" ? {} : undefined,
});

console.log(`Target: ${process.env.MYSQL_DATABASE} on ${process.env.MYSQL_HOST}\n`);

const [[existing]] = await db.query(
  `SELECT COUNT(*) AS n FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'submissions'
      AND COLUMN_NAME = 'work_authorization'`,
);

if (existing.n) {
  console.log("  work_authorization  already present, nothing to do");
} else {
  await db.execute(
    `ALTER TABLE submissions
       ADD COLUMN work_authorization VARCHAR(48) NOT NULL DEFAULT ''
       AFTER candidate_photo_url`,
  );
  console.log("  work_authorization  added");
}

const [[rows]] = await db.query("SELECT COUNT(*) AS n FROM submissions");
const [[blank]] = await db.query(
  "SELECT COUNT(*) AS n FROM submissions WHERE work_authorization = ''",
);
console.log(
  `\n  ${rows.n} submission(s); ${blank.n} predate the field and read as "Not provided".`,
);

await db.end();
