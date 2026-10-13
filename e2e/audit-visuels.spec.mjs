import {test,expect} from '@playwright/test';

test.beforeEach(async({page})=>{
 await page.goto('/audit-visuels/');
 await expect(page.locator('#count')).toHaveText('105');
});
test('105 public side-by-side artworks, 67 main and 38 variants, never a secret image',async({page})=>{
 await expect(page.locator('.item')).toHaveCount(105);
 await expect(page.locator('.item figure img')).toHaveCount(210);
 await expect(page.locator('body')).not.toContainText(/chevelu|contenu de la carte mystère/i);
 await expect(page.locator('#approved')).toHaveText('0');
 await page.locator('#type').selectOption('variant');
 await expect(page.locator('.item:visible')).toHaveCount(38);
 await page.locator('#type').selectOption('main');
 await expect(page.locator('.item:visible')).toHaveCount(67);
 await page.locator('#rarity').selectOption('Légendaire');
 await expect(page.locator('.item:visible')).toHaveCount(4);
});
test('local visual decision survives reload and has no network writes',async({page})=>{
 const writes=[];
 page.on('request',r=>{if(['POST','PATCH','PUT','DELETE'].includes(r.method()))writes.push(r.url())});
 const first=page.locator('.item').first();
 const id=await first.getAttribute('data-id');
 await first.getByRole('button',{name:'Valider'}).click();
 await expect(page.locator('#approved')).toHaveText('1');
 await page.reload();
 await expect(page.locator('#count')).toHaveText('105');
 await expect(page.locator('#approved')).toHaveText('1');
 await expect(page.locator('.item').first().getByRole('button',{name:'Valider'})).toHaveAttribute('aria-pressed','true');
 const current=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)), 'tcg-deseur-art-review-105-v1');
 expect(current[id]).toBe('approved');
 expect(writes).toEqual([]);
});
test('search by source reference and show retouch filter',async({page})=>{
 await page.locator('#search').fill('REF-1-001');
 await expect(page.locator('.item:visible')).toHaveCount(1);
 await page.locator('.item:visible').first().getByRole('button',{name:'À retoucher'}).click();
 await page.locator('#decision').selectOption('retouch');
 await expect(page.locator('.item:visible')).toHaveCount(1);
 await page.locator('#search').fill('not-found-reference-xyz');
 await expect(page.locator('#empty')).toBeVisible();
});
test('all images are same 3:4 proportions after output normalization',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','Only one browser required');
 test.setTimeout(120000);
 const errors=await page.evaluate(async()=>{
  const imgs=[...document.querySelectorAll('.item figure:last-child img')];
  const errors=[];
  for(let i=0;i<imgs.length;i+=10){
   const batch=imgs.slice(i,i+10);
   await Promise.all(batch.map(async img=>{
    try{await img.decode();if(img.naturalWidth!==768||img.naturalHeight!==1024)throw Error('bad ratio');}
    catch(e){errors.push(img.src+': '+e.message)}
   }));
  }
  return errors;
 });
 expect(errors).toEqual([]);
});
