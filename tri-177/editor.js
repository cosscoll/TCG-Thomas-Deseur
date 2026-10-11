/* Atelier TCG Deseur : nom, visuel principal, illustration alternative et validation.
   Fonctionne sans serveur ; ne modifie jamais les images originales. */
(function () {
'use strict';
const KEY='tcg_tri_card_v2_';
const groups=[...document.querySelectorAll('.group')];
const search=document.querySelector('#q');
const filter=document.querySelector('#filter');
const shown=document.querySelector('#shown');
const tools=document.querySelector('.tools');
const exportButton=document.querySelector('#export');
const SHINY='SHINY_FROM_MAIN';
const validStates=['À examiner','Validée','Écartée'];
const cards=new Map();
let storageAvailable=true;
try{localStorage.setItem('__tcg_tri_test__','1');localStorage.removeItem('__tcg_tri_test__')}catch{storageAvailable=false}
function read(key){try{return localStorage.getItem(key)}catch{return null}}
function save(card){try{localStorage.setItem(KEY+card.id,JSON.stringify(card.state))}catch{storageAvailable=false; storageWarning()}}
function storageWarning(){
 if(document.querySelector('#storage-warning'))return;
 const e=document.createElement('span');e.id='storage-warning';e.setAttribute('role','alert');
 e.textContent='Sauvegarde locale indisponible : exporte tes choix avant de quitter cette page.';
 tools.append(e);
}
if(!storageAvailable)storageWarning();
function element(tag,cls,text){
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(text!==undefined)e.textContent=text;
 return e;
}
function labeledText(parent,text,control){const l=element('label','editor-label');l.append(element('span','field-title',text),control);parent.append(l);return l}
function option(value,label){const e=element('option','',label);e.value=value;return e}
function getRefs(group){return [...group.querySelectorAll('.photo')].map(p=>({ref:p.querySelector('strong').textContent.trim(),src:p.querySelector('a').getAttribute('href'),node:p}))}
function persisted(group,refs){
 let saved=null;
 try{saved=JSON.parse(read(KEY+group.id)||'null')}catch{}
 if(!saved||typeof saved!=='object')saved={};
 let prevPhoto=read('tcg_tri_photo_'+group.id);
 let prevDecision=read('tcg_tri_'+group.id);
 const primary=refs.some(r=>r.ref===saved.primary)?saved.primary:(refs.some(r=>r.ref===prevPhoto)?prevPhoto:refs[0].ref);
 const alternative=saved.alternative===SHINY?SHINY:(refs.some(r=>r.ref===saved.alternative&&r.ref!==primary)?saved.alternative:'');
 const status=validStates.includes(saved.status)?saved.status:(prevDecision==='Écarter du set'?'Écartée':'À examiner');
 return {name:typeof saved.name==='string'?saved.name.slice(0,90):'',primary,alternative,status};
}
function imageOf(card,ref){return card.refs.find(r=>r.ref===ref)}
function syncAlternativeOptions(card){
 const select=card.altSelect;
 select.replaceChildren(option('','Choisir une alternative…'),option(SHINY,'Version Shiny à créer depuis le visuel principal'));
 card.refs.forEach(r=>{
   if(r.ref!==card.state.primary)select.append(option(r.ref,'Autre photo : '+r.ref));
 });
 if(card.state.alternative&&![...select.options].some(o=>o.value===card.state.alternative))card.state.alternative='';
 select.value=card.state.alternative;
}
function previewImage(parent,src,alt){
 parent.replaceChildren();
 if(!src){parent.append(element('span','preview-empty','À sélectionner'));return}
 const img=element('img');img.src=src;img.alt=alt;img.loading='lazy';parent.append(img);
}
function render(card){
 const s=card.state;
 card.nameInput.value=s.name;
 card.mainSelect.value=s.primary;
 syncAlternativeOptions(card);
 const main=imageOf(card,s.primary);
 const alternate=imageOf(card,s.alternative);
 previewImage(card.mainImage,main&&main.src,'Aperçu du visuel principal '+s.primary);
 previewImage(card.altImage,(s.alternative===SHINY?main:alternate)?.src,'Aperçu de la source du visuel alternatif');
 card.mainCaption.textContent=s.primary||'À choisir';
 card.altCaption.textContent=s.alternative===SHINY?'Shiny à illustrer · source '+s.primary:(s.alternative||'À choisir');
 card.altPanel.classList.toggle('shiny-source',s.alternative===SHINY);
 card.group.dataset.cardStatus=s.status;
 card.statusNode.textContent=s.status==='Validée'?'Carte validée':s.status==='Écartée'?'Carte écartée':'À examiner';
 card.validateButton.textContent=s.status==='Validée'?'Carte validée ✓ (modifier pour réviser)':'Valider cette carte';
 card.validateButton.disabled=s.status==='Validée';
 card.excludeButton.textContent=s.status==='Écartée'?'Réintégrer au tri':'Écarter cette carte';
 card.refs.forEach(r=>{
  r.node.dataset.selected=String(r.ref===s.primary);
  r.node.dataset.alternative=String(r.ref===s.alternative);
  const m=r.node.querySelector('.choose-main');
  const a=r.node.querySelector('.choose-alt');
  m.setAttribute('aria-pressed',String(r.ref===s.primary));
  a.setAttribute('aria-pressed',String(r.ref===s.alternative));
  a.disabled=r.ref===s.primary;
  a.title=r.ref===s.primary?'Pour un Shiny du principal, utilise « Version Shiny à créer »':'Choisir comme image alternative';
 });
 const heading=card.group.querySelector('h2');
 heading.textContent=card.id+' · '+(s.name.trim()||card.originalName);
 card.group.dataset.customName=s.name.toLocaleLowerCase('fr');
}
function changed(card){
 if(card.state.status==='Validée'||card.state.status==='Écartée')card.state.status='À examiner';
 card.message.textContent='Choix enregistrés localement · validation à confirmer';
 save(card);render(card);update();
}
function build(card){
 const group=card.group, review=group.querySelector('.review'), s=card.state;
 const box=element('div','card-editor');
 const top=element('div','editor-top');
 const nameInput=element('input','card-name');
 nameInput.type='text';nameInput.maxLength=90;nameInput.placeholder='Saisir le nom définitif de la carte';nameInput.value=s.name;
 nameInput.autocomplete='off';nameInput.setAttribute('aria-label','Nom définitif pour '+card.id);
 labeledText(top,'Nom de la carte',nameInput);
 const statusNode=element('span','card-status');top.append(statusNode);
 box.append(top);
 const picks=element('div','pick-grid');
 const mainSelect=element('select','pick-main');
 const altSelect=element('select','pick-alt');
 mainSelect.setAttribute('aria-label','Visuel principal pour '+card.id);
 altSelect.setAttribute('aria-label','Visuel alternatif pour '+card.id);
 card.refs.forEach(r=>mainSelect.append(option(r.ref,r.ref+' · '+r.node.querySelector('span').textContent)));
 labeledText(picks,'1. Visuel principal',mainSelect);
 labeledText(picks,'2. Visuel alternatif / Shiny',altSelect);
 box.append(picks);
 const previews=element('div','card-previews');
 const mainPanel=element('div','preview-panel');
 mainPanel.append(element('strong','','VISUEL PRINCIPAL'));
 const mainImage=element('div','preview-image');mainPanel.append(mainImage);
 const mainCaption=element('small');mainPanel.append(mainCaption);
 const altPanel=element('div','preview-panel');
 altPanel.append(element('strong','','VISUEL ALTERNATIF'));
 const altImage=element('div','preview-image');altPanel.append(altImage);
 const altCaption=element('small');altPanel.append(altCaption);
 previews.append(mainPanel,altPanel);box.append(previews);
 const hint=element('p','editor-hint','Alternative : choisis une autre photo du groupe, ou « Version Shiny à créer » pour prévoir une illustration spéciale basée sur la principale. Le rendu Shiny n’est pas encore créé.');
 box.append(hint);
 const actions=element('div','editor-actions');
 const validateButton=element('button','validate-card','Valider cette carte');validateButton.type='button';
 const excludeButton=element('button','exclude-card','Écarter cette carte');excludeButton.type='button';
 const message=element('span','editor-message');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 actions.append(validateButton,excludeButton,message);box.append(actions);
 const prevDecision=read('tcg_tri_'+card.id);
 if(prevDecision&&prevDecision!=='À examiner'){
   box.append(element('small','legacy-info','Ancienne décision conservée : '+prevDecision));
 }
 review.replaceWith(box);
 Object.assign(card,{box,nameInput,statusNode,mainSelect,altSelect,mainPanel,mainImage,mainCaption,altPanel,altImage,altCaption,validateButton,excludeButton,message});
 nameInput.addEventListener('input',()=>{s.name=nameInput.value;changed(card)});
 mainSelect.addEventListener('change',()=>{s.primary=mainSelect.value;if(s.alternative===s.primary)s.alternative='';changed(card)});
 altSelect.addEventListener('change',()=>{s.alternative=altSelect.value;changed(card)});
 validateButton.addEventListener('click',()=>{
  if(!s.name.trim()){message.textContent='Indique d’abord le nom de la carte.';nameInput.focus();return}
  if(!s.primary){message.textContent='Choisis le visuel principal.';mainSelect.focus();return}
  if(!s.alternative){message.textContent='Choisis une autre photo ou une version Shiny à créer.';altSelect.focus();return}
  if(s.alternative===s.primary){message.textContent='Les deux photos doivent être différentes (ou choisis le Shiny).';altSelect.focus();return}
  s.name=s.name.trim();s.status='Validée';save(card);render(card);update();
  message.textContent='Carte validée et sauvegardée. Exporte le CSV/JSON pour me transmettre tes choix.';
 });
 excludeButton.addEventListener('click',()=>{
  s.status=s.status==='Écartée'?'À examiner':'Écartée';
  save(card);render(card);update();message.textContent=s.status==='Écartée'?'Carte écartée du futur set (aucune image supprimée).':'Carte réintégrée au tri.';
 });
 for(const photo of card.refs){
  const actions=element('div','photo-actions');
  const main=element('button','choose-main','Principale');main.type='button';main.title='Choisir '+photo.ref+' comme principale';
  const alt=element('button','choose-alt','Alternative');alt.type='button';alt.title='Choisir '+photo.ref+' comme alternative';
  main.addEventListener('click',()=>{s.primary=photo.ref;if(s.alternative===photo.ref)s.alternative='';changed(card)});
  alt.addEventListener('click',()=>{if(photo.ref===s.primary){message.textContent='Cette photo est déjà principale : choisis « Version Shiny à créer ».';return}s.alternative=photo.ref;changed(card)});
  actions.append(main,alt);photo.node.append(actions);
 }
 render(card);
}
for(const group of groups){
 const refs=getRefs(group);
 const originalName=group.querySelector('h2').textContent.split(' · ').slice(1).join(' · ');
 const card={id:group.id,group,refs,originalName,state:persisted(group,refs)};
 cards.set(card.id,card);build(card);
}
const moreFilters=[
 ['validated','Cartes validées'],
 ['pending','Cartes à examiner'],
 ['excluded','Cartes écartées']
];
moreFilters.forEach(([v,t])=>filter.append(option(v,t)));
const summary=element('span','decision-stats');summary.id='card-summary';tools.append(summary);
const exportJson=element('button','export-json','Exporter sauvegarde (.json)');exportJson.type='button';
const importLabel=element('label','import-label','Importer une sauvegarde JSON');
const importFile=element('input');importFile.type='file';importFile.accept='.json,application/json';importFile.setAttribute('aria-label','Importer une sauvegarde de cartes');
importLabel.append(importFile);tools.insertBefore(exportJson,shown);tools.insertBefore(importLabel,shown);
function update(){
 const query=search.value.toLocaleLowerCase('fr').trim();
 let visible=0,validated=0,excluded=0;
 for(const card of cards.values()){
  const s=card.state;
  if(s.status==='Validée')validated++;
  if(s.status==='Écartée')excluded++;
  const matchText=(card.group.dataset.search+' '+s.name).toLocaleLowerCase('fr').includes(query);
  const f=filter.value;
  const matchFilter=f==='all'||f===card.group.dataset.type||(f==='urgent'&&card.group.dataset.status==='Haute priorité')||(f==='validated'&&s.status==='Validée')||(f==='pending'&&s.status==='À examiner')||(f==='excluded'&&s.status==='Écartée');
  const ok=matchText&&matchFilter;card.group.classList.toggle('hidden',!ok);if(ok)visible++;
 }
 shown.textContent=visible+' groupe(s) affiché(s)';
 summary.textContent=validated+' validée(s) · '+(cards.size-validated-excluded)+' à examiner · '+excluded+' écartée(s)';
}
search.addEventListener('input',update);filter.addEventListener('change',update);
function rows(){
 return [...cards.values()].map(c=>{
  const s=c.state;
  const alt=s.alternative===SHINY?imageOf(c,s.primary):imageOf(c,s.alternative);
  return {
   reference_carte:c.id,nom_carte:s.name,nom_provisoire:c.originalName,statut:s.status,
   reference_visuel_principal:s.primary,url_visuel_principal:imageOf(c,s.primary)?.src||'',
   type_visuel_alternatif:s.alternative===SHINY?'shiny_a_creer':s.alternative?'autre_photo':'non_defini',
   reference_visuel_alternatif:s.alternative===SHINY?s.primary:s.alternative,
   url_source_visuel_alternatif:alt?.src||'',
   nombre_photos:c.refs.length, references_photos:c.refs.map(r=>r.ref).join(', '),
   decision_ancien_tri:read('tcg_tri_'+c.id)||''
  };
 });
}
function download(name,content,type){
 const url=URL.createObjectURL(new Blob([content],{type}));
 const a=element('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),3000);
}
function safeCsv(v){
 let s=String(v??'').replaceAll('\r',' ').replaceAll('\n',' ');
 // Excel/LibreOffice injection guard for untrusted card names
 if(/^\s*[=+\-@]/.test(s))s="'"+s;
 return '"'+s.replaceAll('"','""')+'"';
}
exportButton.textContent='Exporter les cartes (.csv)';
exportButton.addEventListener('click',()=>{
 const data=rows(),headers=Object.keys(data[0]);
 download('TCG_Deseur_cartes_noms_visuels.csv','\ufeff'+[headers.map(safeCsv).join(';'),...data.map(row=>headers.map(h=>safeCsv(row[h])).join(';'))].join('\r\n'),'text/csv;charset=utf-8');
});
exportJson.addEventListener('click',()=>{
 const entries={};for(const card of cards.values())entries[card.id]={...card.state};
 download('TCG_Deseur_sauvegarde_tri.json',JSON.stringify({schema:'tcg-deseur-cards-v2',savedAt:new Date().toISOString(),cards:entries},null,2),'application/json;charset=utf-8');
});
importFile.addEventListener('change',async()=>{
 const file=importFile.files&&importFile.files[0];if(!file)return;
 try{
  if(file.size>2_000_000)throw new Error('Fichier trop volumineux');
  const data=JSON.parse(await file.text());
  if(data.schema!=='tcg-deseur-cards-v2'||!data.cards||typeof data.cards!=='object')throw new Error('Ce fichier ne correspond pas à une sauvegarde TCG Deseur.');
  if(!window.confirm('Importer cette sauvegarde ? Elle remplacera les noms et les choix actuellement enregistrés dans ce navigateur.'))return;
  for(const card of cards.values()){
   const incoming=data.cards[card.id];if(!incoming||typeof incoming!=='object')continue;
   const refs=card.refs.map(r=>r.ref);
   const name=typeof incoming.name==='string'?incoming.name.slice(0,90):'';
   const primary=refs.includes(incoming.primary)?incoming.primary:refs[0];
   const alternate=incoming.alternative===SHINY?SHINY:(refs.includes(incoming.alternative)&&incoming.alternative!==primary?incoming.alternative:'');
   let status=validStates.includes(incoming.status)?incoming.status:'À examiner';
   if(status==='Validée'&&(!name.trim()||!alternate))status='À examiner';
   card.state={name,primary,alternative:alternate,status};
   // Keep all event handlers synchronized with the same mutable state object.
   Object.assign(card.liveState,card.state);
   card.state=card.liveState;
   save(card);render(card);
  }
  update();window.alert('Sauvegarde importée.');
 }catch(err){window.alert('Import impossible : '+err.message)}finally{importFile.value=''}
});
update();
})();
