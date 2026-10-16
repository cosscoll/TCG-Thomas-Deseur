/** Legacy compatibility only; unlimited boosters are permanently disabled. */
const BETA_UNLIMITED_BOOSTERS = false;
export const tcgBoosterAvailability = Object.freeze({
 betaUnlimited: BETA_UNLIMITED_BOOSTERS,
 canOpen(nextAvailable:Date,now:number=Date.now(),unlimited:boolean=BETA_UNLIMITED_BOOSTERS){
  return unlimited || nextAvailable.getTime()<=now;
 },
 nextDate(now:number=Date.now(),unlimited:boolean=BETA_UNLIMITED_BOOSTERS){
  return new Date(unlimited?now:now+12*60*60*1000);
 },
 publicDate(nextAvailable:Date|null,unlimited:boolean=BETA_UNLIMITED_BOOSTERS){
  return unlimited?null:nextAvailable?.toISOString()??null;
 }
});
