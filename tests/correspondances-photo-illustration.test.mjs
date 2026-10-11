import test from "node:test";
import assert from "node:assert/strict";
import {
 CARD_PHOTO_PAIRS_160, PRIMARY_PAIRS_69, DUPLICATE_PAIRS_91,
 PHOTO_REFS_WITHOUT_ILLUSTRATION_17, UNREPRESENTED_COSTUME_GROUPS
} from "../data/correspondances-photo-illustration.js";
import {PHOTO_ORIGINS_177} from "../data/photo-origins-177.js";
import {PUBLIC_CARDS_160} from "../data/public-cards-160.js";

test("une photo réelle différente pour chacune des 160 illustrations",()=>{
 assert.equal(CARD_PHOTO_PAIRS_160.length,160);
 assert.equal(new Set(CARD_PHOTO_PAIRS_160.map(p=>p.id)).size,160);
 assert.equal(new Set(CARD_PHOTO_PAIRS_160.map(p=>p.sourceReference)).size,160);
 assert.deepEqual(new Set(CARD_PHOTO_PAIRS_160.map(p=>p.id)),new Set(PUBLIC_CARDS_160.map(c=>c.id)));
 assert.ok(CARD_PHOTO_PAIRS_160.every(p=>PHOTO_ORIGINS_177[p.sourceReference]));
 assert.ok(CARD_PHOTO_PAIRS_160.every(p=>p.groupId===PHOTO_ORIGINS_177[p.sourceReference].groupId));
 assert.ok(!JSON.stringify(CARD_PHOTO_PAIRS_160).toLowerCase().includes("chevelu"));
});
test("les anciennes étiquettes étaient erronées pour 116 cartes",()=>{
 assert.equal(CARD_PHOTO_PAIRS_160.filter(p=>p.previousReference!==p.sourceReference).length,116);
 const find=id=>CARD_PHOTO_PAIRS_160.find(p=>p.id===id);
 assert.equal(find("td_1_001").sourceReference,"REF-1-002");
 assert.equal(find("td_1_004").sourceReference,"REF-1-001");
 assert.equal(find("td_2_001").sourceReference,"REF-2-002");
 assert.equal(find("td_2_003").sourceReference,"REF-2-001");
 assert.equal(find("td_3_003").sourceReference,"REF-3-004");
 assert.equal(find("td_3_004").sourceReference,"REF-3-003");
});
test("69 illustrations principales + 91 variantes, aucune suppression",()=>{
 assert.equal(PRIMARY_PAIRS_69.length,69);
 assert.equal(DUPLICATE_PAIRS_91.length,91);
 assert.equal(CARD_PHOTO_PAIRS_160.length,PRIMARY_PAIRS_69.length+DUPLICATE_PAIRS_91.length);
 const main=new Set(PRIMARY_PAIRS_69.map(p=>p.id));
 assert.equal(main.size,69);
 assert.equal(new Set(PRIMARY_PAIRS_69.map(p=>p.groupId)).size,69);
 assert.ok(DUPLICATE_PAIRS_91.every(p=>main.has(p.representativeId)));
});
test("17 photos sans rendu, dont tout le groupe COST-048",()=>{
 assert.equal(PHOTO_REFS_WITHOUT_ILLUSTRATION_17.length,17);
 assert.deepEqual(UNREPRESENTED_COSTUME_GROUPS,["COST-048"]);
 for(const ref of ["REF-1-048","REF-2-047","REF-3-013"]){
  assert.ok(PHOTO_REFS_WITHOUT_ILLUSTRATION_17.includes(ref));
 }
});
test("la source spéciale est une affiche, correspondance partielle signalée",()=>{
 const special=CARD_PHOTO_PAIRS_160.find(p=>p.id==="td_lille");
 assert.equal(special.sourceReference,"REF-177-LILLE");
 assert.equal(special.partialMatch,true);
});
