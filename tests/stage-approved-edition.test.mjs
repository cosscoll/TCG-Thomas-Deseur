import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stageApprovedEdition} from '../scripts/stage-approved-edition.mjs';
import {CARDS as legacy} from '../data/cards.js';

const approved=JSON.parse(fs.readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
const clone=()=>structuredClone(approved);
const build=()=>stageApprovedEdition(approved);

test('prepares 67 distinct characters, 38 attached variants and exact public artwork URLs',()=>{
 const stage=build();
 assert.equal(stage.status,'NON_DÉPLOYABLE_AVANT_DÉCISIONS');
 assert.deepEqual(stage.edition,{characterCount:67,baseArtworks:67,variantArtworks:38,totalArtworks:105});
 assert.equal(stage.cards.length,67);
 assert.equal(stage.cards.filter(c=>c.variants.length===2).length,1);
 assert.equal(stage.cards.reduce((n,c)=>n+c.variants.length,0),38);
 for(const card of stage.cards){
  assert.equal(card.rarity,null);
  assert.equal(card.variantsCollectingRule,null);
  assert.ok(!Object.hasOwn(card,'legacyId'));
  assert.ok(!Object.hasOwn(card,'userId'));
  assert.match(card.main.imageUrl,/^https:\/\/cosscoll\.github\.io\/TCG-Thomas-Deseur\/collection-161\/assets\/cards\//);
  assert.ok(!legacy.some(c=>c.id===card.characterId));
 }
});
test('does not flatten variants into distinct gameplay cards or modify the input',()=>{
 const before=JSON.stringify(approved);
 const a=build(),b=build();
 assert.deepEqual(a,b);
 assert.equal(JSON.stringify(approved),before);
 assert.ok(Object.isFrozen(a));
 assert.ok(Object.isFrozen(a.cards[0]));
 assert.ok(Array.isArray(a.questionsPending));
 assert.deepEqual(a.questionsPending,['rarityPerCharacter','variantObtainingRule','variantCompletionEffect']);
});
test('rejects invented duplicate artwork or duplicate character identifiers',()=>{
 const altered=clone();
 altered.cards[1].main.artworkId=altered.cards[0].main.artworkId;
 assert.throws(()=>stageApprovedEdition(altered),/Visuel réutilisé/);
 const duplicate=clone();
 duplicate.cards[1].id=duplicate.cards[0].id;
 assert.throws(()=>stageApprovedEdition(duplicate),/Personnage en double/);
});
test('rejects artwork paths that escape the strictly approved directory',()=>{
 const altered=clone();
 altered.cards[0].main.asset='../private.jpg';
 assert.throws(()=>stageApprovedEdition(altered),/Lien illustration invalide/);
});
test('rejects collisions with legacy inventory IDs',()=>{
 assert.throws(()=>stageApprovedEdition(approved,{legacyIds:[...legacy.map(c=>c.id),approved.cards[0].id]}),/Collision/);
});
test('rejects extra characters or dropped variants instead of silently migrating',()=>{
 const altered=clone();
 altered.cards.pop();
 assert.throws(()=>stageApprovedEdition(altered),/67 cartes/);
 const changed=clone();
 changed.cards[0].variants=[];
 assert.throws(()=>stageApprovedEdition(changed),/105/);
});
