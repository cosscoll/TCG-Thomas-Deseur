import superjson from "superjson";
import {summarizeConfirmedBooster} from "../helpers/tcgBoosterRecap";
export type DrawnCard={id:string;artworkId?:string;name:string;rarity:string;imagePath:string;newCard:boolean;quantity:number;alternative?:boolean};
export type OutputType={drawn:DrawnCard[];nextAvailable:string|null;boosterUnlimited:boolean;stock:number;giftStock:number};
export async function postBooster():Promise<OutputType>{
 const res=await fetch("/_api/booster",{method:"POST",headers:{"Content-Type":"application/json"},
  body:superjson.stringify({}),credentials:"include",cache:"no-store"});
 let body:any;
 try{body=superjson.parse<any>(await res.text());}
 catch{throw new Error("Réponse illisible. Vérifie ton classeur avant de réessayer.");}
 if(!res.ok)throw new Error(body?.error||"Ouverture impossible.");
 if(!body||!Array.isArray(body.drawn)||body.drawn.length!==5
    ||!body.drawn.every((c:DrawnCard)=>typeof c.imagePath==="string")
    ||body.boosterUnlimited!==false
    ||!Number.isInteger(body.stock)||body.stock<0||body.stock>3
    ||!Number.isInteger(body.giftStock)||body.giftStock<0
    ||(body.stock<3 && (typeof body.nextAvailable!=="string"||!Number.isFinite(Date.parse(body.nextAvailable))))
    ||(body.stock===3 && body.nextAvailable!==null))
   throw new Error("Résultat du booster invalide.");
 summarizeConfirmedBooster(body.drawn);
 return body as OutputType;
}

