import { sql } from "kysely";
import { db } from "./db";
import superjson from "superjson";
import { tcgIpDigest } from "./tcgIpDigest";

/**
 * Database-backed, atomic limit. Deploy security/tcg-auth-ip-rate-windows.sql
 * BEFORE deploying endpoints that call this helper.
 * Limits count all requests, including failures and malformed requests.
 */
const policies = {
  register: { max: 8, seconds: 3600 },
  login: { max: 40, seconds: 900 },
  reset_request: { max: 8, seconds: 3600 },
  reset_attempt: { max: 20, seconds: 900 },
  redeem: { max: 30, seconds: 900 },
  gift_create: { max: 15, seconds: 900 },
} as const;

export async function tcgAuthRateLimit(
  request: Request,
  scope: keyof typeof policies
): Promise<Response | null> {
  const { max, seconds } = policies[scope];
  const digest = tcgIpDigest(request, scope);
  const result = await sql<{ attempts: number; window_started_at: Date | string }>`
    INSERT INTO tcg_auth_ip_rate_windows (scope, bucket_hash, attempts, window_started_at)
    VALUES (${scope}, ${digest}, 1, NOW())
    ON CONFLICT (scope, bucket_hash) DO UPDATE SET
      attempts = CASE
        WHEN tcg_auth_ip_rate_windows.window_started_at <= NOW() - (${seconds} * INTERVAL '1 second')
          THEN 1 ELSE tcg_auth_ip_rate_windows.attempts + 1 END,
      window_started_at = CASE
        WHEN tcg_auth_ip_rate_windows.window_started_at <= NOW() - (${seconds} * INTERVAL '1 second')
          THEN NOW() ELSE tcg_auth_ip_rate_windows.window_started_at END
    RETURNING attempts, window_started_at
  `.execute(db);
  if (Number(result.rows[0]?.attempts ?? max + 1) <= max) return null;
  const windowStarted = new Date(result.rows[0]?.window_started_at ?? Date.now()).getTime();
  const retrySeconds = Math.max(1, Math.ceil((windowStarted + seconds * 1000 - Date.now()) / 1000));
  return new Response(superjson.stringify({
    message: "Trop de demandes. Réessaie plus tard.",
  }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      "Retry-After": String(retrySeconds),
    },
  });
}
