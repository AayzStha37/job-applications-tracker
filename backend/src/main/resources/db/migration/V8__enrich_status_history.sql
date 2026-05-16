-- Enrich status_history so that APPLIED is recorded as the entry point for every non-SAVED app.
--
-- Background: V7 backfilled one history row per app (NULL -> current_status). For apps that were
-- imported directly into a downstream state (e.g. REJECTED), this leaves the Sankey diagram with
-- no APPLIED record, and getTransitions() drops them entirely. APPLIED should be the superset:
-- every application has, by definition, been applied to.
--
-- Strategy: identify apps whose status_history has exactly one row AND whose to_status is neither
-- SAVED nor APPLIED. Replace that single row with two rows:
--   1) NULL    -> APPLIED         at created_at
--   2) APPLIED -> current_status  at COALESCE(status_changed_at, created_at + 1s)
--
-- Apps whose single record is NULL -> APPLIED or NULL -> SAVED are correct as-is.
-- Apps with multiple history rows are user-managed and we leave them alone.

-- 1) Snapshot the apps we need to fix into a temp table.
CREATE TEMP TABLE _v8_fix AS
SELECT
    a.id              AS app_id,
    a.status          AS curr_status,
    a.created_at      AS created_at,
    COALESCE(a.status_changed_at, datetime(a.created_at, '+1 second')) AS transition_at
FROM applications a
WHERE a.status NOT IN ('SAVED', 'APPLIED')
  AND (
      SELECT COUNT(*) FROM status_history sh WHERE sh.application_id = a.id
  ) = 1
  AND (
      SELECT sh.to_status FROM status_history sh
      WHERE sh.application_id = a.id
      LIMIT 1
  ) = a.status
  AND (
      SELECT sh.from_status FROM status_history sh
      WHERE sh.application_id = a.id
      LIMIT 1
  ) IS NULL;

-- 2) Drop the lone (incorrect) backfill row for those apps.
DELETE FROM status_history
WHERE application_id IN (SELECT app_id FROM _v8_fix);

-- 3) Insert the synthetic NULL -> APPLIED entry at created_at.
INSERT INTO status_history (application_id, from_status, to_status, changed_at)
SELECT app_id, NULL, 'APPLIED', created_at FROM _v8_fix;

-- 4) Insert the APPLIED -> current_status entry at the (possibly nudged) transition timestamp.
INSERT INTO status_history (application_id, from_status, to_status, changed_at)
SELECT app_id, 'APPLIED', curr_status, transition_at FROM _v8_fix;

DROP TABLE _v8_fix;
