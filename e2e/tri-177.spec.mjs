import {test,expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/tri-177/');
  await expect(page.getByRole('heading',{name:'TCG Deseur — 177 photos à trier'})).toBeVisible();
});

test('177 photos, 70 groupes et références préservées', async ({page})=>{
  await expect(page.locator('section.group')).toHaveCount(70);
  await expect(page.locator('.photo')).toHaveCount(177);
  await expect(page.locator('.primary-photo')).toHaveCount(70);
  await expect(page.locator('#COST-005')).toContainText('Héros au casque vert et cape');
  await expect(page.locator('#COST-005 .photo')).toHaveCount(3);
  await expect(page.locator('#COST-005')).toContainText('REF-1-005');
  await expect(page.locator('#COST-005')).toContainText('REF-2-001');
  await expect(page.locator('#COST-005')).toContainText('REF-3-014');
});

test('recherche, filtre et décision restent fonctionnels',async({page})=>{
  await page.locator('#q').fill('girafe');
  await expect(page.locator('section.group:not(.hidden)')).toHaveCount(1);
  await page.locator('#q').fill('');
  await page.locator('#filter').selectOption('solo');
  await expect(page.locator('section.group:not(.hidden)')).toHaveCount(4);
  await page.locator('#filter').selectOption('multi');
  await expect(page.locator('section.group:not(.hidden)')).toHaveCount(66);
  await page.locator('#filter').selectOption('all');
  const decision=page.locator('#COST-005 select.decision');
  await decision.selectOption('Conserver plusieurs variantes');
  await expect(page.locator('.decision-stats')).toContainText('1 / 70');
  await page.reload();
  await expect(page.locator('#COST-005 select.decision')).toHaveValue('Conserver plusieurs variantes');
});

test('choisir la photo principale et exporter un CSV des 70 décisions', async({page})=>{
  const primary=page.locator('#COST-005 .primary-photo');
  await primary.selectOption('REF-3-014');
  await expect(page.locator('#COST-005 .photo[data-selected="true"]')).toContainText('REF-3-014');
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.locator('#export').click(),
  ]);
  expect(download.suggestedFilename()).toBe('TCG_Deseur_tri_177_decisions.csv');
  const data=await download.path();
  const fs=await import('node:fs/promises');
  const csv=await fs.readFile(data,'utf8');
  expect(csv).toContain('REF-3-014');
  expect(csv).toContain('COST-070');
  expect(csv.split('\r\n').filter(Boolean)).toHaveLength(71);
  await page.reload();
  await expect(page.locator('#COST-005 .primary-photo')).toHaveValue('REF-3-014');
});

test('photos WebP valides depuis le serveur local',async({page})=>{
  const image=page.locator('#COST-001 img').first();
  await image.scrollIntoViewIfNeeded();
  await expect.poll(()=>image.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
  const src=await image.getAttribute('src');
  expect(src).toMatch(/\.webp$/);
  const result=await page.request.get('/tri-177/'+src);
  expect(result.status()).toBe(200);
  expect(result.headers()['content-type']).toContain('image/webp');
});

test('aucun défilement horizontal sur téléphone',async({page})=>{
  for(const width of [320,375,390,768]){
    await page.setViewportSize({width,height:800});
    const o=await page.evaluate(()=>Math.max(
      document.documentElement.scrollWidth-document.documentElement.clientWidth,
      document.body.scrollWidth-document.body.clientWidth
    ));
    expect(o,'Overflow on '+width+'px').toBeLessThanOrEqual(2);
  }
});

test('chaque photo originale indique sa galerie et un lien vers la provenance',async({page})=>{
  await expect(page.locator('section.group .photo')).toHaveCount(177);
  await expect(page.locator('section.group .photo .photo-provenance')).toHaveCount(177);
  await expect(page.locator('section.group .photo .photo-origin-name')).toHaveCount(177);
  await expect(page.locator('section.group .photo .photo-provenance a[href^="https://"]')).toHaveCount(177);
  const card=page.locator('#COST-005 .photo').first();
  await expect(card).toContainText('Costumes — vidéos 100 et 1000 couches');
  await expect(card).toContainText('images/100-1000-couches/REF-1-005.png');
  await expect(card.locator('.photo-provenance a')).toHaveAttribute('href',/tiermaker.com/);
});
