/* One-off copy of existing Firestore data into MySQL.
 *
 *   node --env-file=.env.local scripts/migrate-firestore.mjs --dry-run
 *   node --env-file=.env.local scripts/migrate-firestore.mjs
 *
 * Reads with the Firebase *client* SDK using the same public config the browser
 * uses, so no service-account key is needed. That means firestore.rules still
 * apply, and `users`, `submissions` and `admins` are only readable by an admin.
 * Sign in with your admin account to copy those:
 *
 *   node --env-file=.env.local scripts/migrate-firestore.mjs \
 *     --email you@example.com --password 'yourpassword'
 *
 * Firestore document IDs are preserved. That is what keeps /jobs/{id} URLs —
 * already in the sitemap and the JobPosting structured data — working.
 *
 * Safe to re-run: every write is an upsert keyed on the original ID.
 */

import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import mysql from "mysql2/promise";
import { randomUUID } from "node:crypto";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const argValue = (name) => {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : undefined;
};

const firebase = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
const fs = getFirestore(firebase);

const email = argValue("--email");
const password = argValue("--password");
if (email && password) {
  await signInWithEmailAndPassword(getAuth(firebase), email, password);
  console.log(`  Signed in as ${email}\n`);
} else {
  console.log(
    "  Not signed in — only `jobs` and `settings` are publicly readable.\n" +
      "  Pass --email and --password to also copy users, submissions and admins.\n",
  );
}

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  connectTimeout: 15_000,
  ...(process.env.MYSQL_SSL === "true"
    ? { ssl: { rejectUnauthorized: true } }
    : {}),
});

/* The server is not in strict mode, so out-of-range numbers are clamped and
   long strings truncated with only a warning. Opt this session into strict mode
   so a value that will not fit fails loudly and gets reported per row, rather
   than landing silently corrupted. */
await conn.query("SET SESSION sql_mode = 'STRICT_ALL_TABLES,NO_ENGINE_SUBSTITUTION'");

/** Firestore Timestamp -> MySQL DATETIME(3) string, or null. */
const ts = (v) => {
  if (!v) return null;
  const d = typeof v?.toDate === "function" ? v.toDate() : new Date(v);
  return Number.isNaN(d?.getTime?.()) ? null : d.toISOString().slice(0, 23).replace("T", " ");
};
const s = (v, fallback = "") => (typeof v === "string" ? v : fallback);
const n = (v) => (typeof v === "number" && Number.isFinite(v) ? Math.trunc(v) : null);

/* Salary and commission columns are INT UNSIGNED, and the API caps them at
   100M. Firestore had no such constraint — one job carried a salaryMax of
   11225879852654. Under strict mode that now fails the whole INSERT, so clamp
   it here instead: keeping the job with a flagged salary beats dropping the
   job. Every clamp is reported so the bad values can be corrected by hand. */
const MAX_MONEY = 100_000_000;
const clamped = [];
const money = (v, field, id) => {
  const raw = n(v);
  if (raw === null) return null;
  const fixed = Math.min(Math.max(raw, 0), MAX_MONEY);
  if (fixed !== raw) clamped.push(`${id}.${field}: ${raw} -> ${fixed}`);
  return fixed;
};
const j = (v) => JSON.stringify(Array.isArray(v) ? v : []);

/** Read a collection, tolerating a permission-denied when signed out. */
async function read(name) {
  try {
    const snap = await getDocs(collection(fs, name));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.log(`  SKIP    ${name}: ${err.code || err.message}`);
    return null;
  }
}

const counts = {};

async function copy(label, rows, sql, toParams) {
  if (!rows) return;
  if (!rows.length) {
    console.log(`  ${label.padEnd(12)} 0 documents`);
    return;
  }
  if (dryRun) {
    console.log(`  ${label.padEnd(12)} ${rows.length} documents (dry run)`);
    counts[label] = rows.length;
    return;
  }
  let done = 0;
  for (const row of rows) {
    try {
      await conn.execute(sql, toParams(row));
      done += 1;
    } catch (err) {
      console.log(`  WARN    ${label} ${row.id}: ${err.code || err.message}`);
    }
  }
  console.log(`  ${label.padEnd(12)} ${done}/${rows.length} copied`);
  counts[label] = done;
}

