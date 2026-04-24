CREATE TABLE applications (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  company          TEXT    NOT NULL,
  position         TEXT    NOT NULL,
  location         TEXT,
  url              TEXT    NOT NULL,
  source           TEXT    NOT NULL,
  external_job_id  TEXT,
  status           TEXT    NOT NULL DEFAULT 'APPLIED',
  notes            TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, external_job_id)
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_updated_at ON applications(updated_at DESC);
