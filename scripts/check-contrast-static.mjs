#!/usr/bin/env node
/** Contrast spot check for chosen static color pairs; NOT a WCAG certification. */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const pairs=[
 {page:'Collection',element:'Texte principal',fg:'#fbf9fe',bg:'#100d1a'},
 {page:'Collection',element:'Texte secondaire',fg:'#c9bfd4',bg:'#241a35'},
 {page:'Collection',element:'Filtres et contrôles',fg:'#e0d5e7',bg:'#100d1a'},
 {page:'Bêta',element:'Texte principal',fg:'#f7f3fb',bg:'#100c18'},
 {page:'Bêta',element:'Texte secondaire',fg:'#d1c4d9',bg:'#24182e'},
 {page:'Atelier 105',element:'Texte principal',fg:'#f9f5ff',bg:'#120e1d'},
 {page:'Atelier 105',element:'Texte secondaire',fg:'#d0c5dd',bg:'#241c32'},
 {page:'Atelier 105',element:'Bouton standard',fg:'#ffffff',bg:'#423450'},
 {page:'Atelier 105',element:'Bouton danger',fg:'#ffffff',bg:'#462b36'},
 {page:'Suivi 88',element:'Texte secondaire',fg:'#d9cce1',bg:'#241a35'},
 {page:'Suivi 88',element:'Accent sur fond principal',fg:'#f7c98e',bg:'#130e21'},
 {page:'Atelier PNG',element:'Accent secondaire',fg:'#f7d2a0',bg:'#241c33'}
];
export function luminance(hex){
 if(!/^#[a-fA-F0-9]{6}$/.test(hex))throw Error('6-digit hexadecimal color required');
 const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)
  .map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4));
 return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
export function ratio(a,b){
 const [l1,l2]=[luminance(a),luminance(b)].sort((x,y)=>y-x);
 return (l1+.05)/(l2+.05);
}
export function assess(){
 return pairs.map(p=>({...p,ratio:ratio(p.fg,p.bg),aa:ratio(p.fg,p.bg)>=4.5?'passe':'échec'}));
}
export function markdown(items){
 return [
 '# TCG Deseur — contrôle ciblé des contrastes, 13 octobre 2026','',
 '> Test de paires de couleurs explicites, pas une certification WCAG ni l’inspection de tous les états graphiques.','',
 '| Page | Élément | Texte | Fond | Contraste | AA texte normal 4,5:1 |',
 '| --- | --- | --- | --- | ---: | --- |',
 ...items.map(x=>'| '+x.page+' | '+x.element+' | '+x.fg+' | '+x.bg+' | '+x.ratio.toFixed(2).replace('.',',')+':1 | '+(x.aa==='passe'?'Oui':'Non')+' |'),
 '',
 '**Minimum de ces paires : '+Math.min(...items.map(i=>i.ratio)).toFixed(2).replace('.',',')+':1.**','',
 'Non couverts : dégradés, focus/hover/disabled, overlays, contraste non textuel, zoom, lecteurs d’écran et interface authentifiée Floot.','',
 'Commande : node scripts/check-contrast-static.mjs --write.',''
 ].join('\n');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const results=assess();
 if(results.some(x=>x.aa!=='passe'))throw Error('Documented pair fails text contrast 4.5:1');
 if(process.argv.includes('--write'))
  fs.writeFileSync(path.join(root,'docs/CONTRASTES_PUBLICS_2026-10-13.md'),markdown(results),'utf8');
 console.log(JSON.stringify({tested:results.length,lowestRatio:Math.min(...results.map(r=>r.ratio))},null,2));
}
