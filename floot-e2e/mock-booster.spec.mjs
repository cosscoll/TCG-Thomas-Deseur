import {test,expect} from '@playwright/test';

/** Authenticated E2E against the public Floot frontend with ALL /_api routes intercepted.
 * No real account is created and NO server-side booster is consumed.
 * Default tests match the live 68-card edition; beta tests are opt-in until deployed.
 */
const counts=[['commune',33],['rare',21],['epique',8],['legendaire',4],['hors_serie',1]];
function makeCatalogue(){
 let ordinal=0;
 const known=counts.flatMap(([rarity,count])=>Array.from({length:count},()=>{
  ordinal++;
  return {
   id:'COST-'+String(ordinal).padStart(3,'0'),
   name:'Personnage fictif '+ordinal,
   rarity,reference:'REF-TEST-'+ordinal,sourceReference:'REF-TEST-'+ordinal,
   imagePath:'',ordinal
  };
 }));
 return [...known,{
  id:'carte_mystere_68',name:'Carte mystère',rarity:'mystere',
  reference:'CARTE-MYSTERE-068',sourceReference:null,imagePath:'',ordinal:68
 }];
}
const allCards=makeCatalogue();
const regularCards=allCards.slice(0,67);
const drawIds=[regularCards[0].id,regularCards[1].id,regularCards[2].id,regularCards[33].id,regularCards[54].id];
const getDraws=()=>drawIds.map(id=>regularCards.find(card=>card.id===id));
const toSuperJson=value=>JSON.stringify({json:value});
const user={id:987654321,email:'fixture@invalid.test',displayName:'Joueur fictif',role:'user',avatarUrl:null};

async function mockAuthenticatedState(page,{
 boosterFailure=false,malformedAfterCommit=false,initialOwned=[],unlimited=false
}={}){
 let opened=0,postCalls=0,unexpected=[];
 let owned=structuredClone(initialOwned),history=[],nextAvailable=null;
 await page.route('**/_api/**',async route=>{
  const req=route.request(),url=new URL(req.url()),path=url.pathname;
  const method=req.method();
  const reply=(value,status=200)=>route.fulfill({
   status,contentType:'application/json',
   headers:{'Cache-Control':'private, no-store'},body:toSuperJson(value)
  });
  if(path==='/_api/auth/session'&&method==='GET')return reply({user});
  if(path==='/_api/collection'&&method==='GET')return reply({
   cards:allCards,owned,opened,
   nextAvailable:unlimited?null:nextAvailable,boosterUnlimited:unlimited,history,
   completion:{found:owned.filter(r=>r.quantity>0).length,required:67,available:false,claimed:false},
   legacy:{cards:[],owned:[],history:[]},
   previousEdition:{cards:[],owned:[],history:[]}
  });
  if(path==='/_api/booster'&&method==='POST'){
   postCalls++;
   if(boosterFailure)return reply({error:'Booster temporairement indisponible.'},500);
   if(opened&&!unlimited)return reply({error:'Booster déjà ouvert. Consulte le compte à rebours.'},429);
   opened++;
   const counts=new Map(owned.map(row=>[row.cardId,row.quantity]));
   const drawn=getDraws().map(card=>{
    const quantity=(counts.get(card.id)??0)+1;
    counts.set(card.id,quantity);
    return {...card,newCard:quantity===1,quantity,imagePath:''};
   });
   owned=[...counts].map(([cardId,quantity])=>({cardId,quantity}));
   history.unshift({
    cards:drawn.map(card=>card.id),artworks:drawn.map(card=>card.imagePath),
    createdAt:new Date(Date.UTC(2026,9,13,10,opened)).toISOString(),kind:'normal'
   });
   nextAvailable=unlimited?null:'2099-01-01T00:00:00.000Z';
   if(malformedAfterCommit)return reply({drawn:[],nextAvailable});
   return reply({drawn,nextAvailable});
  }
  unexpected.push(method+' '+path);
  return route.abort('blockedbyclient');
 });
 return {
  get postCalls(){return postCalls},
  get unexpected(){return unexpected},
  get owned(){return structuredClone(owned)},
  get history(){return structuredClone(history)}
 };
}

test('les données simulées correspondent à 67 cartes approuvées + une Carte mystère',()=>{
 expect(allCards).toHaveLength(68);
 expect(regularCards).toHaveLength(67);
 for(const [rarity,n] of counts)
  expect(regularCards.filter(card=>card.rarity===rarity)).toHaveLength(n);
 expect(allCards[67]).toMatchObject({name:'Carte mystère',rarity:'mystere'});
 expect(drawIds).toHaveLength(5);
 expect(getDraws().map(card=>card.rarity)).toEqual(['commune','commune','commune','rare','epique']);
});

