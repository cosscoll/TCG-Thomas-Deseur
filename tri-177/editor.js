/* TCG Deseur — Atelier de sélection des illustrations stylisées.
   1 visuel principal obligatoire et 0..N variantes optionnelles (dont Shiny à créer).
   Aucune mutation du jeu ni suppression des originaux. */
(() => {
'use strict';
const KEY='tcg_tri_card_v2_'; // même préfixe : migration sans perte des choix antérieurs
const SCHEMA='tcg-deseur-cards-v3';
const OLD_SCHEMA='tcg-deseur-cards-v2';
const SHINY='SHINY_FROM_MAIN';
const STATUSES=['À examiner','Validée','Écartée'];
const groups=[...document.querySelectorAll('.group')];
const search=document.querySelector('#q');
const filter=document.querySelector('#filter');
const shown=document.querySelector('#shown');
const tools=document.querySelector('.tools');
const exportButton=document.querySelector('#export');
const cards=new Map();
let localStoreOk=true;
try{localStorage.setItem('__tcg_tri_test__','1');localStorage.removeItem('__tcg_tri_test__')}catch{localStoreOk=false}
function el(tag,cls,text){
 const node=document.createElement(tag);
 if(cls)node.className=cls;
 if(text!==undefined)node.textContent=String(text);
 return node;
}
function opt(value,label){const o=el('option','',label);o.value=value;return o}
function get(key){try{return localStorage.getItem(key)}catch{return null}}
function warnStorage(){
 if(document.querySelector('#storage-warning'))return;
 const note=el('span','', 'Sauvegarde locale indisponible : exporte une sauvegarde JSON avant de quitter.');
 note.id='storage-warning';note.setAttribute('role','alert');tools.append(note);
}
if(!localStoreOk)warnStorage();
function save(card){
 try{localStorage.setItem(KEY+card.id,JSON.stringify(card.state))}
 catch{localStoreOk=false;warnStorage()}
}
function refsFrom(group){
 return [...group.querySelectorAll('.artwork-photo')].map(node=>({
  ref:node.dataset.cardId,
  sourceRef:node.dataset.sourceRef,
  src:node.querySelector('a').getAttribute('href'),
  node
 }));
}
function artFor(card,ref){return card.refs.find(r=>r.ref===ref)}
function normalizeRef(value,refs){
 if(typeof value!=='string'||!value)return '';
 return refs.find(r=>r.ref===value||r.sourceRef===value)?.ref||'';
}
function normalizeState(incoming,refs,legacyPrimary='',legacyDecision=''){
 const saved=incoming&&typeof incoming==='object'&&!Array.isArray(incoming)?incoming:{};
 const primary=normalizeRef(saved.primary,refs)||normalizeRef(legacyPrimary,refs)||refs[0]?.ref||'';
 const alternatives=[];
 const candidates=Array.isArray(saved.alternatives)?saved.alternatives:[saved.alternative];
 for(const candidate of candidates){
  const ref=normalizeRef(candidate,refs);
  if(ref&&ref!==primary&&!alternatives.includes(ref))alternatives.push(ref);
 }
 // Supporte l'ancien champ alternative="SHINY_FROM_MAIN" et le nouveau booléen shiny.
 const shiny=Boolean(primary&&(saved.shiny===true||saved.alternative===SHINY));
 const name=typeof saved.name==='string'?saved.name.slice(0,90):'';
 const previous=STATUSES.includes(saved.status)?saved.status:(legacyDecision==='Écarter du set'?'Écartée':'À examiner');
 const invalidPrimary=Boolean(saved.primary&&!refs.some(r=>r.ref===saved.primary));
 // Une carte renommée/convertie à partir des photos doit être revérifiée.
 const status=previous==='Validée'&&(!primary||!name.trim()||invalidPrimary)?'À examiner':previous;
 return {name,primary,alternatives,shiny,status};
}
function loadState(group,refs){
 let incoming={};
 try{incoming=JSON.parse(get(KEY+group.id)||'{}')}catch{}
 const accepted=window.__TCG_APPROVED_CARDS__?.[group.id];
 const hasLocal=incoming&&typeof incoming==='object'&&!Array.isArray(incoming)&&Object.keys(incoming).length>0;
 if(!hasLocal&&accepted){
  return normalizeState(accepted,refs,'','');
 }
 const state=normalizeState(incoming,refs,get('tcg_tri_photo_'+group.id)||'',get('tcg_tri_'+group.id)||'');
 if(accepted?.status==='Validée'&&state.status==='À examiner'){
  // Ne valide que si le contenu de la copie locale est identique à celui
  // explicitement confirmé sur GitHub ; toute modification garde son état.
  const same=state.name===accepted.name&&state.primary===accepted.primary
   &&JSON.stringify(state.alternatives)===JSON.stringify(accepted.alternatives)
   &&state.shiny===Boolean(accepted.shiny);
  if(same)state.status='Validée';
 }
 return state;
}
function label(parent,heading,control,klass){
 const lab=el('label',klass||'editor-label');
 lab.append(el('span','field-title',heading),control);
 parent.append(lab);return lab;
}
function picture(where,src,description){
 where.replaceChildren();
 if(!src){where.append(el('span','preview-empty','Aucun visuel'));return}
 const img=el('img');img.src=src;img.alt=description;img.loading='lazy';where.append(img);
}
function counts(card){
 const num=card.state.alternatives.length+(card.state.shiny?1:0);
 return num===0?'Aucune variante':num+' variante'+(num>1?'s':'')+(card.state.shiny?' (dont Shiny à créer)':'');
}
function drawAlternativePreviews(card){
 const zone=card.alternativesPreview;
 zone.replaceChildren();
 const selected=card.state.alternatives;
 if(!selected.length&&!card.state.shiny){
  zone.append(el('p','no-variants','Aucune variante sélectionnée : cette carte peut être validée avec son seul visuel principal.'));
  return;
 }
 selected.forEach((id,i)=>{
  const art=artFor(card,id);
  if(!art)return;
  const panel=el('div','preview-panel variant-panel');
  panel.append(el('strong','', 'VARIANTE '+(i+1)));
  const frame=el('div','preview-image');picture(frame,art.src,'Variante '+id);panel.append(frame);
  panel.append(el('small','',id+' · '+art.sourceRef));
  const remove=el('button','remove-variant','Retirer cette variante');remove.type='button';
  remove.setAttribute('aria-label','Retirer '+id+' des variantes de '+card.id);
  remove.addEventListener('click',()=>{card.state.alternatives=card.state.alternatives.filter(v=>v!==id);markChanged(card)});
  panel.append(remove);zone.append(panel);
 });
 if(card.state.shiny){
  const main=artFor(card,card.state.primary);
  const panel=el('div','preview-panel shiny-source variant-panel');
  panel.append(el('strong','','SHINY À CRÉER'));
  const frame=el('div','preview-image');picture(frame,main?.src,'Source principale du futur Shiny');panel.append(frame);
  panel.append(el('small','','Rendu Shiny à produire · base '+(card.state.primary||'indéfinie')));
  const remove=el('button','remove-variant','Ne plus prévoir ce Shiny');remove.type='button';
  remove.addEventListener('click',()=>{card.state.shiny=false;markChanged(card)});
  panel.append(remove);zone.append(panel);
 }
}
function render(card){
 const s=card.state;
 card.nameInput.value=s.name;
 card.mainSelect.value=s.primary;
 const main=artFor(card,s.primary);
 picture(card.mainImage,main?.src,'Illustration principale '+s.primary);
 card.mainCaption.textContent=s.primary||'Aucune illustration';
 card.shinyCheckbox.checked=s.shiny;
 card.variantsCount.textContent=counts(card);
 card.removeAllButton.disabled=!s.alternatives.length&&!s.shiny;
 drawAlternativePreviews(card);
 card.group.dataset.cardStatus=s.status;
 card.statusNode.textContent=card.refs.length===0?'Sans illustration stylisée':s.status==='Validée'?'Carte validée':s.status==='Écartée'?'Carte écartée':'À examiner';
 card.validateButton.textContent=s.status==='Validée'?'Carte validée ✓':'Valider cette carte';
 card.validateButton.disabled=s.status==='Validée'||card.refs.length===0;
 card.excludeButton.textContent=s.status==='Écartée'?'Réintégrer au tri':'Écarter cette carte';
 for(const art of card.refs){
  const selected=art.ref===s.primary;
  const alternative=s.alternatives.includes(art.ref);
  art.node.dataset.selected=String(selected);
  art.node.dataset.alternative=String(alternative);
  const mainButton=art.node.querySelector('.choose-main');
  const altButton=art.node.querySelector('.choose-alt');
  mainButton.setAttribute('aria-pressed',String(selected));
  altButton.setAttribute('aria-pressed',String(alternative));
  altButton.disabled=selected;
  altButton.textContent=alternative?'Retirer variante':'Ajouter variante';
  altButton.title=selected?'Visuel principal déjà sélectionné':'Ajouter ou retirer une version alternative';
 }
 card.group.querySelector('h2').textContent=card.id+' · '+(s.name.trim()||card.originalName);
 card.group.dataset.customName=s.name.toLocaleLowerCase('fr');
}
function markChanged(card){
 if(card.state.status==='Validée'||card.state.status==='Écartée')card.state.status='À examiner';
 card.message.textContent='Choix sauvegardés · validation à confirmer';
 save(card);render(card);update();
}
function build(card){
 const s=card.state;
 const box=el('div','card-editor');
 const top=el('div','editor-top');
 const name=el('input','card-name');name.type='text';name.maxLength=90;
 name.placeholder='Nom définitif de la carte';name.autocomplete='off';
 name.setAttribute('aria-label','Nom de '+card.id);
 label(top,'Nom de la carte',name);
 const status=el('span','card-status');top.append(status);box.append(top);
 const mainSection=el('div','single-main');
 const mainPick=el('select','pick-main');
 mainPick.setAttribute('aria-label','Illustration principale pour '+card.id);
 if(!card.refs.length)mainPick.append(opt('','Aucune illustration stylisée disponible'));
 for(const a of card.refs)mainPick.append(opt(a.ref,a.ref+' · origine '+a.sourceRef));
 label(mainSection,'1. Illustration principale (obligatoire)',mainPick);
 const mainPanel=el('div','preview-panel main-preview');
 mainPanel.append(el('strong','','VISUEL PRINCIPAL'));
 const mainFrame=el('div','preview-image');mainPanel.append(mainFrame);
 const mainCaption=el('small');mainPanel.append(mainCaption);
 mainSection.append(mainPanel);box.append(mainSection);
 const altSection=el('section','alternative-section');
 altSection.append(el('h3','','2. Variantes de la carte (facultatives)'));
 altSection.append(el('p','editor-hint','Sélectionne zéro, une ou plusieurs illustrations alternatives dans la galerie au-dessus en cliquant sur « Ajouter variante ». Une carte sans variante est parfaitement valide.'));
 const variantToolbar=el('div','variant-toolbar');
 const variantCount=el('strong','variant-count');
 const removeAll=el('button','clear-variants','Retirer toutes les variantes');removeAll.type='button';
 const shinyLine=el('label','shiny-toggle');
 const shinyCheckbox=el('input');shinyCheckbox.type='checkbox';
 shinyCheckbox.setAttribute('aria-label','Prévoir une variante Shiny à créer pour '+card.id);
 shinyLine.append(shinyCheckbox,el('span','','Prévoir aussi une version Shiny à créer (facultatif)'));
 variantToolbar.append(variantCount,removeAll,shinyLine);
 altSection.append(variantToolbar);
 const variantPreviews=el('div','variants-previews');altSection.append(variantPreviews);
 box.append(altSection);
 const actions=el('div','editor-actions');
 const validate=el('button','validate-card','Valider cette carte');validate.type='button';
 const exclude=el('button','exclude-card','Écarter cette carte');exclude.type='button';
 const message=el('span','editor-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 actions.append(validate,exclude,message);box.append(actions);
 const oldDecision=get('tcg_tri_'+card.id);
 if(oldDecision&&oldDecision!=='À examiner')box.append(el('small','legacy-info','Ancienne décision conservée : '+oldDecision));
 card.group.querySelector('.review').replaceWith(box);
 Object.assign(card,{
  box,nameInput:name,statusNode:status,mainSelect:mainPick,mainImage:mainFrame,mainCaption,
  shinyCheckbox,alternativesPreview:variantPreviews,variantsCount:variantCount,
  removeAllButton:removeAll,validateButton:validate,excludeButton:exclude,message
 });
 name.addEventListener('input',()=>{s.name=name.value;markChanged(card)});
 mainPick.addEventListener('change',()=>{
  const last=s.primary;
  s.primary=mainPick.value;
  s.alternatives=s.alternatives.filter(v=>v!==s.primary);
  // Previous primary is not automatically turned into an alternative.
  if(last!==s.primary)markChanged(card);
 });
 shinyCheckbox.addEventListener('change',()=>{s.shiny=shinyCheckbox.checked;markChanged(card)});
 removeAll.addEventListener('click',()=>{s.alternatives=[];s.shiny=false;markChanged(card)});
 validate.addEventListener('click',()=>{
  if(!s.name.trim()){message.textContent='Donne d’abord un nom à la carte.';name.focus();return}
  if(!s.primary){message.textContent='Choisis d’abord une illustration principale.';mainPick.focus();return}
  // Zéro variante est autorisé. Seule la principale et le nom sont requis.
  s.name=s.name.trim();s.status='Validée';save(card);render(card);update();
  message.textContent='Carte validée avec '+counts(card).toLocaleLowerCase('fr')+'. Pense à exporter le CSV ou JSON.';
 });
 exclude.addEventListener('click',()=>{
  s.status=s.status==='Écartée'?'À examiner':'Écartée';
  save(card);render(card);update();
  message.textContent=s.status==='Écartée'?'Carte écartée du futur set. Aucun fichier supprimé.':'Carte réintégrée au tri.';
 });
 for(const art of card.refs){
  const buttons=el('div','photo-actions');
  const primary=el('button','choose-main','Principale');primary.type='button';
  primary.setAttribute('aria-label','Définir '+art.ref+' comme visuel principal');
  const toggle=el('button','choose-alt','Ajouter variante');toggle.type='button';
  toggle.setAttribute('aria-label','Ajouter ou retirer '+art.ref+' des variantes');
  primary.addEventListener('click',()=>{
    if(s.primary===art.ref)return;
    s.primary=art.ref;
    s.alternatives=s.alternatives.filter(v=>v!==art.ref);
    markChanged(card);
  });
  toggle.addEventListener('click',()=>{
    if(s.primary===art.ref)return;
    s.alternatives=s.alternatives.includes(art.ref)
      ?s.alternatives.filter(v=>v!==art.ref)
      :[...s.alternatives,art.ref];
    markChanged(card);
  });
  buttons.append(primary,toggle);art.node.append(buttons);
 }
 render(card);
}
for(const group of groups){
 const refs=refsFrom(group);
 const name=group.querySelector('h2').textContent.split(' · ').slice(1).join(' · ');
 const card={id:group.id,group,refs,originalName:name,state:loadState(group,refs)};
 cards.set(card.id,card);build(card);
}
[
 ['validated','Cartes validées'],['pending','Cartes à examiner'],['excluded','Cartes écartées'],
 ['no-variants','Sans variantes'],['with-variants','Avec variantes']
].forEach(([value,label])=>filter.append(opt(value,label)));
const summary=el('span','decision-stats');summary.id='card-summary';tools.append(summary);
const exportJson=el('button','export-json','Exporter sauvegarde (.json)');exportJson.type='button';
const importLabel=el('label','import-label','Importer sauvegarde JSON');
const importFile=el('input');importFile.type='file';importFile.accept='.json,application/json';
importFile.setAttribute('aria-label','Importer une sauvegarde des choix TCG Deseur');
importLabel.append(importFile);tools.insertBefore(exportJson,shown);tools.insertBefore(importLabel,shown);
function update(){
 const query=search.value.toLocaleLowerCase('fr').trim();
 let visible=0,validated=0,excluded=0;
 for(const card of cards.values()){
  const s=card.state;
  if(s.status==='Validée')validated++;
  if(s.status==='Écartée')excluded++;
  const hasVariants=s.alternatives.length>0||s.shiny;
  const f=filter.value;
  const matchText=(card.group.dataset.search+' '+s.name).toLocaleLowerCase('fr').includes(query);
  const matchFilter=f==='all'||f===card.group.dataset.type
   ||(f==='urgent'&&card.group.dataset.status==='Haute priorité')
   ||(f==='validated'&&s.status==='Validée')
   ||(f==='pending'&&s.status==='À examiner')
   ||(f==='excluded'&&s.status==='Écartée')
   ||(f==='no-variants'&&!hasVariants)
   ||(f==='with-variants'&&hasVariants);
  const ok=matchText&&matchFilter;
  card.group.classList.toggle('hidden',!ok);if(ok)visible++;
 }
 shown.textContent=visible+' groupe(s) affiché(s)';
 summary.textContent=validated+' validée(s) · '+(cards.size-validated-excluded)+' à examiner · '+excluded+' écartée(s)';
}
search.addEventListener('input',update);
filter.addEventListener('change',update);
function rows(){
 return [...cards.values()].map(card=>{
  const s=card.state,main=artFor(card,s.primary);
  const variants=s.alternatives.map(ref=>artFor(card,ref)).filter(Boolean);
  return {
   reference_groupe:card.id,nom_carte:s.name,nom_provisoire:card.originalName,statut:s.status,
   id_illustration_principale:s.primary,reference_photo_source_principale:main?.sourceRef||'',
   fichier_illustration_principale:main?.src||'',
   nombre_variantes_existantes:variants.length,
   ids_illustrations_alternatives:variants.map(v=>v.ref).join(' | '),
   references_photos_sources_alternatives:variants.map(v=>v.sourceRef).join(' | '),
   fichiers_illustrations_alternatives:variants.map(v=>v.src).join(' | '),
   shiny_a_creer:s.shiny?'oui':'non',
   fichier_source_shiny_a_creer:s.shiny?main?.src||'':'',
   nombre_total_variantes:variants.length+(s.shiny?1:0),
   nombre_illustrations_stylisees_du_groupe:card.refs.length,
   ids_illustrations_du_groupe:card.refs.map(r=>r.ref).join(' | '),
   decision_ancien_tri:get('tcg_tri_'+card.id)||''
  };
 });
}
function download(filename,text,type){
 const url=URL.createObjectURL(new Blob([text],{type}));
 const anchor=el('a');anchor.href=url;anchor.download=filename;
 document.body.append(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function safeCsv(value){
 let val=String(value??'').replaceAll('\r',' ').replaceAll('\n',' ');
 if(/^\s*[=+\-@]/.test(val))val="'"+val;
 return '"'+val.replaceAll('"','""')+'"';
}
exportButton.textContent='Exporter les cartes (.csv)';
exportButton.addEventListener('click',()=>{
 const data=rows(),columns=Object.keys(data[0]||{});
 download('TCG_Deseur_cartes_noms_visuels.csv','\ufeff'+[
  columns.map(safeCsv).join(';'),
  ...data.map(row=>columns.map(col=>safeCsv(row[col])).join(';'))
 ].join('\r\n'),'text/csv;charset=utf-8');
});
exportJson.addEventListener('click',()=>{
 const entries={};
 for(const card of cards.values())entries[card.id]={...card.state,alternatives:[...card.state.alternatives]};
 download('TCG_Deseur_sauvegarde_tri.json',JSON.stringify({
  schema:SCHEMA,savedAt:new Date().toISOString(),cards:entries
 },null,2),'application/json;charset=utf-8');
});
importFile.addEventListener('change',async()=>{
 const file=importFile.files?.[0];if(!file)return;
 try{
  if(file.size>2_000_000)throw Error('Fichier trop volumineux.');
  const data=JSON.parse(await file.text());
  if(![SCHEMA,OLD_SCHEMA].includes(data.schema)||!data.cards||typeof data.cards!=='object')
   throw Error('Ce fichier ne correspond pas à une sauvegarde TCG Deseur.');
  if(!window.confirm('Importer cette sauvegarde ? Les choix actuels du navigateur seront remplacés.'))return;
  for(const card of cards.values()){
   const incoming=data.cards[card.id];
   if(!incoming||typeof incoming!=='object')continue;
   const normalized=normalizeState(incoming,card.refs);
   // La validation est conservée pour une sauvegarde récente si la source n'a pas été modifiée.
   Object.assign(card.state,normalized);
   save(card);render(card);
  }
  update();window.alert('Sauvegarde importée. Les variantes multiples et les cartes sans variante sont conservées.');
 }catch(error){window.alert('Import impossible : '+error.message)}
 finally{importFile.value=''}
});
update();
})();