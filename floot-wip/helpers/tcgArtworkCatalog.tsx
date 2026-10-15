export type Variant={id:string;imagePath:string;reference:string};
export type CardArt={id:string;name:string;rarity:string;imagePath:string;ordinal:number;reference:string;sourceReference:string|null;normalBooster:boolean;variants:unknown};
export type PublicArtwork={id:string;cardId:string;name:string;rarity:string;reference:string;sourceReference:string|null;imagePath:string;ordinal:number;alternative:boolean;parentId:string|null};
export function tcgArtworkCatalog(cards:readonly CardArt[],includePrivate=false):PublicArtwork[]{
 const visible=cards.filter(c=>c.normalBooster).sort((a,b)=>a.ordinal-b.ordinal);
 if(visible.length!==67)throw Error("Catalogue officiel incomplet");
 const result:PublicArtwork[]=[];
 let position=0;
 for(const card of visible){
  result.push({id:card.id,cardId:card.id,name:card.name,rarity:card.rarity,reference:card.reference,sourceReference:card.sourceReference,imagePath:card.imagePath,ordinal:++position,alternative:false,parentId:null});
  const variants=Array.isArray(card.variants)?card.variants as Variant[]:[];
  for(const v of variants){
   if(!v||typeof v.id!=="string"||typeof v.imagePath!=="string")throw Error("Variante invalide");
   result.push({id:v.id,cardId:card.id,name:card.name+" — alternative",rarity:card.rarity,reference:v.reference||card.reference,sourceReference:card.sourceReference,imagePath:v.imagePath,ordinal:++position,alternative:true,parentId:card.id});
  }
 }
 if(result.length!==105)throw Error("105 illustrations attendues");
 if(includePrivate){
  const extra=cards.filter(c=>!c.normalBooster);
  for(const c of extra)result.push({id:c.id,cardId:c.id,name:c.name,rarity:c.rarity,reference:c.reference,sourceReference:c.sourceReference,imagePath:c.imagePath,ordinal:++position,alternative:false,parentId:null});
 }
 return result;
}
