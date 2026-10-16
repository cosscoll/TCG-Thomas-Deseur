import {normalizeGiftCode,hashGiftCode,validateGiftRewards} from "./tcgGiftCodes";
describe("TCG : codes cadeaux sécurisés",()=>{
 const artworks=new Set(["COST-001","COST-002","ALT_001"]);
 it("normalise toujours le même code",()=>{
  expect(normalizeGiftCode("  deseur-1234 ")).toBe("DESEUR-1234");
  expect(hashGiftCode("DESEUR-1234")).toBe(hashGiftCode(normalizeGiftCode(" deseur-1234 ")));
  expect(hashGiftCode("DESEUR-1234")).not.toBe(hashGiftCode("DESEUR-5678"));
  expect(()=>normalizeGiftCode("a")).toThrow();
  expect(()=>normalizeGiftCode("DESEUR !123")).toThrow();
 });
 it("autorise les récompenses combinées configurables",()=>{
  const r=validateGiftRewards([
   {type:"packs",kind:"normal",quantity:3},
   {type:"packs",kind:"special",quantity:2,rules:{rarityFloor:"epique"}},
   {type:"packs",kind:"custom",quantity:1,rules:{fixedArtworkIds:Array(5).fill("COST-001")}},
   {type:"card",artworkId:"ALT_001",quantity:1}],artworks);
  expect(r.length).toBe(4);
 });
 it("interdit les illustrations hors catalogue et les lots mal formés",()=>{
  expect(()=>validateGiftRewards([{type:"card",artworkId:"reward_hidden",quantity:1}],artworks)).toThrow();
  expect(()=>validateGiftRewards([{type:"packs",kind:"custom",quantity:1,rules:{fixedArtworkIds:["COST-001"]}}],artworks)).toThrow();
  expect(()=>validateGiftRewards([{type:"packs",kind:"special",quantity:1,rules:{rarityFloor:"mythic"}}],artworks)).toThrow();
  expect(()=>validateGiftRewards([{type:"packs",kind:"normal",quantity:1001}],artworks)).toThrow();
 });
});
