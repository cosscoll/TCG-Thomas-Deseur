import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARDS} from '../data/cards.js';

const selection=JSON.parse(readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
test('legacy inventory IDs cannot be silently overwritten with approved character IDs',()=>{
 const existing=new Set(CARDS.map(c=>c.id));
 const approved=new Set(selection.cards.map(c=>c.id));
 assert.equal(existing.size,49);
 assert.equal(approved.size,67);
 assert.equal([...existing].filter(id=>approved.has(id)).length,0);
 for(const card of selection.cards){
  assert.ok(card.id.startsWith('COST-'),'Expected approved character reference');
  assert.ok(!Object.prototype.hasOwnProperty.call(card,'rarity'),'The creator has not yet assigned rarities');
  assert.ok(!Object.prototype.hasOwnProperty.call(card,'legacyId'),'No historical card mapping has been confirmed');
 }
});
