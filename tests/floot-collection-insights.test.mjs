import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../data/cards.js';
import { buildCollectionModel } from '../floot-collection/collection-model.mjs';
import {
  getDuplicateSummary, getCollectionGoals, normalizeAcquisitionHistory,
  getCommittedBoosterRecap, getBoosterAvailabilityHint,
} from '../floot-collection/collection-insights.mjs';

const selected = [
  {cardId:'matelas', quantity:4},
  {cardId:'fontaine', quantity:2},
  {cardId:'etalon', quantity:1},
  {cardId:'mouette', quantity:1},
  {cardId:'chemise', quantity:1},
];
const sample = () => buildCollectionModel(CARDS, selected);
const empty = () => buildCollectionModel(CARDS, []);
const complete = () => buildCollectionModel(CARDS,CARDS.map(c=>({cardId:c.id,quantity:1})));
const history = [
  {id:'test-older',openedAt:'2026-10-01T12:00:00Z',cardIds:['matelas','matelas','matelas','matelas','fontaine']},
  {id:'test-new',openedAt:'2026-10-02T12:00:00Z',cardIds:['matelas','etalon','mouette','matelas','chemise']},
];

test('duplicates show 4 extra copies across two types', () => {
  const result=getDuplicateSummary(sample());
  assert.equal(result.extraCopies,4);
  assert.equal(result.types,2);
  assert.equal(result.totalCopiesOfDuplicateTypes,6);
  assert.deepEqual(result.cards.map(c=>c.id),['matelas','fontaine']);
});
test('no duplicates in an empty binder', () => {
  const d=getDuplicateSummary(empty());
  assert.equal(d.types,0);
  assert.equal(d.extraCopies,0);
  assert.deepEqual(d.cards,[]);
});
test('rarity filter narrows duplicates without changing totals elsewhere', () => {
  const d=getDuplicateSummary(sample(),{rarity:'rare'});
  assert.deepEqual(d.cards.map(c=>c.id),['fontaine']);
  assert.equal(d.extraCopies,1);
  assert.equal(d.byRarity.find(c=>c.id==='rare').types,1);
  assert.equal(d.byRarity.find(c=>c.id==='commune').extraCopies,0);
});
test('complete binder with one of each has zero extras', () => {
  assert.equal(getDuplicateSummary(complete()).extraCopies,0);
});
test('different duplicate order and unknown filters are handled', () => {
  const m=sample();
  assert.deepEqual(getDuplicateSummary(m,{sort:'name'}).cards.map(c=>c.id),['fontaine','matelas']);
  assert.deepEqual(getDuplicateSummary(m,{sort:'catalogue'}).cards.map(c=>c.id),['matelas','fontaine']);
  assert.throws(()=>getDuplicateSummary(m,{rarity:'mythique'}),/Rareté/);
  assert.throws(()=>getDuplicateSummary(m,{sort:'invalid'}),/Tri/);
});
test('goals are informative and never grant rewards', () => {
  const g=getCollectionGoals(sample());
  assert.equal(g.total,15);
  assert.equal(g.achieved,6);
  assert.equal(g.goals.find(x=>x.id==='unique-5').achieved,true);
  assert.equal(g.goals.find(x=>x.id==='unique-10').remaining,5);
  assert.equal(g.goals.find(x=>x.id==='complete-secrete').remaining,2);
  assert.ok(g.goals.every(x=>!('reward' in x)));
});
test('empty binder has no achieved goals and displays upcoming objectives', () => {
  const g=getCollectionGoals(empty());
  assert.equal(g.achieved,0);
  assert.equal(g.next[0].remaining,1);
});
test('fully collected binder achieves all milestones', () => {
  const g=getCollectionGoals(complete());
  assert.equal(g.achieved,15);
  assert.equal(g.next.length,0);
});
test('goals cap progress at the target and preserve completion percentages', () => {
  const g=getCollectionGoals(sample());
  assert.equal(g.goals.find(x=>x.id==='unique-1').progress,1);
  assert.equal(g.goals.find(x=>x.id==='unique-1').completionPercent,100);
  assert.equal(g.goals.find(x=>x.id==='unique-25').completionPercent,20);
});
test('history is sorted newest first without changing the input', () => {
  const input=structuredClone(history);
  const h=normalizeAcquisitionHistory(CARDS,input);
  assert.deepEqual(h.map(x=>x.id),['test-new','test-older']);
  assert.deepEqual(input,history);
  assert.deepEqual(h.map(x=>x.newDiscoveries),[null,null]);
});
test('history counts rarities and rarest card', () => {
  const h=normalizeAcquisitionHistory(CARDS,history)[0];
  assert.equal(h.rarest,'secrete');
  assert.equal(h.cards.length,5);
  assert.equal(Object.values(h.rarityCounts).reduce((a,b)=>a+b),5);
});
test('historical new/double badges stay unknown with partial history', () => {
  const h=normalizeAcquisitionHistory(CARDS,history);
  assert.ok(h.every(x=>x.newDiscoveries===null&&x.duplicateCopies===null));
});
test('history empty array is valid and does not invent openings',()=>{
  assert.deepEqual(normalizeAcquisitionHistory(CARDS,[]),[]);
});
test('history limits are honored',()=>{
  assert.equal(normalizeAcquisitionHistory(CARDS,history,{limit:1}).length,1);
  assert.throws(()=>normalizeAcquisitionHistory(CARDS,history,{limit:0}),/Limite/);
  assert.throws(()=>normalizeAcquisitionHistory(CARDS,history,{limit:101}),/Limite/);
});
test('duplicate event identifiers are rejected',()=>{
  assert.throws(()=>normalizeAcquisitionHistory(CARDS,[history[0],history[0]]),/invalide/);
});
test('time without timezone is rejected rather than guessed',()=>{
  assert.throws(()=>normalizeAcquisitionHistory(CARDS,[{...history[0],openedAt:'2026-10-01T12:00:00'}]),/invalide/);
});
test('unknown historical card ID is rejected',()=>{
  assert.throws(()=>normalizeAcquisitionHistory(CARDS,[{...history[0],cardIds:['unknown','matelas','matelas','matelas','fontaine']}]),/inconnue/);
});
test('history with a common fifth card is rejected',()=>{
  assert.throws(()=>normalizeAcquisitionHistory(CARDS,[{...history[0],cardIds:['matelas','fontaine','etalon','mouette','matelas']}]),/cinquième/);
});
test('booster recap identifies new cards and within-pack duplicate cards',()=>{
  const r=getCommittedBoosterRecap(CARDS,[],['matelas','matelas','matelas','matelas','fontaine']);
  assert.equal(r.count,5);
  assert.equal(r.firstDiscoveries,2);
  assert.equal(r.duplicateCopies,3);
  assert.equal(r.byRarity.find(x=>x.id==='commune').count,4);
  assert.equal(r.highestRarity,'rare');
});
test('booster recap respects a previously owned card',()=>{
  const r=getCommittedBoosterRecap(CARDS,[{cardId:'matelas',quantity:2}],['matelas','matelas','matelas','matelas','fontaine']);
  assert.equal(r.firstDiscoveries,1);
  assert.equal(r.duplicateCopies,4);
  assert.equal(r.cards[0].quantityAfter,3);
  assert.equal(r.cards[3].quantityAfter,6);
});
test('booster recap rejects any uncommitted or malformed five-card request',()=>{
  assert.throws(()=>getCommittedBoosterRecap(CARDS,[],['matelas']),/cinq/);
  assert.throws(()=>getCommittedBoosterRecap(CARDS,[],['matelas','matelas','matelas','matelas','matelas']),/cinquième/);
});
test('booster countdown unknown does not promise availability',()=>{
  assert.deepEqual(getBoosterAvailabilityHint(null,1000),{known:false,remainingMs:null,elapsed:null});
});
test('booster countdown is strictly informative',()=>{
  assert.deepEqual(getBoosterAvailabilityHint('2026-10-10T09:00:00Z',Date.parse('2026-10-10T08:00:00Z')),{known:true,remainingMs:3600000,elapsed:false});
  assert.deepEqual(getBoosterAvailabilityHint('2026-10-10T09:00:00Z',Date.parse('2026-10-10T10:00:00Z')),{known:true,remainingMs:0,elapsed:true});
});
test('invalid countdown values are rejected',()=>{
  assert.throws(()=>getBoosterAvailabilityHint('yesterday',0),/Échéance/);
  assert.throws(()=>getBoosterAvailabilityHint('2026-10-10T09:00:00Z',NaN),/Heure/);
});
