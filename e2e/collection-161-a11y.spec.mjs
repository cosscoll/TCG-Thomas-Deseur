import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {CARDS_161} from '../data/cards-161.js';

test('les 161 illustrations apparaissent automatiquement après publication du pack',async({page})=>{
  const files=CARDS_161.map(c=>c.artPath.split('/').at(-1));
  await page.route('**/assets/available.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({version:'161',count:161,images:files}),
  }));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGPgEpEDAABoAD1UCKP3AAAAAElFTkSuQmCC','base64');
  await page.route('**/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:png,
  }));
  await page.goto('/collection-161/');
  // Images are intentionally lazy: only visible images download initially.
  // Verify all 160 image tags are correctly connected to the DOM.
  await expect(page.locator('.art-frame img')).toHaveCount(160);
  await expect.poll(()=>page.locator('.art-frame.has-image').count(),{timeout:12000}).toBeGreaterThan(0);
  await expect(page.locator('.card[data-rarity="secrete"] img')).toHaveCount(0);
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await expect(page.locator('.art-frame img')).toHaveCount(161);
  const secret=page.locator('.card[data-rarity="secrete"] img');
  await secret.scrollIntoViewIfNeeded();
  await expect.poll(()=>secret.evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  await page.locator('#preview-secret').click();
  await expect(page.locator('#secret-dialog')).toBeVisible();
  await expect(page.locator('.secret-reveal-image')).toHaveAttribute('alt',/Chevelu/);
});

test('audit WCAG A/AA du classeur 161 et du booster Chevelu',async({page})=>{
  await page.goto('/collection-161/');
  const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(report.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,3).map(n=>n.target)}))).toEqual([]);
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await page.locator('#preview-secret').click();
  const modal=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(modal.violations.map(v=>({id:v.id,nodes:v.nodes.slice(0,3).map(n=>n.target)}))).toEqual([]);
});
