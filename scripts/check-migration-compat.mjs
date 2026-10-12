/** Contrôle lecture seule : identité historique des cartes vs nouveau catalogue.
 * Aucun rapprochement automatique : tous les anciens inventaires doivent rester intacts.
 * Exécution : node scripts/check-migration-compat.mjs
 */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARDS} from '../data/cards.js';
const manifest=JSON.parse(readFileSync(new URL('../data/catalogue-valide-67.json',import.meta.url),'utf8'));
const oldIds=new Set(CARDS.map(c=>c.id));
const newIds=new Set(manifest.cards.map(c=>c.id));
assert.equal(oldIds.size,49,'Historique inattendu : ne pas migrer sans audit');
assert.equal(newIds.size,67,'Nouveau catalogue incomplet');
assert.equal(manifest.cards.reduce((n,c)=>n+c.variants.length,0),38);
const directlyCompatible=[...newIds].filter(id=>oldIds.has(id));
const missingMappings=[...newIds].filter(id=>!oldIds.has(id));
const legacyWithoutMapping=[...oldIds].filter(id=>!newIds.has(id));
const result={
 legacyCardCount:oldIds.size,
 approvedCharacterCount:newIds.size,
 approvedVariantArtworks:38,
 exactIdMatches:directlyCompatible.length,
 newCardsWithoutExactLegacyId:missingMappings.length,
 legacyCardsWithoutExactNewId:legacyWithoutMapping.length,
 automaticInventoryMigrationSafe:directlyCompatible.length===oldIds.size&&missingMappings.length===0,
 nextAction:'Conserver les inventaires et historiques Floot. Mapper les cartes anciennes vers les groupes approuvés au cas par cas, puis définir raretés et règles des variantes avant toute migration.'
};
assert.equal(result.exactIdMatches,0,'Contrôler le changement de modèle avant toute migration');
assert.equal(result.automaticInventoryMigrationSafe,false);
console.log(JSON.stringify(result,null,2));
