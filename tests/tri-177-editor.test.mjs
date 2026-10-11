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
test('card editor validates names and stylized main/alternative choices with backup',()=>{
 assert.doesNotThrow(()=>new Function(editor));
 assert.ok(editor.includes('SHINY_FROM_MAIN'));
 assert.ok(editor.includes("s.status='Validée'"));
 assert.ok(editor.includes("s.status==='Écartée'"));
 assert.ok(editor.includes('id_illustration_principale'));
 assert.ok(editor.includes('id_illustration_alternative'));
 assert.ok(editor.includes('reference_photo_source_principale'));
 assert.ok(editor.includes('fichier_source_shiny_a_creer'));
 assert.ok(editor.includes('TCG_Deseur_cartes_noms_visuels.csv'));
 assert.ok(editor.includes('TCG_Deseur_sauvegarde_tri.json'));
 assert.ok(editor.includes('tcg_tri_card_v2_'));
 assert.ok(editor.includes("read('tcg_tri_photo_'"));
 assert.ok(editor.includes("read('tcg_tri_'"));
 assert.ok(editor.includes('window.confirm'));
});
