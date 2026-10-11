import {test,expect} from '@playwright/test';

// Lecture du catalogue public GitHub Pages seulement : pas de connexion Floot,
// pas de tirage, pas de modification d'inventaire ni d'identité joueur.
test.beforeEach(async ({page})=>{
 await page.goto('/collection-validee/');
 await expect(page.locator('#total')).toHaveText('67');
});

test('67 cartes nommées, 38 variantes et trois exclusions visibles',async({page})=>{
 await expect(page.locator('#variants')).toHaveText('38');
 await expect(page.locator('#excluded')).toHaveText('3');
 await expect(page.locator('article.card')).toHaveCount(67);
 await expect(page.locator('#count')).toContainText('67 / 67');
 await expect(page.locator('article.card .card-label h3').first()).not.toBeEmpty();
});

test('Picasso conserve exactement son visuel principal et ses deux variantes',async({page})=>{
 await page.locator('#search').fill('Picasso Deseur');
 await expect(page.locator('article.card')).toHaveCount(1);
 const card=page.locator('article.card');
 await expect(card.locator('h3')).toHaveText('Picasso Deseur');
 await expect(card.locator('.card-label small')).toContainText('td_1_002');
 await expect(card.locator('.variant-item')).toHaveCount(2);
 await expect(card.locator('.variant-item').nth(0)).toContainText('td_2_042');
 await expect(card.locator('.variant-item').nth(1)).toContainText('td_3_042');
 const main=card.locator('> .image-frame img');
 await expect(main).toHaveAttribute('src',/td-1-002\.webp$/);
 await expect.poll(async()=>await main.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
});

test('filtrage des variantes, puis réinitialisation de la recherche',async({page})=>{
 await page.locator('#filter').selectOption('multi');
 await expect(page.locator('article.card')).toHaveCount(1);
 await expect(page.locator('article.card h3')).toHaveText('Picasso Deseur');
 await page.locator('#filter').selectOption('none');
 await expect(page.locator('article.card')).not.toHaveCount(0);
 await page.locator('#search').fill('aucune-carte-nommée-ainsi');
 await expect(page.locator('#empty')).toBeVisible();
 await page.locator('#search').clear();
 await page.locator('#filter').selectOption('all');
 await expect(page.locator('article.card')).toHaveCount(67);
});

test('le catalogue reste dans le viewport, y compris sur mobile',async({page})=>{
 for(const width of [320,393,820]){
  await page.setViewportSize({width,height:840});
  const dims=await page.evaluate(()=>({inner:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  expect(dims.scroll,'Débordement horizontal à '+width+'px').toBeLessThanOrEqual(dims.inner+1);
 }
});
