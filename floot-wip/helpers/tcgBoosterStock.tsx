/** Strict server-side stock accounting. At most three regenerating packs. */
export const BOOSTER_INTERVAL_MS=12*60*60*1000;
export const MAX_BOOSTERS=3;
export type StockState={stock:number;rechargeAt:Date|null};
export function rechargeBoosterStock(state:StockState,now=new Date()):StockState{
 if(!Number.isInteger(state.stock)||state.stock<0||state.stock>MAX_BOOSTERS)throw Error("Stock invalide");
 if(state.stock===MAX_BOOSTERS)return {stock:MAX_BOOSTERS,rechargeAt:null};
 const first=state.rechargeAt?.getTime()??(now.getTime()+BOOSTER_INTERVAL_MS);
 if(first>now.getTime())return {stock:state.stock,rechargeAt:new Date(first)};
 const steps=1+Math.floor((now.getTime()-first)/BOOSTER_INTERVAL_MS);
 const stock=Math.min(MAX_BOOSTERS,state.stock+steps);
 return {stock,rechargeAt:stock===MAX_BOOSTERS?null:new Date(first+steps*BOOSTER_INTERVAL_MS)};
}
export function consumeBoosterStock(state:StockState,now=new Date()):StockState{
 const current=rechargeBoosterStock(state,now);
 if(current.stock===0)throw Error("Aucun booster disponible.");
 const next=current.stock-1;
 return {stock:next,rechargeAt:current.stock===MAX_BOOSTERS?new Date(now.getTime()+BOOSTER_INTERVAL_MS):current.rechargeAt??new Date(now.getTime()+BOOSTER_INTERVAL_MS)};
}
