import {db} from "../helpers/db";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {NotAuthenticatedError} from "../helpers/getSetServerSession";
import {tcgOriginRules} from "../helpers/tcgOriginRules";
import {tcgPackHistoryJsonb} from "../helpers/tcgPackHistoryJsonb";
import {consumeBoosterStock,rechargeBoosterStock,BOOSTER_INTERVAL_MS} from "../helpers/tcgBoosterStock";
import {randomInt} from "node:crypto";
import superjson from "superjson";
import type {OutputType,DrawnCard} from "./booster_POST.schema";

type Variant={id:string;imagePath:string;reference:string};
type GiftRules={fixedArtworkIds?:string[];poolArtworkIds?:string[];rarityFloor?:string};
class NoPacks extends Error{}
const headers={"Content-Type":"application/json","Cache-Control":"private, no-store"};
const tiers=["commune","rare","epique","legendaire","hors_serie"];
export async function handle(request:Request){
 let userId:number;
 try{userId=(await getServerUserSession(request)).user.id;}
 catch(e){
  if(e instanceof NotAuthenticatedError)return new Response(superjson.stringify({error:"Connecte-toi pour ouvrir ton booster."}),{status:401,headers});
  return new Response(superjson.stringify({error:"Session temporairement indisponible."}),{status:500,headers});
 }
 try{
  const result=await db.transaction().execute(async trx=>{
   const now=new Date();
   await trx.insertInto("tcgPackStatus").values({userId,stock:1,rechargeAt:new Date(now.getTime()+BOOSTER_INTERVAL_MS)})
    .onConflict(oc=>oc.column("userId").doNothing()).execute();
   const stored=await trx.selectFrom("tcgPackStatus").select(["stock","rechargeAt","opened"])
    .where("userId","=",userId).forUpdate().executeTakeFirstOrThrow();
   const refreshed=rechargeBoosterStock({stock:stored.stock,rechargeAt:stored.rechargeAt},now);
   let gift: {id:string;kind:string;remaining:number;rules:unknown}|null=null;
   let after=refreshed;
   if(refreshed.stock>0)after=consumeBoosterStock(refreshed,now);
   else{
    const row=await trx.selectFrom("tcgGiftPacks").select(["id","kind","remaining","rules"])
     .where("userId","=",userId).where("remaining",">",0).orderBy("id","asc").forUpdate().executeTakeFirst();
    if(!row)throw new NoPacks("Aucun booster en stock. Le prochain arrive dans quelques heures.");
    gift=row;
   }
   const catalog=await trx.selectFrom("tcgCardsOrigin")
    .select(["id","name","rarity","imagePath","variants","normalBooster"]).where("normalBooster","=",true).execute();
   tcgOriginRules.validate(catalog);
   const artworks:{id:string;cardId:string;imagePath:string;card:typeof catalog[number];alternative:boolean}[]=[];
   for(const card of catalog){
    artworks.push({id:card.id,cardId:card.id,imagePath:card.imagePath,card,alternative:false});
    for(const variant of card.variants as Variant[]){
     artworks.push({id:variant.id,cardId:card.id,imagePath:variant.imagePath,card,alternative:true});
    }
   }
   const catalogByArt=new Map(artworks.map(a=>[a.id,a]));
   const inventory=await trx.selectFrom("tcgArtworkInventory").select(["artworkId","quantity"])
    .where("userId","=",userId).execute();
   const quantities=new Map(inventory.map(row=>[row.artworkId,row.quantity]));
   const basesOwned=new Set(catalog.filter(card=>(quantities.get(card.id)||0)>0).map(card=>card.id));
   const permitted=artworks.filter(a=>!a.alternative||basesOwned.has(a.cardId));
   const variants=permitted.filter(a=>a.alternative);
   const groups=new Map<string,typeof permitted>();
   for(const art of permitted){
    const g=groups.get(art.card.rarity)||[];if(!art.alternative){g.push(art);groups.set(art.card.rarity,g);}
   }
   const rules=(gift?.rules && typeof gift.rules==="object"&&!Array.isArray(gift.rules)?gift.rules:{}) as GiftRules;
   if(gift?.kind==="custom" && (!Array.isArray(rules.fixedArtworkIds)||rules.fixedArtworkIds.length!==5))throw Error("Booster personnalisé invalide.");
   const drawn:DrawnCard[]=[];
   for(let slot=0;slot<5;slot++){
    let item:typeof artworks[number]|undefined;
    if(gift?.kind==="custom"){
     item=catalogByArt.get(rules.fixedArtworkIds![slot]);
     if(!item||item.alternative&&!basesOwned.has(item.cardId))throw Error("Une alternative requiert sa carte de base.");
    }else{
     let outcome=tcgOriginRules.select(slot,randomInt(100));
     if(gift?.kind==="special" && slot>=3 && tiers.includes(rules.rarityFloor||"")){
      const floor=tiers.indexOf(rules.rarityFloor!);
      if(outcome==="alternative"||tiers.indexOf(outcome)<floor)outcome=rules.rarityFloor!;
     }
     if(outcome==="alternative" && variants.length)item=variants[randomInt(variants.length)];
     else{
      const category=outcome==="alternative"?"rare":outcome;
      const pool=groups.get(category);
      if(!pool?.length)throw Error("Rareté indisponible.");
      item=pool[randomInt(pool.length)];
     }
     if(Array.isArray(rules.poolArtworkIds)&&rules.poolArtworkIds.length && gift){
      const selected=permitted.filter(x=>rules.poolArtworkIds!.includes(x.id));
      if(!selected.length)throw Error("Sélection cadeau indisponible.");
      item=selected[randomInt(selected.length)];
     }
    }
    if(!item)throw Error("Carte indisponible.");
    const qty=(quantities.get(item.id)||0)+1;
    await trx.insertInto("tcgArtworkInventory").values({userId,artworkId:item.id,cardId:item.cardId,quantity:1})
     .onConflict(oc=>oc.columns(["userId","artworkId"]).doUpdateSet(eb=>({quantity:eb("tcgArtworkInventory.quantity","+",1)}))).execute();
    await trx.insertInto("tcgInventoryOrigin").values({userId,cardId:item.cardId,quantity:1})
     .onConflict(oc=>oc.columns(["userId","cardId"]).doUpdateSet(eb=>({quantity:eb("tcgInventoryOrigin.quantity","+",1)}))).execute();
    quantities.set(item.id,qty);
    drawn.push({id:item.cardId,artworkId:item.id,name:item.card.name,rarity:item.card.rarity,
     imagePath:item.imagePath,alternative:item.alternative,newCard:qty===1,quantity:qty});
   }
   await trx.insertInto("tcgPackHistoryOrigin").values({
    userId,drawn:tcgPackHistoryJsonb(drawn.map(c=>c.id)),
    artworks:tcgPackHistoryJsonb(drawn.map(c=>c.imagePath)),kind:gift?.kind||"normal"
   }).execute();
   if(gift){
    if(gift.remaining<=1)await trx.deleteFrom("tcgGiftPacks").where("id","=",gift.id).where("userId","=",userId).execute();
    else await trx.updateTable("tcgGiftPacks").set({remaining:gift.remaining-1}).where("id","=",gift.id).where("userId","=",userId).execute();
   }
   const rechargeAt=after.rechargeAt;
   await trx.updateTable("tcgPackStatus").set({opened:stored.opened+1,stock:after.stock,rechargeAt,
    nextAvailable:rechargeAt??now}).where("userId","=",userId).execute();
   const gifts=await trx.selectFrom("tcgGiftPacks").select(["remaining"]).where("userId","=",userId).execute();
   const giftStock=gifts.reduce((n,v)=>n+v.remaining,0);
   return {drawn,nextAvailable:rechargeAt?.toISOString()??null,boosterUnlimited:false,stock:after.stock,giftStock};
  });
  return new Response(superjson.stringify(result satisfies OutputType),{headers});
 }catch(e){
  if(!(e instanceof NoPacks))console.error("Origine booster error",e);
  return new Response(superjson.stringify({error:e instanceof NoPacks?e.message:"Ouverture temporairement indisponible."}),
   {status:e instanceof NoPacks?429:500,headers});
 }
}
