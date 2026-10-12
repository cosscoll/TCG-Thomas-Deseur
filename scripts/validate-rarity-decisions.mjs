/**
 * Vérifie les réponses exportées par l'atelier visuel des raretés.
 * Aucune attribution n'est appliquée au jeu : validation en lecture seule.
 * Usage : node scripts/validate-rarity-decisions.mjs <sauvegarde.json>
 *         node scripts/validate-rarity-decisions.mjs <sauvegarde.json> --require-complete
 */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';

const ALLOWED=['À définir','Commune','Rare','Épique','Légendaire','Hors-série'];
export function validateRarityDecisions(submission,catalogue,{requireComplete=false}={}){
 assert.ok(submission && typeof submission==='object' && !Array.isArray(submission),'Sauvegarde invalide');
 assert.equal(submission.schema,'tcg-deseur-rarities-v1','Version de sauvegarde incompatible');
 assert.equal(submission.source,'catalogue-valide-67.json','Origine du catalogue incorrecte');
 assert.ok(submission.cards && typeof submission.cards==='object' && !Array.isArray(submission.cards),'Liste des cartes absente');
 assert.ok(Array.isArray(catalogue.cards)&&catalogue.cards.length===67,'Catalogue de référence incorrect');
 const expected=new Map(catalogue.cards.map(c=>[c.id,c.name]));
 const received=Object.keys(submission.cards);
 assert.equal(received.length,expected.size,'La sauvegarde doit contenir exactement 67 cartes');
 const counts=Object.fromEntries(ALLOWED.map(r=>[r,0]));
 for(const [id,name] of expected){
  const decision=submission.cards[id];
  assert.ok(decision && typeof decision==='object' && !Array.isArray(decision),'Carte manquante : '+id);
  assert.equal(decision.name,name,'Nom modifié ou carte incorrecte : '+id);
  assert.ok(ALLOWED.includes(decision.rarity),'Rareté inconnue : '+id);
  assert.ok(decision.note===undefined || typeof decision.note==='string','Note non textuelle : '+id);
  assert.ok(!decision.note || decision.note.length<=1500,'Note excessivement longue : '+id);
  counts[decision.rarity]++;
 }
 for(const id of received)assert.ok(expected.has(id),'Référence supplémentaire inconnue');
 const pending=counts['À définir'];
 if(requireComplete)assert.equal(pending,0,'Il reste '+pending+' cartes sans rareté');
 return {total:expected.size,defined:expected.size-pending,pending,counts};
}
function run(){
 const file=process.argv[2];
 if(!file||file.startsWith('--')){console.error('Usage : node scripts/validate-rarity-decisions.mjs <sauvegarde.json> [--require-complete]');process.exitCode=2;return;}
 try{
  const catalogue=JSON.parse(fs.readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
  const submission=JSON.parse(fs.readFileSync(file,'utf8'));
  const result=validateRarityDecisions(submission,catalogue,{requireComplete:process.argv.includes('--require-complete')});
  console.log(JSON.stringify(result,null,2));
 }catch(error){console.error('Sauvegarde refusée : '+error.message);process.exitCode=1;}
}
if(process.argv[1] && fileURLToPath(import.meta.url)===resolve(process.argv[1]))run();
