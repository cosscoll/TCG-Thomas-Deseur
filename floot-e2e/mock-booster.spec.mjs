import {test,expect} from '@playwright/test';

/**
 * Parcours joueur simulé contre le véritable frontend publié.
 * Toutes les API sont interceptées AVANT leur envoi : aucun compte,
 * aucun booster et aucune collection de production ne sont touchés.
 */
function makeCatalogue(){
 const distribution=[['commune',95],['rare',35],['epique',18],['legendaire',11],['hors_serie',1]];
 return distribution.flatMap(([rarity,count])=>Array.from({length:count},(_,n)=>({
  id:'tcg_fixture_'+rarity+'_'+(n+1),
  name:'Illustration fictive '+rarity+' '+(n+1),
  rarity,
  reference:'REF-TEST-'+rarity+'-'+(n+1),
  imagePath:'',
  ordinal:1,
 }))).map((card,n)=>({...card,ordinal:n+1}));
}
const allCards=makeCatalogue();
const draws=[allCards[0],allCards[1],allCards[2],allCards[3],allCards[95]];
const packCards=draws.map(card=>({...card,newCard:true,quantity:1,imagePath:''}));
const toSuperJson=value=>JSON.stringify({json:value});
const user={id:987654321,email:'fixture@invalid.test',displayName:'Joueur fictif',role:'user',avatarUrl:null};

async function mockAuthenticatedState(page,{boosterFailure=false,malformedAfterCommit=false,initialOwned=[]}={}){
 let opened=0,postCalls=0,unexpected=[];
 let owned=structuredClone(initialOwned),history=[],nextAvailable=null;
 await page.route('**/_api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  const method=req.method();
  const reply=(value,status=200)=>route.fulfill({status,contentType:'application/json',headers:{'Cache-Control':'private, no-store'},body:toSuperJson(value)});
  if(path==='/_api/auth/session'&&method==='GET')
   return reply({user});
  if(path==='/_api/collection'&&method==='GET')
   return reply({
    cards:allCards,owned,opened,nextAvailable,history,
    completion:{found:owned.filter(r=>r.quantity>0).length,required:160,available:false,claimed:false},
    legacy:{cards:[],owned:[],history:[]},
   });
  if(path==='/_api/booster'&&method==='POST'){
   postCalls++;
   if(boosterFailure)return reply({error:'Booster temporairement indisponible.'},500);
   if(opened)return reply({error:'Booster déjà ouvert. Consulte le compte à rebours.'},429);
   opened=1;
   const counts=new Map(owned.map(row=>[row.cardId,row.quantity]));
   for(const card of draws)counts.set(card.id,(counts.get(card.id)??0)+1);
   owned=[...counts].map(([cardId,quantity])=>({cardId,quantity}));
   history=[{cards:draws.map(card=>card.id),createdAt:'2026-10-12T10:00:00Z',kind:'normal'}];
   nextAvailable='2099-01-01T00:00:00.000Z';
   if(malformedAfterCommit)return reply({drawn:[],nextAvailable});
   return reply({drawn:packCards,nextAvailable});
  }
  unexpected.push(method+' '+path);
  return route.abort('blockedbyclient');
 });
 return {get postCalls(){return postCalls},get unexpected(){return unexpected},get owned(){return structuredClone(owned)},get history(){return structuredClone(history)}};
}

for(const caseName of ['desktop-chromium','mobile-chromium']){
 test('simulation authentifiée complète, sans transaction réelle ('+caseName+')',async({page},testInfo)=>{
  test.skip(testInfo.project.name!==caseName);
  const state=await mockAuthenticatedState(page);
  await page.goto('/');
  await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeEnabled();
  await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
  await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
  await expect(page.getByText(/CARTE 1 SUR 5/)).toBeVisible();
  for(let n=1;n<5;n++){
   await page.getByRole('button',{name:/Révéler la carte suivante/}).click();
   await expect(page.getByText('CARTE '+(n+1)+' SUR 5',{exact:true})).toBeVisible();
  }
  await expect(page.getByText('Bilan de ce booster')).toBeVisible();
  await page.getByRole('button',{name:/Voir mon classeur/}).click();
  await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeDisabled();
  await expect(page.getByText(/Prochain booster dans/)).toBeVisible();
  await expect(page.getByText(/5 \/ 160/).first()).toBeVisible();
  expect(state.postCalls).toBe(1);
  expect(state.unexpected).toEqual([]);
 });
}
test('échec simulé du booster : aucune animation de récompense mensongère',async({page})=>{
 const state=await mockAuthenticatedState(page,{boosterFailure:true});
 await page.goto('/');
 await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeEnabled();
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByRole('alert')).toContainText('Booster temporairement indisponible.');
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toHaveCount(0);
 expect(state.postCalls).toBe(1);
 expect(state.unexpected).toEqual([]);
});

test('un booster confirmé est conservé après rechargement, sans second POST',async({page})=>{
 const state=await mockAuthenticatedState(page);
 await page.goto('/');
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByText(/5 \/ 160/).first()).toBeVisible();
 await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeDisabled();
 expect(state.postCalls).toBe(1);
 expect(state.history).toHaveLength(1);
 expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(5);
 expect(state.unexpected).toEqual([]);
});
test('un tirage déjà crédité, mais dont le récapitulatif est corrompu, reste retrouvé après recharge',async({page})=>{
 const state=await mockAuthenticatedState(page,{malformedAfterCommit:true});
 await page.goto('/');
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toHaveCount(0);
 expect(state.postCalls).toBe(1);
 expect(state.history).toHaveLength(1);
 await page.reload();
 await expect(page.getByText(/5 \/ 160/).first()).toBeVisible();
 await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeDisabled();
 expect(state.postCalls).toBe(1);
 expect(state.unexpected).toEqual([]);
});
test('une carte déjà possédée deux fois devient ×3 après tirage, sans doubler la progression',async({page})=>{
 const state=await mockAuthenticatedState(page,{initialOwned:[{cardId:draws[0].id,quantity:2}]});
 await page.goto('/');
 await expect(page.getByText(/1 \/ 160/).first()).toBeVisible();
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByText(/5 \/ 160/).first()).toBeVisible();
 expect(state.owned.find(x=>x.cardId===draws[0].id)?.quantity).toBe(3);
 expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(7);
 expect(state.postCalls).toBe(1);
 expect(state.unexpected).toEqual([]);
});
