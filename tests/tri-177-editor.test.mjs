import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import path from 'node:path';

const html=readFileSync(new URL('../tri-177/index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../tri-177/editor.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../tri-177/editor.css',import.meta.url),'utf8');

test('177 photos and 70 original reference groups are preserved',()=>{
 const groups=[...html.matchAll(/<section class="group" id="(COST-\d+)"/g)].map(m=>m[1]);
 const images=[...html.matchAll(/<a href="(images_nommes\/[^"]+\.webp)"/g)].map(m=>m[1]);
 const refs=[...html.matchAll(/<strong>(REF-[^<]+)<\/strong>/g)].map(m=>m[1]);
 assert.equal(groups.length,70);
 assert.equal(new Set(groups).size,70);
 assert.equal(images.length,177);
 assert.equal(new Set(images).size,177);
 assert.equal(refs.length,177);
 assert.equal(new Set(refs).size,177);
 for(const img of images)assert.ok(existsSync(new URL('../tri-177/'+img,import.meta.url)),'Image missing: '+img);
});
test('new editor assets are wired without removing photo provenance',()=>{
 assert.match(html,/<script src="\.\/editor\.js"><\/script>/);
 assert.match(html,/<link rel="stylesheet" href="\.\/editor\.css">/);
 assert.match(html,/<script type="module" src="\.\/details\.js"><\/script>/);
 assert.match(html,/Nom de la carte|crée et valide tes cartes/);
 assert.ok(css.includes('.card-previews'));
});
test('editor JavaScript parses and retains required operations',()=>{
 assert.doesNotThrow(()=>new Function(js));
 assert.ok(js.includes('SHINY_FROM_MAIN'));
 assert.ok(js.includes("s.status='Validée'"));
 assert.ok(js.includes("s.status==='Écartée'"));
 assert.ok(js.includes('reference_visuel_principal'));
 assert.ok(js.includes('reference_visuel_alternatif'));
 assert.ok(js.includes('TCG_Deseur_cartes_noms_visuels.csv'));
 assert.ok(js.includes('tcg_tri_card_v2_'));
 assert.ok(js.includes("read('tcg_tri_photo_'"));
 assert.ok(js.includes("read('tcg_tri_'"));
 assert.ok(js.includes('window.confirm'));
});
