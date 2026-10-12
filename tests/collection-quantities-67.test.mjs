import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildApprovedCollectionQuantities,describeOwnedQuantity} from '../game/collection-quantities-67.js';

const manifest=JSON.parse(readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
const catalogue=manifest.cards;
const first=catalogue[0].id,second=catalogue[1].id,third=catalogue[2].id;

test('a missing card has no copy badge; one owned card stays single',()=>{
 assert.deepEqual(describeOwnedQuantity(0),{owned:false,isDuplicate:false,quantity:0,badge:null,accessibleText:'Carte non obtenue'});
 assert.deepEqual(describeOwnedQuantity(1),{owned:true,isDuplicate:false,quantity:1,badge:null,accessibleText:'1 exemplaire possédé'});
});
test('cards obtained twice, three times or more display the actual quantity',()=>{
 for(const count of [2,3,4,12,999]){
  const model=describeOwnedQuantity(count);
  assert.equal(model.badge,'×'+count);
  assert.equal(model.accessibleText,count+' exemplaires possédés');
  assert.equal(model.isDuplicate,true);
 }
});
test('duplicate acquisitions update total copies but not completion of distinct cards',()=>{
 const serverInventory=[{cardId:first,quantity:3},{cardId:second,quantity:2},{cardId:third,quantity:1}];
 const before=JSON.stringify(serverInventory);
 const view=buildApprovedCollectionQuantities(catalogue,serverInventory);
 assert.equal(view.cards.length,67);
 assert.deepEqual(view.cards.slice(0,3).map(c=>c.badge),['×3','×2',null]);
 assert.equal(view.uniqueOwned,3);
 assert.equal(view.missing,64);
 assert.equal(view.totalCopies,6);
 assert.equal(view.extraCopies,3);
 assert.equal(view.duplicateTypes,2);
 assert.equal(view.completedBaseCharacters,false);
 assert.equal(JSON.stringify(serverInventory),before,'Read model must never alter the server payload');
});
test('an owned card can be shown to the player with 1 then 2 then 3 copies',()=>{
 const single=buildApprovedCollectionQuantities(catalogue,[{cardId:first,quantity:1}]);
 const double=buildApprovedCollectionQuantities(catalogue,[{cardId:first,quantity:2}]);
 const triple=buildApprovedCollectionQuantities(catalogue,[{cardId:first,quantity:3}]);
 assert.equal(single.cards[0].badge,null);
 assert.equal(double.cards[0].badge,'×2');
 assert.equal(triple.cards[0].badge,'×3');
 for(const model of [single,double,triple])assert.equal(model.uniqueOwned,1);
});
test('all 67 unique cards can be completed, even if some are duplicates',()=>{
 const inventory=catalogue.map((c,index)=>({cardId:c.id,quantity:index===0?5:1}));
 const model=buildApprovedCollectionQuantities(catalogue,inventory);
 assert.equal(model.completedBaseCharacters,true);
 assert.equal(model.uniqueOwned,67);
 assert.equal(model.totalCopies,71);
 assert.equal(model.extraCopies,4);
});
test('rejects invalid quantities, duplicate rows and foreign card references rather than inventing stock',()=>{
 for(const quantity of [-1,0.4,NaN,Infinity,2**54])assert.throws(()=>describeOwnedQuantity(quantity),/Quantité invalide/);
 assert.throws(()=>buildApprovedCollectionQuantities(catalogue,[{cardId:first,quantity:1},{cardId:first,quantity:2}]),/Inventaire incohérent/);
 assert.throws(()=>buildApprovedCollectionQuantities(catalogue,[{cardId:'unknown',quantity:5}]),/Inventaire incohérent/);
 assert.throws(()=>buildApprovedCollectionQuantities(catalogue,[{cardId:first,quantity:-1}]),/Inventaire incohérent/);
});
test('display model does not generate rewards or assert anything about variant inventory',()=>{
 const model=buildApprovedCollectionQuantities(catalogue,[]);
 assert.equal(model.uniqueOwned,0);
 assert.equal(model.totalCopies,0);
 assert.equal(model.missing,67);
 for(const key of ['award','grant','draw','userId','variantCount']) assert.ok(!Object.hasOwn(model,key));
});
