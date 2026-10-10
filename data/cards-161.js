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
const imageRenderIds=Object.freeze({
  1:"R115,R114,R116,R117,R119,R118,R121,R120,R122,R123,R124,R125,R126,R127,R128,R129,R130,R132,R131,R134,R136,R135,R137,R138,R139,R140,R141,R142,R144,R143,R155,R147,R146,R148,R149,R151,R150,R153,R152,R154,R156,R157,R158,R159,R162,R161,R164,R166,R167,R165,R168,R169,R170,R176,R173,R174,R172,R178,R177,R179,R181,R180,R182".split(","),
  2:"R084,R086,R088,R089,R083,R085,R087,R090,R045,R047,R049,R052,R050,R051,R055,R053,R057,R058,R054,R056,R059,R060,R061,R063,R064,R069,R067,R071,R065,R066,R068,R070,R072,R080,R073,R077,R076,R075,R078,R079,R082,R081,R102,R104,R103,R105,R113,R107,R109,R108,R110,R111,R112,R091".split(","),
  3:"R002,R003,R011,R005,R006,R007,R008,R010,R009,R001,R012,R014,R013,R016,R015,R017,R018,R020,R019,R021,R024,R023,R022,R025,R026,R027,R028,R029,R030,R035,R032,R033,R036,R038,R037,R040,R039,R041,R042,R046,R048,R044".split(","),
});
for(const series of [1,2,3]){
  if(imageRenderIds[series].length!==sourceNumbers[series].length)
    throw new Error("Le PDF contient une correspondance de rendu manquante");
}
const standardReferences = Object.entries(sourceNumbers).flatMap(([series, numbers]) =>
  numbers.map((num,i) => ({series:Number(series),num, reference:"REF-"+series+"-"+String(num).padStart(3,"0"), renderId:imageRenderIds[series][i]}))
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
    renderId:ref.renderId,
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
    id:"td_lille",reference:"REF-177-LILLE",renderId:"R043",name:"Lille",rarity:"hors_serie",
    rarityStatus:"speciale",collectionNumber:160,cardType:"hors_serie",
    obtainableInDailyBooster:true,
    artPath:"./assets/cards/td-lille.webp",artAvailable:false,
  }),
  Object.freeze({
    id:SECRET_CARD_ID,reference:"CHEVELU-SECRETE",renderId:"R183",name:"Chevelu",rarity:"secrete",
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
