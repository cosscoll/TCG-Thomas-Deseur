import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html=readFileSync(new URL('../floot-collection/demo.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../floot-collection/demo.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../floot-collection/demo.css',import.meta.url),'utf8');

test('the separate binder demo is explicitly non-connected and not indexable',()=>{
  assert.match(html,/lang="fr"/);
  assert.match(html,/noindex,nofollow/);
  assert.match(html,/Aperçu non connecté/);
  assert.match(html,/quantités ci-dessous sont fictives/);
});

test('interactive controls and status IDs exist in the HTML',()=>{
  for(const id of ['unique','copies','extras','missing','completion','progress-fill','rarity-progress','cards','search','ownership','rarity','sort','shown','no-results','clear-filters']){
    assert.match(html,new RegExp(`id="${id}"`));
  }
});

test('the module actually imports the pure collection model and the 49 cards',()=>{
  assert.match(js,/import \{ CARDS \} from '\.\.\/data\/cards\.js'/);
  assert.match(js,/buildCollectionModel/);
  assert.match(js,/filterCollectionCards/);
});

test('no account or inventory API calls and no local persistence in the demo',()=>{
  for(const forbidden of [/fetch\(/, /XMLHttpRequest/, /localStorage/, /sessionStorage/, /document\.cookie/, /claimCloudBooster/, /openDemoPack\(/]){
    assert.doesNotMatch(js,forbidden);
  }
});

test('the demo provides empty, sample and fully collected examples only',()=>{
  for(const scenario of ['sample','empty','complete']){
    assert.match(html,new RegExp(`data-scenario="${scenario}"`));
    assert.match(js,new RegExp(`\\b${scenario}:`));
  }
});

test('CSS supports small screens and reduced motion',()=>{
  assert.match(css, /max-width: 650px/);
  assert.match(css, /max-width: 380px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test('no real artwork URL is hardcoded in the demo',()=>{
  assert.doesNotMatch(html,/\.(?:jpg|jpeg|png|webp)"/i);
  assert.doesNotMatch(js, /https?:\/\/[^'"]+\.(?:jpg|jpeg|png|webp)/i);
});
