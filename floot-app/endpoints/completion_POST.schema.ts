import superjson from "superjson";
import type {DrawnCard} from "./booster_POST.schema";
export type OutputType={drawn:DrawnCard[];kind:"collection_reward"};
export async function openCollectionReward():Promise<OutputType>{
 const res=await fetch("/_api/completion",{method:"POST",headers:{"Content-Type":"application/json"},body:superjson.stringify({}),credentials:"include",cache:"no-store"});
 const body=superjson.parse<any>(await res.text());
 if(!res.ok)throw new Error(body.error||"Ce booster est indisponible.");
 return body as OutputType;
}

