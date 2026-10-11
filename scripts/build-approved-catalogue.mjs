/** Prépare un manifeste public de la collection approuvée, sans modification
 * des comptes, des boosters, des données Floot ni des données cachées.
 * Exécuter : node scripts/build-approved-catalogue.mjs
 */
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const choices=JSON.parse(readFileSync(resolve(root,'data/choix-cartes-2026-10-11.json'),'utf8'));
if(choices.schema!=='tcg-deseur-cards-v3')throw Error('Schéma de tri inattendu');
const pairs=new Map(CARD_PHOTO_PAIRS_160.map(c=>[c.id,c]));
const cards=[],excluded=[],seenArt=new Set();
for(const [group,decision] of Object.entries(choices.cards).sort(([a],[b])=>a.localeCompare(b))){
 if(decision.status==='Écartée'){excluded.push(group);continue}
 if(decision.status!=='Validée')throw Error('Carte non validée : '+group);
 if(!decision.name?.trim()||!decision.primary)throw Error('Nom ou visuel principal manquant : '+group);
 if(!Array.isArray(decision.alternatives))throw Error('Variantes mal formées : '+group);
 if(decision.shiny)throw Error('Illustration Shiny non produite : '+group);
 const artwork=(ref)=>{
  const match=pairs.get(ref);
  if(!match||match.groupId!==group)throw Error('Illustration dans un groupe incorrect : '+group+' / '+ref);
  if(seenArt.has(ref))throw Error('Illustration utilisée plusieurs fois : '+ref);
  seenArt.add(ref);
  const file='collection-161/assets/cards/'+match.illustration;
  if(!existsSync(resolve(root,file)))throw Error('Fichier stylisé absent : '+file);
  return {artworkId:match.id,asset:file,photoReference:match.sourceReference};
 };
 const main=artwork(decision.primary);
 const variants=decision.alternatives.map(artwork);
 cards.push({id:group,name:decision.name,main,variants});
}
if(cards.length!==67||excluded.length!==3||seenArt.size!==105||
 cards.reduce((n,c)=>n+c.variants.length,0)!==38)
 throw Error('Sélection incohérente (attendu : 67 cartes / 38 variantes / 3 exclusions)');
const output={
 schema:'tcg-deseur-approved-catalogue-v1',
 source:'data/choix-cartes-2026-10-11.json',
 savedAt:choices.savedAt,
 summary:{cards:cards.length,existingVariants:38,excludedGroups:excluded.length,usedArtworks:seenArt.size},
 // Stable ids are provisional for future Floot migration. Do not replace
 // the current 49-card server inventory without mapping/backups.
 cards,excludedGroups:excluded
};
writeFileSync(resolve(root,'data/catalogue-valide-67.json'),JSON.stringify(output,null,2)+'\n');
console.log('Catalogue validé généré : '+cards.length+' cartes, 38 variantes.');
