-- B24 Blood Bank — Initial Migration
-- All tables use b24_bb_ prefix (shared DB convention)

-- Moderators & Admins
CREATE TABLE IF NOT EXISTS b24_bb_users (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT UNIQUE NOT NULL,
  password   TEXT NOT NULL,
  role       TEXT NOT NULL CHECK(role IN ('admin', 'moderator')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Hostel Students
CREATE TABLE IF NOT EXISTS b24_bb_students (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  blood_group     TEXT NOT NULL CHECK(blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  batch           TEXT NOT NULL,
  phone           TEXT,
  room_number     TEXT,
  last_donated_at INTEGER,
  is_active       INTEGER NOT NULL DEFAULT 1,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL
);

-- Donation Logs
CREATE TABLE IF NOT EXISTS b24_bb_donation_logs (
  id         TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES b24_bb_students(id),
  donated_at INTEGER NOT NULL,
  note       TEXT,
  logged_by  TEXT NOT NULL REFERENCES b24_bb_users(id),
  created_at INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_students_blood_group ON b24_bb_students(blood_group);
CREATE INDEX IF NOT EXISTS idx_students_batch ON b24_bb_students(batch);
CREATE INDEX IF NOT EXISTS idx_students_active ON b24_bb_students(is_active);
CREATE INDEX IF NOT EXISTS idx_donation_logs_student ON b24_bb_donation_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_donation_logs_donated_at ON b24_bb_donation_logs(donated_at);
