import superjson from 'superjson';
import type {GiftReward} from '../helpers/tcgGiftCodes';
export type InputType={code:string;label:string;rewards:GiftReward[];maxUses:number;expiresAt:string|null};
export type OutputType={code:string;label:string;maxUses:number;rewardCount:number};
export async function createGiftCode(input:InputType):Promise<OutputType>{
 const response=await fetch('/_api/gift_create',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:superjson.stringify(input)});
 const data=superjson.parse<any>(await response.text());
 if(!response.ok)throw Error(data?.error||'Création du code indisponible.');
 return data as OutputType;
}
