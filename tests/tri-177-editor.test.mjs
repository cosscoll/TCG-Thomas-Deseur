import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {CARD_PHOTO_PAIRS_160,PHOTO_REFS_WITHOUT_ILLUSTRATION_17,PRIMARY_PAIRS_69,DUPLICATE_PAIRS_91} from '../data/correspondances-photo-illustration.js';
import {PHOTO_ORIGINS_177} from '../data/photo-origins-177.js';

const html=readFileSync(new URL('../tri-177/index.html',import.meta.url),'utf8');
const editor=readFileSync(new URL('../tri-177/editor.js',import.meta.url),'utf8');
const gallery=readFileSync(new URL('../tri-177/artworks.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../tri-177/editor.css',import.meta.url),'utf8');

test('177 photographic sources and 70 original reference groups are preserved',()=>{
 const groups=[...html.matchAll(/<section class="group" id="(COST-\d+)"/g)].map(m=>m[1]);
 const images=[...html.matchAll(/<a href="(images_nommes\/[^"]+\.webp)"/g)].map(m=>m[1]);
 const refs=[...html.matchAll(/<strong>(REF-[^<]+)<\/strong>/g)].map(m=>m[1]);
 assert.equal(groups.length,70);assert.equal(new Set(groups).size,70);
 assert.equal(images.length,177);assert.equal(new Set(images).size,177);
 assert.equal(refs.length,177);assert.equal(new Set(refs).size,177);
 for(const img of images)assert.ok(existsSync(new URL('../tri-177/'+img,import.meta.url)),'Source image missing: '+img);
});
test('the 160 existing stylized artworks have valid and uniquely mapped source references',()=>{
 assert.equal(CARD_PHOTO_PAIRS_160.length,160);
 assert.equal(PRIMARY_PAIRS_69.length,69);
 assert.equal(DUPLICATE_PAIRS_91.length,91);
 assert.equal(PHOTO_REFS_WITHOUT_ILLUSTRATION_17.length,17);
 assert.equal(new Set(CARD_PHOTO_PAIRS_160.map(c=>c.id)).size,160);
 assert.equal(new Set(CARD_PHOTO_PAIRS_160.map(c=>c.illustration)).size,160);
 assert.equal(new Set(CARD_PHOTO_PAIRS_160.map(c=>c.sourceReference)).size,160);
 for(const pair of CARD_PHOTO_PAIRS_160){
  assert.equal(PHOTO_ORIGINS_177[pair.sourceReference]?.groupId,pair.groupId);
  assert.ok(existsSync(new URL('../collection-161/assets/cards/'+pair.illustration,import.meta.url)), 'Stylized asset missing: '+pair.illustration);
 }
});
test('the editor loads the stylized catalogue rather than selecting original photo files',()=>{
 assert.match(html,/<script type="module" src="\.\/artworks\.js"><\/script>/);
 assert.match(html,/<link rel="stylesheet" href="\.\/editor\.css">/);
 assert.match(html,/<script type="module" src="\.\/details\.js"><\/script>/);
 assert.match(html,/160<\/strong> illustrations stylisées/);
 assert.match(gallery,/import \{CARD_PHOTO_PAIRS_160\}/);
 assert.match(gallery,/collection-161\/assets\/cards\//);
 assert.match(gallery,/classList\.add\('source-photos'\)/);
 assert.match(gallery,/await import\('\.\/editor\.js'\)/);
 assert.match(editor,/querySelectorAll\('\.artwork-photo'\)/);
 assert.doesNotMatch(editor,/getRefs\(group\)\{return \[\.\.\.group\.querySelectorAll\('\.photo'\)/);
 assert.ok(css.includes('.originals-details'));
 assert.ok(css.includes('.artwork-photos'));
});
test('editor validates names and one primary only; alternatives are optional and multi-select',()=>{
 assert.doesNotThrow(()=>new Function(editor));
 assert.match(editor,/const candidates=Array\.isArray\(saved\.alternatives\)/);
 assert.match(editor,/const alternatives=\[\]/);
 assert.match(editor,/s\.alternatives\.includes\(art\.ref\)/);
 assert.match(editor,/s\.alternatives=\[\.\.\.s\.alternatives,art\.ref\]/);
 assert.match(editor,/s\.alternatives=\[\];s\.shiny=false/);
 assert.match(editor,/Zéro variante est autorisé/);
 assert.match(editor,/const shiny=Boolean\(primary&&/);
 assert.match(editor,/s\.status='Validée'/);
 assert.match(editor,/s\.status==='Écartée'/);
 assert.match(editor,/ids_illustrations_alternatives/);
 assert.match(editor,/nombre_total_variantes/);
 assert.match(editor,/reference_photo_source_principale/);
 assert.match(editor,/fichier_source_shiny_a_creer/);
 assert.match(editor,/TCG_Deseur_cartes_noms_visuels\.csv/);
 assert.match(editor,/TCG_Deseur_sauvegarde_tri\.json/);
 assert.match(editor,/tcg-deseur-cards-v3/);
 assert.match(editor,/tcg-deseur-cards-v2/);
 assert.match(editor,/tcg_tri_card_v2_/);
 assert.match(editor,/window\.confirm/);
 assert.match(html,/zéro à plusieurs visuels alternatifs|aucune, une ou plusieurs illustrations alternatives/);
 assert.ok(css.includes('.variants-previews'));
});
test('normalizing previous and new choices supports 0, 1, or many variants',()=>{
 const start=editor.indexOf('function normalizeRef(');
 const end=editor.indexOf('function loadState(');
 assert.ok(start>=0&&end>start);
 const normalize=new Function('SHINY','STATUSES',editor.slice(start,end)+'\nreturn normalizeState;')(
  'SHINY_FROM_MAIN',['À examiner','Validée','Écartée']
 );
 const refs=[
  {ref:'td_1_001',sourceRef:'REF-1-002'},
  {ref:'td_1_002',sourceRef:'REF-1-003'},
  {ref:'td_1_003',sourceRef:'REF-1-004'},
  {ref:'td_1_004',sourceRef:'REF-1-005'}
 ];
 const single=normalize({name:'Une carte',primary:'td_1_001',alternatives:[],shiny:false,status:'Validée'},refs);
 assert.equal(single.status,'Validée');
 assert.deepEqual(single.alternatives,[]);
 assert.equal(single.shiny,false);
 const multiple=normalize({name:'Triple',primary:'td_1_001',alternatives:['td_1_002','td_1_003','td_1_002','td_1_001','inconnu'],shiny:true,status:'Validée'},refs);
 assert.equal(multiple.status,'Validée');
 assert.deepEqual(multiple.alternatives,['td_1_002','td_1_003']);
 assert.equal(multiple.shiny,true);
 const oldSingle=normalize({name:'Ancienne',primary:'td_1_001',alternative:'td_1_002',status:'Validée'},refs);
 assert.deepEqual(oldSingle.alternatives,['td_1_002']);
 assert.equal(oldSingle.shiny,false);
 const oldShiny=normalize({name:'Ancienne Shiny',primary:'td_1_001',alternative:'SHINY_FROM_MAIN',status:'Validée'},refs);
 assert.deepEqual(oldShiny.alternatives,[]);
 assert.equal(oldShiny.shiny,true);
 const photoMigration=normalize({name:'Photo corrigée',primary:'REF-1-002',alternative:'REF-1-003',status:'Validée'},refs);
 assert.equal(photoMigration.primary,'td_1_001');
 assert.deepEqual(photoMigration.alternatives,['td_1_002']);
 assert.equal(photoMigration.status,'À examiner');
 const zero=normalize({name:'Sans visuel',primary:'',alternatives:[],status:'Validée'},[]);
 assert.equal(zero.status,'À examiner');
});
