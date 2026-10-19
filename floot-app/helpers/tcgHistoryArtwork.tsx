/** Normalize only known public artwork URLs, without rewriting private rewards. */
const ROOT="https://cosscoll.github.io/TCG-Thomas-Deseur/";
const DETOURED=ROOT+"collection-validee/assets/detourees/";
const PUBLIC_FILENAME=/^td-(?:[123]-[0-9]{3}|lille)\.webp$/;

export function normalizePublicArtworkPath(raw:string|undefined):string|null{
  if(!raw||typeof raw!=="string"||/[?#]/.test(raw))return null;
  const legacyBase=ROOT+"collection-161/assets/cards/";
  const isCurrent=raw.startsWith(DETOURED)&&!raw.slice(DETOURED.length).includes("/");
  const isLegacy=raw.startsWith(legacyBase)&&!raw.slice(legacyBase.length).includes("/");
  const oldPrefix=ROOT+"collection-validee/assets/gray-extended-";
  const isGrayLegacy=raw.startsWith(oldPrefix)&&raw.slice((ROOT+"collection-validee/assets/").length).split("/").length===2;
  if(!isCurrent&&!isLegacy&&!isGrayLegacy)return null;
  const filename=raw.substring(raw.lastIndexOf("/")+1);
  return PUBLIC_FILENAME.test(filename)?DETOURED+filename:null;
}

/** Compare identities rather than outdated URLs: old bases are not alternatives. */
export function tcgHistoryArtwork(actual:string|undefined,primary:string|undefined){
  const url=normalizePublicArtworkPath(actual);
  const main=normalizePublicArtworkPath(primary);
  return {url,isVariant:Boolean(url&&main&&url!==main)};
}
