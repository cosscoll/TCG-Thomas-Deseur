import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';

const raw=readFileSync(new URL('../data/choix-cartes-2026-10-11.json',import.meta.url),'utf8');
const data=JSON.parse(raw);
const arts=new Map(CARD_PHOTO_PAIRS_160.map(c=>[c.id,c]));
const accepted=Object.entries(data.cards).filter(([,c])=>c.status==='Validée');
const excluded=Object.entries(data.cards).filter(([,c])=>c.status==='Écartée');
const script=readFileSync(new URL('../collection-validee/app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../collection-validee/index.html',import.meta.url),'utf8');

test('final selections: Picasso Deseur is confirmed with precisely the chosen illustrations',()=>{
 assert.equal(data.schema,'tcg-deseur-cards-v3');
 const picasso=data.cards['COST-003'];
 assert.equal(picasso.status,'Validée');
 assert.equal(picasso.name,'Picasso Deseur');
 assert.equal(picasso.primary,'td_1_002');
 assert.deepEqual(picasso.alternatives,['td_2_042','td_3_042']);
});
test('the selection has 67 validated characters, 38 existing variants and 3 excluded groups',()=>{
 assert.equal(Object.keys(data.cards).length,70);
 assert.equal(accepted.length,67);
 assert.equal(excluded.length,3);
 assert.equal(accepted.reduce((sum,[,c])=>sum+c.alternatives.length,0),38);
 assert.equal(accepted.filter(([,c])=>c.shiny).length,0);
});
test('every approved illustration belongs to its chosen group and exists in the repository',()=>{
 const used=new Set();
 for(const [group,c] of accepted){
  assert.ok(c.name.trim(),group+' is missing a card name');
  assert.ok(c.primary,group+' is missing primary artwork');
  assert.equal(c.shiny,false,group+' has an unrendered Shiny');
  assert.equal(new Set([c.primary,...c.alternatives]).size,c.alternatives.length+1,group+' repeats the principal');
  for(const id of [c.primary,...c.alternatives]){
   const art=arts.get(id);
   assert.ok(art,group+' refers to an unknown illustration '+id);
   assert.equal(art.groupId,group);
   assert.ok(!used.has(id),'Illustration assigned to multiple groups: '+id);
   used.add(id);
   assert.ok(existsSync(new URL('../collection-161/assets/cards/'+art.illustration,import.meta.url)),'Missing stylized illustration: '+art.illustration);
  }
 }
 assert.equal(used.size,105);
});
test('the public approved gallery exposes names and variants without modifying a live inventory',()=>{
 assert.match(script,/choix-cartes-2026-10-11\.json/);
 assert.match(script,/CARD_PHOTO_PAIRS_160/);
 assert.match(script,/artSrc/);
 assert.match(script,/card\.alternatives\.length/);
 assert.doesNotMatch(script,/booster_POST|completion_POST|_api\/booster/);
 assert.match(html,/id="cards"/);
 assert.match(html,/id="filter"/);
 assert.ok(existsSync(new URL('../collection-validee/style.css',import.meta.url)));
});
