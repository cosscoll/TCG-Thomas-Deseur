import test from "node:test";
import assert from "node:assert/strict";
import {PHOTO_ORIGINS_177} from "../data/photo-origins-177.js";
import {PUBLIC_CARDS_160} from "../data/public-cards-160.js";

test("les 177 photos disposent d'un nom, référence de costume, provenance et lien source",()=>{
 const items=Object.entries(PHOTO_ORIGINS_177);
 assert.equal(items.length,177);
 for(const [reference,photo] of items){
  assert.match(reference,/^REF-(?:[123]-\d{3}|177-LILLE)$/);
  assert.ok(photo.title?.trim(),reference+" sans nom");
  assert.ok(photo.fullTitle?.trim(),reference+" sans nom complet");
  assert.match(photo.groupId,/^COST-\d{3}$/);
  assert.ok(photo.groupCount>=1);
  assert.ok(photo.variant>=1&&photo.variant<=photo.groupCount);
  assert.ok(photo.origin?.trim());
  assert.ok(photo.series?.startsWith("images/"));
  assert.match(photo.originUrl,/^https:\/\//);
  assert.match(photo.originalImageUrl,/^https:\/\//);
  assert.ok(photo.originalFile.startsWith("images/"));
 }
});

test("les 160 cartes du classeur possèdent une provenance originale sans dévoiler le booster final",()=>{
 assert.equal(PUBLIC_CARDS_160.length,160);
 for(const card of PUBLIC_CARDS_160){
  const origin=PHOTO_ORIGINS_177[card.reference];
  assert.ok(origin,"Photo source introuvable pour "+card.reference);
  assert.ok(origin.title);
  assert.ok(origin.originUrl);
 }
 assert.equal(PUBLIC_CARDS_160.filter(x=>x.reference==="REF-177-LILLE").length,1);
 assert.ok(!JSON.stringify(PUBLIC_CARDS_160).toLowerCase().includes("chevelu"));
});

test("les 70 costumes sont proposés, les autres vues sont identifiables",()=>{
 const grouped=new Map();
 for(const [reference,item] of Object.entries(PHOTO_ORIGINS_177)){
  const prev=grouped.get(item.groupId)??[];
  prev.push(reference);
  grouped.set(item.groupId,prev);
 }
 assert.equal(grouped.size,70);
 assert.equal([...grouped.values()].filter(g=>g.length>1).length,66);
 assert.equal([...grouped.values()].filter(g=>g.length===1).length,4);
 for(const [id,refs] of grouped){
  for(const reference of refs){
   assert.equal(PHOTO_ORIGINS_177[reference].groupCount,refs.length,id+" inconsistant");
  }
 }
});

test("les origines distinguent les 3 séries et l'affiche de Lille",()=>{
 const sources=new Map();
 for(const photo of Object.values(PHOTO_ORIGINS_177)){
  sources.set(photo.series,(sources.get(photo.series)??0)+1);
 }
 assert.deepEqual(Object.fromEntries(sources),{
  "images/100-1000-couches":67,
  "images/serie-100-couches":66,
  "images/personnages-thomas":43,
  "images/Braderie-de-Lille-2026":1,
 });
});
