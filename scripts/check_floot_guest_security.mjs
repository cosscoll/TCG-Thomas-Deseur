/**
 * Anonymous-only production checks, with zero third-party dependencies.
 *
 * Does not authenticate, read real collections, create accounts, or
 * request an authorized booster. Two 401 POSTs should not mutate a player.
 * Run with: node --test scripts/check_floot_guest_security.mjs
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const baseURL = process.env.TCG_FLOOT_URL ?? 'https://budget-illimite-tcg.floot.app';
const PRIVATE = new Set([
  'email','password','passwordhash','token','accesstoken','refreshtoken',
  'jwt','cookie','cookies','userid','displayname','cardid','inventory',
  'owned','drawn','history','profile','cards','sessionid','authsession',
]);
const cases = [
  { method: 'GET', path: '/_api/collection' },
  { method: 'GET', path: '/_api/auth/session' },
  { method: 'POST', path: '/_api/booster' },
  { method: 'POST', path: '/_api/profile' },
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
    console.log(JSON.stringify({path,status:response.status,cacheControl}));
  });
}
