import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// Seul le texte public diffusé au visiteur est soumis à cette règle.
// Les noms des propriétés JS internes restent hors de cette vérification.
const publicDocuments=[
 '../README.md',
 '../index.html',
 '../beta/index.html',
 '../collection-validee/index.html',
 '../collection-161/index.html'
];
function humanCopy(content){
 return content.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi,'')
  .replace(/<[^>]+>/g,' ')
  .replace(/\s+/g,' ');
}
test('the published onboarding and collection pages never reveal an unreleased item',()=>{
 for(const file of publicDocuments){
  const content=humanCopy(fs.readFileSync(new URL(file,import.meta.url),'utf8'));
  assert.doesNotMatch(content,/carte\s+secr[eè]te|secret\s+card|une\s+surprise|une\s+carte\s+cach[eé]e|chevelu/i,'Spoiler in '+file);
 }
});
test('collecting the full edition advertises a booster, without detailing its contents',()=>{
 const source=humanCopy(fs.readFileSync(new URL('../collection-161/index.html',import.meta.url),'utf8'));
 assert.match(source,/booster de collection/i);
 assert.match(source,/160\s*\/\s*160/);
 assert.doesNotMatch(source,/une\s+surprise/i);
});
