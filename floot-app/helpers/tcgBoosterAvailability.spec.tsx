import {rechargeBoosterStock,consumeBoosterStock,BOOSTER_INTERVAL_MS} from "./tcgBoosterStock";
describe("TCG : réserve de boosters régénérables",()=>{
  const now=new Date("2026-10-15T09:00:00Z");
  const period=BOOSTER_INTERVAL_MS;
  it("consomme une unité et conserve l'horloge",()=>{
    const initial={stock:1,rechargeAt:new Date(now.getTime()+period)};
    const spent=consumeBoosterStock(initial,now);
    expect(spent.stock).toBe(0);
    expect(spent.rechargeAt?.getTime()).toBe(now.getTime()+period);
    expect(()=>consumeBoosterStock(spent,now)).toThrow();
  });
  it("régénère après 12 h et s'arrête à 3",()=>{
    const initial={stock:1,rechargeAt:new Date(now.getTime()+period)};
    expect(rechargeBoosterStock(initial,new Date(now.getTime()+period-1)).stock).toBe(1);
    expect(rechargeBoosterStock(initial,new Date(now.getTime()+period)).stock).toBe(2);
    const full=rechargeBoosterStock(initial,new Date(now.getTime()+period*100));
    expect(full).toEqual({stock:3,rechargeAt:null});
    expect(consumeBoosterStock(full,new Date(now.getTime()+period*100)))
      .toEqual({stock:2,rechargeAt:new Date(now.getTime()+period*101)});
  });
  it("ne crédite rien pendant la pause à trois",()=>{
    const full={stock:3,rechargeAt:null};
    expect(rechargeBoosterStock(full,new Date(now.getTime()+period*50))).toEqual(full);
    const after=consumeBoosterStock(full,new Date(now.getTime()+period*50));
    expect(rechargeBoosterStock(after,new Date(now.getTime()+period*51-1)).stock).toBe(2);
    expect(rechargeBoosterStock(after,new Date(now.getTime()+period*51)).stock).toBe(3);
  });
  it("rejette les stocks hors limites",()=>{
    expect(()=>rechargeBoosterStock({stock:4,rechargeAt:null},now)).toThrow();
    expect(()=>rechargeBoosterStock({stock:-1,rechargeAt:null},now)).toThrow();
  });
});
