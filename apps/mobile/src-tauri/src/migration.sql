PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_snapshots (
  revision TEXT PRIMARY KEY NOT NULL,
  schema_version INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  published_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
  installed_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS one_current_snapshot
  ON content_snapshots(is_current) WHERE is_current = 1;

CREATE TABLE IF NOT EXISTS favorites (
  center_id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS news_state (
  news_id TEXT PRIMARY KEY NOT NULL,
  read_at TEXT,
  notified_at TEXT
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  request_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'sending', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT,
  last_error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS outbox_retry_idx ON outbox(status, next_attempt_at);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY NOT NULL,
  encrypted_payload BLOB NOT NULL,
  occurred_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  scheduled_at TEXT NOT NULL,
  notification_id INTEGER,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1))
);
