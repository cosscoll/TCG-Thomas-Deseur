import {test, expect} from '@playwright/test';
const url='/collection-161/';
test.beforeEach(async({page})=>{
  await page.goto(url);
  await expect(page.locator('#cards-grid .card')).toHaveCount(161);
});
test('161 cartes, Chevelu secrète et Lille hors-série présentes',async({page})=>{
  await expect(page.getByRole('heading',{name:'Les 161 cartes'})).toBeVisible();
  await expect(page.locator('.card[data-rarity="secrete"]')).toHaveCount(1);
  await expect(page.locator('.card[data-rarity="hors_serie"]')).toHaveCount(1);
  await expect(page.locator('#secret-status')).toHaveText('Verrouillé');
  await expect(page.locator('#preview-secret')).toBeDisabled();
});
test('159 cartes sans Lille ne débloquent pas Chevelu',async({page})=>{
  await page.getByRole('button',{name:'159 / 160 (sans Lille)'}).click();
  await expect(page.locator('#progress-number')).toHaveText('159 / 160');
  await expect(page.locator('#secret-status')).toHaveText('Verrouillé');
  await expect(page.locator('#preview-secret')).toBeDisabled();
});
test('160 autres cartes débloquent uniquement le booster secret de démonstration',async({page})=>{
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await expect(page.locator('#secret-status')).toHaveText('Débloqué');
  await expect(page.locator('#preview-secret')).toBeEnabled();
  await page.locator('#preview-secret').click();
  await expect(page.locator('#secret-dialog')).toBeVisible();
  await expect(page.locator('#dialog-title')).toHaveText('Chevelu');
  await page.locator('#close-secret').click();
  await expect(page.locator('#secret-dialog')).not.toBeVisible();
});
test('une carte secrète déjà obtenue bloque un second booster',async({page})=>{
  await page.getByRole('button',{name:'161 / 161'}).click();
  await expect(page.locator('#secret-status')).toHaveText('Obtenue');
  await expect(page.locator('#preview-secret')).toBeDisabled();
});
test('filtres de collection et raretés corrects',async({page})=>{
  await page.locator('#rarity').selectOption('commune');
  await expect(page.locator('#cards-grid .card')).toHaveCount(95);
  await page.locator('#rarity').selectOption('hors_serie');
  await expect(page.locator('#cards-grid .card')).toHaveCount(1);
  await expect(page.locator('#cards-grid')).toContainText('Lille');
  await page.locator('#rarity').selectOption('secrete');
  await expect(page.locator('#cards-grid .card')).toHaveCount(1);
  await expect(page.locator('#cards-grid')).toContainText('Carte secrète à débloquer');
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
    expect(overflow,`horizontal overflow on ${width}px`).toBeLessThanOrEqual(2);
  }
});
