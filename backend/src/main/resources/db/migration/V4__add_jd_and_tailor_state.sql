ALTER TABLE applications ADD COLUMN job_description   TEXT;
ALTER TABLE applications ADD COLUMN loc_code          TEXT;
ALTER TABLE applications ADD COLUMN mail_alias        TEXT NOT NULL DEFAULT 'email1';
ALTER TABLE applications ADD COLUMN tailor_status     TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE applications ADD COLUMN tailored_cv_path  TEXT;
ALTER TABLE applications ADD COLUMN tailor_error      TEXT;

CREATE INDEX idx_applications_tailor_status ON applications(tailor_status);

-- Backfill: rows that existed before this migration have no scraped JD and
-- were never queued for /tailor — flag them SKIPPED so the Kanban doesn't
-- show a stale "tailor: pending" badge on every legacy card.
UPDATE applications
   SET tailor_status = 'SKIPPED',
       tailor_error  = 'pre-V4 row, no JD captured'
 WHERE job_description IS NULL OR job_description = '';
