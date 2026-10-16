import {db} from "../helpers/db";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {NotAuthenticatedError} from "../helpers/getSetServerSession";
import {randomInt} from "node:crypto";
import {tcgPackHistoryJsonb} from "../helpers/tcgPackHistoryJsonb";
import {tcgOriginRules} from "../helpers/tcgOriginRules";
import {tcgArtworkCatalog} from "../helpers/tcgArtworkCatalog";
import {BOOSTER_INTERVAL_MS} from "../helpers/tcgBoosterStock";
import superjson from "superjson";
import type {OutputType} from "./completion_POST.schema";
class NotReady extends Error{}
const headers={"Content-Type":"application/json","Cache-Control":"private, no-store"};
export async function handle(request:Request){
 let userId:number;
 try{userId=(await getServerUserSession(request)).user.id;}
 catch(e){
  if(e instanceof NotAuthenticatedError)return new Response(superjson.stringify({error:"Connexion requise."}),{status:401,headers});
  return new Response(superjson.stringify({error:"Session indisponible."}),{status:500,headers});
 }
 try{
  const reward=await db.transaction().execute(async trx=>{
   await trx.insertInto("tcgPackStatus").values({userId,stock:1,rechargeAt:new Date(Date.now()+BOOSTER_INTERVAL_MS)})
    .onConflict(oc=>oc.column("userId").doNothing()).execute();
   await trx.selectFrom("tcgPackStatus").select("userId").where("userId","=",userId).forUpdate().executeTakeFirstOrThrow();
   const claim=await trx.selectFrom("tcgRewardClaimsOrigin").select("userId").where("userId","=",userId).executeTakeFirst();
   if(claim)throw new NotReady("Booster de collection déjà récupéré.");
   const catalog=await trx.selectFrom("tcgCardsOrigin")
    .select(["id","name","rarity","reference","sourceReference","ordinal","imagePath","normalBooster","variants"]).execute();
   const regular=catalog.filter(c=>c.normalBooster),privateCards=catalog.filter(c=>!c.normalBooster);
   tcgOriginRules.validate(regular);
   if(catalog.length!==68||privateCards.length!==1)throw Error("Récompense indisponible.");
   const allArt=tcgArtworkCatalog(catalog);
   const artworkInventory=await trx.selectFrom("tcgArtworkInventory").select(["artworkId","quantity"])
    .where("userId","=",userId).execute();
   const quantities=new Map(artworkInventory.map(c=>[c.artworkId,c.quantity]));
   if(!allArt.every(c=>(quantities.get(c.id)||0)>0))
    throw new NotReady("Réunis les 105 illustrations pour débloquer ce booster.");
   if((quantities.get(privateCards[0].id)||0)>0)throw new NotReady("Booster déjà récupéré.");
   const inserted=await trx.insertInto("tcgRewardClaimsOrigin").values({userId})
    .onConflict(oc=>oc.column("userId").doNothing()).returning("userId").executeTakeFirst();
   if(!inserted)throw new NotReady("Booster déjà récupéré.");
   const mixed=Array.from({length:4},()=>regular[randomInt(regular.length)]);
   mixed.splice(randomInt(5),0,privateCards[0]);
   const drawn:OutputType["drawn"]=[];
   for(const card of mixed){
    const quantity=(quantities.get(card.id)||0)+1;
    await trx.insertInto("tcgArtworkInventory").values({userId,artworkId:card.id,cardId:card.id,quantity:1})
     .onConflict(oc=>oc.columns(["userId","artworkId"]).doUpdateSet(eb=>({quantity:eb("tcgArtworkInventory.quantity","+",1)}))).execute();
    await trx.insertInto("tcgInventoryOrigin").values({userId,cardId:card.id,quantity:1})
     .onConflict(oc=>oc.columns(["userId","cardId"]).doUpdateSet(eb=>({quantity:eb("tcgInventoryOrigin.quantity","+",1)}))).execute();
    quantities.set(card.id,quantity);
    drawn.push({id:card.id,artworkId:card.id,name:card.name,rarity:card.rarity,
     imagePath:card.imagePath,newCard:quantity===1,quantity});
   }
   await trx.insertInto("tcgPackHistoryOrigin").values({
    userId,drawn:tcgPackHistoryJsonb(drawn.map(c=>c.id)),
    artworks:tcgPackHistoryJsonb(drawn.map(c=>c.imagePath)),kind:"collection_reward"
   }).execute();
   return {drawn,kind:"collection_reward"} as const;
  });
  return new Response(superjson.stringify(reward satisfies OutputType),{headers});
 }catch(e){
  if(!(e instanceof NotReady))console.error("Origin reward error",e);
  return new Response(superjson.stringify({error:e instanceof NotReady?e.message:"Booster de collection indisponible."}),
   {status:e instanceof NotReady?409:500,headers});
 }
}

