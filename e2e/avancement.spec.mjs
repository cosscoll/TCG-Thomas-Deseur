import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.goto('/avancement/');
 await expect(page.locator('#total')).toHaveText('88');
 await expect(page.locator('#shown')).toHaveText('88');
});
test('88 actions, statuts et preuves sans divulgation du jeu',async({page})=>{
 const states=await page.request.get('/data/suivi-88-actions.json');
 expect(states.ok()).toBe(true);
 const data=await states.json();
 expect(data.actions).toHaveLength(88);
 expect(data.summary.delivered+data.summary.partial).toBe(88);
 const ids=new Set(data.actions.map(a=>a.id));
 expect(ids.size).toBe(88);
 await expect(page.locator('article.task')).toHaveCount(88);
 await expect(page.locator('article.task a.proof')).toHaveCount(88);
});
test('recherche, chantier et filtre de réalisation combinés',async({page})=>{
 await page.locator('#category').selectOption('Probabilités et logique de collection');
 await expect(page.locator('article.task')).toHaveCount(12);
 await page.locator('#state').selectOption('partiel');
 const reduced=await page.locator('article.task').count();
 expect(reduced).toBeGreaterThan(0);
 expect(reduced).toBeLessThan(12);
 await page.locator('#query').fill('complétion');
 await expect(page.locator('#items')).toBeVisible();
 await expect(page.locator('#shown')).not.toHaveText('88');
});
test('dashboard ne déborde pas sur mobile et tablette',async({page})=>{
 for(const width of [320,375,393,768,820,1024,1440]){
  await page.setViewportSize({width,height:900});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'horizontal overflow at '+width).toBeLessThanOrEqual(2);
 }
});
