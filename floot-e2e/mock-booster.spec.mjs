import { test, expect } from '@playwright/test';

/**
 * Browser integration tests with completely intercepted /_api routes.
 * These are synthetic data ONLY: no account, no real POST, no player inventory.
 *
 * Current game: 67 public base cards + 38 alternatives, stock cap 3,
 * 1 regenerated booster every 12 h, 5 cards per opening.
 */
const rarities=[['commune',33],['rare',21],['epique',8],['legendaire',4],['hors_serie',1]];
function catalogue(){
  let ordinal=0,index=0;
  const main=rarities.flatMap(([rarity,count])=>Array.from({length:count},()=>{
    index++;
    return {id:'COST-'+String(index).padStart(3,'0'),cardId:'COST-'+String(index).padStart(3,'0'),
      name:'Personnage fictif '+index,rarity,reference:'REF-TEST-'+index,
      numericReference:String(12000000+index),sourceReference:'REF-TEST-'+index,
      imagePath:'',alternative:false,parentId:null,ordinal:0};
  }));
  const result=[];
  for(let i=0;i<main.length;i++){
    const original={...main[i],ordinal:++ordinal};
    result.push(original);
    if(i<38){
      result.push({id:'variant_'+String(i+1).padStart(3,'0'),
        cardId:'variant_'+String(i+1).padStart(3,'0'),
        name:original.name+' — alternative',rarity:original.rarity,
        reference:'REF-ALT-'+(i+1),numericReference:String(23000000+i+1),
        sourceReference:original.sourceReference,
        imagePath:'',alternative:true,parentId:original.id,ordinal:++ordinal});
    }
  }
  return {main,all:result};
}
const {main:regularCards,all:allCards}=catalogue();
const drawIds=[regularCards[0].id,regularCards[1].id,regularCards[2].id,
  regularCards[33].id,regularCards[54].id];
const getDraws=()=>drawIds.map(id=>allCards.find(c=>c.id===id));
const toSuperJson=value=>JSON.stringify({json:value});
const user={id:987654321,email:'fixture@invalid.test',
  displayName:'Joueur fictif',role:'user',avatarUrl:null};

async function mockAuthenticatedState(page,{
  boosterFailure=false,malformedAfterCommit=false,initialOwned=[],initialStock=1
}={}){
  let opened=0,postCalls=0,stock=initialStock,giftStock=0;
  let owned=structuredClone(initialOwned),history=[],unexpected=[];
  let nextAvailable=stock===3?null:'2099-01-01T00:00:00.000Z';
  await page.route('**/_api/**',async route=>{
    const req=route.request(),path=new URL(req.url()).pathname,method=req.method();
    const reply=(value,status=200)=>route.fulfill({
      status,contentType:'application/json',
      headers:{'Cache-Control':'private, no-store'},body:toSuperJson(value)
    });
    if(path==='/_api/auth/session'&&method==='GET')return reply({user});
    if(path==='/_api/collection'&&method==='GET')return reply({
      cards:allCards,owned,opened,nextAvailable,stock,giftStock,
      boosterUnlimited:false,history,
      completion:{found:owned.filter(r=>r.quantity>0).length,required:105,available:false,claimed:false}
    });
    if(path==='/_api/booster'&&method==='POST'){
      postCalls++;
      if(boosterFailure)return reply({error:'Booster temporairement indisponible.'},500);
      if(stock+giftStock<1)return reply({error:'Stock de boosters épuisé.'},429);
      if(stock>0)stock--;else giftStock--;
      opened++;
      const counts=new Map(owned.map(r=>[r.cardId,r.quantity]));
      const drawn=getDraws().map(card=>{
        const quantity=(counts.get(card.id)??0)+1;
        counts.set(card.id,quantity);
        return {...card,newCard:quantity===1,quantity,artworkId:card.id};
      });
      owned=[...counts].map(([cardId,quantity])=>({cardId,quantity}));
      history.unshift({
        cards:drawn.map(card=>card.id),artworks:drawn.map(card=>card.imagePath),
        createdAt:new Date(Date.UTC(2026,9,19,10,opened)).toISOString(),kind:'normal'
      });
      nextAvailable=stock===3?null:'2099-01-01T00:00:00.000Z';
      const base={nextAvailable,boosterUnlimited:false,stock,giftStock};
      if(malformedAfterCommit)return reply({...base,drawn:[]});
      return reply({...base,drawn});
    }
    unexpected.push(method+' '+path);
    return route.abort('blockedbyclient');
  });
  return {get postCalls(){return postCalls},
    get unexpected(){return [...unexpected]},get stock(){return stock},
    get owned(){return structuredClone(owned)},get history(){return structuredClone(history)}};
}
async function revealFive(page){
  await expect(page.getByText('Découverte de ton booster',{exact:true})).toBeVisible();
  for(let n=1;n<=5;n++){
    await expect(page.getByText('CARTE '+n+' SUR 5',{exact:true})).toBeVisible();
    const expected=getDraws()[n-1];
    await expect(page.locator('[data-rarity="'+expected.rarity+'"]')
      .filter({hasText:expected.name}).first()).toBeVisible();
    if(n<5)await page.getByRole('button',{name:/Révéler la carte suivante/}).click();
  }
}
const button=page=>page.locator('#booster').getByRole('button',{name:/Ouvrir mon booster/});

