-- Add SAVED status as the new default for new applications.
-- Existing rows keep their current status.

-- SQLite doesn't support ALTER COLUMN DEFAULT directly, but the default
-- is only used by raw SQL inserts. The app always sets the status explicitly
-- via JPA, so we just need to ensure the column accepts 'SAVED' values,
-- which it already does (it's a TEXT column, not an enum).
-- This migration exists as documentation of the change.
