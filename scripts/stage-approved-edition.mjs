/** Préparation d'édition 67 personnages + 38 illustrations alternatives.
 *
 * N'écrit JAMAIS dans Floot et ne modifie aucun joueur. Aucune rareté
 * ni méthode de distribution n'est déduite des illustrations.
 *
 * CLI (lecture seule) :
 *    node scripts/stage-approved-edition.mjs
 *    node scripts/stage-approved-edition.mjs --json
 */
import {readFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {CARDS as historicalCards} from '../data/cards.js';

const publicAssets='https://cosscoll.github.io/TCG-Thomas-Deseur/';
const catalogue=JSON.parse(readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));

function assetRef(art){
 assert.ok(art && typeof art==='object','Illustration manquante');
 assert.match(art.artworkId,/^td_(?:1|2|3)_\d{3}$|^td_lille$/,'Référence graphique inattendue');
 assert.match(art.asset,/^collection-161\/assets\/cards\/td-(?:[123]-\d{3}|lille)\.webp$/,'Lien illustration invalide');
 assert.match(art.photoReference,/^REF-(?:[123]-\d{3}|177-LILLE)$/,'Photo source manquante');
 const assetPath=new URL('../'+art.asset,import.meta.url);
 assert.ok(existsSync(assetPath),'Illustration absente du dépôt : '+art.asset);
 return Object.freeze({
  artworkId:art.artworkId,
  assetPath:art.asset,
  imageUrl:publicAssets+art.asset,
  photoReference:art.photoReference
 });
}

export function stageApprovedEdition(input,{legacyIds=historicalCards.map(c=>c.id)}={}){
 assert.equal(input?.schema,'tcg-deseur-approved-catalogue-v1','Manifeste non approuvé');
 assert.ok(Array.isArray(input.cards) && input.cards.length===67,'La sélection doit contenir 67 cartes');
 assert.deepEqual(input.summary,{cards:67,existingVariants:38,excludedGroups:3,usedArtworks:105},'Synthèse du tri modifiée');
 const knownLegacy=new Set(legacyIds),foundIds=new Set(),foundArts=new Set();
 const cards=input.cards.map((card,index)=>{
  assert.match(card.id,/^COST-\d{3}$/,'Identifiant de personnage invalide');
  assert.ok(!foundIds.has(card.id),'Personnage en double : '+card.id);
  assert.ok(!knownLegacy.has(card.id),'Collision avec un identifiant historique : '+card.id);
  foundIds.add(card.id);
  assert.ok(typeof card.name==='string'&&card.name.trim()===card.name&&card.name.length>0,'Nom de carte non validé : '+card.id);
  assert.ok(Array.isArray(card.variants),'Variantes mal formées : '+card.id);
  const main=assetRef(card.main);
  const variants=card.variants.map(assetRef);
  for(const visual of [main,...variants]){
   assert.ok(!foundArts.has(visual.artworkId),'Visuel réutilisé par plusieurs cartes : '+visual.artworkId);
   foundArts.add(visual.artworkId);
  }
  return Object.freeze({
   characterId:card.id,
   title:card.name,
   ordinal:index+1,
   main,
   variants,
   rarity:null,
   variantsCollectingRule:null
  });
 });
 assert.equal(foundIds.size,67);
 assert.equal(foundArts.size,105);
 assert.equal(cards.reduce((n,c)=>n+c.variants.length,0),38);
 assert.equal(input.excludedGroups?.length,3,'Éléments écartés non comptabilisés');
 assert.ok(input.excludedGroups.every(id=>!foundIds.has(id)),'Un groupe écarté est inclus');
 return Object.freeze({
  schema:'tcg-deseur-edition-staging-v1',
  status:'NON_DÉPLOYABLE_AVANT_DÉCISIONS',
  source:'data/catalogue-valide-67.json',
  edition:{characterCount:67,baseArtworks:67,variantArtworks:38,totalArtworks:105},
  questionsPending:['rarityPerCharacter','variantObtainingRule','variantCompletionEffect'],
  cards
 });
}
const stagedEdition=stageApprovedEdition(catalogue);
const invoked=process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(invoked){
 if(process.argv.includes('--json'))console.log(JSON.stringify(stagedEdition,null,2));
 else console.log(JSON.stringify({status:stagedEdition.status,source:stagedEdition.source,...stagedEdition.edition,questionsPending:stagedEdition.questionsPending},null,2));
}
