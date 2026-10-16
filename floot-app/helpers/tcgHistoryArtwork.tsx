/** Distinguish the actual artwork drawn from the character's standard illustration. */
export function tcgHistoryArtwork(actual:string|undefined,primary:string|undefined){
  const root="https://cosscoll.github.io/TCG-Thomas-Deseur/";
  const approved=typeof actual==="string"&&(
    actual.startsWith(root+"collection-validee/assets/gray-extended-")||
    actual.startsWith(root+"collection-161/assets/cards/")
  );
  const url=approved ? actual! : null;
  return {url,isVariant:Boolean(url&&primary&&url!==primary)};
}
