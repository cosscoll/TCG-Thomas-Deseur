import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const login = "floot-app/endpoints/auth/";
const root = "floot-app/endpoints/";

test("every JSON mutation reads a size-limited stream, rather than unbounded request.text", () => {
  for (const file of [
    login + "login_with_password_POST.ts",
    login + "register_with_password_POST.ts",
    login + "request_password_reset_POST.ts",
    login + "reset_password_POST.ts",
    root + "gift_create_POST.ts",
    root + "gift_redeem_POST.ts",
    root + "profile_POST.ts",
  ]) {
    const source = read(file);
    assert.match(source, /await tcgReadLimitedBody\(request\)/, file);
    assert.doesNotMatch(source, /await request\.text\(\)/, file);
    assert.match(source, /TcgRequestBodyError/, file);
  }
});

test("JSON reader enforces byte limit without trusting Content-Length", () => {
  const source = read("floot-app/helpers/tcgReadLimitedBody.tsx");
  assert.match(source, /maxBytes = 16_384/);
  assert.match(source, /getReader\(\)/);
  assert.match(source, /bytes \+= chunk\.value\.byteLength/);
  assert.match(source, /bytes > maxBytes/);
  assert.match(source, /reader\.cancel\(\)/);
  assert.match(source, /TextDecoder\("utf-8", \{ fatal: true \}\)/);
  assert.match(source, /TcgRequestBodyError\(413/);
});

test("CSRF guard rejects both invalid origin and invalid Content-Length", () => {
  const source = read("floot-app/helpers/tcgMutationGuard.tsx");
  assert.match(source, /sec-fetch-site/);
  assert.match(source, /request\.headers\.get\("origin"\)/);
  assert.match(source, /!Number\.isSafeInteger\(length\)/);
  assert.match(source, /length > 16384/);
});

test("gift administration uses parameterized JSONB instead of SQL string concatenation", () => {
  const source = read(root + "gift_create_POST.ts");
  assert.doesNotMatch(source, /sql\.raw\(/);
  assert.match(source, /rewards,\s*maxUses/);
  assert.match(source, /user\.role\s*!==\s*'admin'/);
});

test("logout never includes raw exception details and auth errors are not cacheable", () => {
  const logout = read(login + "logout_POST.ts");
  assert.doesNotMatch(logout, /error instanceof Error \? error\.message/);
  assert.match(logout, /Cache-Control/);
  for (const path of [
    login + "request_password_reset_POST.ts",
    login + "reset_password_POST.ts"
  ]) {
    assert.match(read(path), /"Cache-Control": "private, no-store"/);
  }
});

test("gift JSONB persistence uses object/array params rather than pre-serialized strings", () => {
  const created=read(root+"gift_create_POST.ts");
  const redeemed=read(root+"gift_redeem_POST.ts");
  assert.match(created,/rewards,\s*maxUses/);
  assert.match(redeemed,/rules\}\)\.execute\(\)/);
  assert.doesNotMatch(created,/JSON\.stringify\(rewards\)/);
  assert.doesNotMatch(redeemed,/JSON\.stringify\(rules\)/);
});
