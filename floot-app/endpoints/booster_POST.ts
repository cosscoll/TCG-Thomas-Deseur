import {db} from "../helpers/db";
import {tcgMutationGuard} from "../helpers/tcgMutationGuard";
import {getServerUserSession} from "../helpers/getServerUserSession";
import {NotAuthenticatedError} from "../helpers/getSetServerSession";
import {tcgOriginRules} from "../helpers/tcgOriginRules";
import {tcgPackHistoryJsonb} from "../helpers/tcgPackHistoryJsonb";
import {tcgGiftPackRarity,tcgGiftPackArtworkAllowed} from "../helpers/tcgGiftPackRarity";
import {consumeBoosterStock,rechargeBoosterStock,BOOSTER_INTERVAL_MS} from "../helpers/tcgBoosterStock";
import {randomInt} from "node:crypto";
import superjson from "superjson";
import type {OutputType,DrawnCard} from "./booster_POST.schema";

type Variant={id:string;imagePath:string;reference:string};
type GiftRules={fixedArtworkIds?:string[];poolArtworkIds?:string[];rarityFloor?:string;raritySlots?:string[];megaCounts?:Record<string,number>};
class NoPacks extends Error{}
const headers={"Content-Type":"application/json","Cache-Control":"private, no-store"};
export async function handle(request:Request){
 const blocked = tcgMutationGuard(request);
 if (blocked) return blocked;
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
   const row=await trx.selectFrom("tcgGiftPacks").select(["id","kind","remaining","rules"])
    .where("userId","=",userId).where("remaining",">",0).orderBy("id","asc").forUpdate().executeTakeFirst();
   if(row)gift=row;
   else if(refreshed.stock>0)after=consumeBoosterStock(refreshed,now);
   else throw new NoPacks("Aucun booster en stock. Le prochain arrive dans quelques heures.");
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
   const storedRules=typeof gift?.rules==="string"?JSON.parse(gift.rules):gift?.rules;
   const rules=(storedRules && typeof storedRules==="object"&&!Array.isArray(storedRules)?storedRules:{}) as GiftRules;
   const mega=gift?.kind==="custom" && rules.megaCounts!==undefined;
   const megaExpected={commune:60,rare:20,epique:14,legendaire:5,hors_serie:1};
   if(mega && (!rules.megaCounts||Object.keys(rules.megaCounts).length!==5||
     Object.entries(megaExpected).some(([rarity,count])=>rules.megaCounts?.[rarity]!==count)))
    throw Error("Composition du booster de 100 cartes invalide.");
   if(gift?.kind==="custom" && !mega && (!Array.isArray(rules.fixedArtworkIds)||rules.fixedArtworkIds.length!==5) && (!Array.isArray(rules.raritySlots)||rules.raritySlots.length!==5||rules.raritySlots.some(r=>!['commune','rare','epique','legendaire'].includes(r))))throw Error("Booster personnalisé invalide.");
   const drawn:DrawnCard[]=[];
   if(mega){
    const artCounts=new Map<string,{cardId:string;count:number}>();
    const cardCounts=new Map<string,number>();
    for(const [rarity,count] of Object.entries(megaExpected)){
     const pool=groups.get(rarity);
     if(!pool?.length)throw Error("Rareté indisponible : "+rarity);
     for(let i=0;i<count;i++){
      const item=pool[randomInt(pool.length)];
      const qty=(quantities.get(item.id)||0)+1;
      quantities.set(item.id,qty);
      const prior=artCounts.get(item.id);
      artCounts.set(item.id,{cardId:item.cardId,count:(prior?.count||0)+1});
      cardCounts.set(item.cardId,(cardCounts.get(item.cardId)||0)+1);
      drawn.push({id:item.cardId,artworkId:item.id,name:item.card.name,rarity:item.card.rarity,
       imagePath:item.imagePath,alternative:false,newCard:qty===1,quantity:qty});
     }
    }
    await trx.insertInto("tcgArtworkInventory").values([...artCounts].map(([artworkId,v])=>({
     userId,artworkId,cardId:v.cardId,quantity:v.count
    }))).onConflict(oc=>oc.columns(["userId","artworkId"]).doUpdateSet(eb=>({
     quantity:eb("tcgArtworkInventory.quantity","+",eb.ref("excluded.quantity"))
    }))).execute();
    await trx.insertInto("tcgInventoryOrigin").values([...cardCounts].map(([cardId,quantity])=>({
     userId,cardId,quantity
    }))).onConflict(oc=>oc.columns(["userId","cardId"]).doUpdateSet(eb=>({
     quantity:eb("tcgInventoryOrigin.quantity","+",eb.ref("excluded.quantity"))
    }))).execute();
   }else{
   for(let slot=0;slot<5;slot++){
    let item:typeof artworks[number]|undefined;
    if(gift?.kind==="custom" && rules.fixedArtworkIds){
     item=catalogByArt.get(rules.fixedArtworkIds[slot]);
     if(!item||item.alternative&&!basesOwned.has(item.cardId))throw Error("Une alternative requiert sa carte de base.");
    }else{
     let outcome=gift?.kind==="custom" && rules.raritySlots ? rules.raritySlots[slot] : tcgOriginRules.select(slot,randomInt(100));
     if(gift?.kind==="special")outcome=tcgGiftPackRarity(outcome,rules.rarityFloor);
     if(outcome==="alternative" && variants.length)item=variants[randomInt(variants.length)];
     else{
      const category=outcome==="alternative"?"rare":outcome;
      const pool=groups.get(category);
      if(!pool?.length)throw Error("Rareté indisponible.");
      item=pool[randomInt(pool.length)];
     }
     if(Array.isArray(rules.poolArtworkIds)&&rules.poolArtworkIds.length && gift){
      const selected=permitted.filter(x=>rules.poolArtworkIds!.includes(x.id)&&
       (gift.kind!=="special"||tcgGiftPackArtworkAllowed(x.card.rarity,rules.rarityFloor)));
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
  154
