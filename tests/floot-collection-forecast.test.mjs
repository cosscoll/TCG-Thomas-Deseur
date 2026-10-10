import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS } from '../data/cards.js';
import { buildCollectionModel } from '../floot-collection/collection-model.mjs';
import { getCollectionForecast, getCollectorRank } from '../floot-collection/collection-forecast.mjs';

const SAMPLE=[
  {cardId:'matelas',quantity:4},
  {cardId:'fontaine',quantity:2},
  {cardId:'etalon',quantity:1},
  {cardId:'mouette',quantity:1},
  {cardId:'chemise',quantity:1},
];
const almost=(actual,expected,tolerance=1e-11) => assert.ok(
  Math.abs(actual-expected)<tolerance,`obtained ${actual}, expected ${expected}`);

test('collection vide : un nouveau type de carte est certain au prochain booster',()=>{
  const r=getCollectionForecast(CARDS,[]);
  almost(r.chanceAtLeastOneNew,1);
  almost(r.chanceNoNew,0);
  almost(r.chanceNewPerRegularSlot,1);
  almost(r.chanceNewFifthSlot,1);
  assert.equal(r.missing,49);
  assert.equal(r.ownedUnique,0);
});
test('collection pleine : zéro nouvelle carte malgré les tirages, bonus inchangé',()=>{
  const owned=CARDS.map(card=>({cardId:card.id,quantity:2}));
  const r=getCollectionForecast(CARDS,owned);
  almost(r.chanceAtLeastOneNew,0);
  almost(r.expectedNewUnique,0);
  almost(r.expectedNewCopies,0);
  almost(r.chanceAtLeastOneLegendaryOrSecret,
    1-(1-.06)**4*(1-6/45));
  assert.equal(r.rank.complete,true);
});
test('dupliquer une carte possédée ne change aucune probabilité de découverte',()=>{
  const single=SAMPLE.map(row=>({...row,quantity:1}));
  const multiple=SAMPLE.map(row=>({...row,quantity:100}));
  const a=getCollectionForecast(CARDS,single);
  const b=getCollectionForecast(CARDS,multiple);
  almost(a.chanceAtLeastOneNew,b.chanceAtLeastOneNew);
  almost(a.expectedNewUnique,b.expectedNewUnique);
  assert.deepEqual(a.byRarity,b.byRarity);
});
test('la cinquième case ne peut donner de nouvelle Commune',()=>{
  const r=getCollectionForecast(CARDS,[]);
  const group=r.byRarity.find(x=>x.id==='commune');
  almost(group.chanceNewGuaranteed,0);
  almost(group.chanceNewRegular,.55);
});
test('exactitude des poids de cinquième case garantissant Rare ou plus',()=>{
  const r=getCollectionForecast(CARDS,[]);
  const values=[0,27,12,4,2].map(w=>w/45);
  for(let i=0;i<5;i++) almost(r.byRarity[i].chanceNewGuaranteed,values[i]);
});
test('si seule une Commune manque, la cinquième case ne peut rien améliorer',()=>{
  const inventory=CARDS.filter(card=>card.id!=='matelas').map(card=>({cardId:card.id,quantity:1}));
  const r=getCollectionForecast(CARDS,inventory);
  const p=.55/17;
  almost(r.chanceAtLeastOneNew,1-(1-p)**4);
  almost(r.expectedNewUnique,1-(1-p)**4);
  almost(r.expectedNewCopies,4*p);
});
test('si seule une carte Secrète manque, cinquième slot compte',()=>{
  const inventory=CARDS.filter(card=>card.id!=='chemise').map(card=>({cardId:card.id,quantity:1}));
  const r=getCollectionForecast(CARDS,inventory);
  const regular=.02/3,guaranteed=(2/45)/3;
  almost(r.chanceAtLeastOneNew,1-(1-regular)**4*(1-guaranteed));
  almost(r.expectedNewUnique,r.chanceAtLeastOneNew);
});
test('nouveaux exemplaires attendus ≥ cartes nouvelles distinctes attendues',()=>{
  const inventories=[
    [],SAMPLE,
    CARDS.filter((_,i)=>i%3!==0).map(card=>({cardId:card.id,quantity:1})),
    CARDS.map(card=>({cardId:card.id,quantity:1})),
  ];
  for(const inv of inventories){
    const r=getCollectionForecast(CARDS,inv);
    assert.ok(r.expectedNewUnique <= r.expectedNewCopies + 1e-10);
    assert.ok(r.expectedNewUnique >= 0);
    assert.ok(r.expectedNewUnique <= 5);
    assert.ok(r.chanceAtLeastOneNew >=0 && r.chanceAtLeastOneNew<=1);
    assert.ok(r.chanceAtLeastOneLegendaryOrSecret>=0 && r.chanceAtLeastOneLegendaryOrSecret<=1);
  }
});
test('les probabilités pour chaque rareté somment aux quatre et cinq slots',()=>{
  const r=getCollectionForecast(CARDS,SAMPLE);
  almost(r.chanceNewPerRegularSlot,r.byRarity.reduce((sum,x)=>sum+x.chanceNewRegular,0));
  almost(r.chanceNewFifthSlot,r.byRarity.reduce((sum,x)=>sum+x.chanceNewGuaranteed,0));
  almost(r.expectedNewUnique,r.byRarity.reduce((sum,x)=>sum+x.expectedNewUnique,0));
});
test('le rang progresse uniquement selon le nombre de cartes uniques',()=>{
  const cases=[[0,'Débutant',1],[1,'Découvreur',2],[5,'Explorateur',3],
    [10,'Collectionneur',4],[20,'Passionné',5],[30,'Connaisseur',6],
    [40,'Expert',7],[49,'Collection complète',8]];
  for(const [count,title,level] of cases){
    const model=buildCollectionModel(CARDS,CARDS.slice(0,count).map(c=>({cardId:c.id,quantity:1})));
    const rank=getCollectorRank(model);
    assert.equal(rank.title,title);assert.equal(rank.level,level);
    assert.equal(rank.rewards,false);
    assert.equal(rank.complete,count===49);
  }
});
test('progression du rang en cours et nombre restant calculés exactement',()=>{
  const model=buildCollectionModel(CARDS,CARDS.slice(0,7).map(c=>({cardId:c.id,quantity:1})));
  const rank=getCollectorRank(model);
  assert.equal(rank.title,'Explorateur');
  assert.equal(rank.nextThreshold,10);
  assert.equal(rank.remaining,3);
  assert.equal(rank.progressPercent,40);
});
test('prévisions déterministes ; catalogue et inventaire jamais modifiés',()=>{
  const inventory=structuredClone(SAMPLE), before=JSON.stringify(inventory), catalog=JSON.stringify(CARDS);
  assert.deepEqual(getCollectionForecast(CARDS,inventory),getCollectionForecast(CARDS,inventory));
  assert.equal(JSON.stringify(inventory),before);
  assert.equal(JSON.stringify(CARDS),catalog);
});
test('inventaires invalides rejetés au lieu de surestimer la progression',()=>{
  assert.throws(()=>getCollectionForecast(CARDS.slice(1),[]),/49 cartes|attendues/);
  assert.throws(()=>getCollectionForecast(CARDS,[{cardId:'intrus',quantity:1}]),/invalide/);
  assert.throws(()=>getCollectorRank({total:49,unique:50}),/valide/);
});
