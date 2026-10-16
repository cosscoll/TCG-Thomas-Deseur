import React,{useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {Button} from './Button';
import {Input} from './Input';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from './Select';
import {createGiftCode} from '../endpoints/gift_create_POST.schema';
import {redeemGiftCode} from '../endpoints/gift_redeem_POST.schema';
import type {GiftReward} from '../helpers/tcgGiftCodes';
import styles from './TcgGiftCodes.module.css';
type Art={id:string;name:string;alternative:boolean;parentId:string|null};
type Props={logged:boolean;isAdmin:boolean;cards:Art[]};
export function TcgGiftCodes({logged,isAdmin,cards}:Props){
 const qc=useQueryClient();
 const [code,setCode]=useState(''),[result,setResult]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(false);
 const [newCode,setNewCode]=useState(''),[label,setLabel]=useState(''),[maxUses,setMaxUses]=useState(1),[expires,setExpires]=useState('');
 const [draftType,setDraftType]=useState('normal'),[draftQty,setDraftQty]=useState(1),[draftRarity,setDraftRarity]=useState('rare');
 const [draftArt,setDraftArt]=useState(''),[customCards,setCustomCards]=useState('');
 const [rewards,setRewards]=useState<GiftReward[]>([]),[creating,setCreating]=useState(false),[createError,setCreateError]=useState(''),[created,setCreated]=useState('');
 async function redeem(e:React.FormEvent){
  e.preventDefault();if(!logged||loading)return;
  setLoading(true);setError('');setResult('');
  try{
   const reward=await redeemGiftCode(code);
   setCode('');setResult(reward.message+' '+reward.packs+' booster(s) et '+reward.cards.length+' type(s) de carte(s).');
   await qc.invalidateQueries({queryKey:['tcg-collection']});
  }catch(err){setError(err instanceof Error?err.message:'Code indisponible.');}
  finally{setLoading(false);}
 }
 function addReward(){
  setCreateError('');
  if(!Number.isInteger(draftQty)||draftQty<1||draftQty>1000){setCreateError('Quantité comprise entre 1 et 1 000.');return;}
  let reward:GiftReward;
  if(draftType==='card'){
   const artId=draftArt||cards[0]?.id;
   if(!cards.some(c=>c.id===artId)){setCreateError('Sélectionne une carte.');return;}
   reward={type:'card',artworkId:artId,quantity:draftQty};
  }else if(draftType==='custom'){
   const ids=customCards.split(/[,;\s]+/).map(s=>s.trim()).filter(Boolean);
   if(ids.length!==5||ids.some(id=>!cards.some(c=>c.id===id))){setCreateError('Indique exactement cinq références officielles.');return;}
   reward={type:'packs',kind:'custom',quantity:draftQty,rules:{fixedArtworkIds:ids}};
  }else if(draftType==='special'){
   reward={type:'packs',kind:'special',quantity:draftQty,rules:{rarityFloor:draftRarity as 'rare'}};
  }else reward={type:'packs',kind:'normal',quantity:draftQty,rules:{}};
  setRewards(list=>list.length<12?[...list,reward]:list);
 }
 async function create(e:React.FormEvent){
  e.preventDefault();if(!isAdmin||creating)return;
  setCreating(true);setCreateError('');setCreated('');
  try{
   const output=await createGiftCode({code:newCode,label,maxUses,
    expiresAt:expires?new Date(expires).toISOString():null,rewards});
   setCreated(output.code);setRewards([]);setNewCode('');
  }catch(err){setCreateError(err instanceof Error?err.message:'Création impossible.');}
  finally{setCreating(false);}
 }
 const showReward=(r:GiftReward)=>r.type==='card'
  ?r.quantity+' × '+(cards.find(c=>c.id===r.artworkId)?.name||r.artworkId)
  :r.quantity+' booster(s) '+(r.kind==='normal'?'classique(s)':r.kind==='special'?'spécial(aux)':'personnalisé(s)');
 return <section className={styles.section} id="codes">
  <h2>Codes cadeaux</h2>
  <p>Tu as reçu un code ? Saisis-le pour ajouter la récompense à ta collection.</p>
  {logged?<form onSubmit={redeem} className={styles.redeemForm}>
   <Input aria-label="Ton code cadeau" placeholder="Ton code cadeau" value={code} maxLength={48} onChange={event=>setCode(event.target.value)} autoComplete="off"/>
   <Button type="submit" disabled={!code.trim()||loading}>{loading?'Validation…':'Utiliser mon code'}</Button>
   {result&&<p role="status" className={styles.success}>{result}</p>}
   {error&&<p role="alert" className={styles.error}>{error}</p>}
  </form>:<p>Connecte-toi pour utiliser un code.</p>}
  {logged&&isAdmin&&<details className={styles.admin}>
   <summary>Administration — créer mes codes cadeaux</summary>
   <form onSubmit={create} className={styles.adminForm}>
    <div className={styles.fields}>
     <label>Le code exact à distribuer<Input value={newCode} maxLength={48} placeholder="DESEUR-CADEAU" onChange={e=>setNewCode(e.target.value)}/></label>
     <label>Nom interne<Input value={label} maxLength={100} placeholder="Événement / partenariat" onChange={e=>setLabel(e.target.value)}/></label>
     <label>Utilisations maximum<Input type="number" min={1} max={100000} value={maxUses} onChange={e=>setMaxUses(Number(e.target.value))}/></label>
     <label>Expiration (facultative)<Input type="datetime-local" value={expires} onChange={e=>setExpires(e.target.value)}/></label>
    </div>
    <h3>Récompenses du code</h3>
    <div className={styles.fields}>
     <label>Type de récompense<Select value={draftType} onValueChange={setDraftType}><SelectTrigger><SelectValue/></SelectTrigger>
      <SelectContent>
       <SelectItem value="normal">Boosters classiques</SelectItem>
       <SelectItem value="special">Boosters spéciaux</SelectItem>
       <SelectItem value="custom">Boosters personnalisés</SelectItem>
       <SelectItem value="card">Cartes individuelles</SelectItem>
      </SelectContent></Select></label>
     <label>Quantité<Input type="number" min={1} max={1000} value={draftQty} onChange={e=>setDraftQty(Number(e.target.value))}/></label>
    </div>
    {draftType==='special'&&<label className={styles.wide}>Rareté minimale sur les deux dernières cartes
     <Select value={draftRarity} onValueChange={setDraftRarity}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>
      {['rare','epique','legendaire','hors_serie'].map(r=><SelectItem value={r} key={r}>{r}</SelectItem>)}
     </SelectContent></Select></label>}
    {draftType==='card'&&<label className={styles.wide}>Carte officielle
     <Select value={draftArt||cards[0]?.id||''} onValueChange={setDraftArt}><SelectTrigger><SelectValue placeholder="Choisir une carte"/></SelectTrigger>
      <SelectContent>{cards.map(c=><SelectItem key={c.id} value={c.id}>{c.id} — {c.name}{c.alternative?' (alternative)':''}</SelectItem>)}</SelectContent>
     </Select></label>}
    {draftType==='custom'&&<label className={styles.wide}>Cinq références de cartes, séparées par des virgules
     <Input value={customCards} placeholder="COST-001, COST-002, COST-003, COST-004, COST-005" onChange={e=>setCustomCards(e.target.value)}/>
     <small>Les alternatives exigent la carte de base déjà obtenue avant l'ouverture.</small>
    </label>}
    <Button type="button" variant="outline" onClick={addReward} disabled={rewards.length>=12}>Ajouter cette récompense</Button>
    <ul className={styles.rewards}>{rewards.map((r,i)=><li key={i}>{showReward(r)} <Button type="button" size="sm" variant="outline" onClick={()=>setRewards(list=>list.filter((_,j)=>j!==i))}>Retirer</Button></li>)}</ul>
    <Button type="submit" disabled={creating||rewards.length===0||!newCode.trim()||!label.trim()}>{creating?'Création…':'Créer ce code cadeau'}</Button>
    {createError&&<p role="alert" className={styles.error}>{createError}</p>}
    {created&&<div role="status" className={styles.success}>Code enregistré : <strong>{created}</strong>. Conserve-le maintenant, il ne sera pas réaffiché en clair.
      <Button type="button" variant="outline" onClick={()=>navigator.clipboard.writeText(created)}>Copier</Button>
    </div>}
   </form>
  </details>}
 </section>;
}

