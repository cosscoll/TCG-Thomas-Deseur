import {db} from "../helpers/db";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {NotAuthenticatedError} from "../helpers/getSetServerSession";
import {tcgArtworkCatalog} from "../helpers/tcgArtworkCatalog";
import {rechargeBoosterStock,BOOSTER_INTERVAL_MS} from "../helpers/tcgBoosterStock";
import superjson from "superjson";
import type {OutputType} from "./collection_GET.schema";
const headers={"Content-Type":"application/json","Cache-Control":"private, no-store"};
export async function handle(request:Request){
 try{
  const {user}=await getServerUserSession(request);
  const [catalog,owned,status,history,claim,giftPacks,legacy,references]=await Promise.all([
   db.selectFrom("tcgCardsOrigin")
    .select(["id","name","rarity","reference","sourceReference","imagePath","ordinal","normalBooster","variants"])
    .orderBy("ordinal","asc").execute(),
   db.selectFrom("tcgArtworkInventory").select(["artworkId","quantity"]).where("userId","=",user.id).execute(),
   db.selectFrom("tcgPackStatus").select(["opened","stock","rechargeAt"]).where("userId","=",user.id).executeTakeFirst(),
   db.selectFrom("tcgPackHistoryOrigin").select(["drawn","artworks","createdAt","kind"])
    .where("userId","=",user.id).orderBy("createdAt","desc").orderBy("id","desc").limit(10).execute(),
   db.selectFrom("tcgRewardClaimsOrigin").select("userId").where("userId","=",user.id).executeTakeFirst(),
   db.selectFrom("tcgGiftPacks").select(["remaining"]).where("userId","=",user.id).execute(),
   db.selectFrom("tcgInventoryOrigin").select(["cardId","quantity"]).where("userId","=",user.id).execute(),
   db.selectFrom("tcgArtworkRefs").select(["artworkId","numericReference"]).execute()
  ]);
  if(catalog.length!==68||catalog.filter(c=>!c.normalBooster).length!==1)throw Error("Édition Origine incomplète.");
  const privateCard=catalog.find(c=>!c.normalBooster)!;
  const knownOwned=new Set(owned.filter(row=>row.quantity>0).map(row=>row.artworkId));
  const claimed=Boolean(claim)||knownOwned.has(privateCard.id)||legacy.some(c=>c.cardId===privateCard.id&&c.quantity>0);
  const referenceByArtwork=new Map(references.map(ref=>[ref.artworkId,ref.numericReference]));
   const allCards=tcgArtworkCatalog(catalog,claimed).map(card=>{
    const numericReference=referenceByArtwork.get(card.id);
    if(!numericReference)throw Error("Référence numérique manquante.");
    return {...card,numericReference};
   });
  const ownership=owned.map(c=>({cardId:c.artworkId,quantity:c.quantity}))
   .filter(row=>allCards.some(c=>c.id===row.cardId));
  if(claimed&&!ownership.some(row=>row.cardId===privateCard.id)){
   const prev=legacy.find(c=>c.cardId===privateCard.id);
   if(prev)ownership.push({cardId:privateCard.id,quantity:prev.quantity});
  }
  const found=allCards.filter(c=>c.id!==privateCard.id&&knownOwned.has(c.id)).length;
  const now=new Date();
  const reserve=rechargeBoosterStock(status
   ?{stock:status.stock,rechargeAt:status.rechargeAt}
   :{stock:1,rechargeAt:new Date(now.getTime()+BOOSTER_INTERVAL_MS)},now);
  const output:OutputType={
   cards:allCards,owned:ownership,
   opened:status?.opened??0,boosterUnlimited:false,stock:reserve.stock,
   giftStock:giftPacks.reduce((n,r)=>n+r.remaining,0),
   nextAvailable:reserve.rechargeAt?.toISOString()??null,
   history:history.map(h=>({
    cards:Array.isArray(h.drawn)?h.drawn.filter((v):v is string=>typeof v==="string"):[],
    artworks:Array.isArray(h.artworks)?h.artworks.filter((v):v is string=>typeof v==="string"):[],
    createdAt:h.createdAt.toISOString(),kind:h.kind
   })),
   completion:{found,required:105,available:found===105&&!claimed,claimed}
  };
  return new Response(superjson.stringify(output),{headers});
 }catch(e){
  const unauthenticated=e instanceof NotAuthenticatedError;
  if(!unauthenticated)console.error("Collection API",e);
  return new Response(superjson.stringify({error:unauthenticated?"Connexion requise.":"Collection indisponible."}),
   {status:unauthenticated?401:500,headers});
 }
}

