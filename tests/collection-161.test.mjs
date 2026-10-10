import test from "node:test";
import assert from "node:assert/strict";
import { CARDS_161, DAILY_BOOSTER_161, REQUIRED_FOR_CHEVELU, SECRET_CARD_ID, RARITIES_161 } from "../data/cards-161.js";
import { normalizeOwned161, getProgress161, assertSecretPackEligible,
  simulateNormalPack161, verifyNormalPack161, NORMAL_WEIGHTS_161,
  FIFTH_WEIGHTS_161 } from "../game/collection-161.js";

const complete = Object.fromEntries(REQUIRED_FOR_CHEVELU.map(id=>[id,1]));
const counts=Object.fromEntries(RARITIES_161.map(r=>[r.id,CARDS_161.filter(c=>c.rarity===r.id).length]));

test("catalogue 161 cartes dont 160 obtenables et une secrète",()=>{
  assert.equal(CARDS_161.length,161);
  assert.equal(DAILY_BOOSTER_161.length,160);
  assert.equal(REQUIRED_FOR_CHEVELU.length,160);
  assert.deepEqual(counts,{commune:95,rare:35,epique:18,legendaire:11,hors_serie:1,secrete:1});
  assert.equal(new Set(CARDS_161.map(c=>c.id)).size,161);
  assert.equal(new Set(CARDS_161.map(c=>c.reference)).size,161);
});
test("Chevelu jamais dans un booster quotidien",()=>{
  assert.ok(!DAILY_BOOSTER_161.some(c=>c.id===SECRET_CARD_ID));
  assert.ok(CARDS_161.find(c=>c.id===SECRET_CARD_ID)?.onlyFromSpecialBooster);
  for(let i=0;i<200;i++){
    const pack=simulateNormalPack161(Math.random);
    verifyNormalPack161(pack);
    assert.ok(pack.every(c=>c.id!==SECRET_CARD_ID));
    assert.notEqual(pack[4].rarity,"commune");
  }
});
test("un joueur qui possède 159 cartes, mais pas Lille, n'a pas Chevelu",()=>{
  const inventory={...complete};delete inventory.td_lille;
  const x=getProgress161(inventory);
  assert.equal(x.prerequisitesFound,159);
  assert.equal(x.prerequisitesMissing,1);
  assert.equal(x.secretPackEligible,false);
  assert.ok(x.missingPrerequisiteIds.includes("td_lille"));
  assert.throws(()=>assertSecretPackEligible(inventory),/incomplète/);
});
test("Chevelu débloqué uniquement lorsque les 160 autres cartes sont possédées",()=>{
  const x=getProgress161(complete);
  assert.equal(x.prerequisitesFound,160);
  assert.equal(x.secretPackEligible,true);
  assert.equal(x.hasSecret,false);
  assert.equal(x.found,160);
  assert.deepEqual(assertSecretPackEligible(complete),x);
});
test("Chevelu ajouté puis marqué distribué : jamais une deuxième fois",()=>{
  const inv={...complete,td_chevelu:1};
  const x=getProgress161(inv,{secretPackClaimed:true});
  assert.equal(x.found,161);
  assert.equal(x.secretPackEligible,false);
  assert.equal(x.secretPackAlreadyGranted,true);
  assert.throws(()=>assertSecretPackEligible(inv,{secretPackClaimed:true}),/déjà attribué/);
});
test("même si 160 cartes complètes : un flag claim interdit la seconde attribution",()=>{
  const x=getProgress161(complete,{secretPackClaimed:true});
  assert.equal(x.secretPackEligible,false);
  assert.throws(()=>assertSecretPackEligible(complete,{secretPackClaimed:true}),/déjà attribué/);
});
test("les 49 IDs historiques ne sont ni effacés ni reconvertis arbitrairement",()=>{
  const x=getProgress161({...complete,matelas:99,chemise:1,fontaine:10});
  assert.equal(x.prerequisitesFound,160);
  assert.equal(x.found,160);
  assert.equal(x.duplicates,0);
});
test("la progression utilise les copies, pas le nombre d'exemplaires",()=>{
  const x=getProgress161({td_1_001:100,td_1_002:7});
  assert.equal(x.found,2);
  assert.equal(x.duplicates,105);
  assert.equal(x.prerequisitesMissing,158);
});
test("une collection vide n'est pas éligible",()=>{
  const x=getProgress161({});
  assert.equal(x.total,161);
  assert.equal(x.found,0);
  assert.equal(x.secretPackEligible,false);
  assert.equal(x.prerequisitesMissing,160);
});
test("le pool quotidien inclut Lille pour ne pas rendre le secret impossible",()=>{
  assert.equal(DAILY_BOOSTER_161.find(c=>c.id==="td_lille")?.rarity,"hors_serie");
  assert.equal(NORMAL_WEIGHTS_161.hors_serie,2);
  assert.equal(Object.values(NORMAL_WEIGHTS_161).reduce((a,b)=>a+b,0),100);
  assert.equal(Object.values(FIFTH_WEIGHTS_161).reduce((a,b)=>a+b,0),45);
  assert.ok(!("secrete" in NORMAL_WEIGHTS_161));
});
test("tirages fabriqués refusés : carte secrète dans le booster normal",()=>{
  const valid=simulateNormalPack161(()=>0);
  assert.throws(()=>verifyNormalPack161([...valid.slice(0,4),SECRET_CARD_ID]),/Chevelu/);
  assert.throws(()=>verifyNormalPack161([SECRET_CARD_ID,...valid.slice(1)]),/Chevelu/);
  assert.throws(()=>verifyNormalPack161(valid.slice(0,4)),/cinq/);
  assert.throws(()=>verifyNormalPack161([valid[0],valid[0],valid[0],valid[0],valid[0]]),/Cinquième/);
});
test("quantités erronées rejetées, pas de récompenses à partir d'un faux inventaire",()=>{
  for(const val of [-1,1.5,Infinity,NaN,"7"])assert.throws(()=>normalizeOwned161({td_1_001:val}),/invalide/);
  assert.throws(()=>normalizeOwned161([{id:"td_1_001",quantity:1},{id:"td_1_001",quantity:1}]),/invalide/);
});
test("les cartes du PDF ne sont ni modifiées ni normalisées par le calcul",()=>{
  const before=JSON.stringify(CARDS_161);
  getProgress161({...complete,td_chevelu:1});
  simulateNormalPack161(()=>0.1);
  assert.equal(JSON.stringify(CARDS_161),before);
});
