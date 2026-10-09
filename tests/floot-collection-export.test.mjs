import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../data/cards.js';
import { buildCollectionModel } from '../floot-collection/collection-model.mjs';
import { exportCollectionCsv } from '../floot-collection/collection-export.mjs';

const empty = () => buildCollectionModel(CARDS, []);
const sample = () => buildCollectionModel(CARDS, [
  {cardId:'matelas',quantity:4},
  {cardId:'fontaine',quantity:2},
  {cardId:'etalon',quantity:1},
  {cardId:'mouette',quantity:1},
  {cardId:'chemise',quantity:1},
]);

test('CSV UTF-8 has BOM, six columns and 49 cards by default', () => {
  const csv = exportCollectionCsv(sample());
  assert.ok(csv.startsWith('\ufeff'));
  assert.equal(csv.replace(/^\ufeff/, '').trim().split('\r\n').length,50);
  assert.equal(csv.split('\r\n')[0].split(';').length,6);
});
test('CSV reports correct copies and extra duplicates without personal data', () => {
  const csv = exportCollectionCsv(sample());
  assert.match(csv,/"matelas";"Matelas";"commune";"Oui";"4";"3"/);
  assert.match(csv,/"fontaine";"Fontaine";"rare";"Oui";"2";"1"/);
  assert.match(csv,/"standupper";"Standupper";"commune";"Non";"0";"0"/);
  assert.doesNotMatch(csv,/password|token|email|userId|openedAt/);
});
test('CSV can exclude missing cards without miscounting duplicates', () => {
  const csv = exportCollectionCsv(sample(),{includeMissing:false,bom:false});
  assert.ok(!csv.startsWith('\ufeff'));
  assert.equal(csv.trim().split('\r\n').length,6);
  assert.doesNotMatch(csv,/"standupper"/);
});
test('an empty collection exports 49 missing entries', () => {
  const csv = exportCollectionCsv(empty());
  assert.equal(csv.trim().split('\r\n').length,50);
  assert.match(csv,/"matelas";"Matelas";"commune";"Non";"0";"0"/);
});
test('a fully collected binder exports 49 possessed cards',()=>{
  const model=buildCollectionModel(CARDS,CARDS.map(c=>({cardId:c.id,quantity:1})));
  const csv=exportCollectionCsv(model);
  assert.doesNotMatch(csv,/"Non"/);
  assert.equal(csv.trim().split('\r\n').length,50);
});
test('CSV escapes quotes and semicolons safely', () => {
  const catalog=CARDS.map(c=>c.id==='matelas'?{...c,name:'Thomas "déguisé"; et drôle'}:c);
  const csv=exportCollectionCsv(buildCollectionModel(catalog,[]),{bom:false});
  assert.match(csv,/"matelas";"Thomas ""déguisé""; et drôle";"commune"/);
});
test('CSV sanitizes formula-like labels to prevent spreadsheet injection',()=>{
  for(const prefix of ['=','+','-','@','\t=','\n=']) {
    const catalog=CARDS.map(c=>c.id==='matelas'?{...c,name:prefix+'1+2'}:c);
    const csv=exportCollectionCsv(buildCollectionModel(catalog,[]),{bom:false});
    assert.ok(csv.includes('"\'=1+2"') ||
      csv.includes('"\'+'+prefix+'1+2"') ||
      csv.includes('"\'-1+2"') ||
      csv.includes('"\'@1+2"'));
    assert.doesNotMatch(csv,/"[=+@-]1\+2"/);
  }
});
test('CSV export does not mutate model contents',()=>{
  const model=sample(),before=JSON.stringify(model);
  exportCollectionCsv(model,{includeMissing:false});
  assert.equal(JSON.stringify(model),before);
});
test('CSV refuses truncated, altered or negative-quantity data',()=>{
  const model=sample();
  assert.throws(()=>exportCollectionCsv({...model,cards:model.cards.slice(1)}),/49 cartes/);
  assert.throws(()=>exportCollectionCsv({...model,cards:model.cards.map(c=>c.id==='matelas'?{...c,quantity:-1}:c)}),/invalide/);
  assert.throws(()=>exportCollectionCsv({...model,cards:[...model.cards.slice(1),model.cards[0]]}),/invalide|49 cartes/);
});
test('invalid export options are rejected',()=>{
  assert.throws(()=>exportCollectionCsv(sample(),{includeMissing:'false'}),/Options/);
  assert.throws(()=>exportCollectionCsv(sample(),{bom:'yes'}),/Options/);
});
