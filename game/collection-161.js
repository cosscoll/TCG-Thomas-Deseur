import {CARDS_161, DAILY_BOOSTER_161, SECRET_CARD_ID, REQUIRED_FOR_CHEVELU, RARITIES_161} from "../data/cards-161.js";
export const SECRET_BONUS_SIZE=1;
export const REGULAR_PACK_SIZE=5;
export const DAILY_COOLDOWN_MS=24*60*60*1000;
export const NORMAL_WEIGHTS_161=Object.freeze(Object.fromEntries(
  RARITIES_161.filter(r=>r.weight>0).map(r=>[r.id,r.weight])));
export const FIFTH_WEIGHTS_161=Object.freeze(Object.fromEntries(
  Object.entries(NORMAL_WEIGHTS_161).filter(([rarity])=>rarity!=="commune")));

function validQuantity(value){return Number.isSafeInteger(value) && value >= 0;}
export function normalizeOwned161(raw){
  if(raw == null) return new Map();
  const iterable=raw instanceof Map?[...raw.entries()]:
    Array.isArray(raw)?raw.map(c=>[c.cardId??c.id,c.quantity]):
    typeof raw==="object"?Object.entries(raw):null;
  if(!iterable) throw new Error("Inventaire invalide");
  const seen=new Set(),out=new Map();
  for(const [id,quantity] of iterable){
    if(typeof id!=="string"||!validQuantity(quantity)||seen.has(id))throw new Error("Inventaire invalide");
    seen.add(id);
    if(quantity>0)out.set(id,quantity);
  }
  return out;
}
/** The 49 original IDs are grandfathered and kept; they do NOT create
 * fabricated ownership of one of the 161 illustrated images. */
export function getProgress161(raw, {secretPackClaimed=false}={}){
  if(typeof secretPackClaimed!=="boolean")throw new Error("Statut de récompense invalide");
  const owned=normalizeOwned161(raw);
  const found=CARDS_161.filter(c=>(owned.get(c.id)??0)>0);
  const obtained=found.length;
  const otherCardsFound=REQUIRED_FOR_CHEVELU.filter(id=>(owned.get(id)??0)>0).length;
  const missing=REQUIRED_FOR_CHEVELU.filter(id=>!(owned.get(id)>0));
  const duplicates=CARDS_161.reduce((total,c)=>total+Math.max(0,(owned.get(c.id)??0)-1),0);
  const hasSecret=(owned.get(SECRET_CARD_ID)??0)>0;
  return Object.freeze({
    total:161,found:obtained,missing:161-obtained,duplicates,
    prerequisitesTotal:160,prerequisitesFound:otherCardsFound,
    prerequisitesMissing:missing.length,missingPrerequisiteIds:missing,
    hasSecret,secretPackClaimed,secretPackEligible:missing.length===0&&!secretPackClaimed&&!hasSecret,
    secretPackAlreadyGranted:secretPackClaimed||hasSecret,
    completionPercent:Math.round(obtained/161*100),
  });
}
/** This guard must be reevaluated UNDER DB LOCK before a server grant.
 * In browser contexts this is only an informational hint. */
export function assertSecretPackEligible(raw, options){
  const progress=getProgress161(raw,options);
  if(!progress.secretPackEligible)throw new Error(
    progress.secretPackAlreadyGranted?"Booster secret déjà attribué":
      "Collection incomplète : "+progress.prerequisitesMissing+" autres cartes manquantes"
  );
  return progress;
}
/** Validate a server-produced normal pack. No random draw, no account mutation. */
export function verifyNormalPack161(draw){
  if(!Array.isArray(draw)||draw.length!==REGULAR_PACK_SIZE)throw new Error("Booster normal : cinq cartes attendues");
  const byId=new Map(DAILY_BOOSTER_161.map(c=>[c.id,c]));
  for(const card of draw){
    const id=typeof card==="string"?card:card?.id;
    if(!byId.has(id))throw new Error("Chevelu ou carte inconnue interdit dans le booster normal");
  }
  const last=draw.at(-1);
  const fifth=byId.get(typeof last==="string"?last:last.id);
  if(fifth.rarity==="commune")throw new Error("Cinquième carte : rare ou meilleure requise");
  return true;
}
function roll(weights,random){
  const entries=Object.entries(weights);
  const total=entries.reduce((sum,[,w])=>sum+w,0);
  const n=random();
  if(!Number.isFinite(n)||n<0||n>=1)throw new Error("Aléa invalide");
  let value=n*total;
  for(const [key,weight] of entries){
    if(value<weight)return key;
    value-=weight;
  }
  return entries.at(-1)[0];
}
/** LOCAL ILLUSTRATION ONLY, never award official inventory from this function. */
export function simulateNormalPack161(random=Math.random){
  return Array.from({length:5},(_,index)=>{
    const rarity=roll(index===4?FIFTH_WEIGHTS_161:NORMAL_WEIGHTS_161,random);
    const pool=DAILY_BOOSTER_161.filter(card=>card.rarity===rarity);
    const n=random();
    if(!Number.isFinite(n)||n<0||n>=1)throw new Error("Aléa invalide");
    return pool[Math.floor(n*pool.length)];
  });
}
