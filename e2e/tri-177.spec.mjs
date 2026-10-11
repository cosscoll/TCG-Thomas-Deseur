import {test,expect} from '@playwright/test';

// L'atelier est un éditeur statique : pas de session serveur ni de mutation du jeu.
test.beforeEach(async({page})=>{
 await page.goto('/tri-177/');
 await expect(page.getByRole('heading',{name:/TCG Deseur — trie les illustrations stylisées/})).toBeVisible();
 await expect(page.locator('.card-editor')).toHaveCount(70);
});

test('70 groupes, 160 rendus stylisés, 177 photos sources conservées séparément',async({page})=>{
 await expect(page.locator('section.group')).toHaveCount(70);
 await expect(page.locator('.artwork-photo')).toHaveCount(160);
 await expect(page.locator('.originals-details .source-photos .photo')).toHaveCount(177);
 await expect(page.locator('#COST-005 .artwork-photo')).toHaveCount(3);
 await expect(page.locator('#COST-048 .artwork-photo')).toHaveCount(0);
 await expect(page.locator('#COST-005')).toContainText('Héros au casque vert et cape');
});

test('l’atelier reprend les 67 noms approuvés, Picasso avec ses deux variantes',async({page})=>{
 await expect(page.locator('#card-summary')).toContainText('67 validée(s)');
 const picasso=page.locator('#COST-003');
 await expect(picasso.locator('.card-name')).toHaveValue('Picasso Deseur');
 await expect(picasso.locator('.pick-main')).toHaveValue('td_1_002');
 await expect(picasso.locator('.artwork-photo[data-alternative="true"]')).toHaveCount(2);
 await expect(picasso.locator('.variants-previews .variant-panel')).toHaveCount(2);
 await expect(picasso.locator('.card-status')).toContainText('validée');
});

test('filtrer, renommer et valider une carte sans variante conserve les changements',async({page})=>{
 await page.locator('#q').fill('Roucoul Deseur');
 await expect(page.locator('section.group:not(.hidden)')).toHaveCount(1);
 await page.locator('#q').clear();
 await page.locator('#filter').selectOption('solo');
 await expect(page.locator('#COST-004')).toBeVisible();
 const target=page.locator('#COST-004');
 await expect(target.locator('.artwork-photo')).toHaveCount(1);
 await target.locator('.card-name').fill('Roucoul test');
 await target.locator('.validate-card').click();
 await expect(target.locator('.card-status')).toContainText('validée');
 await expect(target.locator('.variants-previews .variant-panel')).toHaveCount(0);
 await page.reload();
 await expect(page.locator('.card-editor')).toHaveCount(70);
 await expect(page.locator('#COST-004 .card-name')).toHaveValue('Roucoul test');
 await expect(page.locator('#COST-004 .card-status')).toContainText('validée');
});

test('une carte peut avoir plusieurs variantes et être exportée en JSON',async({page})=>{
 const group=page.locator('#COST-005');
 await group.locator('.card-name').fill('Thomas test');
 const arts=group.locator('.artwork-photo');
 await arts.nth(1).locator('.choose-alt').click();
 await arts.nth(2).locator('.choose-alt').click();
 await expect(group.locator('.variant-panel')).toHaveCount(2);
 await group.locator('.validate-card').click();
 await expect(group.locator('.card-status')).toContainText('validée');
 const [download]=await Promise.all([
  page.waitForEvent('download'),
  page.locator('.export-json').click()
 ]);
 expect(download.suggestedFilename()).toBe('TCG_Deseur_sauvegarde_tri.json');
 const fs=await import('node:fs/promises');
 const parsed=JSON.parse(await fs.readFile(await download.path(),'utf8'));
 expect(parsed.schema).toBe('tcg-deseur-cards-v3');
 expect(parsed.cards['COST-005'].alternatives).toHaveLength(2);
});

test('une illustration principale et sa photo d’origine peuvent être comparées',async({page})=>{
 const stylized=page.locator('#COST-001 .artwork-photo img').first();
 await stylized.scrollIntoViewIfNeeded();
 await expect.poll(()=>stylized.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 await page.locator('#COST-001 .originals-details summary').click();
 const photo=page.locator('#COST-001 .originals-details .photo img').first();
 await photo.scrollIntoViewIfNeeded();
 await expect.poll(()=>photo.evaluate(img=>img.complete&&img.naturalWidth>0)).toBe(true);
 const link=page.locator('#COST-001 .originals-details .photo .photo-provenance a').first();
 await expect(link).toHaveAttribute('href',/^https:\/\//);
});

test('aucun débordement horizontal sur ordinateur ou mobile',async({page})=>{
 for(const width of [320,393,820]){
  await page.setViewportSize({width,height:800});
  const overflow=await page.evaluate(()=>Math.max(
   document.documentElement.scrollWidth-document.documentElement.clientWidth,
   document.body.scrollWidth-document.body.clientWidth
  ));
  expect(overflow,'Overflow '+width+'px').toBeLessThanOrEqual(2);
 }
});
