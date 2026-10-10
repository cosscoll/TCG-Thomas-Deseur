import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {CARDS_161} from '../data/cards-161.js';

test('les 161 illustrations apparaissent automatiquement après publication du pack',async({page})=>{
  const files=CARDS_161.map(c=>c.artPath.split('/').at(-1));
  await page.route('**/assets/available.json',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({version:'161',count:161,images:files}),
  }));
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwsB9WkV7wAAAABJRU5ErkJggg==','base64');
  await page.route('**/*.webp',route=>route.fulfill({
    status:200,contentType:'image/png',body:png,
  }));
  await page.goto('/collection-161/');
  await expect.poll(()=>page.locator('.art-frame.has-image').count(),{timeout:20000}).toBe(160);
  await expect(page.locator('.card[data-rarity="secrete"] img')).toHaveCount(0);
  await page.getByRole('button',{name:'160 / 160',exact:true}).click();
  await expect.poll(()=>page.locator('.art-frame.has-image').count(),{timeout:20000}).toBe(161);
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
