-- Store progress summaries only; student answers, notes, and drawings stay in the browser.
CREATE TABLE IF NOT EXISTS progress_sessions (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  workbook_key TEXT NOT NULL CHECK (workbook_key IN ('arithmetic', 'year6', 'year7', 'year8', 'year9', 'year10', 'year11', 'year12', 'year13')),
  module_key TEXT NOT NULL,
  module_title TEXT NOT NULL,
  total_questions INTEGER NOT NULL CHECK (total_questions BETWEEN 1 AND 25),
  completed_questions INTEGER NOT NULL CHECK (completed_questions BETWEEN 0 AND total_questions),
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  elapsed_seconds INTEGER NOT NULL DEFAULT 0 CHECK (elapsed_seconds >= 0),
  stars INTEGER NOT NULL DEFAULT 0 CHECK (stars >= 0),
  topics_json TEXT NOT NULL DEFAULT '[]',
  last_activity INTEGER NOT NULL,
  PRIMARY KEY (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS progress_sessions_activity_idx ON progress_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS progress_sessions_workbook_idx ON progress_sessions(user_id, workbook_key, last_activity DESC);

-- Legacy under-age learner registrations must be linked to a parent before sign-in.
UPDATE users
SET account_type = 'child', active = 0, approval_status = 'pending', entitlements = '[]', requested_entitlements = '[]'
WHERE role = 'student'
  AND account_type = 'learner'
  AND date_of_birth <> ''
  AND date(date_of_birth, '+18 years') > date('now');
