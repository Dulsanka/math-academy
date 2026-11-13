ALTER TABLE users ADD COLUMN account_type TEXT NOT NULL DEFAULT 'learner';
ALTER TABLE users ADD COLUMN parent_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN parent_enabled INTEGER NOT NULL DEFAULT 1 CHECK (parent_enabled IN (0, 1));
ALTER TABLE users ADD COLUMN admin_enabled INTEGER NOT NULL DEFAULT 1 CHECK (admin_enabled IN (0, 1));
ALTER TABLE users ADD COLUMN access_request_status TEXT NOT NULL DEFAULT 'none';

UPDATE users SET admin_enabled = CASE WHEN approval_status = 'pending' THEN 1 ELSE active END;

CREATE INDEX IF NOT EXISTS users_parent_id_idx ON users(parent_id);