test('fixture conforme : 67 principales, 38 alternatives, 105 emplacements',()=>{
  expect(regularCards).toHaveLength(67);
  expect(allCards).toHaveLength(105);
  expect(new Set(allCards.map(card=>card.id)).size).toBe(105);
  expect(allCards.filter(card=>card.alternative)).toHaveLength(38);
  for(const [rarity,count] of rarities)
    expect(regularCards.filter(card=>card.rarity===rarity)).toHaveLength(count);
  for(let i=0;i<allCards.length;i++)if(allCards[i].alternative)
    expect(allCards[i-1].id).toBe(allCards[i].parentId);
  expect(getDraws().map(card=>card.rarity))
    .toEqual(['commune','commune','commune','rare','epique']);
});

test('un booster simulé livre cinq cartes et consomme un crédit',async({page})=>{
  const state=await mockAuthenticatedState(page);
  await page.goto('/');
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await revealFive(page);
  await expect(page.getByText('Bilan de ce booster')).toHaveCount(0);
  await page.getByRole('button',{name:/Voir mon classeur/}).click();
  await expect(button(page)).toBeDisabled();
  await expect(page.getByText(/Recharge dans/)).toBeVisible();
  await expect(page.getByText(/5 \/ 105/).first()).toBeVisible();
  expect(state.postCalls).toBe(1);
  expect(state.stock).toBe(0);
  expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(5);
  expect(state.unexpected).toEqual([]);
});

test('échec serveur simulé : aucune animation, aucun inventaire touché',async({page})=>{
  const state=await mockAuthenticatedState(page,{boosterFailure:true});
  await page.goto('/');
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await expect(page.getByRole('alert')).toContainText('Booster temporairement indisponible.');
  await expect(page.getByText('Découverte de ton booster',{exact:true})).toHaveCount(0);
  expect(state.postCalls).toBe(1);
  expect(state.stock).toBe(1);
  expect(state.owned).toHaveLength(0);
  expect(state.unexpected).toEqual([]);
});

test('après recharge de la page, le classeur retrouve les cinq cartes sans deuxième POST',async({page})=>{
  const state=await mockAuthenticatedState(page);
  await page.goto('/');
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await revealFive(page);
  await page.reload();
  await expect(page.getByText(/5 \/ 105/).first()).toBeVisible();
  await expect(button(page)).toBeDisabled();
  expect(state.postCalls).toBe(1);
  expect(state.history).toHaveLength(1);
  expect(state.unexpected).toEqual([]);
});

test('réponse de tirage invalide mais inventaire conservé au rechargement',async({page})=>{
  const state=await mockAuthenticatedState(page,{malformedAfterCommit:true});
  await page.goto('/');
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await expect(page.getByRole('alert')).toContainText('Résultat du booster invalide.');
  await expect(page.getByText('Découverte de ton booster',{exact:true})).toHaveCount(0);
  expect(state.postCalls).toBe(1);
  expect(state.history).toHaveLength(1);
  await page.reload();
  await expect(page.getByText(/5 \/ 105/).first()).toBeVisible();
  await expect(button(page)).toBeDisabled();
  expect(state.unexpected).toEqual([]);
});

test('une carte déjà possédée ×2 devient ×3 sans double progression',async({page})=>{
  const state=await mockAuthenticatedState(page,{
    initialOwned:[{cardId:drawIds[0],quantity:2}]
  });
  await page.goto('/');
  await expect(page.getByText(/1 \/ 105/).first()).toBeVisible();
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await revealFive(page);
  await page.reload();
  await expect(page.getByText(/5 \/ 105/).first()).toBeVisible();
  expect(state.owned.find(x=>x.cardId===drawIds[0])?.quantity).toBe(3);
  expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(7);
  expect(state.postCalls).toBe(1);
  expect(state.unexpected).toEqual([]);
});

test('trois crédits en stock : ouvrir un autre booster sans recharger la page',async({page})=>{
  const state=await mockAuthenticatedState(page,{initialStock:3});
  await page.goto('/');
  await expect(button(page)).toBeEnabled();
  await button(page).click();
  await revealFive(page);
  await page.getByRole('button',{name:/Ouvrir un autre booster/}).click();
  await revealFive(page);
  await page.reload();
  await expect(page.getByText(/5 \/ 105/).first()).toBeVisible();
  expect(state.postCalls).toBe(2);
  expect(state.stock).toBe(1);
  expect(state.owned.reduce((n,row)=>n+row.quantity,0)).toBe(10);
  expect(state.unexpected).toEqual([]);
});
