/** Édition Origine : 67 personnages + 1 emplacement mystère (jamais tiré dans un booster classique). */
export const tcgOriginRules = {
 expected: {commune:33,rare:21,epique:8,legendaire:4,hors_serie:1} as Record<string,number>,
 probabilities: [
  [{kind:"commune",weight:100}],
  [{kind:"commune",weight:100}],
  [{kind:"commune",weight:100}],
  [{kind:"rare",weight:90},{kind:"alternative",weight:10}],
  [{kind:"rare",weight:80},{kind:"epique",weight:17},{kind:"legendaire",weight:2},{kind:"hors_serie",weight:1}]
 ] as ReadonlyArray<ReadonlyArray<{kind:string;weight:number}>>,
 validate(cards:ReadonlyArray<{id:string;rarity:string;normalBooster:boolean;variants:unknown}>){
  if(cards.length!==67)throw Error("Édition Origine incomplète : 67 cartes requises.");
  const ids=new Set<string>(),counts=new Map<string,number>();
  let variantCount=0;
  for(const c of cards){
   if(!c.id||ids.has(c.id)||!c.normalBooster||!(c.rarity in this.expected)||!Array.isArray(c.variants))
    throw Error("Carte Origine invalide.");
   ids.add(c.id);counts.set(c.rarity,(counts.get(c.rarity)||0)+1);
   variantCount+=c.variants.length;
  }
  for(const [r,expected] of Object.entries(this.expected))if(counts.get(r)!==expected)throw Error("Raretés Origine incorrectes.");
  if(variantCount!==38)throw Error("Les 38 illustrations alternatives sont manquantes.");
  return true;
 },
 select(position:number,roll:number){
  if(!Number.isInteger(position)||position<0||position>=5||!Number.isInteger(roll)||roll<0||roll>=100)
   throw RangeError("Emplacement ou tirage invalide");
  let remaining=roll;
  for(const {kind,weight} of this.probabilities[position]){
   if(remaining<weight)return kind;
   remaining-=weight;
  }
  throw Error("Distribution de booster invalide");
 }
};
