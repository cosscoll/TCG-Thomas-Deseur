#!/usr/bin/env node
/**
 * TCG Deseur: reproducible LOCAL simulation (no network calls, account, inventory or Floot write).
 * ONLY the 67 approved characters. An alternative is an artwork, not a 68th character.
 * Runs 1,000,000 fictional boosters + cohort completion study and prints a Markdown report.
 * Usage: node scripts/simuler-boosters-67.mjs [--report] [--quick]
 */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=p=>JSON.parse(readFileSync(path.join(root,p),'utf8'));
const manifest=load('data/edition-staging-67.json');
const rules=load('data/regles-booster-67.json');
const cards=manifest.cards;
const rarityToLocal={'Commune':'Commune','Rare':'Rare','Épique':'Épique','Légendaire':'Légendaire','Hors-série':'Hors-série'};
const pool=Object.fromEntries(Object.keys(rarityToLocal).map(r=>[r,cards.filter(x=>x.rarity===r)]));
const alternatives=cards.flatMap(c=>c.variants.map(v=>({c,v})));
export const expectedCounts={Commune:33,Rare:21,'Épique':8,'Légendaire':4,'Hors-série':1};
if(cards.length!==67||alternatives.length!==38)throw Error('Approved edition required');
for(const [r,count] of Object.entries(expectedCounts))if(pool[r].length!==count)throw Error('Invalid approved rarities');

