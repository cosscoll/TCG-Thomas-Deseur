#!/usr/bin/env node
/** Hypothetical variants comparison. Never alters game probability rules. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {oneBooster,seededRandom} from './simuler-boosters-67.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const quantile=(s,p)=>s[Math.floor((s.length-1)*p)];
export function compareVariants({cohorts=750,seed=20261014}={}){
 const rng=seededRandom(seed),policy={sameCharacter:[],independentArtwork:[]};
 for(let i=0;i<cohorts;i++){
  const main=new Set(),independent=new Set();
  let regularFinished=null,allFinished=null;
  for(let pack=1;pack<=12000;pack++){
   const draws=oneBooster(rng);
   for(const draw of draws){
    main.add(draw.card.characterId);
    independent.add(draw.alternative ? draw.artworkId : draw.card.main.artworkId);
   }
   if(main.size===67&&regularFinished===null)regularFinished=pack;
   if(independent.size===105&&allFinished===null)allFinished=pack;
   if(regularFinished!==null&&allFinished!==null)break;
  }
  if(regularFinished===null||allFinished===null)throw Error('Incomplete simulation at 12,000 boosters');
  policy.sameCharacter.push(regularFinished);
  policy.independentArtwork.push(allFinished);
 }
 const summarize=a=>{a.sort((x,y)=>x-y);return {min:a[0],p10:quantile(a,.1),median:quantile(a,.5),
  mean:Math.round(a.reduce((n,v)=>n+v,0)/a.length),p90:quantile(a,.9),max:a.at(-1)}};
 return {cohorts,seed,scenarios:{characters67:summarize(policy.sameCharacter),artworks105:summarize(policy.independentArtwork)}};
}
export function markdown(x){
 const a=x.scenarios.characters67,b=x.scenarios.artworks105;
 return [
 '# TCG Deseur — impact possible des 38 variantes sur la complétion (étude hypothétique)','',
 '> **Aucune modification de règle ni de serveur.** Modèle d’aide à la décision, fondé sur la politique technique provisoire de 10 % d’alternatives à l’emplacement 4, choisies de manière uniforme parmi 38 visuels.','',
 '## Scénarios étudiés','',
 'A — **67 personnages distincts** : une illustration alternative d’un personnage peut contribuer à sa découverte. C’est l’interprétation provisoire actuelle du classeur connecté.',
 '',
 'B — **105 illustrations distinctes** : chaque visuel principal et chacun des 38 alternatifs doit être obtenu séparément ; une alternative ne compte alors pas comme acquisition de sa version principale. **Cette règle n’a pas été validée par le créateur.**',
 '',
 'Les cinq probabilités d’emplacements et les 67 raretés ne changent pas entre les deux hypothèses. Aucune mécanique d’échange, pity-system, garantie ou récompense n’est ajoutée.',
 '',
 '## Résultats de '+x.cohorts+' cohortes fictives','',
 '| Mesure | A — 67 personnages | B — 105 images |',
 '| --- | ---: | ---: |',
 '| Minimum | '+a.min+' | '+b.min+' |',
 '| 10e percentile | '+a.p10+' | '+b.p10+' |',
 '| Médiane | '+a.median+' | '+b.median+' |',
 '| Moyenne | '+a.mean+' | '+b.mean+' |',
 '| 90e percentile | '+a.p90+' | '+b.p90+' |',
 '| Maximum | '+a.max+' | '+b.max+' |',
 '',
 '**Interprétation :** faire des 38 alternatives une condition supplémentaire pourrait rallonger fortement la complétion. Ce résultat dépend du choix uniforme des variantes ; modifier ce choix produirait d’autres chiffres. En bêta avec boosters illimités, le nombre de boosters reste le même mais n’est pas une durée en jours.',
 '',
 '## Choix à soumettre au créateur (ne pas activer sans accord)','',
 '1. Les alternatives sont seulement des versions cosmétiques du même personnage, conservées dans l’historique de tirage.',
 '2. Chaque alternative a son propre compteur d’inventaire, mais **n’est pas obligatoire** pour obtenir le booster de collection.',
 '3. Chaque alternative a son compteur et **compte pour une collection complète de 105 illustrations** (plus difficile).',
 '',
 'Le nombre de personnages du classeur public demeure **67 connus + une Carte mystère**, quelle que soit la décision ; une version graphique ne devient pas automatiquement un nouveau personnage.',
 '',
 'Simulation reproductible : node scripts/comparer-variantes-collection.mjs --report ; aucune connexion Floot.',
 ''
 ].join('\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const x=compareVariants({cohorts:750});
 if(process.argv.includes('--report'))
  fs.writeFileSync(path.join(root,'docs/COMPARAISON_VARIANTES_67_VS_105_2026-10-13.md'),markdown(x),'utf8');
 console.log(JSON.stringify(x,null,2));
}
