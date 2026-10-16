import superjson from 'superjson';
export type OutputType={message:string;packs:number;cards:{name:string;quantity:number;imagePath:string}[]};
export async function redeemGiftCode(code:string):Promise<OutputType>{
 const response=await fetch('/_api/gift_redeem',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:superjson.stringify({code})});
 const data=superjson.parse<any>(await response.text());
 if(!response.ok)throw Error(data?.error||'Ce code ne peut pas être utilisé.');
 return data as OutputType;
}
