import {db} from '../helpers/db';
import {getServerUserSession} from '../helpers/getServerUserSession';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {normalizeGiftCode,hashGiftCode,validateGiftRewards} from '../helpers/tcgGiftCodes';
import {tcgArtworkCatalog} from '../helpers/tcgArtworkCatalog';
import {BOOSTER_INTERVAL_MS} from '../helpers/tcgBoosterStock';
import {sql} from 'kysely';
import superjson from 'superjson';
import type {OutputType} from './gift_redeem_POST.schema';
class GiftFailure extends Error{}
const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};
const fail=(status:number,error:string)=>new Response(superjson.stringify({error}),{status,headers});
export async function handle(request:Request){
 let userId:number;
 try{userId=(await getServerUserSession(request)).user.id;}
 catch(error){if(error instanceof NotAuthenticatedError)return fail(401,'Connexion requise.');return fail(500,'Session indisponible.');}
 try{
  const parsed=superjson.parse<{code:string}>(await request.text());
  const hash=hashGiftCode(normalizeGiftCode(parsed?.code));
  const output=await db.transaction().execute(async trx=>{
   await trx.insertInto('tcgPackStatus').values({userId,stock:1,rechargeAt:new Date(Date.now()+BOOSTER_INTERVAL_MS)})
    .onConflict(oc=>oc.column('userId').doNothing()).execute();
   await trx.selectFrom('tcgPackStatus').select('userId').where('userId','=',userId).forUpdate().executeTakeFirstOrThrow();
   const code=await trx.selectFrom('tcgGiftCodes').selectAll().where('codeHash','=',hash).forUpdate().executeTakeFirst();
   if(!code||!code.active||code.usedCount>=code.maxUses||(code.expiresAt&&code.expiresAt.getTime()<=Date.now()))
    throw new GiftFailure('Code invalide ou expiré.');
   const prior=await trx.selectFrom('tcgGiftRedemptions').select('codeId')
    .where('codeId','=',code.id).where('userId','=',userId).executeTakeFirst();
   if(prior)throw new GiftFailure('Ce code a déjà été utilisé sur ce compte.');
   const catalog=await trx.selectFrom('tcgCardsOrigin')
    .select(['id','name','rarity','reference','sourceReference','imagePath','ordinal','normalBooster','variants']).execute();
   const artworks=tcgArtworkCatalog(catalog);
   const artById=new Map(artworks.map(c=>[c.id,c]));
   const rewards=validateGiftRewards(code.rewards,new Set(artById.keys()));
   const current=await trx.selectFrom('tcgArtworkInventory').select(['artworkId','quantity'])
    .where('userId','=',userId).execute();
   const owned=new Set(current.filter(c=>c.quantity>0).map(c=>c.artworkId));
   for(const reward of rewards){
    if(reward.type!=='card')continue;
    const art=artById.get(reward.artworkId)!;
    if(art.alternative&&!owned.has(art.cardId))throw new GiftFailure('Obtiens d’abord la carte de base de cette alternative. Le code reste utilisable.');
   }
   const awarded:OutputType['cards']=[];let packs=0;
   for(const reward of rewards){
    if(reward.type==='packs'){
     const rules=reward.rules??{};
     await trx.insertInto('tcgGiftPacks').values({userId,kind:reward.kind,remaining:reward.quantity,
      rules:sql`${JSON.stringify(rules)}::jsonb`}).execute();
     packs+=reward.quantity;
    }else{
     const art=artById.get(reward.artworkId)!;
     await trx.insertInto('tcgArtworkInventory').values({userId,artworkId:art.id,cardId:art.cardId,quantity:reward.quantity})
      .onConflict(oc=>oc.columns(['userId','artworkId'])
       .doUpdateSet(eb=>({quantity:eb('tcgArtworkInventory.quantity','+',reward.quantity)}))).execute();
     await trx.insertInto('tcgInventoryOrigin').values({userId,cardId:art.cardId,quantity:reward.quantity})
      .onConflict(oc=>oc.columns(['userId','cardId'])
       .doUpdateSet(eb=>({quantity:eb('tcgInventoryOrigin.quantity','+',reward.quantity)}))).execute();
     awarded.push({name:art.name,quantity:reward.quantity,imagePath:art.imagePath});
    }
   }
   await trx.insertInto('tcgGiftRedemptions').values({codeId:code.id,userId}).execute();
   await trx.updateTable('tcgGiftCodes').set({usedCount:code.usedCount+1}).where('id','=',code.id).execute();
   return {message:'Récompense ajoutée à ton compte.',packs,cards:awarded} satisfies OutputType;
  });
  return new Response(superjson.stringify(output),{headers});
 }catch(error){
  if(error instanceof GiftFailure)return fail(409,error.message);
  if(error instanceof Error&&/Code invalide|Ajoute de|Récompense|Quantité|Carte offerte|booster|Rareté/.test(error.message))return fail(400,error.message);
  if(error&&typeof error==='object'&&'code'in error&&error.code==='23505')return fail(409,'Ce code a déjà été utilisé.');
  console.error('Gift redemption',error);
  return fail(500,'Code temporairement indisponible.');
 }
}

