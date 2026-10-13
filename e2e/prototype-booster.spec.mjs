import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.goto('/prototype-booster/');
 await expect(page.locator('#start')).toBeEnabled();
});
test('prototype fictif révèle cinq vraies illustrations dans un ordre autorisé',async({page})=>{
 const writes=[];page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))writes.push(r.url())});
 await page.getByRole('button',{name:'Ouvrir le booster fictif'}).click();
 for(let i=0;i<5;i++){
  await expect(page.locator('#status')).toContainText('CARTE '+(i+1)+' SUR 5');
  await expect(page.locator('#card')).toHaveAttribute('data-rarity',i<3?'Commune':i===3?'Rare':'Épique');
  await expect(page.locator('#card img')).toHaveAttribute('src',/collection-validee\/assets\/uniform\/td-.*\.webp$/);
  if(i<4)await page.getByRole('button',{name:'Révéler la carte suivante'}).click();
 }
 await expect(page.locator('#result')).toBeVisible();
 await expect(page.locator('#summary article')).toHaveCount(5);
 await expect(page.getByRole('button',{name:'Révéler la carte suivante'})).toBeHidden();
 expect(writes).toEqual([]);
});
test('rejouer ne conserve pas de récompense et la commande revient au départ',async({page})=>{
 await page.locator('#start').click();
 for(let i=0;i<4;i++)await page.locator('#next').click();
 await expect(page.locator('#result')).toBeVisible();
 await page.locator('#restart').click();
 await expect(page.locator('#result')).toBeHidden();
 await expect(page.locator('#start')).toBeVisible();
 await expect(page.locator('#card')).toHaveClass(/back/);
});
test('accessibilité des cinq étapes sur mobile et réduction des animations',async({page})=>{
 for(const width of [320,375,393,820,1024]){
  await page.setViewportSize({width,height:860});
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'Horizontal overflow '+width).toBeLessThanOrEqual(2);
 }
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.locator('#start').click();
 const value=await page.locator('#card').evaluate(el=>getComputedStyle(el).animationName);
 expect(value).toBe('none');
});
