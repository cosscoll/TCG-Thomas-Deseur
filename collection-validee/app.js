import {CARD_PHOTO_PAIRS_160} from '../data/correspondances-photo-illustration.js';
const byId=new Map(CARD_PHOTO_PAIRS_160.map(c=>[c.id,c]));
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=String(text);return e};
const artSrc=id=>{
 const pair=byId.get(id);
 return pair?'../collection-161/assets/cards/'+encodeURIComponent(pair.illustration):null;
};
let approved=[];
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
 const frame=image(card.primary,card.name);
 const caption=make('div','card-top');
 caption.append(make('span','card-reference',card.group));
 const variantTotal=card.alternatives.length+(card.shiny?1:0);
 caption.append(make('span','variant-badge',variantTotal===0?'Version unique':variantTotal+' variante'+(variantTotal>1?'s':'')));
 const label=make('div','card-label');
 label.append(make('h3','',card.name),make('small','',card.primary+' · Illustration principale'));
 box.append(frame,caption,label);
 if(card.alternatives.length){
  const variants=make('div','card-variants');
  variants.append(make('h4','','Variantes ('+card.alternatives.length+')'));
  const thumbs=make('div','thumbs');
  for(const [i,ref] of card.alternatives.entries()){
   const small=make('div','variant-item');
   small.append(image(ref,card.name+' — variante '+(i+1),true),make('small','',ref));
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
 const rows=approved.filter(c=>{
  const count=c.alternatives.length+(c.shiny?1:0);
  return (mode==='all'||mode==='variants'&&count>0||mode==='none'&&count===0||mode==='multi'&&count>1)
   && (c.name+' '+c.group+' '+c.primary+' '+c.alternatives.join(' ')).toLocaleLowerCase('fr').includes(search);
 });
 const fragment=document.createDocumentFragment();
 for(const entry of rows)fragment.append(cardView(entry));
 $('cards').replaceChildren(fragment);
 $('count').textContent=rows.length+' / '+approved.length+' cartes affichées';
 $('empty').hidden=rows.length>0;
}
async function initialize(){
 try{
  const response=await fetch('../data/choix-cartes-2026-10-11.json',{cache:'no-store'});
  if(!response.ok)throw Error('Impossible de récupérer la sélection publiée.');
  const data=await response.json();
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
   return {group,name,primary,alternatives,shiny};
  });
  $('total').textContent=approved.length;
  $('variants').textContent=approved.reduce((sum,c)=>sum+c.alternatives.length,0);
  $('excluded').textContent=discarded.length;
  $('search').addEventListener('input',render);
  $('filter').addEventListener('change',render);
  render();
 }catch(e){
  $('count').textContent='Chargement impossible';
  $('error').textContent=e.message||'Erreur inconnue';
  $('error').hidden=false;
 }
}
initialize();
