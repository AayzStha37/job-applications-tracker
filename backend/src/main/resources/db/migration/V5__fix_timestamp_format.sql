-- Convert epoch-millis timestamps to 'yyyy-MM-dd HH:mm:ss.SSS' format.
-- SQLite datetime() with 'unixepoch' expects seconds, so divide by 1000.
-- Only convert rows where the value looks like a bare number (epoch millis).

UPDATE applications
SET created_at = strftime('%Y-%m-%d %H:%M:%f', created_at / 1000, 'unixepoch')
WHERE typeof(created_at) = 'integer' OR created_at GLOB '[0-9]*';

UPDATE applications
SET updated_at = strftime('%Y-%m-%d %H:%M:%f', updated_at / 1000, 'unixepoch')
WHERE typeof(updated_at) = 'integer' OR updated_at GLOB '[0-9]*';

UPDATE applications
SET status_changed_at = strftime('%Y-%m-%d %H:%M:%f', status_changed_at / 1000, 'unixepoch')
WHERE status_changed_at IS NOT NULL
  AND (typeof(status_changed_at) = 'integer' OR status_changed_at GLOB '[0-9]*');
