const $=id=>document.getElementById(id);
const STORAGE='tcg-deseur-art-review-105-v1';
const ROOT='../';
const FIRST10_GRAY=new Set(['td_1_004','td_1_001','td_1_002','td_1_003','td_1_005','td_1_007','td_1_008','td_1_006','td_1_012','td_1_011']);
const finalImage=a=>FIRST10_GRAY.has(a.artworkId)
  ? 'collection-validee/assets/gray-extended-first10/'+a.source.split('/').at(-1)
  : a.normalized;

const api={cards:[],metadata:[],decisions:{}};
const local=()=>{try{const v=JSON.parse(localStorage.getItem(STORAGE)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:{}}catch{return {}}};
const setLocal=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(api.decisions));return true}catch{return false}};
const elt=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n};
const imgUrl=p=>ROOT+p;
function counts(){
 const all=api.metadata;
 const approved=all.filter(a=>api.decisions[a.artworkId]==='approved').length;
 const retouch=all.filter(a=>api.decisions[a.artworkId]==='retouch').length;
 $('count').textContent=String(all.length);$('approved').textContent=String(approved);
 $('retouch').textContent=String(retouch);$('pending').textContent=String(all.length-approved-retouch);
}
function item(card,art,kind,index){
 const a=api.metadata.find(x=>x.artworkId===art.artworkId);
 if(!a)throw Error('Illustration manquante '+art.artworkId);
 const article=elt('article','item');article.dataset.id=art.artworkId;
 const h=elt('h2','',card.title+(kind==='variant'?' — alternative '+index:''));article.append(h);
 const meta=elt('div','meta');for(const label of [card.characterId,card.rarity,art.artworkId,art.photoReference,kind==='main'?'Principale':'Alternative'])meta.append(elt('span','chip',label));
 article.append(meta);
 const compare=elt('div','compare');
 for(const [label,path] of [['Avant — original',a.source],
   [FIRST10_GRAY.has(a.artworkId)?'Après — fond gris prolongé, sujet inchangé':'Après — uniformisé',finalImage(a)]]){
  const figure=elt('figure'),caption=elt('figcaption','',label),img=elt('img');
  img.src=imgUrl(path);img.alt=label+' pour '+card.title;img.loading='lazy';img.decoding='async';
  img.addEventListener('error',()=>{caption.textContent+=' — Erreur de chargement';figure.style.borderColor='#f77'});
  figure.append(caption,img);compare.append(figure);
 }
 article.append(compare,elt('small','ratio',FIRST10_GRAY.has(a.artworkId)
 ? 'Source : '+a.sourceSize.join(' × ')+' px · Export 1200 × 1600 px · Original intégré sans aucun recadrage ni zoom'
 : 'Source : '+a.sourceSize.join(' × ')+' px · Premier plan dans l’export : '+a.foregroundBounds.join(', ')+' px'));
 const footer=elt('footer');
 for(const [decision,label]of [['approved','Valider'],['retouch','À retoucher'],['pending','À revoir']]){
  const button=elt('button','',label);button.type='button';
  button.setAttribute('aria-pressed',String((api.decisions[art.artworkId]||'pending')===decision));
  button.addEventListener('click',()=>{
   if(decision==='pending')delete api.decisions[art.artworkId];else api.decisions[art.artworkId]=decision;
   const saved=setLocal();
   counts();filter();$('live-status').textContent=label+' : '+art.artworkId+(saved?' (enregistré dans ce navigateur)':' (sauvegarde locale indisponible, exporter les décisions)');
   for(const b of footer.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.textContent===label));
  });
  footer.append(button);
 }
 article.append(footer);
 return article;
}
function filter(){
 const search=$('search').value.trim().toLocaleLowerCase('fr');
 const rarity=$('rarity').value,kind=$('type').value,decision=$('decision').value;
 let shown=0;
 for(const element of $('items').children){
  const card=api.cards.find(c=>c.characterId===element.dataset.card);
  const a=api.metadata.find(x=>x.artworkId===element.dataset.id);
  const status=api.decisions[a.artworkId]||'pending';
  const haystack=[card.title,card.characterId,card.rarity,a.artworkId,
   (a.kind==='main'?card.main:card.variants.find(x=>x.artworkId===a.artworkId)).photoReference].join(' ').toLocaleLowerCase('fr');
  const ok=(rarity==='all'||rarity===card.rarity)&&(kind==='all'||kind===a.kind)
   &&(decision==='all'||decision===status)&&haystack.includes(search);
  element.hidden=!ok;if(ok)shown++;
 }
 $('empty').hidden=shown>0;
}
function download(name,mime,content){
 const a=elt('a');const url=URL.createObjectURL(new Blob([content],{type:mime}));a.href=url;a.download=name;
 document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function exportRows(){
 return api.metadata.map(a=>{const c=api.cards.find(c=>c.characterId===a.characterId);return {
 characterId:a.characterId,title:c.title,rarity:c.rarity,artworkId:a.artworkId,kind:a.kind,
 photoReference:(a.kind==='main'?c.main:c.variants.find(x=>x.artworkId===a.artworkId)).photoReference,
 source:a.source,uniform:a.normalized,sourceSize:a.sourceSize.join('x'),status:api.decisions[a.artworkId]||'pending'
 }});
}
async function init(){
 try{
  const r=await Promise.all([fetch(ROOT+'data/edition-staging-67.json',{cache:'no-store'}),fetch(ROOT+'data/approved-artwork-uniform-105.json',{cache:'no-store'})]);
  if(r.some(x=>!x.ok))throw Error('Catalogue ou métadonnées introuvables');
  const [catalog,source]=await Promise.all(r.map(x=>x.json()));
  if(catalog.cards.length!==67||source.artworks.length!==105||source.size.join('x')!=='768x1024')throw Error('Données approuvées incorrectes');
  api.cards=catalog.cards;api.metadata=source.artworks;api.decisions=local();
  const frag=document.createDocumentFragment();
  for(const c of api.cards){
   for(const [index,a] of [c.main,...c.variants].entries()){
    const n=item(c,a,index===0?'main':'variant',index);n.dataset.card=c.characterId;frag.append(n);
   }
  }
  $('items').replaceChildren(frag);counts();filter();
 }catch(e){$('error').hidden=false;$('error').textContent='Chargement impossible : '+e.message;}
}
for(const field of ['search','rarity','type','decision'])$(field).addEventListener('input',filter);
$('download-json').addEventListener('click',()=>download('tcg-audit-105.json','application/json',JSON.stringify({schema:'tcg-deseur-art-review-v1',exportedAt:new Date().toISOString(),items:exportRows()},null,2)));
$('download-csv').addEventListener('click',()=>{
 const rows=exportRows(),keys=Object.keys(rows[0]||{});
 const cell=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 download('tcg-audit-105.csv','text/csv;charset=utf-8','\uFEFF'+keys.join(';')+'\n'+rows.map(r=>keys.map(k=>cell(r[k])).join(';')).join('\n'));
});
$('clear').addEventListener('click',()=>{
 if(!confirm('Effacer les décisions locales ? Exporte-les d’abord si tu souhaites les conserver.'))return;
 api.decisions={};setLocal();counts();filter();
 $('live-status').textContent='Décisions locales effacées.';
});
init();
