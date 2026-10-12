import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateRarityDecisions} from '../scripts/validate-rarity-decisions.mjs';

const catalogue=JSON.parse(fs.readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
const prepared=()=>{
 const cards=Object.fromEntries(catalogue.cards.map(c=>[c.id,{name:c.name,rarity:'À définir',note:''}]));
 return {schema:'tcg-deseur-rarities-v1',source:'catalogue-valide-67.json',savedAt:'2026-10-12T10:00:00Z',cards};
};
test('accepte les 67 décisions encore vides, sans inventer de rareté',()=>{
 const d=prepared(),s=validateRarityDecisions(d,catalogue);
 assert.equal(s.total,67);assert.equal(s.pending,67);assert.equal(s.defined,0);
 assert.deepEqual(Object.keys(d.cards),catalogue.cards.map(c=>c.id));
});
test('comptabilise les raretés décidées sans attribuer la moindre carte',()=>{
 const d=prepared();d.cards[catalogue.cards[0].id].rarity='Rare';
 d.cards[catalogue.cards[1].id].rarity='Légendaire';
 const s=validateRarityDecisions(d,catalogue);
 assert.equal(s.defined,2);assert.equal(s.counts.Rare,1);
 assert.equal(s.counts.Légendaire,1);assert.equal(s.pending,65);
 assert.throws(()=>validateRarityDecisions(d,catalogue,{requireComplete:true}),/65 cartes/);
});
test('refuse référence inattendue, renommage et doublons cachés',()=>{
 const d=prepared(),first=catalogue.cards[0].id;
 d.cards[first].name='Carte remplacée';
 assert.throws(()=>validateRarityDecisions(d,catalogue),/Nom modifié/);
 d.cards[first].name=catalogue.cards[0].name;
 d.cards.UNKNOWN={name:'Extra',rarity:'Rare'};
 assert.throws(()=>validateRarityDecisions(d,catalogue),/exactement 67/);
});
test('refuse données tronquées, statut inconnu et données techniques supplémentaires',()=>{
 const d=prepared(),first=catalogue.cards[0].id;
 delete d.cards[first];
 assert.throws(()=>validateRarityDecisions(d,catalogue),/exactement 67/);
 d.cards[first]={name:catalogue.cards[0].name,rarity:'MYTHIQUE'};
 assert.throws(()=>validateRarityDecisions(d,catalogue),/Rareté inconnue/);
});
test('valide une liste complète uniquement lorsque le créateur a choisi toutes les raretés',()=>{
 const d=prepared();for(const id of Object.keys(d.cards))d.cards[id].rarity='Commune';
 const s=validateRarityDecisions(d,catalogue,{requireComplete:true});
 assert.equal(s.pending,0);assert.equal(s.defined,67);
});
