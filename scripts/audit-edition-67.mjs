#!/usr/bin/env node
/**
 * TCG Deseur public dataset integrity audit. No personal/secret card source, no Floot credentials.
 * It does not claim two different images of the same costume are non-duplicates:
 * perceptual review is a separate manual task.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {PHOTO_ORIGINS_177} from '../data/photo-origins-177.js';
import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const data=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const stage=data('data/edition-staging-67.json');
const approved=data('data/catalogue-valide-67.json');
const normalized=data('data/approved-artwork-uniform-105.json');
const rarities=data('data/raretes-validees-67.json');
const choices=data('data/choix-cartes-2026-10-11.json');
const byArt=new Map(normalized.artworks.map(a=>[a.artworkId,a]));
const byPair=new Map(CARD_PHOTO_PAIRS_160.map(p=>[p.id,p]));
const expected={Commune:33,Rare:21,'Épique':8,'Légendaire':4,'Hors-série':1};
const assert=(b,message)=>{if(!b)throw Error(message)};
export function audit(){
 const seenIds=new Set(),seenArt=new Set(),seenSrcHash=new Set(),seenNormHash=new Set(),seenRef=new Set();
 const notes=[],rows=[],stats={};
 assert(stage.cards.length===67,'67 known approved cards expected');
 assert(normalized.artworks.length===105,'105 normalized visuals expected');
 assert(approved.cards.length===67,'67 public catalogue cards expected');
 assert(Object.keys(rarities.cards).length===67,'67 creator rarity decisions expected');
 assert(Object.keys(choices.cards).length>=67,'Creator choices missing');
 for(const card of stage.cards){
  assert(!seenIds.has(card.characterId),'Character duplicate '+card.characterId);
  seenIds.add(card.characterId);
  const publicCard=approved.cards.find(c=>c.id===card.characterId);
  assert(publicCard?.name===card.title,'Public name mismatch '+card.characterId);
  assert(rarities.cards[card.characterId]?.name===card.title,'Rarity source name mismatch '+card.characterId);
  assert(rarities.cards[card.characterId]?.rarity===card.rarity,'Rarity source disagreement '+card.characterId);
  assert(choices.cards[card.characterId]?.name===card.title,'Creator name mismatch '+card.characterId);
  assert(choices.cards[card.characterId]?.primary===card.main.artworkId,'Creator main mismatch '+card.characterId);
  assert(JSON.stringify(choices.cards[card.characterId]?.alternatives)===JSON.stringify(card.variants.map(v=>v.artworkId)),'Creator variant mismatch '+card.characterId);
  stats[card.rarity]??={characters:0,alternatives:0};stats[card.rarity].characters++;stats[card.rarity].alternatives+=card.variants.length;
  const artworks=[['main',card.main],...card.variants.map(v=>['variant',v])];
  for(const [kind,art]of artworks){
   const norm=byArt.get(art.artworkId);
   assert(norm&&norm.characterId===card.characterId&&norm.kind===kind,'Normalized art linkage mismatch '+art.artworkId);
   assert(!seenArt.has(art.artworkId),'Art ID used twice '+art.artworkId);
   assert(!seenSrcHash.has(norm.sourceSha256),'Identical original file content appears twice '+art.artworkId);
   assert(!seenNormHash.has(norm.sha256),'Identical normalized file content appears twice '+art.artworkId);
   assert(!seenRef.has(art.photoReference),'Identical photographic reference used twice '+art.photoReference);
   seenArt.add(art.artworkId);seenSrcHash.add(norm.sourceSha256);seenNormHash.add(norm.sha256);seenRef.add(art.photoReference);
   assert(art.assetPath===norm.source,'Original asset path mismatch '+art.artworkId);
   assert(art.imageUrl.endsWith('/'+art.assetPath),'Original URL mismatch '+art.artworkId);
   const pair=byPair.get(art.artworkId);
   assert(pair?.sourceReference===art.photoReference,'Photo-reference mapping mismatch '+art.artworkId);
   const origin=PHOTO_ORIGINS_177[art.photoReference];
   assert(origin,'Photo origin missing '+art.photoReference);
   assert(origin.series&&origin.originUrl&&origin.originalFile,'Incomplete documentary origin '+art.photoReference);
   assert(norm.foregroundBounds.length===4&&norm.foregroundBounds.every(x=>Number.isInteger(x)&&x>=0),'Invalid bounds');
   const margin=Math.max(norm.foregroundBounds[0]/768,norm.foregroundBounds[1]/1024);
   const risk=margin>.24?'fort':margin>.17?'moyen':'standard';
   if(risk!=='standard')notes.push({character:card.characterId,artworkId:art.artworkId,risk,reason:'Larges marges de fond prolongé; contrôle humain du rendu recommandé'});
   if(origin.groupId!==PHOTO_ORIGINS_177[card.main.photoReference]?.groupId)notes.push({character:card.characterId,artworkId:art.artworkId,risk:'à comparer',reason:'Ancien regroupement de photos différent du personnage approuvé'});
   rows.push({
    characterId:card.characterId,name:card.title,rarity:card.rarity,kind,
    artworkId:art.artworkId,photoReference:art.photoReference,
    photographicTitle:origin.title,documentarySeries:origin.series,documentaryUrl:origin.originUrl,
    originalImagePath:norm.source,finalImagePath:norm.normalized,
    width:768,height:1024,sourceWidth:norm.sourceSize[0],sourceHeight:norm.sourceSize[1],
    sourceSha256:norm.sourceSha256,uniformSha256:norm.sha256,reviewPriority:risk
   });
  }
 }
 assert(rows.length===105&&seenArt.size===105,'Exactly 105 artworks required');
 for(const [r,count] of Object.entries(expected))assert(stats[r]?.characters===count,'Rarity count mismatch '+r);
 assert(Object.values(stats).reduce((n,o)=>n+o.alternatives,0)===38,'38 alternatives required');
 assert(normalized.artworks.every(a=>seenArt.has(a.artworkId)),'Unattached normalized artwork');
 return {rows,stats,notes,counts:{characters:67,artworks:105,alternatives:38,sourceHashes:seenSrcHash.size,normalizedHashes:seenNormHash.size,photographicReferences:seenRef.size}};
}
const esc=v=>'"'+String(v??'').replaceAll('"','""')+'"';
export function csv(rows){
 const keys=Object.keys(rows[0]||{});
 return '\uFEFF'+keys.join(';')+'\n'+rows.map(r=>keys.map(k=>esc(r[k])).join(';')).join('\n')+'\n';
}
export function markdown(report){
 const {rows,stats,notes,counts}=report;
 const lines=['# TCG Deseur — audit reproductible du catalogue de 67 personnages','',
 '> Rapport automatique limité aux **67 personnages publics**. Aucune identité de la Carte mystère ou donnée utilisateur n’est exportée. L’origine documentaire indiquée n’est **pas** une attribution vidéo/scène certifiée.','',
 '## Contrôles techniques réussis','',
 '- 67 personnages : identifiants, noms, références principales et raretés identiques dans les **choix du créateur**, la collection publiée, le catalogue Floot préparatoire et les raretés approuvées.',
 '- 105 illustrations référencées une seule fois, dont **38 alternatives** ; 105 références de photos uniques.',
 '- 105 empreintes SHA-256 d’originaux distinctes ; 105 empreintes SHA-256 des exports distinctes. **Cela ne permet pas de conclure à l’absence de doublons de costume ou de scène**.',
 '- Pour chaque illustration, correspondance de photo source documentée et image finale normalisée en **768 × 1 024 px**.',
 '',
 '| Rareté | Personnages | Alternatives associées |',
 '| --- | ---: | ---: |'];
 for(const [r,c]of Object.entries(stats))lines.push('| '+r+' | '+c.characters+' | '+c.alternatives+' |');
 lines.push('','## Alertes de revue humaine (non bloquantes)','',
 'Les rapports de dimensions sont un **signal de contrôle**, pas un défaut établi. Une marge étendue peut être esthétique ou nécessiter une retouche selon la photo. Les anciens regroupements documentaires peuvent différer des regroupements artistiques validés par le créateur.','',
 '| Carte | Illustration | Type d’alerte | Justification |','| --- | --- | --- | --- |');
 if(!notes.length)lines.push('| — | — | Aucune anomalie automatique | La revue visuelle reste nécessaire |');
 else for(const v of notes)lines.push('| '+v.character+' | '+v.artworkId+' | '+v.risk+' | '+v.reason+' |');
 lines.push('','## Fichiers à utiliser','',
 '- **Atelier visuel** : https://cosscoll.github.io/TCG-Thomas-Deseur/audit-visuels/ — revue côte à côte, annotations locales et exports JSON/CSV.',
 '- **Matrice exhaustive** : \`data/audit-catalogue-105.csv\` — 105 lignes avec noms, raretés, source documentaire, URL, dimensions, sommes de contrôle et priorité de revue.',
 '- Source de vérité : \`data/choix-cartes-2026-10-11.json\`, \`data/raretes-validees-67.json\`, \`data/edition-staging-67.json\`.',
 '',
 '## Limites et suite','',
 'Le rapprochement de costumes et de scènes **demande une validation visuelle humaine**. Les URLs documentaires ne garantissent pas une vidéo ou une séquence spécifique. Ne modifier ni noms ni regroupements approuvés sur la base de cette seule analyse. Les éventuels choix de retouche ou d’alternative pourront être importés après validation du propriétaire.','',
 'Rapport régénérable par \`node scripts/audit-edition-67.mjs --write\`.',
 ''
 );
 return lines.join('\n');
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){
 const report=audit();
 if(process.argv.includes('--write')){
  fs.writeFileSync(path.join(root,'docs/AUDIT_CATALOGUE_67_2026-10-13.md'),markdown(report),'utf8');
  fs.writeFileSync(path.join(root,'data/audit-catalogue-105.csv'),csv(report.rows),'utf8');
 }
 console.log(JSON.stringify({counts:report.counts,byRarity:report.stats,reviewFlags:report.notes.length},null,2));
}
