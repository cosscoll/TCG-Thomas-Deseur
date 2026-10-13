import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.goto('/planches/');
 await expect(page.locator('#status')).toContainText('105 illustrations publiques chargées');
});
test('67 illustrations principales et 38 alternatives sur deux planches imprimables',async({page})=>{
 await expect(page.locator('#primary-grid article')).toHaveCount(67);
 await expect(page.locator('#variant-grid article')).toHaveCount(38);
 await expect(page.locator('article.card img')).toHaveCount(105);
 await expect(page.locator('article.card').first()).toContainText('COST-001');
 await expect(page.locator('article.card').first()).toContainText('REF-1-001');
 await expect(page.getByRole('button',{name:/Imprimer/})).toBeVisible();
 await expect(page.locator('article.card img').first()).toHaveAttribute('src',/assets\/uniform\/td-.*\.webp$/);
});
test('filtres et tri fonctionnent sans perdre les cartes officielles',async({page})=>{
 await page.locator('#view').selectOption('main');
 await expect(page.locator('#main')).toBeVisible();
 await expect(page.locator('#alternative')).toBeHidden();
 await page.locator('#view').selectOption('variant');
 await expect(page.locator('#main')).toBeHidden();
 await expect(page.locator('#variant-grid article')).toHaveCount(38);
 await page.locator('#view').selectOption('all');
 await page.locator('#sort').selectOption('name');
 const names=await page.locator('#primary-grid article strong').allTextContents();
 expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b,'fr')));
 await page.locator('#sort').selectOption('rarity');
 await expect(page.locator('#primary-grid article').first()).toHaveAttribute('data-rarity','Commune');
});
test('planches mobile/tablette sans débordements horizontaux',async({page})=>{
 for(const width of [320,375,393,768,820,1024,1440]){
  await page.setViewportSize({width,height:900});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'horizontal overflow @'+width).toBeLessThanOrEqual(2);
 }
});
test('document printable ne montre que les illustrations publiques',async({page})=>{
 const requested=await page.evaluate(()=>[...document.querySelectorAll('article.card img')].map(i=>i.getAttribute('src')));
 expect(new Set(requested).size).toBe(105);
 expect(requested.every(path=>path.includes('/assets/uniform/')&&!path.includes('reward'))).toBe(true);
 expect(await page.locator('article.card img').count()).toBe(105);
 await expect(page.locator('article.card')).not.toContainText(/modalité de récompense|identité privée/i);
});
