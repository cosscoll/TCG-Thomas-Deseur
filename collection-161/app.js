import {PUBLIC_CARDS_160,PUBLIC_RARITIES,REQUIRED_PUBLIC_IDS,demoProgress160,demoNormalPack160} from "../data/public-cards-160.js";
import {PHOTO_ORIGINS_177} from "../data/photo-origins-177.js";
const ORIGIN_SHORT={
 "images/100-1000-couches":"Vidéos 100 et 1000 couches",
 "images/serie-100-couches":"Série 100 couches",
 "images/personnages-thomas":"Personnages Thomas Deseur",
 "images/Braderie-de-Lille-2026":"Braderie de Lille 2026"
};
function cardName(card){return PHOTO_ORIGINS_177[card.reference]?.title??card.name;}
function originLabel(meta){return ORIGIN_SHORT[meta?.series]??"Source originale à préciser";}
const $=id=>document.getElementById(id);
const rarityNames=Object.fromEntries(PUBLIC_RARITIES.map(r=>[r.id,r.label]));
const demoOwned=Object.create(null);
const scenarios=Object.freeze({
  demo:()=>({...demoOwned}),
  empty:()=>({}),
  partial:()=>Object.fromEntries(REQUIRED_PUBLIC_IDS.slice(0,75).map(id=>[id,1])),
  "without-lille":()=>Object.fromEntries(REQUIRED_PUBLIC_IDS.filter(id=>id!=="td_lille").map(id=>[id,1])),
  eligible:()=>Object.fromEntries(REQUIRED_PUBLIC_IDS.map(id=>[id,1])),
  complete:()=>Object.fromEntries(REQUIRED_PUBLIC_IDS.map(id=>[id,1])),
});
let selected="empty";
let artworkPublished=false;
const button=(name,className,text)=>{
  const el=document.createElement(name);
  if(className)el.className=className;
  if(text!=null)el.textContent=String(text);
  return el;
};
function state(){return demoProgress160(scenarios[selected](),selected==="complete");}
function setState(id){
  if(!Object.hasOwn(scenarios,id))return;
  selected=id;
  for(const el of document.querySelectorAll("[data-scenario]")){
    el.setAttribute("aria-pressed",String(el.dataset.scenario===id));
  }
  render();
}
function render(){
  const progress=state();
  $("progress-number").textContent=progress.prerequisitesFound+" / 160";
  $("unlock-numbers").textContent=progress.prerequisitesFound+" / 160 prérequis réunis";
  $("unlock-track").setAttribute("aria-valuenow",String(progress.prerequisitesFound));
  $("unlock-fill").style.width=(progress.prerequisitesFound/160*100)+"%";
  const ready=progress.secretPackEligible;
  const finished=progress.secretPackAlreadyGranted;
  $("secret-status").textContent=finished?"Récupéré":ready?"Disponible":"Verrouillé";
  $("secret-detail").textContent=finished?"Le booster de collection a été récupéré":
    ready?"Booster spécial disponible (simulation)":
    progress.prerequisitesMissing+" autres cartes à découvrir";
  $("unlock-heading").textContent=finished?"Booster de collection déjà récupéré":ready?
    "Booster de collection disponible":"Booster de collection verrouillé";
  $("unlock-explanation").textContent=finished?
    "La récompense a déjà été obtenue : elle n'est attribuée qu'une fois par joueur.":
    ready?"Les 160 cartes visibles sont réunies. Le booster de collection peut être ouvert dans le jeu en ligne.":
    "Il faut posséder toutes les autres cartes. Il manque "+progress.prerequisitesMissing+" carte"+
    (progress.prerequisitesMissing>1?"s":"")+".";
  $("preview-secret").disabled=!ready;
  const search=$("search").value.trim().toLocaleLowerCase("fr");
  const rarity=$("rarity").value,ownedFilter=$("ownership").value;
  const inventory=scenarios[selected]();
  const cards=PUBLIC_CARDS_160.filter(card=>{
    const owned=(inventory[card.id]??0)>0;
    return (rarity==="all"||card.rarity===rarity)
      && (ownedFilter==="all"||(ownedFilter==="owned"&&owned)||(ownedFilter==="missing"&&!owned))
      && (card.reference+" "+cardName(card)+" "+(PHOTO_ORIGINS_177[card.reference]?.origin??"")+" "+(PHOTO_ORIGINS_177[card.reference]?.groupId??"")).toLocaleLowerCase("fr").includes(search);
  });
  $("cards-shown").textContent=cards.length+" carte"+(cards.length>1?"s":"")+" affichée"+(cards.length>1?"s":"");
  const fragment=document.createDocumentFragment();
  for(const card of cards){
    const owned=(inventory[card.id]??0)>0;
    const metadata=PHOTO_ORIGINS_177[card.reference];
    const displayName=cardName(card);
    const el=button("article","card","");
    el.dataset.rarity=card.rarity;
    el.dataset.owned=String(owned);
    const head=button("div","card-head");
    head.append(button("span","rarity-name",rarityNames[card.rarity]),
      button("span","card-number","#"+String(card.collectionNumber).padStart(3,"0")));
    const art=button("div","art-frame","Illustration en attente de publication");
    if(artworkPublished){
      const image=document.createElement("img");
      image.src=card.artPath;
      image.alt="Illustration : "+displayName+" — "+card.reference;
      image.loading="lazy";
      image.decoding="async";
      image.addEventListener("load",()=>{art.replaceChildren(image);art.classList.add("has-image")},{once:true});
      image.addEventListener("error",()=>{image.remove()},{once:true});
      // Lazy images must be connected to the document BEFORE they can load.
      // Append first, then replace the placeholder only once loaded.
      art.append(image);
    }
    art.setAttribute("role","img");
    art.setAttribute("aria-label","Illustration issue du PDF");
    const title=button("strong","card-title",displayName);
    const subtitle=button("small","card-subtitle","Nom descriptif proposé");
    const source=button("small","card-source",card.reference+" · "+(metadata?.groupId??"Groupe à vérifier"));
    const provenance=button("div","card-provenance");
    provenance.append(
      button("span","card-meta-label","Origine de la photo :"),
      button("span","card-origin",originLabel(metadata)),
      button("span","card-meta-small",metadata?
        (metadata.groupCount+" prise"+(metadata.groupCount>1?"s":"")+" de vue rapprochée"+(metadata.groupCount>1?"s":"")+" · vue "+metadata.variant):
        "Référence à vérifier")
    );
    const links=button("div","card-links");
    if(metadata?.originUrl){
      const originLink=document.createElement("a");
      originLink.href=metadata.originUrl;
      originLink.target="_blank";
      originLink.rel="noopener noreferrer";
      originLink.textContent="Source originale ↗";
      originLink.setAttribute("aria-label","Voir la source originale de "+displayName+" ("+card.reference+")");
      links.append(originLink);
    }
    if(metadata?.groupId){
      const groupLink=document.createElement("a");
      groupLink.href="../tri-177/#"+encodeURIComponent(metadata.groupId);
      groupLink.textContent=metadata.groupCount>1?"Comparer les vues →":"Voir la photo →";
      groupLink.setAttribute("aria-label","Comparer les photos de "+displayName+" ("+metadata.groupId+")");
      links.append(groupLink);
    }
    const status=button("span","card-status",owned?"Possédée (exemple)":"Non possédée (exemple)");
    el.append(head,art,subtitle,title,source,provenance,links,status);
    fragment.append(el);
  }
  $("cards-grid").replaceChildren(fragment);
  $("empty-results").hidden=cards.length!==0;
}
$("draw-demo").addEventListener("click",()=>{
  // Illustrative only. This random draw never invokes an endpoint and must
  // not be interpreted as a server-authoritative reward.
  const cards=demoNormalPack160();
  const result=$("demo-pack-results");
  const fragment=document.createDocumentFragment();
  for(const [index,card] of cards.entries()){
    const before=demoOwned[card.id]??0;
    demoOwned[card.id]=before+1;
    const item=button("li","demo-pack-card",
      "#"+(index+1)+" · "+cardName(card)+" · "+rarityNames[card.rarity]+" · "+
      (before===0?"Nouvelle carte (fictive)":"Doublon (fictif)"));
    item.dataset.rarity=card.rarity;
    fragment.append(item);
  }
  result.replaceChildren(fragment);
  result.hidden=false;
  setState("demo");
});
for(const btn of document.querySelectorAll("[data-scenario]"))btn.addEventListener("click",()=>setState(btn.dataset.scenario));
for(const id of ["search","rarity","ownership"]){
  $(id).addEventListener(id==="search"?"input":"change",render);
}
$("preview-secret").addEventListener("click",()=>{
  if(!state().secretPackEligible)return;
  // The preview never reveals the real reward. Only the authenticated
  // production app shows granted cards after the server confirms the opening.
  $("secret-dialog").showModal();
});
for(const id of ["close-secret","finish-secret"])$(id).addEventListener("click",()=>$("secret-dialog").close());
$("secret-dialog").addEventListener("click",e=>{if(e.target===$("secret-dialog"))e.target.close()});
render();
(async()=>{
  // One manifest controls the switch: when the prepared assets package
  // is uploaded intact, all 161 original artworks appear automatically.
  // Without it the GitHub preview uses honest neutral placeholders.
  try{
    const response=await fetch("./assets/available.json",{cache:"no-store"});
    if(!response.ok)return;
    const manifest=await response.json();
    if(manifest?.count===160 && Array.isArray(manifest.images) &&
      new Set(manifest.images).size===160){
      artworkPublished=true;
      render();
    }
  }catch{ /* image package not hosted yet */ }
})();
