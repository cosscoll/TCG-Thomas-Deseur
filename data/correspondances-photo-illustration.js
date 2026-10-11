/** Correspondances reconstruites par comparaison visuelle des photographies
 * du ZIP et des illustrations du PDF. Noms artistiques laissés de côté.
 *
 * IMPORTANT : les anciennes références d'illustration suivent l'ordre du PDF
 * et NE sont PAS des références fiables des photos d'origine.
 * Les 69 groupes et 91 variantes sont des PROPOSITIONS de dédoublonnage,
 * sans suppression des cartes ni migration des inventaires des joueurs.
 */
import {PHOTO_ORIGINS_177} from "./photo-origins-177.js";

export const PERMUTATIONS_160=Object.freeze({
 "1":Object.freeze({1:2,2:3,3:4,4:1,5:5,6:8,7:6,8:7,9:11,10:12,11:10,12:9,13:14,14:15,15:13,16:16,17:17,18:20,19:19,20:18,21:21,22:23,23:22,24:24,25:27,26:25,27:28,28:26,29:30,30:31,31:29,32:32,33:35,34:33,35:34,36:36,37:37,38:39,39:40,40:38,41:41,42:43,43:42,44:44,45:50,49:49,50:45,51:51,52:53,53:55,54:54,55:52,56:58,57:59,58:57,59:56,60:61,61:63,62:60,63:62,64:66,65:64,66:65}),
 "2":Object.freeze({1:2,2:3,3:1,4:4,5:5,6:8,7:6,8:7,19:22,20:19,21:21,22:20,23:23,24:26,25:25,26:24,27:30,29:27,30:31,31:29,32:35,33:34,34:32,35:33,36:37,37:38,38:36,39:39,40:41,41:43,42:42,43:40,44:44,45:45,46:48,48:46,49:50,50:52,51:49,52:51,53:56,54:55,55:53,56:54,57:59,58:58,59:57,60:60,61:62,62:61,63:63,64:64,65:65,66:66}),
 "3":Object.freeze({1:1,2:2,3:4,4:3,5:7,6:6,7:8,8:5,9:11,10:10,11:9,12:12,14:17,15:15,16:16,17:14,18:20,19:18,20:19,21:21,22:23,23:25,24:24,25:22,26:26,27:28,28:27,29:29,30:32,31:31,32:33,33:30,34:34,35:36,36:35,37:37,38:40,39:38,40:41,41:39,42:43,43:42})
});

const pad=n=>String(n).padStart(3,"0");
const mapped=Object.entries(PERMUTATIONS_160).flatMap(([series,refs])=>
 Object.entries(refs).map(([cardNumber,sourceNumber])=>{
  const id="td_"+series+"_"+pad(Number(cardNumber));
  const original="REF-"+series+"-"+pad(sourceNumber);
  const meta=PHOTO_ORIGINS_177[original];
  if(!meta)throw Error("Photo absente du ZIP : "+original);
  return Object.freeze({
   id,
   illustration:"td-"+series+"-"+pad(Number(cardNumber))+".webp",
   previousReference:"REF-"+series+"-"+pad(Number(cardNumber)),
   sourceReference:original,
   originalFile:meta.originalFile,
   groupId:meta.groupId,
   sourceGallery:meta.series,
   series:Number(series),
   partialMatch:false
  });
 })
);
const poster=PHOTO_ORIGINS_177["REF-177-LILLE"];
mapped.push(Object.freeze({
 id:"td_lille",illustration:"td-lille.webp",previousReference:"REF-177-LILLE",
 sourceReference:"REF-177-LILLE",originalFile:poster.originalFile,
 groupId:poster.groupId,sourceGallery:poster.series,series:177,partialMatch:true
}));
mapped.sort((a,b)=>a.series-b.series||a.id.localeCompare(b.id));
if(mapped.length!==160||new Set(mapped.map(c=>c.id)).size!==160||
 new Set(mapped.map(c=>c.sourceReference)).size!==160)
 throw Error("Les 160 correspondances doivent être uniques.");
const grouped=new Map();
for(const pair of mapped){
 const arr=grouped.get(pair.groupId)??[];arr.push(pair);grouped.set(pair.groupId,arr);
}
if(grouped.size!==69)throw Error("Le tri provisoire attend 69 groupes illustrés.");
const selects=new Map();
for(const [group,arr] of grouped){
 // Préférence à la première prise de vue source du groupe quand elle a bien
 // une illustration. Sinon, conserver la première illustration référencée.
 const sources=Object.entries(PHOTO_ORIGINS_177)
  .filter(([,v])=>v.groupId===group)
  .map(([ref])=>ref);
 const preferred=arr.find(c=>c.sourceReference===sources[0])??arr[0];
 selects.set(group,preferred.id);
}
export const CARD_PHOTO_PAIRS_160=Object.freeze(mapped.map(c=>Object.freeze({
 ...c,representativeId:selects.get(c.groupId),
 proposedStatus:c.id===selects.get(c.groupId)?"primary":"set_aside"
})));
export const PRIMARY_PAIRS_69=Object.freeze(CARD_PHOTO_PAIRS_160.filter(p=>p.proposedStatus==="primary"));
export const DUPLICATE_PAIRS_91=Object.freeze(CARD_PHOTO_PAIRS_160.filter(p=>p.proposedStatus==="set_aside"));
export const PHOTO_REFS_WITHOUT_ILLUSTRATION_17=Object.freeze(
 Object.keys(PHOTO_ORIGINS_177).filter(ref=>!new Set(CARD_PHOTO_PAIRS_160.map(p=>p.sourceReference)).has(ref))
);
export const UNREPRESENTED_COSTUME_GROUPS=Object.freeze(
 [...new Set(Object.values(PHOTO_ORIGINS_177).map(p=>p.groupId))]
  .filter(g=>!grouped.has(g))
);
if(PRIMARY_PAIRS_69.length!==69||DUPLICATE_PAIRS_91.length!==91||
 PHOTO_REFS_WITHOUT_ILLUSTRATION_17.length!==17||
 UNREPRESENTED_COSTUME_GROUPS.length!==1||UNREPRESENTED_COSTUME_GROUPS[0]!=="COST-048")
 throw Error("Le dédoublonnage doit conserver ses références de contrôle.");
