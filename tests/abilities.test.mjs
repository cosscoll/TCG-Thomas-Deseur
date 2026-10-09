import test from "node:test";
import assert from "node:assert/strict";
import { CARDS } from "../data/cards.js";
import { PILOT_CARD_IDS, PILOT_PROFILES } from "../game/card-profiles.js";
import { cardStats, createMatch, applyAction, validateDeck } from "../game/engine.js";

const allIds = CARDS.map(c => c.id);
function scenario(id, { enemyGuard = 0, enemyEnergy = 3, ownHp = null, ownGuard = 0, ownEnergy = 3, benchWounds = false } = {}) {
  const other = allIds.filter(x => x !== id);
  for (let seed = 1; seed <= 500; seed++) {
    const match = createMatch({ playerDeck:[id,...other.slice(0,7)], aiDeck:other.slice(7,15), seed });
    if (match.sides.player.active.id !== id) continue;
    match.sides.player.energy = ownEnergy;
    match.sides.player.guard = ownGuard;
    match.sides.ai.energy = enemyEnergy;
    match.sides.ai.guard = enemyGuard;
    // Prevent premature KO unless the test explicitly requires it.
    match.sides.ai.active.hp = cardStats(match.sides.ai.active.id).maxHp;
    if (ownHp !== null) match.sides.player.active.hp = ownHp;
    if (benchWounds) {
      match.sides.player.bench[0].hp = Math.max(1,match.sides.player.bench[0].hp-25);
    }
    return match;
  }
  throw new Error("No seeded match with active pilot card: "+id);
}
test("twelve authored cards are known, unique and have valid ability definitions", () => {
  assert.equal(PILOT_CARD_IDS.length,12);
  assert.equal(new Set(PILOT_CARD_IDS).size,12);
  for (const id of PILOT_CARD_IDS) {
    const card = cardStats(id);
    assert.equal(card.ability.name,PILOT_PROFILES[id].ability.name);
    assert.ok(card.ability.description.length>20);
    assert.ok(card.quick>0&&card.burst>card.quick&&card.maxHp>card.burst);
  }
});
test("all 49 cards remain playable; authored stats do not affect deck validation",()=>{
  for (const c of CARDS) assert.ok(cardStats(c.id).maxHp>0);
  assert.equal(validateDeck(PILOT_CARD_IDS.slice(0,8)).valid,true);
});
test("drain removes opponent energy but never goes negative",()=>{
  const state=scenario("standupper",{enemyEnergy:0});
  const next=applyAction(state,"player",{type:"burst"});
  assert.equal(next.sides.ai.energy,1); // next turn regeneration applies after the drain
});
test("mattress shielding and fountain healing respect caps",()=>{
  const shield=applyAction(scenario("matelas",{ownGuard:33}),"player",{type:"burst"});
  assert.equal(shield.sides.player.guard,35);
  const current=scenario("fontaine",{ownHp:60});
  const restored=applyAction(current,"player",{type:"burst"});
  assert.equal(restored.sides.player.active.hp,75);
});
test("unshielded bonus, pierce and guard break change actual damage",()=>{
  const plain=applyAction(scenario("etalon"),"player",{type:"burst"});
  const defended=applyAction(scenario("etalon",{enemyGuard:20}),"player",{type:"burst"});
  const foeStats=cardStats(plain.sides.ai.active.id);
  assert.equal(foeStats.maxHp-plain.sides.ai.active.hp,51);
  assert.equal(foeStats.maxHp-defended.sides.ai.active.hp,21);
  const pierce=applyAction(scenario("mouette",{enemyGuard:35}),"player",{type:"burst"});
  assert.equal(cardStats(pierce.sides.ai.active.id).maxHp-pierce.sides.ai.active.hp,20);
  const breakGuard=applyAction(scenario("chemise",{enemyGuard:35}),"player",{type:"burst"});
  assert.equal(cardStats(breakGuard.sides.ai.active.id).maxHp-breakGuard.sides.ai.active.hp,15);
});
test("fauxbras restores guard and extra energy",()=>{
  const s=scenario("fauxbras",{ownEnergy:3});
  const next=applyAction(s,"player",{type:"burst"});
  assert.equal(next.sides.player.energy,2);
  assert.equal(next.sides.player.guard,8);
});
test("costume heals only an injured reserve fighter",()=>{
  const s=scenario("costume",{benchWounds:true});
  const old=s.sides.player.bench[0].hp;
  const next=applyAction(s,"player",{type:"burst"});
  assert.equal(next.sides.player.bench[0].hp,old+17);
});
test("touriste conditional guard and arnaque energy steal respect turn regeneration",()=>{
  const s=scenario("touriste",{ownHp:30});
  assert.equal(applyAction(s,"player",{type:"burst"}).sides.player.guard,12);
  const arnaque=applyAction(scenario("arnaque",{enemyEnergy:3}),"player",{type:"burst"});
  assert.equal(arnaque.sides.ai.energy,3); // 3 - 1 + 1 on its turn
  assert.equal(arnaque.sides.player.energy,3); // 3 - 2 + 1 passive + 1 stolen
});
test("regent restores guard and hit points",()=>{
  const next=applyAction(scenario("regent",{ownHp:70}),"player",{type:"burst"});
  assert.equal(next.sides.player.guard,8);
  assert.equal(next.sides.player.active.hp,76);
});
test("rituels ability and tactician passive jointly restore 2 energy",()=>{
  const next=applyAction(scenario("rituels",{ownEnergy:3}),"player",{type:"burst"});
  assert.equal(next.sides.player.energy,3);
});