for(const caseName of ['desktop-chromium','mobile-chromium']){
 test('simulation authentifiée : 68 cartes et ordre du booster officiel ('+caseName+')',async({page},testInfo)=>{
  test.skip(testInfo.project.name!==caseName);
  const state=await mockAuthenticatedState(page);
  await page.goto('/');
  await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeEnabled();
  await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
  await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
  for(let n=1;n<=5;n++){
   await expect(page.getByText('CARTE '+n+' SUR 5',{exact:true})).toBeVisible();
   const expected=getDraws()[n-1];
   await expect(page.locator('[data-rarity="'+expected.rarity+'"]').filter({hasText:expected.name}).first()).toBeVisible();
   if(n!==5)await page.getByRole('button',{name:/Révéler la carte suivante/}).click();
  }
  await expect(page.getByText('Bilan de ce booster')).toBeVisible();
  await page.getByRole('button',{name:/Voir mon classeur/}).click();
  await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeDisabled();
  await expect(page.getByText(/Prochain booster dans/)).toBeVisible();
  await expect(page.getByText(/5 \/ 68/).first()).toBeVisible();
  expect(state.postCalls).toBe(1);
  expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(5);
  expect(state.unexpected).toEqual([]);
 });
}

test('échec simulé du booster : aucune animation mensongère',async({page})=>{
 const state=await mockAuthenticatedState(page,{boosterFailure:true});
 await page.goto('/');
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByRole('alert')).toContainText('Booster temporairement indisponible.');
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toHaveCount(0);
 expect(state.postCalls).toBe(1);
 expect(state.unexpected).toEqual([]);
});

test('cinq cartes créditées puis rechargées, sans second POST',async({page})=>{
 const state=await mockAuthenticatedState(page);
 await page.goto('/');
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByText(/5 \/ 68/).first()).toBeVisible();
 await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeDisabled();
 expect(state.postCalls).toBe(1);
 expect(state.history).toHaveLength(1);
 expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(5);
 expect(state.unexpected).toEqual([]);
});

test('tirage crédité mais réponse invalide : le classeur retrouve les cartes',async({page})=>{
 const state=await mockAuthenticatedState(page,{malformedAfterCommit:true});
 await page.goto('/');
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toHaveCount(0);
 expect(state.postCalls).toBe(1);
 expect(state.history).toHaveLength(1);
 await page.reload();
 await expect(page.getByText(/5 \/ 68/).first()).toBeVisible();
 await expect(page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/})).toBeDisabled();
 expect(state.postCalls).toBe(1);
 expect(state.unexpected).toEqual([]);
});

test('une carte déjà possédée ×2 devient ×3, sans progression artificielle',async({page})=>{
 const state=await mockAuthenticatedState(page,{initialOwned:[{cardId:drawIds[0],quantity:2}]});
 await page.goto('/');
 await expect(page.getByText(/1 \/ 68/).first()).toBeVisible();
 await page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/}).click();
 await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
 await page.reload();
 await expect(page.getByText(/5 \/ 68/).first()).toBeVisible();
 expect(state.owned.find(x=>x.cardId===drawIds[0])?.quantity).toBe(3);
 expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(7);
 expect(state.postCalls).toBe(1);
 expect(state.unexpected).toEqual([]);
});

/** Opt-in after the Floot beta-unlimited backend+UI release.
 * Run against the PUBLIC frontend with intercepted APIs:
 * TCG_BETA_UNLIMITED=1 npx playwright test --config=floot-e2e/playwright.config.mjs
 */
test('bêta illimitée : deux boosters successifs, dix exemplaires et aucun cooldown',async({page})=>{
 test.skip(process.env.TCG_BETA_UNLIMITED!=='1','À activer dès publication de la bêta illimitée');
 const state=await mockAuthenticatedState(page,{unlimited:true});
 await page.goto('/');
 await expect(page.getByText(/Boosters illimités pendant la bêta/)).toBeVisible();
 for(let n=1;n<=2;n++){
  const open=page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/});
  await expect(open).toBeEnabled();
  await open.click();
  await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
  for(let step=1;step<5;step++)await page.getByRole('button',{name:/Révéler la carte suivante/}).click();
  await page.getByRole('button',{name:/Voir mon classeur/}).click();
  await expect(page.getByText(/5 \/ 68/).first()).toBeVisible();
 }
 await page.reload();
 await expect(page.getByText(/5 \/ 68/).first()).toBeVisible();
 expect(state.postCalls).toBe(2);
 expect(state.history).toHaveLength(2);
 expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(10);
 expect(state.owned.find(x=>x.cardId===drawIds[0])?.quantity).toBe(2);
 expect(state.unexpected).toEqual([]);
});
