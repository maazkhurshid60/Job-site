-- JobFolder — MySQL 8.4 schema
--
-- Target: FreeHostia database `patnov13_jobfolder`, MySQL 8.4,
--         utf8mb4 / utf8mb4_0900_ai_ci.
--
-- Apply via phpMyAdmin (Import tab) or:
--   mysql -h <remote-host> -u patnov13_jobfolder -p patnov13_jobfolder < db/schema.sql
--
-- Verify afterwards with:  npm run db:check
--
-- Scope of the migration this supports: Firestore moves to SQL. Firebase Auth
-- and Firebase Storage STAY. That means:
--   * `users.uid` and `admins.uid` are Firebase Auth UIDs, not local accounts.
--     There is no password column here and there must never be one.
--   * `cv_url` / `photo_url` remain Firebase Storage download URLs.
--
-- IMPORTANT — primary keys are the existing Firestore document IDs, kept as
-- VARCHAR rather than switched to AUTO_INCREMENT. Job detail pages live at
-- /jobs/{id}; those URLs are in the sitemap and in the JobPosting structured
-- data. Renumbering the IDs would break every indexed job URL.
--
-- Charset note: utf8mb4 throughout. Candidate names and job descriptions
-- contain accented characters and the occasional emoji; utf8 (3-byte) would
-- silently truncate them.

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ---------------------------------------------------------------- users

-- Recruiters. One self-serve role; admins are a separate allow-list below,
-- mirroring the current `admins/{uid}` collection.
CREATE TABLE users (
  uid         VARCHAR(128) NOT NULL,
  name        VARCHAR(255) NOT NULL DEFAULT '',
  email       VARCHAR(320) NOT NULL DEFAULT '',
  phone       VARCHAR(64)  NOT NULL DEFAULT '',
  company     VARCHAR(255) NOT NULL DEFAULT '',
  headline    VARCHAR(255) NOT NULL DEFAULT '',
  location    VARCHAR(255) NOT NULL DEFAULT '',
  linkedin    VARCHAR(512) NOT NULL DEFAULT '',
  bio         TEXT,
  photo_url   VARCHAR(1024) NOT NULL DEFAULT '',
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                           ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (uid),
  KEY idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Admin allow-list. Membership alone grants console access, so writes to this
-- table must only ever happen from a trusted server context.
CREATE TABLE admins (
  uid        VARCHAR(128) NOT NULL,
  note       VARCHAR(255) NOT NULL DEFAULT '',
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------- jobs

CREATE TABLE jobs (
  id               VARCHAR(64)  NOT NULL,   -- preserved Firestore doc ID
  title            VARCHAR(255) NOT NULL,
  company          VARCHAR(255) NOT NULL DEFAULT '',
  category         VARCHAR(128) NOT NULL DEFAULT 'Other',
  location         VARCHAR(255) NOT NULL DEFAULT '',
  remote           BOOLEAN      NOT NULL DEFAULT FALSE,
  employment_type  ENUM('Full-time','Part-time','Contract','Temporary','Internship')
                                NOT NULL DEFAULT 'Full-time',
  salary_min       INT UNSIGNED NULL,
  salary_max       INT UNSIGNED NULL,
  bounty           INT UNSIGNED NULL,       -- recruiter referral commission
  description      MEDIUMTEXT,              -- the "Job Brief"
  responsibilities MEDIUMTEXT,
  requirements     MEDIUMTEXT,

  -- Ordered lists edited as a single unit in the admin wizard, never queried
  -- by element. JSON keeps them one row instead of three child tables.
  faqs                JSON,                 -- [{ question, answer }]
  screening_questions JSON,                 -- [string]
  hiring_stages       JSON,                 -- [string]

  status     ENUM('draft','open','closed') NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                         ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- The public board's only query: open roles, newest first.
  KEY idx_jobs_status_created (status, created_at DESC),
  KEY idx_jobs_category (category),
  -- Powers the ?q= search without a full scan once the board grows.
  FULLTEXT KEY ft_jobs_search (title, company, category, location, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------- submissions

-- A recruiter's referred candidate. job_title/company/bounty are deliberately
-- denormalised: they are a snapshot of the role as it stood at submission, and
-- must not change if the job is later edited. That is what the commission and
-- any dispute are settled against.
CREATE TABLE submissions (
  id              VARCHAR(64)  NOT NULL,
  job_id          VARCHAR(64)  NOT NULL,
  job_title       VARCHAR(255) NOT NULL DEFAULT '',
  company         VARCHAR(255) NOT NULL DEFAULT '',
  -- NULL for an open/public application. firestore.rules allows submissions
  -- with no login ("recruiterId: recruiter?.uid ?? ''"), so this cannot be
  -- NOT NULL or every public applicant would be rejected by the FK.
  recruiter_id    VARCHAR(128) NULL,
  recruiter_name  VARCHAR(255) NOT NULL DEFAULT 'Public applicant',
  candidate_name  VARCHAR(255) NOT NULL DEFAULT '',
  candidate_email VARCHAR(320) NOT NULL DEFAULT '',
  candidate_phone VARCHAR(64)  NOT NULL DEFAULT '',
  notes           MEDIUMTEXT,
  cv_url          VARCHAR(1024) NOT NULL DEFAULT '',
  cv_name         VARCHAR(255)  NOT NULL DEFAULT '',
  bounty          INT UNSIGNED NULL,
  status          ENUM('submitted','screening','approved','client_review','hired','rejected')
                               NOT NULL DEFAULT 'submitted',
  created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                               ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_subs_recruiter (recruiter_id, created_at DESC),
  KEY idx_subs_job (job_id),
  KEY idx_subs_status (status),

  -- Referral ownership is currently only a timestamp, with nothing preventing
  -- the same candidate being submitted twice for one role (see the recruiter
  -- FAQ wording). This makes first-submission-wins an actual database rule.
  -- Drop it if you'd rather keep resolving duplicates by hand.
  UNIQUE KEY uq_subs_job_candidate (job_id, candidate_email),

  CONSTRAINT fk_subs_job FOREIGN KEY (job_id)
    REFERENCES jobs (id) ON DELETE CASCADE,
  -- SET NULL, not RESTRICT: deleting a recruiter must not be blocked by, or
  -- destroy, the submission history the commission is settled against.
  CONSTRAINT fk_subs_recruiter FOREIGN KEY (recruiter_id)
    REFERENCES users (uid) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------- messages

-- Public contact-form enquiries. No FK: senders are anonymous visitors.
CREATE TABLE messages (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL DEFAULT '',
  email      VARCHAR(320) NOT NULL DEFAULT '',
  subject    VARCHAR(255) NOT NULL DEFAULT '',
  message    MEDIUMTEXT,
  handled    BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_messages_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ------------------------------------------------------------- settings

-- Replaces `settings/jobCategories`. Key/value so future admin-editable
-- settings don't each need a migration.
CREATE TABLE settings (
  setting_key VARCHAR(64) NOT NULL,
  value       JSON        NOT NULL,
  updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
                          ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed: the JOB_CATEGORIES fallback from lib/jobs.ts.
INSERT INTO settings (setting_key, value) VALUES (
  'jobCategories',
  JSON_ARRAY(
    'Civil Engineering','Transportation / DOT','Structural Engineering',
    'MEP Engineering','Electrical Engineering','Mechanical Engineering',
    'Water / Hydrology','CEI / Inspection','Project Management',
    'Architecture (AEC)','Software Engineering','AWS / DevOps',
    'Data Science','Information Technology','Government / Cleared',
    'DOD / Intelligence','Finance','Automotive','Electronics',
    'Executive','Other'
  )
);
