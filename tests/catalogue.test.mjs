import test from "node:test";
import assert from "node:assert/strict";
import { CARDS, RARITIES } from "../data/cards.js";

test("49 cartes et identifiants uniques", () => {
  assert.equal(CARDS.length, 49);
  assert.equal(new Set(CARDS.map(card => card.id)).size, 49);
});
test("répartition conforme à l'archive source", () => {
  assert.deepEqual(Object.fromEntries(RARITIES.map(({ id }) =>
    [id, CARDS.filter(card => card.rarity === id).length])),
    { commune: 17, rare: 15, epique: 10, legendaire: 4, secrete: 3 });
});
test("seules Matelas et Fontaine possèdent une source vidéo confirmée", () => {
  const verified = CARDS.filter(card => card.verification === "source-video-confirmee");
  assert.deepEqual(verified.map(card => card.id).sort(), ["fontaine","matelas"]);
  assert.deepEqual(verified.map(card => card.sourceUrl).sort(), [
    "https://www.youtube.com/watch?v=X1MSeqV4ZUw",
    "https://www.youtube.com/watch?v=qfL_GCXtYCU"
  ].sort());
  for (const card of CARDS) {
    assert.equal(card.imageUrl, null, "aucune photo de carte publiée sans vérification");
    if (!verified.includes(card)) assert.equal(card.sourceUrl, null);
  }
});

test("identifiants valides et noms non vides", () => {
  for (const card of CARDS) {
    assert.match(card.id, /^[a-z0-9_]+$/);
    assert.ok(card.name.length > 0);
  }
});
