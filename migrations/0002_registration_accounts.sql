ALTER TABLE users ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'approved';
ALTER TABLE users ADD COLUMN first_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN surname TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN email TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN email_key TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN date_of_birth TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN address TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN school_year TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN requested_entitlements TEXT NOT NULL DEFAULT '[]';
ALTER TABLE users ADD COLUMN parent_name TEXT NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN parent_email TEXT NOT NULL DEFAULT '';

UPDATE users SET email_key = lower(email) WHERE email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key_unique_idx ON users(email_key) WHERE email_key <> '';

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS password_resets_expiry_idx ON password_resets(expires_at);
