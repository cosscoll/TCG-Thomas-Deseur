/**
 * Plan des 5 positions du booster ORDINAIRE de la future édition 67.
 * Ceci NE choisit pas de carte, n'ajoute rien à une collection et ne remplace
 * pas l'API serveur Floot actuelle. Réservé à la validation des règles.
 *
 * Le serveur devra fournir un tirage uniforme via crypto.randomInt(100).
 */
import rules from "../data/regles-booster-67.json" with {type:"json"};

const ALLOWED_RARITIES=new Set(["Commune","Rare","Épique","Légendaire","Hors-série"]);

export function validateApprovedBoosterRules67(input=rules){
 if(input?.schema!=="tcg-deseur-booster-probabilities-v1"||
    input.cardsPerBooster!==5||
    input.appliesTo!=="ordinary-booster-only"||
    !Array.isArray(input.slots)||input.slots.length!==5){
   throw Error("Configuration des boosters incomplète.");
 }
 for(const [index,slot] of input.slots.entries()){
  if(slot.position!==index+1||!Array.isArray(slot.outcomes)||!slot.outcomes.length)throw Error("Position invalide.");
  const total=slot.outcomes.reduce((sum,outcome)=>{
   if(!Number.isInteger(outcome.percentage)||outcome.percentage<=0||outcome.percentage>100)throw Error("Probabilité invalide.");
   if(outcome.kind==="rarity"&&!ALLOWED_RARITIES.has(outcome.rarity))throw Error("Rareté inconnue.");
   if(outcome.kind!=="rarity"&&outcome.kind!=="alternative")throw Error("Catégorie inconnue.");
   if(outcome.kind==="alternative"&&outcome.rarity!==undefined)throw Error("La rareté d'une alternative n'a pas été définie.");
   return sum+outcome.percentage;
  },0);
  if(total!==100)throw Error("Chaque position doit représenter 100 %.");
 }
 const sig=slot=>slot.outcomes.map(o=>o.kind==="alternative"?"alternative:"+o.percentage:o.rarity+":"+o.percentage).join("|");
 const actual=input.slots.map(sig);
 const expected=[
  "Commune:100","Commune:100","Commune:100",
  "Rare:90|alternative:10","Rare:80|Épique:17|Légendaire:2|Hors-série:1"
 ];
 if(actual.some((s,i)=>s!==expected[i]))throw Error("Probabilités différentes des choix du créateur.");
 return true;
}
validateApprovedBoosterRules67();

/** Sélection de catégorie pour la position donnée, pas de récompense réelle. */
export function selectApprovedSlot67(position,roll){
 if(!Number.isInteger(position)||position<1||position>5)throw Error("Position impossible.");
 if(!Number.isInteger(roll)||roll<0||roll>99)throw Error("Tirage aléatoire attendu entre 0 et 99.");
 const slot=rules.slots[position-1];
 let cumulative=0;
 for(const outcome of slot.outcomes){
  cumulative+=outcome.percentage;
  if(roll<cumulative)return {...outcome,position};
 }
 throw Error("Répartition invalide.");
}

/** Produit 5 catégories à résoudre côté serveur avec les vrais pools. */
export function prepareApprovedBooster67(drawUniformInteger){
 if(typeof drawUniformInteger!=="function")throw Error("Tirage serveur requis.");
 return [1,2,3,4,5].map(position=>selectApprovedSlot67(position,drawUniformInteger(100)));
}
