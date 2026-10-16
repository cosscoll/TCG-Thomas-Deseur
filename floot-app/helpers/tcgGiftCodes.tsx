import {createHash} from 'node:crypto';
export type PackKind='normal'|'special'|'custom';
export type GiftPackRule={rarityFloor?:'commune'|'rare'|'epique'|'legendaire'|'hors_serie';fixedArtworkIds?:string[];poolArtworkIds?:string[]};
export type GiftReward={type:'packs';kind:PackKind;quantity:number;rules?:GiftPackRule}|{type:'card';artworkId:string;quantity:number};
export function normalizeGiftCode(input:unknown):string{
 if(typeof input!=='string')throw Error('Code invalide.');
 const code=input.trim().toUpperCase();
 if(!/^[A-Z0-9][A-Z0-9_-]{9,47}$/.test(code))throw Error('Code invalide : utilise 10 à 48 lettres, chiffres ou tirets.');
 return code;
}
export function hashGiftCode(code:string):string{return createHash('sha256').update('TCG-DESEUR:CODE:'+code).digest('hex');}
export function validateGiftRewards(input:unknown,artworkIds:ReadonlySet<string>,references:ReadonlyMap<string,string>=new Map()):GiftReward[]{
 if(!Array.isArray(input)||input.length<1||input.length>12)throw Error('Ajoute de 1 à 12 récompenses.');
 const resolve=(raw:unknown):string|undefined=>{
  if(typeof raw!=='string')return undefined;
  const id=references.get(raw)??raw;
  return artworkIds.has(id)?id:undefined;
 };
 return input.map((item:unknown)=>{
  if(!item||typeof item!=='object')throw Error('Récompense invalide.');
  const r=item as Record<string,unknown>;
  if(!Number.isInteger(r.quantity)||(r.quantity as number)<1||(r.quantity as number)>1000)throw Error('Quantité de récompense invalide.');
  const quantity=r.quantity as number;
  if(r.type==='card'){
   const id=resolve(r.artworkId);
   if(!id)throw Error('Carte offerte inconnue.');
   return {type:'card',artworkId:id,quantity} as GiftReward;
  }
  if(r.type!=='packs'||!['normal','special','custom'].includes(String(r.kind)))throw Error('Type de récompense inconnu.');
  const kind=r.kind as PackKind;
  const rule=(r.rules&&typeof r.rules==='object'&&!Array.isArray(r.rules)?r.rules:{}) as Record<string,unknown>;
  const rules:GiftPackRule={};
  if(kind==='special'){
   const valid=['commune','rare','epique','legendaire','hors_serie'];
   if(!valid.includes(String(rule.rarityFloor)))throw Error('Rareté de booster spécial invalide.');
   rules.rarityFloor=rule.rarityFloor as GiftPackRule['rarityFloor'];
  }
  if(kind==='custom'){
   if(!Array.isArray(rule.fixedArtworkIds)||rule.fixedArtworkIds.length!==5||
      rule.fixedArtworkIds.some((id:unknown)=>!resolve(id)))
    throw Error('Un booster personnalisé doit contenir cinq illustrations officielles exactes.');
   rules.fixedArtworkIds=rule.fixedArtworkIds.map(resolve) as string[];
  }
  if(Array.isArray(rule.poolArtworkIds)){
   if(rule.poolArtworkIds.length<1||rule.poolArtworkIds.length>105||
      rule.poolArtworkIds.some((id:unknown)=>!resolve(id)))
    throw Error('Sélection de cartes inconnue.');
   rules.poolArtworkIds=rule.poolArtworkIds.map(resolve) as string[];
  }
  return {type:'packs',kind,quantity,rules} as GiftReward;
 });
}
