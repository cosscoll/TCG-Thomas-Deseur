import {tcgArtworkCatalog,type CardArt} from "./tcgArtworkCatalog";
const base:CardArt[]=Array.from({length:67},(_,i)=>({
  id:"COST-"+String(i+1).padStart(3,"0"),
  name:"Personnage "+(i+1),rarity:"commune",imagePath:"https://example.org/base-"+i+".webp",
  ordinal:i+1,reference:"REF-"+i,sourceReference:null,normalBooster:true,
  variants:i<38?[{id:"td_2_"+String(i+1).padStart(3,"0"),reference:"ALT-"+i,imagePath:"https://example.org/alt-"+i+".webp"}]:[]
}));
describe("TCG : classeur 105 illustrations",()=>{
  it("place chaque alternative juste après la base du même personnage",()=>{
    const items=tcgArtworkCatalog(base);
    expect(items.length).toBe(105);
    for(let i=0;i<38;i++){
      const parent=items.findIndex(x=>x.id===base[i].id);
      expect(items[parent+1].alternative).toBe(true);
      expect(items[parent+1].parentId).toBe(base[i].id);
      expect(items[parent+1].cardId).toBe(base[i].id);
      expect(items[parent+1].ordinal).toBe(items[parent].ordinal+1);
    }
  });
  it("ne révèle aucune récompense privée aux joueurs sans acquisition",()=>{
    const privateCard:CardArt={...base[0],id:"hidden_reward",normalBooster:false,variants:[]};
    const publicItems=tcgArtworkCatalog([...base,privateCard]);
    expect(publicItems.length).toBe(105);
    expect(publicItems.some(x=>x.id===privateCard.id)).toBe(false);
  });
  it("rejette un catalogue amputé d'une illustration",()=>{
    expect(()=>tcgArtworkCatalog(base.slice(1))).toThrow();
    const missing=base.map((c,i)=>i===0?{...c,variants:[]}:c);
    expect(()=>tcgArtworkCatalog(missing)).toThrow();
  });
});
