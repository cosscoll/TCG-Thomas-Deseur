import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const load=relative=>JSON.parse(readFileSync(path.join(root,relative),'utf8'));
const normalized=load('data/approved-artwork-uniform-105.json');
const stage=load('data/edition-staging-67.json');
const sql=readFileSync(path.join(root,'data/migrations/floot-origin-uniform-105.sql'),'utf8');
const q=value=>"'"+String(value).replaceAll("'","''")+"'";
const urlFor=image=>image.imageUrl.replace('/collection-161/assets/cards/','/collection-validee/assets/uniform/');

test('the approved visual migration only references 67 official characters and 105 public images',()=>{
 assert.equal(stage.cards.length,67);
 assert.equal(normalized.artworks.length,105);
 assert.equal(stage.cards.reduce((n,c)=>n+1+c.variants.length,0),105);
 assert.equal(normalized.artworks.filter(x=>x.kind==='main').length,67);
 assert.equal(normalized.artworks.filter(x=>x.kind==='variant').length,38);
 assert.deepEqual(normalized.size,[768,1024]);
 assert.equal(normalized.originalsUnchanged,true);
 const assets=new Set();
 for(const c of stage.cards){
  for(const image of [c.main,...c.variants]){
   assert.equal(assets.has(image.assetPath),false,'No duplicate artwork source');
   assets.add(image.assetPath);
   const entry=normalized.artworks.find(a=>a.artworkId===image.artworkId);
   assert.ok(entry,'Missing normalized image '+image.artworkId);
   assert.equal(entry.characterId,c.characterId);
   assert.equal(entry.source,image.assetPath);
   assert.equal(entry.normalized,
    image.assetPath.replace('collection-161/assets/cards/','collection-validee/assets/uniform/'));
   assert.match(entry.sourceSha256,/^[a-f0-9]{64}$/);
   assert.match(entry.sha256,/^[a-f0-9]{64}$/);
   assert.ok(entry.foregroundBounds[2]>0 && entry.foregroundBounds[3]>0);
   assert.ok(entry.foregroundBounds[0]>=0 && entry.foregroundBounds[1]>=0);
   assert.ok(entry.foregroundBounds[0]+entry.foregroundBounds[2]<=768);
   assert.ok(entry.foregroundBounds[1]+entry.foregroundBounds[3]<=1024);
  }
 }
 assert.equal(assets.size,105);
});

test('each SQL row maps correct name, original image, normalized main and all variants',()=>{
 const rows=sql.match(/^\('COST-[0-9]{3}',/gm)??[];
 assert.equal(rows.length,67);
 for(const c of stage.cards){
  const prevVariants=c.variants.map(v=>({id:v.artworkId,imagePath:v.imageUrl,reference:v.photoReference}));
  const newVariants=c.variants.map(v=>({id:v.artworkId,imagePath:urlFor(v),reference:v.photoReference}));
  const fields=[
   q(c.characterId),q(c.title),q(c.main.imageUrl),q(urlFor(c.main)),
   q(JSON.stringify(prevVariants))+'::jsonb',q(JSON.stringify(newVariants))+'::jsonb'
  ];
  const expected='('+fields.join(',')+')';
  assert.ok(sql.includes(expected),'Out-of-date SQL mapping for '+c.characterId);
 }
 // This SQL must not touch the private card, stocks, rarities or logins.
 assert.ok(!/^\('COST-.*?'.*?secret/mi.test(sql));
 assert.match(sql,/CREATE TEMP TABLE _tcg_uniform_artwork_map/);
 assert.match(sql,/WHERE live\.id = stage\.card_id AND live\.normal_booster = TRUE/);
 assert.match(sql,/UPDATE tcg_cards_origin live SET\s+image_path = stage\.new_main_url,\s+variants = stage\.new_variants/);
 assert.match(sql,/DO \$tcg_preflight\$/);
 assert.match(sql,/DO \$tcg_postflight\$/);
 assert.match(sql,/^BEGIN;/);
 assert.match(sql,/COMMIT;\s*$/);
 assert.doesNotMatch(sql,/\b(?:DELETE|TRUNCATE|DROP|ALTER|GRANT|REVOKE)\s+(?:TABLE\s+)?(?:tcg_|users)/i);
 assert.doesNotMatch(sql,/\bUPDATE\s+tcg_(?:inventory|pack_history|pack_status|reward_claims|secret)/i);
});
