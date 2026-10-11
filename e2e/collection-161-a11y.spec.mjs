import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {PUBLIC_CARDS_160} from '../data/public-cards-160.js';

test('les 160 illustrations visibles apparaissent automatiquement après publication du pack',async({page})=>{
  const files=PUBLIC_CARDS_160.map(c=>c.artPath.split('/').at(-1));
  await page.route('**/assets/available.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({version:'160-public',count:160,images:files}),
  }));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgEpEDAABoAD1UCKP3AAAAAElFTkSuQmCC','base64');
  await page.route('**/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:png,
  }));
  await page.goto('/collection-161/');
  // Images are intentionally lazy: only visible images download initially.
  // Verify all 160 image tags are correctly connected to the DOM.
  await expect(page.locator('.art-frame img')).toHaveCount(160);
  // The gallery is below the initial viewport on phones; trigger lazy load.
  const firstImage=page.locator('.art-frame img').first();
  await firstImage.scrollIntoViewIfNeeded();
  await expect.poll(()=>firstImage.evaluate(img=>img.complete&&img.naturalWidth>0),{timeout:16000}).toBe(true);
  await expect.poll(()=>page.locator('.art-frame.has-image').count(),{timeout:16000}).toBeGreaterThan(0);
  await expect(page.locator('.card[data-rarity="secrete"] img')).toHaveCount(0);
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  // 160 prerequisites unlock the special pack, but do NOT reveal the secret
  // card inside the collection: its artwork appears in the special booster.
  await expect(page.locator('.art-frame img')).toHaveCount(160);
  await expect(page.locator('.card[data-rarity="secrete"] img')).toHaveCount(0);
  await page.locator('#preview-secret').click();
  await expect(page.locator('#secret-dialog')).toBeVisible();
  await expect(page.locator('#dialog-title')).toHaveText('Booster de collection');
  await page.locator('#close-secret').click();
  await page.getByRole('button',{name:'Booster déjà récupéré',exact:true}).click();
  await expect(page.locator('.art-frame img')).toHaveCount(160);
  await expect(page.locator('.card[data-rarity="secrete"]')).toHaveCount(0);
});

test('audit WCAG A/AA du classeur visible et du booster de collection',async({page})=>{
  await page.goto('/collection-161/');
  const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(report.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,3).map(n=>n.target)}))).toEqual([]);
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await page.locator('#preview-secret').click();
  const modal=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(modal.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,3).map(n=>n.target)}))).toEqual([]);
});
