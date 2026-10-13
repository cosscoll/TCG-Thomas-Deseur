import test from 'node:test';
import assert from 'node:assert/strict';
import {seededRandom,oneBooster,run,renderReport} from '../scripts/simuler-boosters-67.mjs';
test('same seed yields same random sequence and first booster',()=>{
 const a=seededRandom(1),b=seededRandom(1);
 assert.deepEqual(Array.from({length:30},()=>a()),Array.from({length:30},()=>b()));
 assert.deepEqual(oneBooster(seededRandom(42)),oneBooster(seededRandom(42)));
});
test('first three always Common, slot4 Rare/Alternative, slot5 Rare or higher',()=>{
 const rng=seededRandom(914);
 for(let i=0;i<5000;i++){
  const p=oneBooster(rng);
  assert.equal(p.length,5);
  for(let j=0;j<3;j++)assert.equal(p[j].card.rarity,'Commune');
  assert.ok(p[3].alternative||p[3].card.rarity==='Rare');
  assert.ok(['Rare','Épique','Légendaire','Hors-série'].includes(p[4].card.rarity));
  assert.ok(p.every(x=>/^COST-[0-9]{3}$/.test(x.card.characterId)));
  assert.equal(p.some(x=>x.card.rarity==='secrete'),false);
 }
});
test('10,000 boosters are coherent; every simulated player can collect exactly 67 characters',()=>{
 const r=run({count:10000,cohorts:30,seed:324561});
 assert.deepEqual(r.slots.slice(0,3).map(s=>s.Commune),[10000,10000,10000]);
 assert.equal(r.slots[3].Rare+r.slots[3].alternative,10000);
 assert.equal(['Rare','Épique','Légendaire','Hors-série'].reduce((sum,key)=>sum+r.slots[4][key],0),10000);
 assert.equal(r.alternativeArtworks,38);
 assert.equal(r.distinctCharacters,67);
 assert.ok(r.completion.p10<=r.completion.median&&r.completion.median<=r.completion.p90);
 const text=renderReport(r);
 assert.match(text,/10 000|10 000/);
 assert.doesNotMatch(text,/contenu de la carte mystère/i);
});
