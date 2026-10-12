const form=document.getElementById('feedback-form');
const output=document.getElementById('output');
const prepare=document.getElementById('prepare');
const copy=document.getElementById('copy');
const download=document.getElementById('download');
const share=document.getElementById('share');
const status=document.getElementById('copy-state');
const fields=[
 ['signup','Inscription'],
 ['login','Connexion'],
 ['booster','Ouverture du premier booster'],
 ['reveal','Révélation des cinq cartes'],
 ['collection','Cartes dans le classeur'],
 ['persistence','Cartes présentes après reconnexion']
];
function redact(text){
 return String(text||'').trim().slice(0,1500)
  .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,'[adresse e-mail masquée]')
  .replace(/\beyJ[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?\b/g,'[jeton masqué]')
  .replace(/((?:mot de passe|password|secret|token|cookie|bearer)\s*[:=]\s*)([^\s,;]+)/gi,'$1[masqué]')
  .replace(/(Authorization\s*:\s*Bearer\s+)\S+/gi,'$1[masqué]')
  .replace(/([?&](?:access_token|refresh_token|token|code|session)=)[^&#\s]+/gi,'$1[masqué]');
}
function report(){
 const entries=new FormData(form);
 const device=entries.get('device')||'Non précisé';
 const browser=entries.get('browser')||'Non précisé';
 const feedback=fields.map(([key,label])=>'- '+label+' : '+entries.get(key));
 const comment=redact(entries.get('comments'));
 return [
  'TCG DESEUR — RETOUR DE TEST',
  'Appareil : '+device,
  'Navigateur : '+browser,
  '',
  'Étapes vérifiées :',
  ...feedback,
  '',
  'Remarque ou erreur :',
  comment||'(aucune remarque)',
  '',
  'Lien du jeu : https://budget-illimite-tcg.floot.app/',
  '',
  'Aucun identifiant ou mot de passe demandé.'
 ].join('\n');
}
function build(){
 output.value=report();
 copy.disabled=false;
 download.disabled=false;
 share.disabled=false;
 status.textContent='Compte rendu préparé. Vérifie le texte, puis copie-le pour le transmettre à la personne qui t’a invité.';
}
prepare.addEventListener('click',build);
copy.addEventListener('click',async()=>{
 if(!output.value)return;
 try{
  if(navigator.clipboard?.writeText){
   await navigator.clipboard.writeText(output.value);
   status.textContent='Compte rendu copié. Tu peux le transmettre à la personne qui t’a invité.';
  }else{
   output.focus();output.select();
   status.textContent='Sélectionne et copie le texte avec Ctrl+C (ou Copier sur téléphone).';
  }
 }catch{
  output.focus();output.select();
  status.textContent='Copie le texte sélectionné avec Ctrl+C ou le menu Copier.';
 }
});
function invalidate(){
 if(!output.value)return;
 output.value='';
 for(const button of [copy,download,share])button.disabled=true;
 status.textContent='Les réponses ont changé. Prépare à nouveau ton compte rendu.';
}
form.addEventListener('input',invalidate);
form.addEventListener('change',invalidate);
download.addEventListener('click',()=>{
 if(!output.value)return;
 const url=URL.createObjectURL(new Blob([output.value+'\n'],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');
 a.href=url;
 a.download='tcg-deseur-retour-de-test.txt';
 a.hidden=true;
 document.body.append(a);
 a.click();
 a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),3000);
 status.textContent='Fichier texte préparé sur ton appareil. Aucun résultat envoyé automatiquement.';
});
share.addEventListener('click',async()=>{
 if(!output.value)return;
 if(typeof navigator.share!=='function'){
  status.textContent='Le partage direct n’est pas disponible ici : utilise « Copier le compte rendu ».';
  return;
 }
 try{
  await navigator.share({title:'TCG Deseur — retour de test',text:output.value});
  status.textContent='Partage terminé ou transfert au service de partage demandé.';
 }catch(e){
  status.textContent=e?.name==='AbortError'?'Partage annulé. Ton rapport est conservé.':'Partage impossible. Utilise la copie ou le téléchargement.';
 }
});
form.addEventListener('submit',e=>e.preventDefault());
form.addEventListener('reset',()=>{
 queueMicrotask(()=>{
  output.value='';
  for(const button of [copy,download,share])button.disabled=true;
  status.textContent='Réponses effacées sur cette page.';
 });
});
