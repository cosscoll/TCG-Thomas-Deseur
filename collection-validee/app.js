import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';
import {PHOTO_ORIGINS_177} from '../data/photo-origins-177.js';
const byId=new Map(CARD_PHOTO_PAIRS_160.map(c=>[c.id,c]));
const originNames=Object.freeze({
 'images/100-1000-couches':'Costumes — 100 et 1000 couches',
 'images/serie-100-couches':'Série 100 couches',
 'images/personnages-thomas':'Personnages Thomas',
 'images/Braderie-de-Lille-2026':'Braderie de Lille 2026'
});
function getPhoto(ref){
 const pair=byId.get(ref);
 return pair?PHOTO_ORIGINS_177[pair.sourceReference]:null;
}
function originLink(ref){
 const pair=byId.get(ref),meta=getPhoto(ref);
 if(!pair)return null;
 const wrap=make('div','photo-origin');
 wrap.append(make('span','photo-ref','Photo source : '+pair.sourceReference));
 if(meta?.originUrl){
  const a=make('a','origin-link','Voir la galerie de référence ↗');
  a.href=meta.originUrl;a.target='_blank';a.rel='noopener noreferrer';
  a.setAttribute('aria-label','Consulter la galerie documentaire de '+pair.sourceReference);
  wrap.append(a);
 }
 return wrap;
}
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const artSrc=id=>{
 const pair=byId.get(id);
 return pair?'../collection-161/assets/cards/'+encodeURIComponent(pair.illustration):null;
};
let approved=[];
const rarityOrder=Object.freeze(['Commune','Rare','Épique','Légendaire','Hors-série']);
const expectedRarityCounts=Object.freeze({'Commune':33,'Rare':21,'Épique':8,'Légendaire':4,'Hors-série':1});
function renderRaritySummary(){
 const counts=Object.fromEntries(rarityOrder.map(name=>[name,approved.filter(c=>c.rarity===name).length]));
 const parent=$('rarity-summary');
 const nodes=rarityOrder.map(name=>{
  const tile=make('div','rarity-stat rarity-'+rarityOrder.indexOf(name));
  tile.setAttribute('role','group');
  tile.setAttribute('aria-label',name+' : '+counts[name]+' cartes');
  tile.append(make('span','rarity-name',name),make('strong','',counts[name]));
  return tile;
 });
 parent.replaceChildren(...nodes);
}
function image(id,name,variant=false){
 const src=artSrc(id);
 const frame=make('div',variant?'image-frame variant-image':'image-frame');
 const img=make('img');
 if(src){img.src=src;img.alt='Illustration '+name+' ('+id+')';img.loading='lazy';img.decoding='async';
  img.addEventListener('error',()=>{frame.replaceChildren(make('span','missing','Illustration indisponible'))});frame.append(img);
 }else frame.append(make('span','missing','Illustration indisponible'));
 return frame;
}
function cardView(card){
 const box=make('article','card');
 box.dataset.group=card.group;
 box.dataset.rarity=card.rarity;
 const frame=image(card.primary,card.name);
 const caption=make('div','card-top');
 caption.append(make('span','card-reference',card.group));
 caption.append(make('span','rarity-badge rarity-'+rarityOrder.indexOf(card.rarity),card.rarity));
 const variantTotal=card.alternatives.length+(card.shiny?1:0);
 caption.append(make('span','variant-badge',variantTotal===0?'Version unique':variantTotal+' variante'+(variantTotal>1?'s':'')));
 const label=make('div','card-label');
 label.append(make('h3','',card.name),make('small','',card.primary+' · Illustration principale'));
 const meta=getPhoto(card.primary);
 label.append(make('p','origin-title','Galerie documentaire : '+(originNames[meta?.series]??'Source à vérifier')));
 const original=originLink(card.primary);
 if(original)label.append(original);
 box.append(frame,caption,label);
 if(card.alternatives.length){
  const variants=make('div','card-variants');
  variants.append(make('h4','','Variantes ('+card.alternatives.length+')'));
  const thumbs=make('div','thumbs');
  for(const [i,ref] of card.alternatives.entries()){
   const small=make('div','variant-item');
   small.append(image(ref,card.name+' — variante '+(i+1),true),make('small','',ref));
   const photo=byId.get(ref);
   if(photo)small.append(make('small','photo-ref',photo.sourceReference));
   thumbs.append(small);
  }
  variants.append(thumbs);box.append(variants);
 }
 if(card.shiny)box.append(make('p','shiny-note','Version Shiny prévue : illustration spécifique non produite.'));
 return box;
}
function render(){
 const search=$('search').value.toLocaleLowerCase('fr').trim();
 const mode=$('filter').value;
 const origin=$('origin').value;
 const rarity=$('rarity').value;
 const rows=approved.filter(c=>{
  const count=c.alternatives.length+(c.shiny?1:0);
  const gallery=getPhoto(c.primary)?.series;
  return (rarity==='all'||c.rarity===rarity)
   && (mode==='all'||mode==='variants'&&count>0||mode==='none'&&count===0||mode==='multi'&&count>1)
   && (origin==='all'||origin===gallery)
   && (c.name+' '+c.group+' '+c.primary+' '+c.alternatives.join(' ')+' '+byId.get(c.primary)?.sourceReference).toLocaleLowerCase('fr').includes(search);
 });
 const fragment=document.createDocumentFragment();
 for(const entry of rows)fragment.append(cardView(entry));
 $('cards').replaceChildren(fragment);
 $('count').textContent=rows.length+' / '+approved.length+' cartes affichées';
 $('empty').hidden=rows.length>0;
}
async function initialize(){
 try{
  const [response,rarityResponse]=await Promise.all([
   fetch('../data/choix-cartes-2026-10-11.json',{cache:'no-store'}),
   fetch('../data/raretes-validees-67.json',{cache:'no-store'})
  ]);
  if(!response.ok||!rarityResponse.ok)throw Error('Impossible de récupérer le catalogue et ses raretés officielles.');
  const [data,rarities]=await Promise.all([response.json(),rarityResponse.json()]);
  if(rarities.schema!=='tcg-deseur-rarities-v1'||rarities.source!=='catalogue-valide-67.json'||
     !rarities.cards||Object.keys(rarities.cards).length!==67)throw Error('Fichier des raretés incomplet.');
  if(data.schema!=='tcg-deseur-cards-v3'||!data.cards)throw Error('Format de catalogue incompatible.');
  const entries=Object.entries(data.cards);
  if(entries.length!==70)throw Error('Le fichier de sélection est incomplet.');
  const validated=entries.filter(([,c])=>c.status==='Validée');
  const discarded=entries.filter(([,c])=>c.status==='Écartée');
  if(validated.length!==67||discarded.length!==3)throw Error('Statuts de collection inattendus.');
  approved=validated.map(([group,c])=>{
   const {name,primary,alternatives=[],shiny=false}=c;
   if(!name?.trim()||byId.get(primary)?.groupId!==group||!Array.isArray(alternatives)
    ||new Set(alternatives).size!==alternatives.length||alternatives.some(id=>id===primary||byId.get(id)?.groupId!==group))
    throw Error('Correspondance non valide : '+group);
   const rarityChoice=rarities.cards[group];
   if(!rarityChoice||rarityChoice.name!==name||!rarityOrder.includes(rarityChoice.rarity))
    throw Error('Rareté manquante ou incohérente : '+group);
   return {group,name,primary,alternatives,shiny,rarity:rarityChoice.rarity};
  });
  const counts=Object.fromEntries(rarityOrder.map(name=>[name,approved.filter(c=>c.rarity===name).length]));
  if(Object.entries(expectedRarityCounts).some(([name,qty])=>counts[name]!==qty))
   throw Error('Répartition de raretés inattendue.');
  renderRaritySummary();
  $('total').textContent=approved.length;
  $('variants').textContent=approved.reduce((sum,c)=>sum+c.alternatives.length,0);
  $('excluded').textContent=discarded.length;
  $('search').addEventListener('input',render);
  $('filter').addEventListener('change',render);
  $('rarity').addEventListener('change',render);
  $('origin').addEventListener('change',render);
  render();
 }catch(e){
  $('count').textContent='Chargement impossible';
  $('error').textContent=e.message||'Erreur inconnue';
  $('error').hidden=false;
 }
}
initialize();
