import superjson from "superjson";
export type OutputType={
 cards:{id:string;cardId:string;name:string;rarity:string;reference:string;sourceReference:string|null;imagePath:string;ordinal:number;alternative:boolean;parentId:string|null}[];
 owned:{cardId:string;quantity:number}[];
 opened:number;boosterUnlimited:boolean;nextAvailable:string|null;stock:number;giftStock:number;
 history:{cards:string[];artworks?:string[];createdAt:string;kind:string}[];
 completion:{found:number;required:number;available:boolean;claimed:boolean};
};
export async function getCollection(signal?:AbortSignal):Promise<OutputType>{
 const res=await fetch("/_api/collection",{credentials:"include",signal,cache:"no-store"});
 const body=superjson.parse<any>(await res.text());
 if(!res.ok)throw new Error(body.error||"Erreur de collection");
 return body as OutputType;
}

