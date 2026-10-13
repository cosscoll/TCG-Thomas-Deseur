/** Published preproduction manifest for the approved TCG Deseur edition.
 * It contains no player inventory, private details or hidden rewards.
 * It does not migrate or modify Floot.
 *
 * Usage:
 *  node scripts/generate-approved-staging.mjs --check   (CI: verify committed artifact)
 *  node scripts/generate-approved-staging.mjs           (regenerate public JSON)
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {stageApprovedEdition} from './stage-approved-edition.mjs';
const source=new URL('../data/catalogue-valide-67.json',import.meta.url);
const target=new URL('../data/edition-staging-67.json',import.meta.url);
const staged=stageApprovedEdition(JSON.parse(readFileSync(source,'utf8')));
const expected=JSON.stringify(staged,null,2)+'\n';
if(process.argv.includes('--check')){
 const actual=readFileSync(target,'utf8');
 if(actual!==expected)throw Error('Le manifeste préproduction 67 cartes est périmé. Relancer node scripts/generate-approved-staging.mjs et vérifier le diff.');
 console.log('Manifeste préproduction vérifié : 67 cartes, 38 variantes, raretés validées, zéro attribution.');
}else{
 writeFileSync(target,expected);
 console.log('Manifeste préproduction régénéré, sans aucune modification Floot.');
}
