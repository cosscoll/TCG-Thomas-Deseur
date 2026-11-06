import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL("../"+path, import.meta.url), "utf8");
const endpoints = {
  "auth/register_with_password_POST.ts":"register",
  "auth/login_with_password_POST.ts":"login",
  "auth/request_password_reset_POST.ts":"reset_request",
  "auth/reset_password_POST.ts":"reset_attempt",
  "gift_redeem_POST.ts":"redeem",
  "gift_create_POST.ts":"gift_create",
};
test("each sensitive endpoint has an IP abuse guard", () => {
  for (const [path, scope] of Object.entries(endpoints)) {
    const code=read("floot-app/endpoints/"+path);
    assert.match(code,/import \{tcgAuthRateLimit\}/,path);
    assert.ok(code.includes('tcgAuthRateLimit(request,"'+scope+'")'),path);
    assert.match(code,/if\(throttle\)return throttle;/,path);
  }
});
test("IP identifiers are generated with a keyed digest, not stored in plaintext", () => {
  const code=read("floot-app/helpers/tcgIpDigest.tsx");
  assert.match(code,/x-floot-client-ip/);
  assert.match(code,/createHmac\("sha256", key\)/);
  assert.doesNotMatch(code,/request\.headers\.get\(["']x-forwarded-for/i);
  assert.doesNotMatch(code,/request\.headers\.get\(["']cf-connecting-ip/i);
});
test("rate-limit counters are atomic across serverless workers", () => {
  const code=read("floot-app/helpers/tcgAuthRateLimit.tsx");
  assert.match(code,/INSERT INTO tcg_auth_ip_rate_windows/);
  assert.match(code,/ON CONFLICT \(scope, bucket_hash\) DO UPDATE SET/);
  assert.match(code,/RETURNING attempts, window_started_at/);
  assert.match(code,/status:\s*429/);
  assert.match(code,/Retry-After/);
  assert.match(code,/private, no-store/);
});
test("migration creates a dedicated non-personalized rate-limit table", () => {
  const sql=read("security/tcg-auth-ip-rate-windows.sql");
  assert.match(sql,/CREATE TABLE IF NOT EXISTS tcg_auth_ip_rate_windows/);
  assert.match(sql,/PRIMARY KEY \(scope, bucket_hash\)/);
  assert.match(sql,/bucket_hash char\(64\)/);
  assert.doesNotMatch(sql,/INSERT INTO users|UPDATE users|DELETE FROM users/i);
});
