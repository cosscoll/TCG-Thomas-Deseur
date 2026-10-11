import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';

const manifest=JSON.parse(readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
const decisions=JSON.parse(readFileSync(new URL('../data/choix-cartes-2026-10-11.json',import.meta.url),'utf8'));
const byArt=new Map(CARD_PHOTO_PAIRS_160.map(p=>[p.id,p]));
test('approved catalogue is a strict derivation of reviewed decisions',()=>{
 assert.equal(manifest.schema,'tcg-deseur-approved-catalogue-v1');
 assert.equal(manifest.summary.cards,67);
 assert.equal(manifest.summary.existingVariants,38);
 assert.equal(manifest.summary.excludedGroups,3);
 assert.equal(manifest.summary.usedArtworks,105);
 assert.equal(manifest.cards.length,67);
 assert.equal(manifest.savedAt,decisions.savedAt);
 const ids=manifest.cards.map(c=>c.id);
 assert.equal(new Set(ids).size,67);
 assert.deepEqual(ids,[...ids].sort());
 assert.deepEqual(manifest.excludedGroups,['COST-048','COST-063','COST-069']);
 const usedArt=new Set();
 for(const c of manifest.cards){
  const raw=decisions.cards[c.id];
  assert.equal(raw.status,'Validée');
  assert.equal(c.name,raw.name);
  assert.equal(c.main.artworkId,raw.primary);
  assert.deepEqual(c.variants.map(v=>v.artworkId),raw.alternatives);
  for(const entry of [c.main,...c.variants]){
   assert.ok(!usedArt.has(entry.artworkId),'Repeated artwork: '+entry.artworkId);
   usedArt.add(entry.artworkId);
   const pair=byArt.get(entry.artworkId);
   assert.ok(pair,'Missing old artwork id: '+entry.artworkId);
   assert.equal(pair.groupId,c.id);
   assert.equal(entry.asset,'collection-161/assets/cards/'+pair.illustration);
   assert.equal(entry.photoReference,pair.sourceReference);
   assert.ok(existsSync(new URL('../'+entry.asset,import.meta.url)),entry.asset);
  }
 }
 assert.equal(usedArt.size,105);
});
test('no user account, roles, rarity or pack entitlement are added to static manifest',()=>{
 const src=JSON.stringify(manifest);
 for(const word of ['userId','email','password','entitlement','granted','token','accountId','rarity','rewardIdentity']){
  assert.ok(!Object.prototype.hasOwnProperty.call(manifest,word));
  for(const card of manifest.cards)assert.ok(!Object.prototype.hasOwnProperty.call(card,word));
 }
 assert.equal(manifest.cards.find(c=>c.id==='COST-003').name,'Picasso Deseur');
});
