import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.goto('/kit-visuels/');
 await expect(page.locator('#status')).toContainText('Aperçu prêt');
});
test('3 personnages officiels, sans données privées ni images inventées',async({page})=>{
 await expect(page.locator('#card0 option')).toHaveCount(67);
 await expect(page.locator('#card1 option')).toHaveCount(67);
 await expect(page.locator('#card2 option')).toHaveCount(67);
 await expect(page.locator('#preview')).toHaveAttribute('width','1080');
 await expect(page.locator('#preview')).toHaveAttribute('height','1080');
 await expect(page.locator('#download')).toBeEnabled();
 await expect(page.locator('body')).not.toContainText(/identité privée|méthode cachée/i);
});
test('formats carré, story et bannière exportables en PNG haute définition',async({page})=>{
 for(const [name,size] of [['square',[1080,1080]],['story',[1080,1920]],['landscape',[1200,630]]]){
  await page.locator('#format').selectOption(name);
  await expect(page.locator('#status')).toContainText(size.join(' × '));
  const d=await page.evaluate(()=>[document.querySelector('#preview').width,document.querySelector('#preview').height]);
  expect(d).toEqual(size);
  const p=page.waitForEvent('download');
  await page.getByRole('button',{name:'Exporter ce visuel en PNG'}).click();
  expect((await p).suggestedFilename()).toBe('tcg-deseur-maquette-'+name+'.png');
 }
});
test('changer les cartes ne crée aucun nouveau personnage ni requête POST',async({page})=>{
 const writes=[];page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))writes.push(r.url())});
 await page.locator('#card1').selectOption({index:22});
 await page.locator('#headline').selectOption('packs');
 await expect(page.locator('#status')).toContainText('Aperçu prêt');
 expect(writes).toEqual([]);
});
test('mise en page responsive du générateur',async({page})=>{
 for(const width of [320,375,393,820,1024,1440]){
  await page.setViewportSize({width,height:900});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'horizontal overflow @'+width).toBeLessThanOrEqual(2);
 }
});