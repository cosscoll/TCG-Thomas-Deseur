import {tcgAuthRateLimit} from "../helpers/tcgAuthRateLimit";
import {tcgReadLimitedBody} from "../helpers/tcgReadLimitedBody";
import {TcgRequestBodyError} from "../helpers/TcgRequestBodyError";
import {db} from '../helpers/db';
import {tcgMutationGuard} from "../helpers/tcgMutationGuard";
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
 const blocked = tcgMutationGuard(request);
 if (blocked) return blocked;
 let userId:number;
 try{userId=(await getServerUserSession(request)).user.id;}
 catch(error){if(error instanceof NotAuthenticatedError)return fail(401,'Connexion requise.');return fail(500,'Session indisponible.');}
 try{
  const throttle=await tcgAuthRateLimit(request,"redeem");
  if(throttle)return throttle;
  // Persistent per-account throttle: invalid guesses count even when redemption fails.
  const attempt=await sql<{attempts:number}>`
    INSERT INTO tcg_gift_attempt_windows(user_id,attempts,window_started_at)
    VALUES (${userId},1,NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      attempts=CASE WHEN tcg_gift_attempt_windows.window_started_at <= NOW()-INTERVAL '15 minutes'
        THEN 1 ELSE tcg_gift_attempt_windows.attempts+1 END,
      window_started_at=CASE WHEN tcg_gift_attempt_windows.window_started_at <= NOW()-INTERVAL '15 minutes'
        THEN NOW() ELSE tcg_gift_attempt_windows.window_started_at END
    RETURNING attempts
  `.execute(db);
  if(Number(attempt.rows[0]?.attempts??99)>10)return fail(429,'Trop de tentatives. Réessaie dans 15 minutes.');
  const parsed=superjson.parse<{code:string}>(await tcgReadLimitedBody(request));
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
   const storedRewards=typeof code.rewards==='string'?JSON.parse(code.rewards):code.rewards;
   const rewards=validateGiftRewards(storedRewards,new Set(artById.keys()));
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
      rules}).execute();
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
  if(error instanceof TcgRequestBodyError)return fail(error.status,error.message);
  if(error instanceof Error&&/Code invalide|Ajoute de|Récompense|Quantité|Carte offerte|booster|Rareté/.test(error.message))return fail(400,error.message);
  if(error&&typeof error==='object'&&'code'in error&&error.code==='23505')return fail(409,'Ce code a déjà été utilisé.');
  console.error('Gift redemption',error);
  return fail(500,'Code temporairement indisponible.');
 }
}
