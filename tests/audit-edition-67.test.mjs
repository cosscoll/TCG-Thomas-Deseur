import test from 'node:test';
import assert from 'node:assert/strict';
import {audit,csv,markdown} from '../scripts/audit-edition-67.mjs';
test('approved catalogue is fully attributed to 105 distinct photographic source refs and assets',()=>{
 const {rows,stats,counts}=audit();
 assert.deepEqual(counts,{characters:67,artworks:105,alternatives:38,sourceHashes:105,normalizedHashes:105,photographicReferences:105});
 assert.equal(rows.filter(x=>x.kind==='main').length,67);
 assert.equal(rows.filter(x=>x.kind==='variant').length,38);
 assert.equal(stats.Commune.characters,33);
 assert.equal(stats.Rare.characters,21);
 assert.equal(stats['Épique'].characters,8);
 assert.equal(stats['Légendaire'].characters,4);
 assert.equal(stats['Hors-série'].characters,1);
 for(const r of rows){
  assert.match(r.documentaryUrl,/^https:\/\//);
  assert.match(r.photoReference,/^REF-/);
  assert.match(r.originalImagePath,/\.webp$/);
  assert.match(r.finalImagePath,/^collection-validee\/assets\/uniform\//);
 }
 assert.ok(csv(rows).split('\n').length>=106);
 assert.match(markdown(audit()),/validation visuelle humaine/);
});
