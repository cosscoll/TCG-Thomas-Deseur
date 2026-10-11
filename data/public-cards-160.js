/** Catalogue envoyé au navigateur : UNIQUEMENT les 160 cartes visibles.
 * La récompense finale, son identité et son illustration ne figurent pas ici.
 */
export const PUBLIC_RARITIES=Object.freeze([
 {id:"commune",label:"Commune",weight:55},
 {id:"rare",label:"Rare",weight:27},
 {id:"epique",label:"Épique",weight:12},
 {id:"legendaire",label:"Légendaire",weight:4},
 {id:"hors_serie",label:"Hors-série",weight:2},
]);
const sourceNumbers = Object.freeze({
  1: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66],
  2: [1,2,3,4,5,6,7,8,19,20,21,22,23,24,25,26,27,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66],
  3: [1,2,3,4,5,6,7,8,9,10,11,12,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43],
});
const sourceRefs=Object.entries(sourceNumbers).flatMap(([series,nums])=>
 nums.map(num=>({series:Number(series),num,reference:"REF-"+series+"-"+String(num).padStart(3,"0")})));
if(sourceRefs.length!==159)throw Error("Le catalogue visible doit avoir 159 standards.");
function rarity(index){
 const distributed=(index*73)%159;
 return distributed<95?"commune":distributed<130?"rare":distributed<148?"epique":"legendaire";
}
export const PUBLIC_CARDS_160=Object.freeze([
 ...sourceRefs.map((c,i)=>Object.freeze({
  id:"td_"+c.series+"_"+String(c.num).padStart(3,"0"),
  reference:c.reference,
  name:"Carte "+c.reference,
  rarity:rarity(i),
  collectionNumber:i+1,
  artPath:"./assets/cards/td-"+c.series+"-"+String(c.num).padStart(3,"0")+".webp",
 })),
 Object.freeze({id:"td_lille",reference:"REF-177-LILLE",name:"Lille",rarity:"hors_serie",
  collectionNumber:160,artPath:"./assets/cards/td-lille.webp"})
]);
export const REQUIRED_PUBLIC_IDS=Object.freeze(PUBLIC_CARDS_160.map(c=>c.id));
export function demoProgress160(inventory,claimed=false){
 const have=REQUIRED_PUBLIC_IDS.filter(id=>(inventory[id]??0)>0).length;
 return {prerequisitesFound:have,prerequisitesMissing:160-have,
   secretPackEligible:have===160&&!claimed,secretPackAlreadyGranted:claimed};
}
export function demoNormalPack160(random=Math.random){
 const result=[];
 for(let i=0;i<5;i++){
  const weights=PUBLIC_RARITIES.filter(r=>i!==4||r.id!=="commune");
  const total=weights.reduce((sum,r)=>sum+r.weight,0);
  let n=random()*total,rarity=weights.at(-1).id;
  for(const w of weights){if(n<w.weight){rarity=w.id;break;}n-=w.weight;}
  const pool=PUBLIC_CARDS_160.filter(c=>c.rarity===rarity);
  result.push(pool[Math.min(pool.length-1,Math.floor(random()*pool.length))]);
 }
 return result;
}
