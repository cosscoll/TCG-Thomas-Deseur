import {test, expect} from '@playwright/test';
const url='/collection-161/';
test.beforeEach(async({page})=>{
  await page.goto(url);
  await expect(page.locator('#cards-grid .card')).toHaveCount(160);
});
test('160 cartes historiques visibles avec Lille hors-série',async({page})=>{
  await expect(page.getByRole('heading',{name:'Les 160 cartes du classeur'})).toBeVisible();
  // Le catalogue public n'expose que les catégories courantes.
  await expect(page.locator('.card[data-rarity="hors_serie"]')).toHaveCount(1);
  await expect(page.locator('#secret-status')).toHaveText('Verrouillé');
  await expect(page.locator('#preview-secret')).toBeDisabled();
});
test('159 cartes sans Lille ne débloquent pas le booster de collection',async({page})=>{
  await page.getByRole('button',{name:'159 / 160 (sans Lille)'}).click();
  await expect(page.locator('#progress-number')).toHaveText('159 / 160');
  await expect(page.locator('#secret-status')).toHaveText('Verrouillé');
  await expect(page.locator('#preview-secret')).toBeDisabled();
});
test('160 cartes débloquent uniquement la démonstration du booster de collection',async({page})=>{
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await expect(page.locator('#secret-status')).toHaveText('Disponible');
  await expect(page.locator('#preview-secret')).toBeEnabled();
  await page.locator('#preview-secret').click();
  await expect(page.locator('#secret-dialog')).toBeVisible();
  await expect(page.locator('#dialog-title')).toHaveText('Booster de collection');
  await page.locator('#close-secret').click();
  await expect(page.locator('#secret-dialog')).not.toBeVisible();
});
test('une récompense déjà récupérée bloque un deuxième booster',async({page})=>{
  await page.getByRole('button',{name:'Booster déjà récupéré'}).click();
  await expect(page.locator('#secret-status')).toHaveText('Récupéré');
  await expect(page.locator('#preview-secret')).toBeDisabled();
});
test('filtres de collection et raretés corrects',async({page})=>{
  await page.locator('#rarity').selectOption('commune');
  await expect(page.locator('#cards-grid .card')).toHaveCount(95);
  await page.locator('#rarity').selectOption('hors_serie');
  await expect(page.locator('#cards-grid .card')).toHaveCount(1);
  await expect(page.locator('#cards-grid')).toContainText('Lille');
  await page.locator('#rarity').selectOption('all');
  await page.locator('#search').fill('REF-3-043');
  await expect(page.locator('#cards-grid .card')).toHaveCount(1);
});
test('aucune requête POST ni récompense réseau dans la démonstration',async({page})=>{
  const writes=[];page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))writes.push(r.url())});
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await page.locator('#preview-secret').click();
  await page.locator('#finish-secret').click();
  expect(writes).toEqual([]);
});
test('mobile: pas de débordement à 320, 393, 820 pixels',async({page})=>{
  for(const width of [320,393,820]){
    await page.setViewportSize({width,height:800});
    const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth-document.documentElement.clientWidth,document.body.scrollWidth-document.body.clientWidth));
    if(overflow>2){
      const offenders=await page.evaluate(()=>{
        const cw=document.documentElement.clientWidth;
        return [...document.querySelectorAll('body *')].map(node=>({node,r:node.getBoundingClientRect()}))
        .filter(({node,r})=>r.width>0&&r.right>cw+2&&getComputedStyle(node).display!=="none")
        .slice(0,12).map(({node,r})=>({tag:node.tagName,cl:String(node.className).slice(0,80),
        right:Math.round(r.right),width:Math.round(r.width),txt:(node.textContent||'').trim().slice(0,40)}));
      });
      console.log('TCG_161_OVERFLOW_DIAGNOSTIC',JSON.stringify({width,overflow,offenders}));
    }
    expect(overflow,`horizontal overflow on ${width}px`).toBeLessThanOrEqual(2);
  }
});

test('booster ordinaire fictif donne cinq cartes sans secrète et une cinquième Rare+',async({page})=>{
  const requests=[];
  page.on('request',req=>{if(!['GET','HEAD'].includes(req.method()))requests.push(req.url())});
  await page.locator('#draw-demo').click();
  await expect(page.locator('#demo-pack-results li')).toHaveCount(5);
  await expect(page.locator('#demo-pack-results li')).toHaveCount(5);
  const last=page.locator('#demo-pack-results li').last();
  await expect(last).not.toHaveAttribute('data-rarity','commune');
  const count=await page.locator('#progress-number').textContent();
  expect(Number(count?.split('/')[0].trim())).toBeGreaterThan(0);
  expect(requests).toEqual([]);
});

test('les 160 cartes utilisent la référence PHOTO réellement identifiée, sans noms attribués',async({page})=>{
  await expect(page.locator('#cards-grid .card')).toHaveCount(160);
  await expect(page.locator('#cards-grid .card-title')).toHaveCount(160);
  await expect(page.locator('#cards-grid .card-origin')).toHaveCount(160);
  await expect(page.locator('#cards-grid .card-links a[href^="https://"]')).toHaveCount(160);
  const names=await page.locator('.card-title').allTextContents();
  expect(names.every(t=>/^Carte \d{3}$/.test(t))).toBe(true);
  const first=page.locator('#cards-grid .card').first();
  await expect(first).toContainText('Carte 001');
  await expect(first).toContainText('Source ZIP : REF-1-002');
  await expect(first).toContainText('COST-002');
  await page.locator('#search').fill('COST-005');
  await expect(page.locator('#cards-grid .card')).toHaveCount(3);
  const href=await page.locator('#cards-grid .card').first().locator('a[href*="verification-photos"]').getAttribute('href');
  expect(href).toMatch(/verification-photos\/\?carte=td_/);
});
test('la provenance filtre les cartes par série d’origine',async({page})=>{
  await page.locator('#origin').selectOption('images/100-1000-couches');
  await expect(page.locator('#cards-grid .card')).toHaveCount(63);
  await page.locator('#origin').selectOption('images/serie-100-couches');
  await expect(page.locator('#cards-grid .card')).toHaveCount(54);
  await page.locator('#origin').selectOption('images/personnages-thomas');
  await expect(page.locator('#cards-grid .card')).toHaveCount(42);
  await page.locator('#origin').selectOption('images/Braderie-de-Lille-2026');
  await expect(page.locator('#cards-grid .card')).toHaveCount(1);
  await expect(page.locator('#cards-grid')).toContainText('Braderie de Lille');
});
