import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {selectApprovedSlot67,prepareApprovedBooster67,validateApprovedBoosterRules67} from "../game/booster-plan-67.js";
const config=JSON.parse(fs.readFileSync(new URL("../data/regles-booster-67.json",import.meta.url),"utf8"));
test("five slots exactly follow the creator's complete percentages",()=>{
 assert.equal(validateApprovedBoosterRules67(config),true);
 assert.equal(config.cardsPerBooster,5);
 for(const slot of config.slots){
  assert.equal(slot.outcomes.reduce((sum,o)=>sum+o.percentage,0),100);
 }
});
test("positions 1, 2, 3 always yield a common category, even on edge rolls",()=>{
 for(const pos of [1,2,3]){
  for(let roll=0;roll<100;roll++){
   const actual=selectApprovedSlot67(pos,roll);
   assert.equal(actual.kind,"rarity");
   assert.equal(actual.rarity,"Commune");
   assert.equal(actual.position,pos);
  }
 }
});
test("fourth slot is exactly 90 percent rare, 10 percent alternative",()=>{
 const labels=Array.from({length:100},(_,n)=>selectApprovedSlot67(4,n));
 assert.equal(labels.filter(x=>x.kind==="rarity"&&x.rarity==="Rare").length,90);
 assert.equal(labels.filter(x=>x.kind==="alternative").length,10);
 assert.equal(labels[89].rarity,"Rare");
 assert.equal(labels[90].kind,"alternative");
 assert.equal(labels[99].kind,"alternative");
 assert.ok(labels.filter(x=>x.kind==="alternative").every(x=>x.rarity===undefined));
});
test("fifth slot gives 80% rare, 17% epic, 2% legendary, 1% hors-série",()=>{
 const labels=Array.from({length:100},(_,n)=>selectApprovedSlot67(5,n));
 for(const [rarity,expected] of [["Rare",80],["Épique",17],["Légendaire",2],["Hors-série",1]]){
  assert.equal(labels.filter(x=>x.rarity===rarity).length,expected);
 }
 assert.equal(labels[79].rarity,"Rare");
 assert.equal(labels[80].rarity,"Épique");
 assert.equal(labels[96].rarity,"Épique");
 assert.equal(labels[97].rarity,"Légendaire");
 assert.equal(labels[98].rarity,"Légendaire");
 assert.equal(labels[99].rarity,"Hors-série");
});
test("one booster creates only five category choices, never a card, inventory, or entitlement",()=>{
 let index=0;
 const rolls=[44,56,97,91,99];
 const plan=prepareApprovedBooster67(max=>{
  assert.equal(max,100);
  return rolls[index++];
 });
 assert.equal(index,5);
 assert.deepEqual(plan.slice(0,3).map(x=>x.rarity),["Commune","Commune","Commune"]);
 assert.equal(plan[3].kind,"alternative");
 assert.equal(plan[4].rarity,"Hors-série");
 for(const x of plan){
  for(const key of ["cardId","imagePath","userId","quantity","inventory","claim"]){
   assert.equal(Object.hasOwn(x,key),false);
  }
 }
});
test("no Math.random fallback or invalid server roll",()=>{
 assert.throws(()=>prepareApprovedBooster67(),/serveur/);
 for(const roll of [-1,100,NaN,0.2,null,undefined]){
  assert.throws(()=>selectApprovedSlot67(5,roll),/Tirage aléatoire/);
 }
 for(const position of [0,6,2.4]){
  assert.throws(()=>selectApprovedSlot67(position,2),/Position impossible/);
 }
});
test("cannot swap an alternative into an unapproved slot or secretly alter odds",()=>{
 const invalid=structuredClone(config);
 invalid.slots[3].outcomes[0].percentage=91;
 invalid.slots[3].outcomes[1].percentage=9;
 assert.throws(()=>validateApprovedBoosterRules67(invalid),/choix du créateur/);
 invalid.slots[3].outcomes[0].percentage=90;
 invalid.slots[3].outcomes[1].percentage=10;
 invalid.slots[0].outcomes=[{kind:"alternative",percentage:100}];
 assert.throws(()=>validateApprovedBoosterRules67(invalid),/choix du créateur/);
});
test("the collection completion booster is outside the scope of these percentages",()=>{
 assert.equal(config.appliesTo,"ordinary-booster-only");
 assert.match(config.rewardBooster,/excluded/);
 assert.equal(config.alternativePolicy.drawOfSpecificAlternative,"pending");
 assert.equal(config.alternativePolicy.inventoryTreatment,"pending");
 assert.equal(config.alternativePolicy.completionTreatment,"pending");
});
