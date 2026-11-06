-- Migration additive et idempotente. Exécuter sur la base Floot TCG Deseur
-- AVANT de publier les endpoints qui appellent tcgAuthRateLimit.
-- Ne touche pas aux utilisateurs, inventaires, codes cadeaux ni boosters.
CREATE TABLE IF NOT EXISTS tcg_auth_ip_rate_windows (
  scope text NOT NULL CHECK (scope IN (
    'register','login','reset_request','reset_attempt','redeem','gift_create'
  )),
  bucket_hash char(64) NOT NULL CHECK (bucket_hash ~ '^[a-f0-9]{64}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  window_started_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (scope, bucket_hash)
);

CREATE INDEX IF NOT EXISTS tcg_auth_ip_rate_windows_started_at_idx
  ON tcg_auth_ip_rate_windows (window_started_at);
