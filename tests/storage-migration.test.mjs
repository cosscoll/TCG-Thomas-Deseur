import test from "node:test";
import assert from "node:assert/strict";
import { readMigratedStorage } from "../game/legacy-storage.js";

function makeStorage(initial={}) {
  const rows = new Map(Object.entries(initial));
  return {
    rows,
    getItem:key=>rows.get(key)??null,
    setItem:(key,value)=>rows.set(key,String(value)),
  };
}
test("migre les données de démonstration vers TCG Thomas Deseur sans effacer l'ancien stockage",()=>{
  const key="tcg-thomas-deseur:solo-progress:v1";
  const legacy="budget-illimite:solo-progress:v1";
  const original='{"played":9,"won":4}';
  const storage=makeStorage({[legacy]:original});
  assert.equal(readMigratedStorage(storage,key),original);
  assert.equal(storage.getItem(key),original);
  assert.equal(storage.getItem(legacy),original);
});
test("les nouvelles données ont priorité, aucune régression vers l'ancienne sauvegarde",()=>{
  const key="tcg-thomas-deseur:solo-difficulty:v1";
  const storage=makeStorage({[key]:"normal","budget-illimite:solo-difficulty:v1":"decouverte"});
  assert.equal(readMigratedStorage(storage,key),"normal");
});
test("une clé sans sauvegarde historique reste vide",()=>{
  const storage=makeStorage();
  assert.equal(readMigratedStorage(storage,"tcg-thomas-deseur:demo-collection:v1"),null);
});
test("pas de migration pour des clés hors du périmètre TCG",()=>{
  const storage=makeStorage({"budget-illimite:solo-progress:v1":"data"});
  assert.equal(readMigratedStorage(storage,"autre-app:solo-progress:v1"),null);
});
