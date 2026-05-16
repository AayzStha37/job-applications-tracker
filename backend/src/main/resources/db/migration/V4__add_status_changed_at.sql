-- Add status_changed_at column, defaulting to created_at for existing rows
ALTER TABLE applications ADD COLUMN status_changed_at TEXT;
UPDATE applications SET status_changed_at = created_at;
