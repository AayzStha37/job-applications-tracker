CREATE TABLE status_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id  INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    from_status     TEXT,
    to_status       TEXT NOT NULL,
    changed_at      TEXT NOT NULL
);

CREATE INDEX idx_status_history_app_id ON status_history(application_id);
CREATE INDEX idx_status_history_transition ON status_history(from_status, to_status);

-- Backfill existing applications (NULL from_status = creation event)
INSERT INTO status_history (application_id, from_status, to_status, changed_at)
SELECT id, NULL, status, COALESCE(status_changed_at, created_at) FROM applications;
