import test from "node:test";
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {fileURLToPath} from "node:url";

function seed(){
  const filename=fileURLToPath(new URL("../scripts/generate-seed-161.mjs",import.meta.url));
  return execFileSync(process.execPath,[filename],{encoding:"utf8",timeout:10000});
}
test("migration SQL comprend 161 insertions du nouveau set, jamais les anciennes cartes",()=>{
  const content=seed();
  assert.equal((content.match(/INSERT INTO tcg_cards_161/g)||[]).length,161);
  assert.match(content,/td_chevelu/);
  assert.match(content,/td_lille/);
  assert.doesNotMatch(content,/VALUES\('matelas'/);
  assert.doesNotMatch(content,/DELETE FROM|TRUNCATE|DROP TABLE/i);
});
test("l'image Chevelu est hors pool normal dans la génération SQL",()=>{
  const data=seed();
  const chevelu=data.split("\n").find(line=>line.startsWith("VALUES('td_chevelu',"));
  assert.ok(chevelu);
  assert.match(chevelu,/FALSE,161\)/);
  const lille=data.split("\n").find(line=>line.startsWith("VALUES('td_lille',"));
  assert.ok(lille);
  assert.match(lille,/TRUE,160\)/);
});
test("sortie seed SQL reproductible pour migration contrôlée",()=>{
  assert.equal(seed(),seed());
});
