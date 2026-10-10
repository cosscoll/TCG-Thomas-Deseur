/**
 * TCG Deseur — nouvelle collection 161, issue des références principales du PDF.
 * Conservation des 49 anciennes cartes dans data/cards.js : NE PAS effacer les
 * inventaires des comptes existants avant migration transactionnelle Floot.
 *
 * Raretés standards provisoires (95/35/18/11), en attente d'une sélection
 * éditoriale carte par carte. Chevelu n'est JAMAIS dans le pool quotidien.
 * Lille est inclus dans le pool quotidien (catégorie hors-série, 2 % de rareté)
 * afin que toutes les 160 cartes prérequises soient effectivement obtenables.
 */
export const COLLECTION_EDITION = "deseur-origine-161";
export const COLLECTION_SIZE = 161;
export const SECRET_CARD_ID = "td_chevelu";
export const NORMAL_POOL_SIZE = 160;
export const RARITIES_161 = Object.freeze([
  {id:"commune",label:"Commune",color:"#a0a9bc",weight:55},
  {id:"rare",label:"Rare",color:"#61baff",weight:27},
  {id:"epique",label:"Épique",color:"#bb8dff",weight:12},
  {id:"legendaire",label:"Légendaire",color:"#ffd47e",weight:4},
  {id:"hors_serie",label:"Hors-série",color:"#88eadb",weight:2},
  {id:"secrete",label:"Secrète",color:"#ff8bc4",weight:0},
]);

const sourceNumbers = Object.freeze({
  1: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66],
  2: [1,2,3,4,5,6,7,8,19,20,21,22,23,24,25,26,27,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66],
  3: [1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43],
});
const standardReferences = Object.entries(sourceNumbers).flatMap(([series, numbers]) =>
  numbers.map(num => ({series:Number(series),num, reference:"REF-"+series+"-"+String(num).padStart(3,"0")}))
);
if(standardReferences.length!==159)throw new Error("Le PDF doit contenir 159 références standards.");
// Spread tentative rarities among the three series, without fabricating
// descriptions or claiming the individual rarity has editorial approval.
function proposedRarity(index){
  const distributed=(index*73)%159;
  return distributed<95?"commune":distributed<130?"rare":distributed<148?"epique":"legendaire";
}
export const CARDS_161=Object.freeze([
  ...standardReferences.map((ref,index)=>Object.freeze({
    id:"td_"+ref.series+"_"+String(ref.num).padStart(3,"0"),
    reference:ref.reference,
    name:"Carte "+ref.reference,
    rarity:proposedRarity(index),
    rarityStatus:"proposition",
    collectionNumber:index+1,
    cardType:"standard",
    obtainableInDailyBooster:true,
    artPath:"./assets/cards/td-"+ref.series+"-"+String(ref.num).padStart(3,"0")+".webp",
    artAvailable:false,
  })),
  Object.freeze({
    id:"td_lille",reference:"REF-177-LILLE",name:"Lille",rarity:"hors_serie",
    rarityStatus:"speciale",collectionNumber:160,cardType:"hors_serie",
    obtainableInDailyBooster:true,
    artPath:"./assets/cards/td-lille.webp",artAvailable:false,
  }),
  Object.freeze({
    id:SECRET_CARD_ID,reference:"CHEVELU-SECRETE",name:"Chevelu",rarity:"secrete",
    rarityStatus:"speciale",collectionNumber:161,cardType:"recompense_secrete",
    obtainableInDailyBooster:false,onlyFromSpecialBooster:true,
    artPath:"./assets/cards/td-chevelu.webp",artAvailable:false,
  }),
]);
const ids = new Set(CARDS_161.map(c=>c.id));
const references = new Set(CARDS_161.map(c=>c.reference));
const distribution=Object.fromEntries(RARITIES_161.map(r=>[r.id,CARDS_161.filter(c=>c.rarity===r.id).length]));
if(CARDS_161.length!==COLLECTION_SIZE || ids.size!==COLLECTION_SIZE || references.size!==COLLECTION_SIZE ||
  distribution.commune!==95 || distribution.rare!==35 ||
  distribution.epique!==18 || distribution.legendaire!==11 ||
  distribution.hors_serie!==1 || distribution.secrete!==1) {
  throw new Error("Le catalogue Deseur 161 n'est pas conforme aux 161 rendus.");
}
export const DAILY_BOOSTER_161=Object.freeze(CARDS_161.filter(c=>c.obtainableInDailyBooster));
export const REQUIRED_FOR_CHEVELU=Object.freeze(DAILY_BOOSTER_161.map(c=>c.id));
