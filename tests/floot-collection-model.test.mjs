import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../data/cards.js';
import {
  RARITY_ORDER, buildCollectionModel, filterCollectionCards,
  describeCommittedBooster, getDisplayedBoosterOdds,
} from '../floot-collection/collection-model.mjs';

const empty = () => buildCollectionModel(CARDS, []);
const owned = [
  {cardId: 'matelas', quantity: 4},
  {cardId: 'fontaine', quantity: 2},
  {cardId: 'etalon', quantity: 1},
  {cardId: 'mouette', quantity: 1},
  {cardId: 'chemise', quantity: 1},
];

test('empty binder has 49 missing cards and all five rarity groups', () => {
  const m = empty();
  assert.equal(m.total, 49);
  assert.equal(m.unique, 0);
  assert.equal(m.copies, 0);
  assert.equal(m.missing, 49);
  assert.equal(m.extraCopies, 0);
  assert.equal(m.duplicateTypes, 0);
  assert.equal(m.completionPercent, 0);
  assert.equal(m.complete, false);
  assert.deepEqual(m.byRarity.map(r => r.total), [17, 15, 10, 4, 3]);
  assert.deepEqual(m.byRarity.map(r => r.id), RARITY_ORDER);
});

test('one copy is owned, not a duplicate', () => {
  const m = buildCollectionModel(CARDS, [{cardId:'matelas',quantity:1}]);
  assert.equal(m.unique, 1);
  assert.equal(m.copies, 1);
  assert.equal(m.extraCopies, 0);
  assert.equal(m.duplicateTypes, 0);
  assert.equal(m.cards.find(c => c.id === 'matelas').hasDuplicates, false);
});

test('four copies mean one unique, three extra, one duplicated type', () => {
  const m = buildCollectionModel(CARDS, [{cardId:'matelas',quantity:4}]);
  assert.equal(m.unique, 1);
  assert.equal(m.copies, 4);
  assert.equal(m.extraCopies, 3);
  assert.equal(m.duplicateTypes, 1);
  assert.equal(m.missing, 48);
  assert.equal(m.cards.find(c => c.id === 'matelas').quantity, 4);
});

test('rarity progress distinguishes unique cards, total copies and extra copies', () => {
  const m = buildCollectionModel(CARDS, owned);
  assert.deepEqual([m.total,m.unique,m.missing,m.copies,m.extraCopies,m.duplicateTypes], [49,5,44,9,4,2]);
  assert.equal(m.completionPercent, 10);
  const common = m.byRarity.find(r=>r.id==='commune');
  assert.deepEqual([common.total,common.unique,common.copies,common.extraCopies,common.duplicateTypes,common.completionPercent], [17,1,4,3,1,6]);
  const rare = m.byRarity.find(r=>r.id==='rare');
  assert.deepEqual([rare.total,rare.unique,rare.copies,rare.extraCopies,rare.duplicateTypes,rare.completionPercent], [15,1,2,1,1,7]);
});

test('all rarities can be complete without a single duplicate', () => {
  const m = buildCollectionModel(CARDS,CARDS.map(c=>({cardId:c.id,quantity:1})));
  assert.equal(m.complete,true);
  assert.equal(m.completionPercent,100);
  assert.equal(m.missing,0);
  assert.equal(m.extraCopies,0);
  assert.deepEqual(m.byRarity.map(r=>r.completionPercent),[100,100,100,100,100]);
});

test('zero-quantity server rows are not counted as possessed', () => {
  const m = buildCollectionModel(CARDS,[{cardId:'matelas',quantity:0}]);
  assert.equal(m.unique,0);
  assert.equal(m.copies,0);
});

test('the binder uses only actual artwork URLs, otherwise null', () => {
  const m = empty();
  assert.equal(m.cards.find(c=>c.id==='matelas').imageUrl,null);
  const withArt = CARDS.map(c=>c.id==='matelas'?{...c,imageUrl:'https://example.invalid/art.png'}:c);
  assert.equal(buildCollectionModel(withArt,[]).cards.find(c=>c.id==='matelas').imageUrl,'https://example.invalid/art.png');
});

