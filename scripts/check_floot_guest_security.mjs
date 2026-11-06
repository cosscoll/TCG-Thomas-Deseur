/**
 * Anonymous-only production checks, with zero third-party dependencies.
 *
 * Does not authenticate, read real collections, create accounts, or
 * request an authorized booster. Two 401 POSTs should not mutate a player.
 * Run with: node --test scripts/check_floot_guest_security.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const baseURL = process.env.TCG_FLOOT_URL ?? 'https://tcg-thomas-deseur.floot.app';
const PRIVATE = new Set([
  'email','password','passwordhash','token','accesstoken','refreshtoken',
  'jwt','cookie','cookies','userid','displayname','cardid','inventory',
  'owned','drawn','history','profile','cards','sessionid','authsession',
]);
const cases = [
  { method: 'GET', path: '/_api/collection' },
  { method: 'GET', path: '/_api/auth/session' },
  { method: 'POST', path: '/_api/booster' },
  { method: 'POST', path: '/_api/completion' },
  { method: 'POST', path: '/_api/profile' },
  { method: 'POST', path: '/_api/gift_create' },
  { method: 'POST', path: '/_api/gift_redeem' },
];
const normalized = value => String(value).toLowerCase().replace(/[^a-z0-9]/g,'');
export function findPrivateField(value, prefix='') {
  if (Array.isArray(value)) {
    for (let i=0;i<value.length;i++) {
      const found = findPrivateField(value[i],prefix+`[${i}]`);
      if (found) return found;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key,child] of Object.entries(value)) {
      const path = prefix ? prefix+'.'+key : key;
      if (PRIVATE.has(normalized(key))) return path;
      const found = findPrivateField(child,path);
      if (found) return found;
    }
  }
  return null;
}

// These local tests establish the scanner will not silently miss nested secrets.
test('scanner detects personal fields nested in response metadata',()=>{
  assert.equal(findPrivateField({meta:{json:{user_id:'not-a-real-id'}}}), 'meta.json.user_id');
  assert.equal(findPrivateField({json:[{error:'denied'},{authSession:{}}]}),'json[1].authSession');
  assert.equal(findPrivateField({json:{error:'Access denied'}}),null);
});
test('scanner does not print private field values',()=>{
  assert.equal(findPrivateField({details:{access_token:'sensitive-placeholder'}}),'details.access_token');
});

for (const {method,path} of cases) {
  test(`HTTP 401 attendu sans compte : ${method} ${path}`,{timeout:25000},async()=>{
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),20000);
    let response;
    try {
      response = await fetch(new URL(path,baseURL),{
        method,
        body: method === 'POST' ? '{}' : undefined,
        headers: method === 'POST' ? {'content-type':'application/json'} : undefined,
        redirect:'manual',
        cache:'no-store',
        signal:controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
    assert.equal(response.status,401,`${path} refused anonymous user`);
    assert.match(response.headers.get('content-type')??'',/application\/json/i);
    const text = await response.text();
    assert.ok(text.length < 1_000_000,'Unexpected response length');
    const data = JSON.parse(text);
    assert.equal(findPrivateField(data),null,'401 must not expose account fields');
    assert.doesNotMatch(text,/bearer\s+\S+|eyJ[A-Za-z0-9_-]{20,}/i);
    // Report non-sensitive policy metadata only.
    const cacheControl = response.headers.get('cache-control') ?? '(absent)';
    // Every private API denial must not be stored in a shared cache.
    // Prevent a CDN/shared proxy from caching a denial or later leaking a session.
    {
      assert.match(cacheControl,/\bprivate\b/i,`${path} must not be shared-cacheable`);
      assert.match(cacheControl,/\bno-store\b/i,`${path} must not be stored`);
    }
    console.log(JSON.stringify({path,status:response.status,cacheControl}));
  });
}

// These cross-site POST requests must fail before parsing bodies or changing state.
for (const path of [
  '/_api/auth/login_with_password',
  '/_api/auth/register_with_password',
  '/_api/auth/request_password_reset',
  '/_api/auth/reset_password',
  '/_api/auth/logout',
  '/_api/booster',
  '/_api/completion',
  '/_api/gift_create',
  '/_api/gift_redeem',
  '/_api/profile',
]) {
  test('Cross-origin POST rejected (no account, no write): '+path, {timeout:22000}, async()=>{
    const response=await fetch(new URL(path,baseURL),{method:'POST',
      headers:{'Content-Type':'application/json','Origin':'https://untrusted-origin.invalid','Sec-Fetch-Site':'cross-site'},
      body:'{}',cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(20000)});
    assert.equal(response.status,403,'Cross-origin mutations are not allowed');
    assert.match(response.headers.get('content-type')??'',/application\/json/i);
    assert.match(response.headers.get('cache-control')??'',/no-store/i);
    const body=await response.text();
    assert.ok(body.length<10000);
    assert.equal(findPrivateField(JSON.parse(body)),null);
  });
}

test('Public leaderboard leaks no private fields', {timeout:22000}, async()=>{
  const response=await fetch(new URL('/_api/leaderboard',baseURL),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-type')??'',/application\/json/i);
  const body=await response.text();
  assert.ok(body.length<1000000);
  const result=JSON.parse(body);const payload=result.json??result;
  assert.ok(Array.isArray(payload.players));
  assert.ok(Number.isSafeInteger(payload.totalPlayers));
  for(const player of payload.players){
    assert.deepEqual(Object.keys(player).sort(),['boosters','illustrations','rank','username']);
    assert.ok(Number.isInteger(player.rank));
    assert.equal(typeof player.username,'string');
  }
  assert.doesNotMatch(body,/"email"|"password"|"passwordHash"|"token"|"sessionId"/i);
});

test('Published site sends transport and browser hardening headers', {timeout:22000}, async()=>{
  const response=await fetch(new URL('/',baseURL),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(20000)});
  assert.equal(response.status,200);
  assert.match(response.headers.get('strict-transport-security')??'',/max-age=/i);
  assert.equal((response.headers.get('x-content-type-options')??'').toLowerCase(),'nosniff');
  assert.match(response.headers.get('content-security-policy')??'',/default-src/i);
});

test('No raw backend files or credentials are publicly served', {timeout:22000}, async()=>{
  const targets=['/.env','/.git/config','/floot-app/helpers/db.tsx','/supabase/VERIFIER_INSTALLATION.sql'];
  for(const path of targets){
    const response=await fetch(new URL(path,baseURL),{cache:'no-store',redirect:'manual',signal:AbortSignal.timeout(20000)});
    const text=await response.text();
    assert.doesNotMatch(text,/FLOOT_DATABASE_URL|JWT_SECRET|SERVICE_ROLE_KEY|BEGIN (?:RSA |EC )?PRIVATE KEY/i);
    if(path==='/.env'||path.startsWith('/.git/'))assert.equal(response.status,404);
  }
});
