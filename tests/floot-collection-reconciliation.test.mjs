import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../data/cards.js';
import { compareCommittedPackToInventory } from '../floot-collection/collection-reconciliation.mjs';

const draw=['matelas','matelas','matelas','matelas','fontaine'];
const after=(matelas,fontaine)=>[
  {cardId:'matelas',quantity:matelas},
  {cardId:'fontaine',quantity:fontaine},
];

test('a committed pack has exactly the expected five copies',()=>{
  const result=compareCommittedPackToInventory(CARDS,[],after(4,1),draw);
  assert.equal(result.matches,true);
  assert.equal(result.observedGain,5);
  assert.equal(result.expectedGain,5);
  assert.equal(result.uniqueAfter,2);
  assert.equal(result.firstDiscoveries,2);
  assert.equal(result.additionalCopies,3);
  assert.deepEqual(result.discrepancies,[]);
  assert.equal(result.needsServerRefresh,false);
});

test('previous copies affect discoveries but not expected inventory gain',()=>{
  const before=[{cardId:'matelas',quantity:2}];
  const result=compareCommittedPackToInventory(CARDS,before,after(6,1),draw);
  assert.equal(result.matches,true);
  assert.equal(result.firstDiscoveries,1);
  assert.equal(result.additionalCopies,4);
  assert.equal(result.uniqueBefore,1);
  assert.equal(result.uniqueAfter,2);
});

test('missing card in the server snapshot becomes a discrepancy',()=>{
  const result=compareCommittedPackToInventory(CARDS,[],after(4,0),draw);
  assert.equal(result.matches,false);
  assert.equal(result.observedGain,4);
  assert.equal(result.discrepancies.length,1);
  assert.equal(result.discrepancies[0].id,'fontaine');
  assert.equal(result.needsServerRefresh,true);
});

test('an unrelated concurrent change is detected, not overwritten',()=>{
  const result=compareCommittedPackToInventory(CARDS,[],[
    ...after(4,1),{cardId:'etalon',quantity:1}
  ],draw);
  assert.equal(result.matches,false);
  assert.equal(result.observedGain,6);
  assert.equal(result.discrepancies[0].id,'etalon');
});

test('a zero-gain snapshot does not masquerade as confirmed pack',()=>{
  const result=compareCommittedPackToInventory(CARDS,[],[],draw);
  assert.equal(result.matches,false);
  assert.equal(result.observedGain,0);
  assert.equal(result.discrepancies.length,2);
});

test('the reconciliation never modifies its inputs',()=>{
  const before=Object.freeze([{cardId:'matelas',quantity:2}]);
  const afterInventory=Object.freeze(after(6,1).map(c=>Object.freeze(c)));
  const beforeSnapshot=JSON.stringify(before);
  const afterSnapshot=JSON.stringify(afterInventory);
  compareCommittedPackToInventory(CARDS,before,afterInventory,draw);
  assert.equal(JSON.stringify(before),beforeSnapshot);
  assert.equal(JSON.stringify(afterInventory),afterSnapshot);
});

test('invalid or unconfirmed pack shapes are rejected',()=>{
  assert.throws(()=>compareCommittedPackToInventory(CARDS,[],[],['matelas']),/cinq/);
  assert.throws(()=>compareCommittedPackToInventory(CARDS,[],[],['matelas','matelas','matelas','matelas','matelas']),/cinquième/);
});

test('an unknown inventory row is rejected, not silently ignored',()=>{
  assert.throws(()=>compareCommittedPackToInventory(CARDS,[],[{cardId:'fake',quantity:1}],draw),/invalide/);
});

test('no expectation of a transaction or a user ID from the browser',()=>{
  const result=compareCommittedPackToInventory(CARDS,[],after(4,1),draw);
  assert.equal('userId' in result,false);
  assert.equal('databaseUpdated' in result,false);
});
