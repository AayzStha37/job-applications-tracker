-- The original UNIQUE(source, external_job_id) constraint treats all rows with the same
-- source and empty external_job_id as duplicates. Fix: recreate the table with no such
-- constraint, then add a partial unique index that only applies when external_job_id is present.

-- 1. Recreate table without the UNIQUE constraint
CREATE TABLE applications_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  company          TEXT    NOT NULL,
  position         TEXT    NOT NULL,
  location         TEXT,
  url              TEXT    NOT NULL,
  source           TEXT    NOT NULL,
  external_job_id  TEXT,
  status           TEXT    NOT NULL DEFAULT 'APPLIED',
  notes            TEXT,
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL,
  status_changed_at TEXT
);

INSERT INTO applications_new
    SELECT id, company, position, location, url, source, external_job_id,
           status, notes, created_at, updated_at, status_changed_at
    FROM applications;

DROP TABLE applications;
ALTER TABLE applications_new RENAME TO applications;

-- 2. Recreate indexes
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_updated_at ON applications(updated_at DESC);

-- 3. Partial unique index: only enforced when external_job_id is meaningful
CREATE UNIQUE INDEX uq_source_ext_id
    ON applications(source, external_job_id)
    WHERE external_job_id IS NOT NULL AND external_job_id != '';

-- 4. Unique on URL as fallback dedup
CREATE UNIQUE INDEX uq_url ON applications(url);