test('missing filters return the unowned cards', () => {
  const m = buildCollectionModel(CARDS,owned);
  assert.equal(filterCollectionCards(m,{ownership:'missing'}).length,44);
  assert.equal(filterCollectionCards(m,{ownership:'owned'}).length,5);
});

test('duplicated cards are also owned, but only two types have more than one copy', () => {
  const m=buildCollectionModel(CARDS,owned);
  assert.deepEqual(filterCollectionCards(m,{ownership:'duplicates'}).map(c=>c.id).sort(), ['fontaine','matelas']);
  assert.equal(filterCollectionCards(m,{ownership:'duplicates',rarity:'secrete'}).length,0);
});

test('rarity and possession filters combine with each other', () => {
  const m=buildCollectionModel(CARDS,owned);
  assert.deepEqual(filterCollectionCards(m,{ownership:'owned',rarity:'legendaire'}).map(c=>c.id), ['mouette']);
  assert.equal(filterCollectionCards(m,{ownership:'missing',rarity:'secrete'}).length,2);
  assert.equal(filterCollectionCards(m,{ownership:'owned',rarity:'secrete'}).length,1);
});

test('French accent, capitalization and whitespace are ignored in search', () => {
  const catalogue=CARDS.map(c=>c.id==='etalon'?{...c,name:'Étalon'}:c);
  const m=buildCollectionModel(catalogue,owned);
  assert.deepEqual(filterCollectionCards(m,{search:'  E T A L O N  '}).map(c=>c.id), []);
  assert.deepEqual(filterCollectionCards(m,{search:'  ETALON  '}).map(c=>c.id), ['etalon']);
  assert.deepEqual(filterCollectionCards(m,{search:'éTaLoN'}).map(c=>c.id), ['etalon']);
});

test('search can match the stable ID even when display name changes', () => {
  const catalogue=CARDS.map(c=>c.id==='matelas'?{...c,name:'Personnage en costume'}:c);
  const m=buildCollectionModel(catalogue,[]);
  assert.deepEqual(filterCollectionCards(m,{search:'matelas'}).map(c=>c.id),['matelas']);
});

test('catalogue order is stable and sorted copies descending preserve ties', () => {
  const m=buildCollectionModel(CARDS,owned);
  assert.deepEqual(filterCollectionCards(m).map(c=>c.id),CARDS.map(c=>c.id));
  assert.deepEqual(filterCollectionCards(m,{sort:'copies-desc'}).slice(0,2).map(c=>c.id),['matelas','fontaine']);
});

test('sort by rarity puts secret above legendary, then epic, rare and common', () => {
  const m=buildCollectionModel(CARDS,owned);
  const distinct=[];
  for(const card of filterCollectionCards(m,{sort:'rarity'})) {
    if(!distinct.includes(card.rarity)) distinct.push(card.rarity);
  }
  assert.deepEqual(distinct,['secrete','legendaire','epique','rare','commune']);
});

test('sorting alphabetically is supported without changing the source model', () => {
  const m=buildCollectionModel(CARDS,owned);
  const before=m.cards.map(c=>c.id);
  const sorted=filterCollectionCards(m,{sort:'name'});
  assert.equal(sorted.length,49);
  assert.deepEqual(m.cards.map(c=>c.id),before);
});

test('unknown filters and sort modes are rejected', () => {
  const m=empty();
  assert.throws(()=>filterCollectionCards(m,{ownership:'rare'}),/possession/);
  assert.throws(()=>filterCollectionCards(m,{rarity:'mythique'}),/rareté/);
  assert.throws(()=>filterCollectionCards(m,{sort:'recently-acquired'}),/Tri/);
});

test('unknown card IDs from an inventory cause an error, not a silent reallocation', () => {
  assert.throws(()=>buildCollectionModel(CARDS,[{cardId:'invented',quantity:1}]),/invalide/);
});

