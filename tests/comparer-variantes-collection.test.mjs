import test from 'node:test';
import assert from 'node:assert/strict';
import {compareVariants,markdown} from '../scripts/comparer-variantes-collection.mjs';
test('one simulation can distinguish 67 characters from 105 artwork identities',()=>{
 const r=compareVariants({cohorts:20,seed:47});
 assert.equal(r.cohorts,20);
 assert.ok(r.scenarios.characters67.median<r.scenarios.artworks105.median);
 assert.ok(r.scenarios.characters67.p10<=r.scenarios.characters67.median);
 assert.ok(r.scenarios.artworks105.p90>=r.scenarios.artworks105.median);
 assert.match(markdown(r),/Aucune modification de règle/);
});