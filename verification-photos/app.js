import {
  CARD_PHOTO_PAIRS_160, PRIMARY_PAIRS_69, DUPLICATE_PAIRS_91,
  PHOTO_REFS_WITHOUT_ILLUSTRATION_17, UNREPRESENTED_COSTUME_GROUPS
} from "../data/correspondances-photo-illustration.js";
import {PHOTO_ORIGINS_177} from "../data/photo-origins-177.js";

const $=id=>document.getElementById(id);
const fileIndex=new Map();
const byId=new Map(CARD_PHOTO_PAIRS_160.map(c=>[c.id,c]));
let mode="primary", filter="";
const make=(tag,className,text)=>{
 const el=document.createElement(tag);
 if(className)el.className=className;
 if(text!==undefined)el.textContent=String(text);
 return el;
};
function seriesOf(ref){return ref==="REF-177-LILLE"?"177":ref.split("-")[1];}
function sourceImage(reference){
 const filename=fileIndex.get(reference);
 return filename?"../tri-177/images_nommes/"+encodeURIComponent(filename):null;
}
function artImage(card){return "../collection-161/assets/cards/"+encodeURIComponent(card.illustration);}
function addPicture(where,src,alt,fallback){
 const frame=make("div","picture");
 if(src){
  const img=document.createElement("img");
  img.src=src;img.alt=alt;img.loading="lazy";img.decoding="async";
  img.addEventListener("error",()=>{
   frame.replaceChildren(make("p","image-error",fallback));
  },{once:true});
  frame.append(img);
 }else{
  frame.append(make("p","image-error",fallback));
 }
 where.append(frame);
}
function addSourceMeta(container,pair){
 const list=make("dl","refs");
 const pairs=[
  ["Illustration / ID",pair.id],
  ["Ancienne étiquette",pair.previousReference],
  ["Photo du ZIP (corrigée)",pair.sourceReference],
  ["Groupe de vues similaires",pair.groupId]
 ];
 for(const [label,value] of pairs){
  list.append(make("dt","",label),make("dd","",value));
 }
 container.append(list);
}
function photoCard(pair){
 const el=make("article","pair-card");
 el.dataset.group=pair.groupId;
 el.dataset.status=pair.proposedStatus;
 el.dataset.card=pair.id;
 const heading=make("div","pair-heading");
 heading.append(make("h3","",pair.id),make("span","state",
  pair.proposedStatus==="primary"?"Illustration principale proposée":"Variante mise de côté"));
 const media=make("div","pair-media");
 const source=make("figure","pair-figure");
 source.append(make("figcaption","figure-label","PHOTO ORIGINALE DU ZIP"),
  make("small","figure-subtitle",pair.sourceReference));
 addPicture(source,sourceImage(pair.sourceReference),"Photo originale "+pair.sourceReference,
 "Photo originale manquante");
 const art=make("figure","pair-figure");
 art.append(make("figcaption","figure-label","ILLUSTRATION ACTUELLE DE LA CARTE"),
  make("small","figure-subtitle",pair.id));
 addPicture(art,artImage(pair),"Illustration de "+pair.id,"Illustration introuvable");
 media.append(source,art);
 const info=make("div","pair-details");
 addSourceMeta(info,pair);
 const notes=make("p","pair-note",pair.partialMatch?
  "Attention : l'illustration montre une partie de l'affiche originale, et non l'affiche complète.":
  pair.previousReference!==pair.sourceReference?
  "Référence de l'illustration corrigée après comparaison visuelle.":
  "Référence de la photo et ancienne étiquette concordantes.");
 info.append(notes);
 if(pair.proposedStatus==="set_aside"){
  const canonical=byId.get(pair.representativeId);
  const other=make("p","compared-to","Même groupe que "+pair.representativeId+
   " (photo "+canonical.sourceReference+"). Mise à part provisoire : ne pas supprimer.");
  info.append(other);
 }
 const links=make("div","pair-links");
 const compare=document.createElement("a");
 compare.href="../tri-177/#"+encodeURIComponent(pair.groupId);
 compare.textContent="Voir toutes les photos de ce groupe ↗";
 links.append(compare);
 const original=document.createElement("a");
 original.href=sourceImage(pair.sourceReference)||"#";
 original.target="_blank";original.rel="noopener noreferrer";
 original.textContent="Ouvrir la photo du ZIP ↗";
 links.append(original);
 info.append(links);
 el.append(heading,media,info);
 return el;
}
function unusedCard(ref){
 const meta=PHOTO_ORIGINS_177[ref];
 const el=make("article","pair-card unused-card");
 el.dataset.group=meta.groupId;
 el.append(make("h3","",ref),make("p","unused-message","Photo du ZIP sans illustration dans les 160 cartes actuelles."));
 const media=make("div","pair-media");
 const source=make("figure","pair-figure");
 source.append(make("figcaption","figure-label","PHOTO ORIGINALE"),
   make("small","figure-subtitle",ref));
 addPicture(source,sourceImage(ref),"Photo originale "+ref,"Photo originale manquante");
 const absent=make("figure","pair-figure");
 absent.append(make("figcaption","figure-label","ILLUSTRATION"),
  make("div","unillustrated","Aucun rendu associé dans le catalogue"));
 media.append(source,absent);el.append(media);
 const note=make("p","pair-note",UNREPRESENTED_COSTUME_GROUPS.includes(meta.groupId)?
  "Ce costume n'a actuellement aucune illustration.":
  "Un autre angle du même costume peut être présent dans les cartes existantes.");
 el.append(note,make("p","source-line","Groupe : "+meta.groupId));
 const a=document.createElement("a");
 a.href="../tri-177/#"+encodeURIComponent(meta.groupId);
 a.textContent="Comparer toutes les photos du groupe ↗";
 el.append(a);
 return el;
}
function matches(pair,search,series,group,unused=false){
 const ref=unused?pair:pair.sourceReference;
 const groupId=unused?PHOTO_ORIGINS_177[ref].groupId:pair.groupId;
 const query=unused?ref+" "+groupId:
  [pair.id,pair.illustration,pair.previousReference,pair.sourceReference,pair.groupId].join(" ");
 return (series==="all"||series===seriesOf(ref))
  && (group==="all"||group===groupId)
  && query.toLowerCase().includes(search);
}
function render(){
 const search=$("search").value.trim().toLocaleLowerCase("fr");
 const series=$("series").value,group=$("group").value;
 const rows=mode==="unused"?PHOTO_REFS_WITHOUT_ILLUSTRATION_17:
   mode==="set_aside"?DUPLICATE_PAIRS_91:
   mode==="all"?CARD_PHOTO_PAIRS_160:PRIMARY_PAIRS_69;
 const matchesRows=rows.filter(r=>matches(r,search,series,group,mode==="unused"));
 const fragment=document.createDocumentFragment();
 for(const row of matchesRows)fragment.append(mode==="unused"?unusedCard(row):photoCard(row));
 $("results").replaceChildren(fragment);
 $("status").textContent=matchesRows.length+" résultat(s) sur "+rows.length+
   " — "+(mode==="primary"?"principales proposées":mode==="set_aside"?"variantes à part":mode==="unused"?"photos sans rendu":"correspondances");
 $("empty").hidden=matchesRows.length>0;
 for(const button of document.querySelectorAll("[data-mode]"))
  button.setAttribute("aria-pressed",String(button.dataset.mode===mode));
}
function csvExport(){
 const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
 const rows=[["id_carte","ancienne_reference","reference_photo_corrigee",
   "groupe","statut_propose","illustration_principale_groupe",
   "fichier_source_zip"].map(quote).join(";")];
 for(const pair of CARD_PHOTO_PAIRS_160){
  rows.push([pair.id,pair.previousReference,pair.sourceReference,pair.groupId,
   pair.proposedStatus,pair.representativeId,pair.originalFile].map(quote).join(";"));
 }
 const blob=new Blob(["\uFEFF"+rows.join("\r\n")],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="TCG_Deseur_Correspondances_Photo_Carte_160.csv";
 document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function init(){
 try{
  const response=await fetch("../tri-177/manifest.json",{cache:"no-store"});
  if(!response.ok)throw Error("Les références des 177 photographies ne sont pas accessibles.");
  const manifest=await response.json();
  if(manifest.images!==177||!Array.isArray(manifest.files))
   throw Error("Le manifeste de 177 photographies est incomplet.");
  for(const item of manifest.files){
   const reference=item.file.split("__")[0];
   if(reference&&item.file.endsWith(".webp"))fileIndex.set(reference,item.file);
  }
  if(fileIndex.size!==177)throw Error("Les 177 photos ne sont pas retrouvées.");
  for(const pair of CARD_PHOTO_PAIRS_160){
   if(!fileIndex.has(pair.sourceReference))throw Error("Photo source absente : "+pair.sourceReference);
  }
  for(const groupId of [...new Set(Object.values(PHOTO_ORIGINS_177).map(p=>p.groupId))].sort()){
   const option=document.createElement("option");option.value=groupId;option.textContent=groupId;
   $("group").append(option);
  }
  const linkedCard=new URLSearchParams(window.location.search).get("carte");
  if(linkedCard&&byId.has(linkedCard)){mode="all";$("search").value=linkedCard;}
  for(const btn of document.querySelectorAll("[data-mode]"))
   btn.addEventListener("click",()=>{mode=btn.dataset.mode;render();});
  $("search").addEventListener("input",render);
  $("series").addEventListener("change",render);
  $("group").addEventListener("change",render);
  $("export").addEventListener("click",csvExport);
  render();
 }catch(error){
  $("status").textContent="La galerie ne peut pas être chargée : "+error.message;
  $("status").setAttribute("role","alert");
 }
}
init();