try {
  console.log(dryRun ? "  DRY RUN — nothing will be written.\n" : "  Migrating...\n");

  /* Order matters: jobs and users must exist before submissions, which carry
     foreign keys to both. */

  await copy(
    "jobs",
    await read("jobs"),
    `INSERT INTO jobs
       (id,title,company,category,location,remote,employment_type,salary_min,
        salary_max,bounty,description,responsibilities,requirements,faqs,
        screening_questions,hiring_stages,status,created_at,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP(3)),COALESCE(?,CURRENT_TIMESTAMP(3)))
     ON DUPLICATE KEY UPDATE
       title=VALUES(title), company=VALUES(company), category=VALUES(category),
       location=VALUES(location), remote=VALUES(remote),
       employment_type=VALUES(employment_type), salary_min=VALUES(salary_min),
       salary_max=VALUES(salary_max), bounty=VALUES(bounty),
       description=VALUES(description), responsibilities=VALUES(responsibilities),
       requirements=VALUES(requirements), faqs=VALUES(faqs),
       screening_questions=VALUES(screening_questions),
       hiring_stages=VALUES(hiring_stages), status=VALUES(status)`,
    (r) => [
      r.id, s(r.title, "(untitled)"), s(r.company), s(r.category, "Other"),
      s(r.location), r.remote ? 1 : 0, s(r.employmentType, "Full-time"),
      money(r.salaryMin,"salaryMin",r.id), money(r.salaryMax,"salaryMax",r.id),
      money(r.bounty,"bounty",r.id), s(r.description),
      s(r.responsibilities), s(r.requirements), j(r.faqs),
      j(r.screeningQuestions), j(r.hiringStages), s(r.status, "draft"),
      ts(r.createdAt), ts(r.updatedAt),
    ],
  );

  await copy(
    "users",
    await read("users"),
    `INSERT INTO users
       (uid,name,email,phone,company,headline,location,linkedin,bio,photo_url,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP(3)))
     ON DUPLICATE KEY UPDATE
       name=VALUES(name), email=VALUES(email), phone=VALUES(phone),
       company=VALUES(company), headline=VALUES(headline),
       location=VALUES(location), linkedin=VALUES(linkedin), bio=VALUES(bio),
       photo_url=VALUES(photo_url)`,
    (r) => [
      r.id, s(r.name), s(r.email), s(r.phone), s(r.company), s(r.headline),
      s(r.location), s(r.linkedin), s(r.bio), s(r.photoURL), ts(r.createdAt),
    ],
  );

  await copy(
    "admins",
    await read("admins"),
    `INSERT INTO admins (uid,note,created_at)
     VALUES (?,?,COALESCE(?,CURRENT_TIMESTAMP(3)))
     ON DUPLICATE KEY UPDATE note=VALUES(note)`,
    (r) => [r.id, s(r.email, "migrated"), ts(r.createdAt)],
  );

  /* recruiter_id is NULLed when it is blank (a public application) or when it
     names a uid with no users row — the FK would otherwise reject the whole
     submission, and losing the candidate is worse than losing the attribution. */
  const knownUids = new Set(
    (await conn.query("SELECT uid FROM users"))[0].map((u) => u.uid),
  );

  /* Pull each CV down from its old Firebase Storage URL and store the bytes in
     the files table, so nothing is left behind in cloud storage. A CV that
     cannot be fetched leaves cv_file_id NULL rather than dropping the whole
     submission — the candidate's contact details still matter. */
  const submissionDocs = await read("submissions");
  if (submissionDocs && !dryRun) {
    for (const r of submissionDocs) {
      if (!r.cvUrl) continue;
      try {
        const res = await fetch(r.cvUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        const id = randomUUID();
        await conn.execute(
          `INSERT INTO files (id,kind,filename,content_type,byte_size,data,owner_uid)
           VALUES (?,'cv',?,?,?,?,?)`,
          [
            id,
            s(r.cvName, "cv.pdf"),
            res.headers.get("content-type") || "application/octet-stream",
            buf.length,
            buf,
            knownUids.has(r.recruiterId) ? r.recruiterId : null,
          ],
        );
        r.__cvFileId = id;
      } catch (err) {
        console.log(`  WARN    cv for submission ${r.id}: ${err.message}`);
      }
    }
  }

  await copy(
    "submissions",
    submissionDocs,
    `INSERT INTO submissions
       (id,job_id,job_title,company,recruiter_id,recruiter_name,candidate_name,
        candidate_email,candidate_phone,notes,cv_file_id,bounty,status,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP(3)))
     ON DUPLICATE KEY UPDATE
       status=VALUES(status), notes=VALUES(notes)`,
    (r) => [
      r.id, s(r.jobId), s(r.jobTitle), s(r.company),
      knownUids.has(r.recruiterId) ? r.recruiterId : null,
      s(r.recruiterName, "Public applicant"), s(r.candidateName),
      s(r.candidateEmail), s(r.candidatePhone), s(r.notes),
      r.__cvFileId ?? null, money(r.bounty,"bounty",r.id), s(r.status, "submitted"), ts(r.createdAt),
    ],
  );

  await copy(
    "messages",
    await read("messages"),
    `INSERT INTO messages (name,email,subject,message,created_at)
     VALUES (?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP(3)))`,
    (r) => [s(r.name), s(r.email), s(r.subject), s(r.message), ts(r.createdAt)],
  );

  // settings/jobCategories -> settings row
  const settings = await read("settings");
  if (settings) {
    const cats = settings.find((d) => d.id === "jobCategories");
    if (cats?.list?.length && !dryRun) {
      await conn.execute(
        `INSERT INTO settings (setting_key,value) VALUES ('jobCategories',CAST(? AS JSON))
         ON DUPLICATE KEY UPDATE value=VALUES(value)`,
        [JSON.stringify(cats.list)],
      );
      console.log(`  ${"settings".padEnd(12)} jobCategories (${cats.list.length})`);
    } else if (cats?.list?.length) {
      console.log(`  ${"settings".padEnd(12)} jobCategories (${cats.list.length}) (dry run)`);
    }
  }

  if (clamped.length) {
    console.log(`
  CLAMPED ${clamped.length} out-of-range value(s) — review these:`);
    for (const c of clamped) console.log(`          ${c}`);
  }

  console.log(
    dryRun
      ? "\n  Dry run complete. Re-run without --dry-run to write.\n"
      : "\n  Migration complete. Verify with: npm run db:check\n",
  );
} finally {
  await conn.end();
  process.exit(0);
}
