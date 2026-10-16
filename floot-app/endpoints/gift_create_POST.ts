import {db} from '../helpers/db';
import {getServerUserSession} from '../helpers/getServerUserSession';
import {NotAuthenticatedError} from '../helpers/getSetServerSession';
import {normalizeGiftCode,hashGiftCode,validateGiftRewards} from '../helpers/tcgGiftCodes';
import {tcgArtworkCatalog} from '../helpers/tcgArtworkCatalog';
import {sql} from 'kysely';
import superjson from 'superjson';
import type {InputType,OutputType} from './gift_create_POST.schema';
const headers={'Content-Type':'application/json','Cache-Control':'private,no-store'};
const fail=(status:number,error:string)=>new Response(superjson.stringify({error}),{status,headers});
export async function handle(request:Request){
 try{
  const {user}=await getServerUserSession(request);
  if(user.role!=='admin')return fail(403,'Accès administrateur réservé.');
  const input=superjson.parse<InputType>(await request.text());
  const code=normalizeGiftCode(input?.code);
  if(typeof input?.label!=='string'||input.label.trim().length<2||input.label.trim().length>100)
   return fail(400,'Nom du code invalide.');
  if(!Number.isInteger(input.maxUses)||input.maxUses<1||input.maxUses>100000)return fail(400,'Limite invalide.');
  let expiresAt:Date|null=null;
  if(input.expiresAt){
   expiresAt=new Date(input.expiresAt);
   if(!Number.isFinite(expiresAt.getTime())||expiresAt.getTime()<=Date.now())return fail(400,'Date d’expiration invalide.');
  }
  const catalog=await db.selectFrom('tcgCardsOrigin')
   .select(['id','name','rarity','reference','sourceReference','imagePath','ordinal','normalBooster','variants']).execute();
  const known=tcgArtworkCatalog(catalog);
  const rewards=validateGiftRewards(input.rewards,new Set(known.map(c=>c.id)));
  const hash=hashGiftCode(code);
  await db.insertInto('tcgGiftCodes').values({codeHash:hash,label:input.label.trim(),
   rewards:sql`${JSON.stringify(rewards)}::jsonb`,maxUses:input.maxUses,expiresAt,createdBy:user.id}).execute();
  return new Response(superjson.stringify({code,label:input.label.trim(),maxUses:input.maxUses,rewardCount:rewards.length} satisfies OutputType),{headers});
 }catch(error){
  if(error instanceof NotAuthenticatedError)return fail(401,'Connexion requise.');
  if(error instanceof Error && /Code invalide|Récompense|Quantité|Carte offerte|booster|Rareté|Sélection de cartes|Ajoute de/.test(error.message))return fail(400,error.message);
  if(error&&typeof error==='object'&&'code'in error&&error.code==='23505')return fail(409,'Ce code existe déjà.');
  console.error('Gift creation',error);return fail(500,'Impossible de créer le code pour le moment.');
 }
}

