/** Generate deterministic idempotent SQL rows for 161 cards.
 * Usage: node scripts/generate-seed-161.mjs > seed-161.sql
 * RUN THE RESULT only in a reviewed Floot maintenance transaction.
 */
import {CARDS_161} from "../data/cards-161.js";
function sql(value){
  if(value==null)return "NULL";
  return "'"+String(value).replaceAll("'","''")+"'";
}
if(CARDS_161.length!==161)throw Error("Le jeu attend 161 cartes");
let output="-- Generated from data/cards-161.js; 161 cards\nBEGIN;\n";
for(const card of CARDS_161){
  const values=[card.id,card.reference,card.name,card.rarity,card.artPath,
    card.obtainableInDailyBooster,card.collectionNumber];
  const serialized=values.map(value=>typeof value==="boolean"?value?"TRUE":"FALSE":typeof value==="number"?String(value):sql(value));
  output+=`INSERT INTO tcg_cards_161(id,reference,name,rarity,image_path,normal_booster,ordinal)
VALUES(${serialized.join(",")})
ON CONFLICT(id) DO UPDATE SET
  reference=EXCLUDED.reference,name=EXCLUDED.name,rarity=EXCLUDED.rarity,
  image_path=EXCLUDED.image_path,normal_booster=EXCLUDED.normal_booster,
  ordinal=EXCLUDED.ordinal;\n`;
}
output+="-- Expected total 161; 160 normal and one reward.\nCOMMIT;\n";
process.stdout.write(output);
