import superjson from "superjson";
import {postBooster} from "../endpoints/booster_POST.schema";
import {summarizeConfirmedBooster} from "./tcgBoosterRecap";
import {validateGiftRewards} from "./tcgGiftCodes";

describe("Booster cadeau de 100 cartes",()=>{
 const counts={commune:60,rare:20,epique:14,legendaire:5,hors_serie:1};
 it("valide uniquement la répartition exacte et un seul booster",()=>{
  const reward=validateGiftRewards([{type:"packs",kind:"custom",quantity:1,rules:{megaCounts:counts}}],new Set());
  expect(reward).toHaveSize(1);
  expect(reward[0].type).toBe("packs");
  expect(()=>validateGiftRewards([{type:"packs",kind:"custom",quantity:1,rules:{megaCounts:{...counts,rare:19}}}],new Set())).toThrow();
 });
 it("accepte un résultat serveur de 100 cartes avec la bonne distribution",async()=>{
  const previous=globalThis.fetch;
  const drawn=Object.entries(counts).flatMap(([rarity,n])=>Array.from({length:n},(_,i)=>({
   id:rarity+"_"+i,name:rarity+" "+i,rarity,imagePath:"/test.webp",newCard:i===0,quantity:i+1
  })));
  try{
   globalThis.fetch=jasmine.createSpy("fetch").and.resolveTo(new Response(superjson.stringify({
    drawn,stock:1,giftStock:0,boosterUnlimited:false,nextAvailable:"2026-11-22T12:00:00.000Z"
   }),{status:200})) as typeof fetch;
   const result=await postBooster();
   expect(result.drawn).toHaveSize(100);
   const recap=summarizeConfirmedBooster(result.drawn);
   expect(recap.total).toBe(100);
   expect(recap.byRarity.find(r=>r.rarity==="hors_serie")?.count).toBe(1);
   expect(recap.byRarity.find(r=>r.rarity==="legendaire")?.count).toBe(5);
  }finally{globalThis.fetch=previous;}
 });
});

--- end of the file's lines. Below: notes from Floot, NOT part of the file — never copy them into it ---
typecheck of earlier writes (helpers/tcgMegaBooster.spec.tsx): clean
