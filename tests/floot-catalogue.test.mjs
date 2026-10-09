import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../data/cards.js';
import { compareCatalogue } from '../scripts/compare_floot_catalogue.mjs';
const reference = CARDS.map(({id,rarity})=>({id,rarity}));

test('49 historical IDs and rarity pairs match',()=>{const r=compareCatalogue(reference);assert.equal(r.ok,true);assert.equal(r.expectedCount,49)});
test('a missing card is rejected',()=>{const r=compareCatalogue(reference.slice(1));assert.equal(r.ok,false);assert.deepEqual(r.missingIds,[reference[0].id])});
test('an extra ID is rejected',()=>{const r=compareCatalogue([...reference,{id:'invented',rarity:'rare'}]);assert.equal(r.ok,false);assert.deepEqual(r.unexpectedIds,['invented'])});
test('a rarity changed is rejected',()=>{const r=compareCatalogue(reference.map((x,i)=>i===0?{...x,rarity:'rare'}:x));assert.equal(r.ok,false);assert.equal(r.rarityMismatches.length,1)});
test('duplicate IDs are rejected',()=>{const r=compareCatalogue([...reference,reference[0]]);assert.equal(r.ok,false);assert.deepEqual(r.duplicates,[reference[0].id])});
test('a deliberately swapped ID is rejected',()=>{const r=compareCatalogue(reference.map((x,i)=>i===0?{...x,id:'unknown'}:x));assert.equal(r.ok,false);assert.equal(r.missingIds.length,1);assert.equal(r.unexpectedIds.length,1)});
test('private fields in input are refused',()=>assert.throws(()=>compareCatalogue([{id:'any',rarity:'rare',email:'secret@example.invalid'}]),/only id and rarity/));
test('non-array input is refused',()=>assert.throws(()=>compareCatalogue({cards:reference}),/JSON array/));
test('invalid rows are refused',()=>assert.throws(()=>compareCatalogue([null]),/only id and rarity/));
test('correct count but wrong IDs does not pass',()=>{const r=compareCatalogue([...reference.slice(1),{id:'invented',rarity:'rare'}]);assert.equal(r.receivedCount,49);assert.equal(r.ok,false)});
