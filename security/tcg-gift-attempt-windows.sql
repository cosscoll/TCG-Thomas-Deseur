-- Floot migration applied on 2026-11-05. Safe to replay.
CREATE TABLE IF NOT EXISTS tcg_gift_attempt_windows (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT NOW()
);