export function seededRandom(seed=20261013){
 let state=seed>>>0;
 return ()=>{
  state=(state+0x6D2B79F5)|0;
  let t=Math.imul(state^state>>>15,1|state);
  t^=t+Math.imul(t^t>>>7,61|t);
  return ((t^t>>>14)>>>0)/4294967296;
 };
}
const pick=(a,rng)=>a[Math.floor(rng()*a.length)];
export function oneBooster(rng){
 const drawn=[];
 const byRarity=r=>({card:pick(pool[r],rng),alternative:false,slot:drawn.length+1});
 for(let slot=1;slot<=5;slot++){
  if(slot<=3){drawn.push(byRarity('Commune'));continue}
  const roll=Math.floor(rng()*100);
  if(slot===4){
   if(roll<90)drawn.push(byRarity('Rare'));
   else{const a=pick(alternatives,rng);drawn.push({card:a.c,alternative:true,artworkId:a.v.artworkId,slot})}
  }else{
   const rarity=roll<80?'Rare':roll<97?'Épique':roll<99?'Légendaire':'Hors-série';
   drawn.push(byRarity(rarity));
  }
 }
 return drawn;
}
const quantile=(list,p)=>list[Math.min(list.length-1,Math.max(0,Math.floor((list.length-1)*p)))];
export function run({count=1000000,cohorts=1000,seed=20261013}={}){
 const rng=seededRandom(seed);
 const slots=Array.from({length:5},()=>({Commune:0,Rare:0,'Épique':0,'Légendaire':0,'Hors-série':0,alternative:0}));
 let duplicatePositions=0;
 const distinct=new Set();
 const sampleCheckpoints={1:0,5:0,10:0,25:0,50:0,100:0,250:0,500:0,1000:0};
 for(let pack=1;pack<=count;pack++){
  const draw=oneBooster(rng);
  const seen=new Set();
  for(let i=0;i<5;i++){
   const x=draw[i],key=x.card.characterId;
   slots[i][x.alternative?'alternative':x.card.rarity]++;
   if(seen.has(key))duplicatePositions++;
   seen.add(key);
   distinct.add(key);
  }
  if(Object.hasOwn(sampleCheckpoints,pack))sampleCheckpoints[pack]=distinct.size;
 }
 const completions=[];
 let totalCohortBoosters=0;
 for(let i=0;i<cohorts;i++){
  const found=new Set();
  let packs=0;
  while(found.size<67&&packs<15000){
   packs++;
   for(const draw of oneBooster(rng))found.add(draw.card.characterId);
  }
  if(found.size!==67)throw Error('A cohort did not complete after 15000 booster attempts');
  completions.push(packs);totalCohortBoosters+=packs;
 }
 completions.sort((a,b)=>a-b);
 return {seed,boosterCount:count,cohortCount:cohorts,slots,
  duplicatePositions,sampleCheckpoints,
  completion:{min:completions[0],p10:quantile(completions,.1),median:quantile(completions,.5),
   mean:Math.round(totalCohortBoosters/cohorts),p90:quantile(completions,.9),max:completions.at(-1)},
  alternativeArtworks:alternatives.length,distinctCharacters:distinct.size
 };
}
function fmt(n){return Number(n).toLocaleString('fr-FR')}
export function renderReport(x){
 const lines=[
 '# TCG Deseur — étude quantitative des boosters (simulation hors ligne)',
 '',
 '> **Simulation, pas comportement garanti ni tirage réel**. Aucun compte, aucune carte, aucun booster Floot utilisé.',
 '',
 'Source : \`data/edition-staging-67.json\` et \`data/regles-booster-67.json\`. Les cartes alternatives sont choisies **uniformément parmi les 38 visuels** uniquement pour la simulation ; elles comptent pour le personnage de base, comme dans la règle serveur temporaire. Ce traitement des alternatives reste à faire confirmer.',
 '',
 '## Hypothèses et volumes',
 '',
 '- '+fmt(x.boosterCount)+' boosters fictifs, '+fmt(x.boosterCount*5)+' positions simulées.',
 '- '+fmt(x.cohortCount)+' joueurs fictifs indépendants, collection vide et boosters sans échange entre joueurs.',
 '- Graine pseudo-aléatoire reproductible : '+x.seed+'. Le serveur réel utilise un générateur cryptographique, contrairement à cet outil purement analytique.',
 '- Probabilités **par emplacement** fixées par le créateur : 1–3 Communes à 100 %, position 4 Rare 90 % ou Alternative 10 %, position 5 Rare 80 % / Épique 17 % / Légendaire 2 % / Hors-série 1 %.',
 '',
 '## Fréquences observées et attentes théoriques',
 '',
 '| Emplacement | Catégorie | Observé | Observé (%) | Attendu (%) |',
 '| --- | --- | ---: | ---: | ---: |'
 ];
 for(let i=0;i<5;i++){
  const expected=rules.slots[i].outcomes.map(o=>({type:o.kind==='alternative'?'alternative':o.rarity,percentage:o.percentage}));
  for(const e of expected){
   const got=x.slots[i][e.type]??0;
   lines.push('| '+(i+1)+' | '+e.type+' | '+fmt(got)+' | '+(100*got/x.boosterCount).toFixed(3).replace('.',',')+' % | '+e.percentage+' % |');
  }
 }
 lines.push('','## Temps nécessaire pour les 67 personnages distincts','',
 '| Indicateur | Nombre de boosters | À un booster/jour |',
 '| --- | ---: | ---: |',
 '| Meilleur des '+fmt(x.cohortCount)+' cas simulés | '+fmt(x.completion.min)+' | '+fmt(x.completion.min)+' jours |',
 '| 10e percentile | '+fmt(x.completion.p10)+' | '+fmt(x.completion.p10)+' jours |',
 '| Médiane | '+fmt(x.completion.median)+' | '+fmt(x.completion.median)+' jours |',
 '| Moyenne | '+fmt(x.completion.mean)+' | '+fmt(x.completion.mean)+' jours |',
 '| 90e percentile | '+fmt(x.completion.p90)+' | '+fmt(x.completion.p90)+' jours |',
 '| Maximum simulé | '+fmt(x.completion.max)+' | '+fmt(x.completion.max)+' jours |',
 '',
 'La conversion en jours suppose exactement un booster par jour sans jours manqués, et ne s’applique pas à la bêta où les boosters doivent être illimités. **Ce ne sont pas des dates de fin garanties**.',
 '',
 'Les cartes Légendaires (2 % sur la 5e position, réparties entre 4 personnages) constituent probablement le principal facteur de durée : une Légendaire donnée a 0,5 % de chance par booster, hors alternatives. Pour la seule Hors-série, la probabilité est de 1 % par booster, hors alternatives.',
 '',
 '## Doublons et progression',
 '',
 '- '+fmt(x.duplicatePositions)+' répétitions au sein du **même booster** sur '+fmt(x.boosterCount)+' ouvertures simulées. Un même personnage peut aussi réapparaître dans les boosters suivants, ce qui n’augmente pas la progression en cartes distinctes.',
 '- Les alternatives ne créent pas de personnage supplémentaire : la progression requiert les **67 personnages connus**, pas les 105 visuels.',
 '',
 '## Réserves et décisions',
 '',
 'Le modèle ne comprend pas : échange de cartes, carte de récompense, bonus anti-doublons, achats, récompenses éventuelles, futurs changements de rareté, ou variations de l’algorithme après lancement. Il **ne prouve pas** la conformité statistique du serveur Floot sans recette authentifiée en production.',
 '',
 'Pour réduire la difficulté sans toucher aux taux validés, une étude ultérieure pourrait comparer un système d’échanges ou de protection contre les doublons. **Aucun de ces mécanismes n’est décidé ni activé.**',
 '',
 '## Validation du programme',
 '',
 'Commande reproductible : \`node scripts/simuler-boosters-67.mjs --report\`.',
 ''
 );
 return lines.join('\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const quick=process.argv.includes('--quick');
 const x=run({count:quick?10000:1000000,cohorts:quick?50:1000});
 const report=renderReport(x);
 if(process.argv.includes('--report')){
  mkdirSync(path.join(root,'docs'),{recursive:true});
  writeFileSync(path.join(root,'docs/ANALYSE_PROBABILITES_67_2026-10-13.md'),report,'utf8');
 }
 console.log(JSON.stringify({simulations:x.boosterCount,cohorts:x.cohortCount,completion:x.completion,counts:x.slots},null,2));
}
