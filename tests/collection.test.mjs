import test from "node:test";
import assert from "node:assert/strict";
import { CARDS } from "../data/cards.js";
import { emptyCollection, normalizeCollection, collectionStats, applyPack, openDemoPack, COLLECTION_HISTORY_MAX } from "../game/collection.js";

test("collection starts empty and correctly reports missing cards", () => {
  const state = emptyCollection();
  assert.deepEqual(collectionStats(state, CARDS), { unique: 0, total: 0, missing: 49, duplicates: 0, opened: 0, completion: 0 });
  assert.deepEqual(normalizeCollection(null, CARDS), state);
});
test("opening a demo booster grants five local cards with the last one rare+", () => {
  const result = openDemoPack(emptyCollection(), CARDS, () => 0);
  assert.equal(result.results.length, 5);
  assert.notEqual(result.results[4].rarity, "commune");
  assert.equal(result.state.opened, 1);
  assert.equal(collectionStats(result.state, CARDS).total, 5);
  assert.equal(result.results[0].newCard, true);
  assert.equal(result.results[1].newCard, false);
  assert.equal(result.results[4].newCard, true);
});
test("multiple openings accumulate copies and count duplicates correctly", () => {
  let state = emptyCollection();
  for (let i = 0; i < 8; i++) state = openDemoPack(state, CARDS, () => 0).state;
  const stats = collectionStats(state, CARDS);
  assert.equal(stats.total, 40);
  assert.equal(stats.unique, 2);
  assert.equal(stats.duplicates, 38);
  assert.equal(state.history.length, 8);
  assert.equal(normalizeCollection(JSON.parse(JSON.stringify(state)), CARDS).opened, 8);
});
test("malformed local records are rejected and cannot give cloud items", () => {
  const base = emptyCollection();
  for (const state of [
    {...base, opened: 1, copies: {}},
    {...base, opened: 0, copies: { fake: 5 }},
    {...base, opened: -1},
    {...base, copies: {"matelas": -4}},
    {...base, version: 900},
  ]) assert.deepEqual(normalizeCollection(state, CARDS), base);
});
test("booster validation rejects fabricated cards and invalid guaranteed slot", () => {
  const commons = CARDS.filter(c => c.rarity === "commune").slice(0, 5);
  assert.throws(() => applyPack(emptyCollection(), commons, CARDS), /cinquième/);
  assert.throws(() => applyPack(emptyCollection(), [{id:"fake",rarity:"secrete"},...commons.slice(0,4)], CARDS), /invalide/);
  assert.throws(() => applyPack(emptyCollection(), commons.slice(0,3), CARDS), /cinq/);
});
test("recent opening history is bounded to avoid growing forever", () => {
  let state=emptyCollection();
  for(let i=0;i<COLLECTION_HISTORY_MAX+8;i++) state=openDemoPack(state,CARDS,()=>0).state;
  assert.equal(state.history.length,COLLECTION_HISTORY_MAX);
  assert.equal(state.opened,COLLECTION_HISTORY_MAX+8);
});