test('duplicate DB rows for the same card are rejected, not added together', () => {
  assert.throws(()=>buildCollectionModel(CARDS,[{cardId:'matelas',quantity:1},{cardId:'matelas',quantity:1}]),/deux lignes/);
});

test('negative, fractional, NaN, infinity and textual quantities are rejected', () => {
  for(const quantity of [-1,0.5,NaN,Infinity,'2',Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(()=>buildCollectionModel(CARDS,[{cardId:'matelas',quantity}]),/invalide/);
  }
});

test('unsafe quantity total is rejected before rounding', () => {
  assert.throws(()=>buildCollectionModel(CARDS,[{cardId:'matelas',quantity:Number.MAX_SAFE_INTEGER},{cardId:'fontaine',quantity:1}]),/entier fiable/);
});

test('duplicated or unsupported catalogue entries are rejected', () => {
  assert.throws(()=>buildCollectionModel([...CARDS,CARDS[0]],[]),/double/);
  assert.throws(()=>buildCollectionModel([{id:'new',rarity:'mythique'}],[]),/invalide/);
  assert.throws(()=>buildCollectionModel([],[]),/indisponible/);
});

test('presentation of a committed pack distinguishes new and repeated cards in the same draw', () => {
  const draw=['matelas','matelas','matelas','matelas','fontaine'];
  const badges=describeCommittedBooster(CARDS,[],draw);
  assert.deepEqual(badges.map(c=>c.newUnique),[true,false,false,false,true]);
  assert.deepEqual(badges.map(c=>c.duplicate),[false,true,true,true,false]);
  assert.deepEqual(badges.map(c=>c.quantityAfter),[1,2,3,4,1]);
  assert.equal(badges[4].rarity,'rare');
  assert.equal(badges.length,5);
});

test('a known card is duplicate when already owned before the committed pack', () => {
  const badges=describeCommittedBooster(CARDS,[{cardId:'fontaine',quantity:2}],['fontaine','matelas','matelas','matelas','fontaine']);
  assert.equal(badges[0].newUnique,false);
  assert.equal(badges[0].quantityAfter,3);
  assert.equal(badges[4].quantityAfter,4);
});

test('the reveal description never mutates previous inventory', () => {
  const input=Object.freeze([{cardId:'matelas',quantity:1}]);
  const before=JSON.stringify(input);
  describeCommittedBooster(CARDS,input,['matelas','matelas','matelas','matelas','fontaine']);
  assert.equal(JSON.stringify(input),before);
});

test('a committed pack with wrong length or unknown ID is rejected', () => {
  assert.throws(()=>describeCommittedBooster(CARDS,[],['matelas']),/cinq/);
  assert.throws(()=>describeCommittedBooster(CARDS,[],['matelas','matelas','missing','matelas','fontaine']),/inconnue/);
});

test('the fifth card can never be common even in the read-only reveal', () => {
  assert.throws(()=>describeCommittedBooster(CARDS,[],['matelas','fontaine','etalon','mouette','matelas']),/cinquième/);
});

test('displayed normal odds sum to 100 and preserve the original weights', () => {
  const odds=getDisplayedBoosterOdds();
  assert.deepEqual(odds.normalSlots,{commune:55,rare:27,epique:12,legendaire:4,secrete:2});
  assert.equal(Object.values(odds.normalSlots).reduce((a,b)=>a+b),100);
  assert.equal(odds.fifthSlot.commune,0);
  assert.equal(odds.fifthSlot.rare,60);
  assert.ok(Math.abs(Object.values(odds.fifthSlot).reduce((a,b)=>a+b)-100)<1e-10);
});

test('model calculations cannot invent cards from a user supplied inventory',()=>{
  const m=buildCollectionModel(CARDS,[]);
  assert.equal(m.unique,0);
  assert.throws(()=>buildCollectionModel(CARDS,[{cardId:'secret_fake',quantity:999}]),/invalide/);
});
