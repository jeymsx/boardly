-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS subjects (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  color       text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS topics (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id  uuid        NOT NULL,   -- no FK to subjects (local-first pattern)
  name        text        NOT NULL,
  total_reads integer     NOT NULL DEFAULT 3,
  reads       jsonb       NOT NULL DEFAULT '[]',
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id                uuid        PRIMARY KEY,
  user_id           uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date              text        NOT NULL,
  subject_id        uuid,
  topic_label       text        NOT NULL,
  attendance_status text        NOT NULL DEFAULT 'pending',
  reviews           jsonb       NOT NULL DEFAULT '[]',
  total_reviews     integer     NOT NULL DEFAULT 0,
  notes             text,
  notes_link        text,
  weekly_test       jsonb,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS mastery_tests (
  id              uuid        PRIMARY KEY,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  subject_id      uuid,
  subject_enabled boolean     NOT NULL DEFAULT true,
  topic_label     text,
  topic_id        uuid,
  target_score    numeric     NOT NULL DEFAULT 75,
  link            text,
  scores          jsonb       NOT NULL DEFAULT '[]',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  date        text        NOT NULL,
  subject_id  uuid,
  topic_label text,
  notes       text,
  color       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_settings (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  data       jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ── Row-Level Security ────────────────────────────────────────────────────────

ALTER TABLE subjects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_tests   ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings   ENABLE ROW LEVEL SECURITY;

-- Each user can only see and modify their own rows.
CREATE POLICY "own_subjects"  ON subjects        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_topics"    ON topics          FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_sessions"  ON sessions        FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_tests"     ON mastery_tests   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_events"    ON calendar_events FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_settings"  ON user_settings   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Fix sessions table (missing columns)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS subject_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]';

-- Fix mastery_tests table (missing tags column)
ALTER TABLE mastery_tests ADD COLUMN IF NOT EXISTS tags jsonb NOT NULL DEFAULT '[]';

-- Create session tags table
CREATE TABLE IF NOT EXISTS tags (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tags" ON tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create test tags table
CREATE TABLE IF NOT EXISTS test_tags (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_test_tags" ON test_tags FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id          uuid        PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text        NOT NULL,
  url         text        NOT NULL,
  icon        text,
  pinned      boolean     NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_bookmarks" ON bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
