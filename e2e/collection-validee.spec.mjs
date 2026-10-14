import {test,expect} from '@playwright/test';

// Lecture du catalogue public GitHub Pages seulement : pas de connexion Floot,
// pas de tirage, pas de modification d'inventaire ni d'identité joueur.
test.beforeEach(async ({page})=>{
 await page.goto('/collection-validee/');
 await expect(page.locator('#total')).toHaveText('68');
});

test('68 emplacements publics, dont 67 cartes connues et une Carte mystère',async({page})=>{
 await expect(page.locator('#variants')).toHaveText('38');
 await expect(page.locator('#excluded')).toHaveText('3');
 await expect(page.locator('article.card')).toHaveCount(68);
 await expect(page.locator('#count')).toContainText('68 / 68');
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
 const main=card.locator('.image-frame img').first();
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
 await expect(page.locator('article.card')).toHaveCount(68);
});


test('provenance documentaire de chaque carte et filtre par galerie',async({page})=>{
 await expect(page.locator('article.card .photo-origin')).toHaveCount(67);
 await expect(page.locator('article.card .origin-link')).toHaveCount(67);
 await expect(page.locator('article.card .origin-link').first()).toHaveAttribute('href',/^https:\/\/tiermaker\.com\//);
 await page.locator('#origin').selectOption('images/serie-100-couches');
 await expect(page.locator('article.card')).toHaveCount(15);
 await page.locator('#origin').selectOption('images/personnages-thomas');
 await expect(page.locator('article.card')).toHaveCount(8);
 await page.locator('#origin').selectOption('images/Braderie-de-Lille-2026');
 await expect(page.locator('article.card')).toHaveCount(1);
 await page.locator('#origin').selectOption('all');
 await expect(page.locator('article.card')).toHaveCount(68);
});

test('le catalogue reste dans le viewport, y compris sur mobile',async({page})=>{
 for(const width of [320,393,820]){
  await page.setViewportSize({width,height:840});
  const dims=await page.evaluate(()=>({inner:window.innerWidth,scroll:document.documentElement.scrollWidth}));
  expect(dims.scroll,'Débordement horizontal à '+width+'px').toBeLessThanOrEqual(dims.inner+1);
 }
});

test('les 67 raretés validées apparaissent sur les fiches et dans le bilan',async({page})=>{
 const labels=[['Commune',33],['Rare',21],['Épique',8],['Légendaire',4],['Hors-série',1]];
 await expect(page.locator('#rarity-summary .rarity-stat')).toHaveCount(5);
 for(const [i,[name,qty]] of labels.entries()){
  const stat=page.locator('#rarity-summary .rarity-stat').nth(i);
  await expect(stat.locator('.rarity-name')).toHaveText(name);
  await expect(stat.locator('strong')).toHaveText(String(qty));
  await expect(page.locator('article.card[data-rarity="'+name+'"]')).toHaveCount(qty);
 }
 await expect(page.locator('article.card .rarity-badge')).toHaveCount(67);
});
test('le filtre de rareté se combine avec la recherche et les variantes',async({page})=>{
 await page.locator('#rarity').selectOption('Légendaire');
 await expect(page.locator('article.card')).toHaveCount(4);
 await page.locator('#filter').selectOption('multi');
 await expect(page.locator('article.card')).toHaveCount(1);
 await expect(page.locator('article.card h3')).toHaveText('Picasso Deseur');
 await page.locator('#rarity').selectOption('Hors-série');
 await expect(page.locator('#empty')).toBeVisible();
 await page.locator('#filter').selectOption('all');
 await expect(page.locator('article.card')).toHaveCount(1);
 await expect(page.locator('article.card h3')).toHaveText('Thomas huîtres');
 await page.locator('#rarity').selectOption('all');
 await expect(page.locator('article.card')).toHaveCount(68);
});
test('les noms, références et raretés du créateur se correspondent exactement',async({page})=>{
 const expected=await page.request.get('/data/raretes-validees-67.json');
 expect(expected.ok()).toBe(true);
 const rarityData=await expected.json();
 const displayed=await page.locator('article.card[data-group]').evaluateAll(els=>els.map(el=>({
   id:el.getAttribute('data-group'),
   rarity:el.getAttribute('data-rarity'),
   name:el.querySelector('h3')?.textContent
 })));
 expect(displayed).toHaveLength(67);
 for(const item of displayed){
  expect(rarityData.cards[item.id].rarity).toBe(item.rarity);
  expect(rarityData.cards[item.id].name).toBe(item.name);
 }
});

test('la 68e carte reste une simple Carte mystère sans identité, visuel ni mode d’obtention',async({page})=>{
 const mystery=page.locator('article.card.mystery-card');
 await expect(mystery).toHaveCount(1);
 await expect(mystery.locator('h3')).toHaveText('Carte mystère');
 await expect(mystery.locator('.mystery-glyph')).toHaveText('?');
 await expect(mystery.locator('img')).toHaveCount(0);
 await expect(mystery.locator('.photo-ref,.origin-link,.rarity-badge')).toHaveCount(0);
 await expect(page.locator('#rarity-summary .rarity-stat')).toHaveCount(5);
 await page.locator('#rarity').selectOption('mystere');
 await expect(page.locator('article.card')).toHaveCount(1);
 await expect(page.locator('#count')).toHaveText('1 / 68 cartes affichées');
 await page.locator('#rarity').selectOption('all');
 await page.locator('#search').fill('mystère');
 await expect(page.locator('article.card')).toHaveCount(1);
 await expect(page.locator('article.card h3')).toHaveText('Carte mystère');
 await page.locator('#search').clear();
 await expect(page.locator('article.card')).toHaveCount(68);
});
test('tous les 105 visuels approuvés existent ET se décodent dans Chromium',async({page},testInfo)=>{
 test.skip(testInfo.project.name!=='desktop-chromium','Un décodage complet sur un navigateur suffit.');
 test.setTimeout(120_000);
 await expect(page.locator('article.card[data-group] .image-frame img')).toHaveCount(105);
 await expect(page.locator('article.card[data-group] .image-frame img').first()).toHaveAttribute('src',/\/assets\/gray-extended-first10\/td-.*\.webp$/);
 await expect(page.locator('article.card[data-group] .image-frame img').first()).toHaveAttribute('srcset',/\/assets\/gray-thumbs-first10\/td-.*\.webp 384w, .*\/assets\/gray-extended-first10\/td-.*\.webp 1200w/);
 const errors=await page.evaluate(async()=>{
  const entries=[...document.querySelectorAll('article.card[data-group] .image-frame img')].map(el=>({
   src:el.getAttribute('src'),alt:el.getAttribute('alt')
  }));
  const failures=[];
  for(let i=0;i<entries.length;i+=8){
   const batch=entries.slice(i,i+8);
   await Promise.all(batch.map(async entry=>{
    const img=new Image();
    img.src=entry.src;
    try{
     await img.decode();
     const expected=entry.src.includes('/gray-extended-first10/')?[1200,1600]:[768,1024];
      if(img.naturalWidth!==expected[0]||img.naturalHeight!==expected[1])
       throw Error('Dimensions incorrectes (attendu '+expected.join(' × ')+', obtenu '+img.naturalWidth+' × '+img.naturalHeight+')');
    }catch(error){failures.push(entry.alt+' : '+entry.src+' : '+error.message)}
   }));
  }
  return failures;
 });
 expect(errors,'Illustrations dont le chargement ou décodage a échoué').toEqual([]);
});

test('tri des 67 cartes sans perdre la Carte mystère et les filtres',async({page})=>{
 await page.locator('#sort').selectOption('name');
 const names=await page.locator('article.card[data-group] h3').allTextContents();
 expect(names).toHaveLength(67);
 expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b,'fr')));
 await expect(page.locator('.mystery-card')).toHaveCount(1);
 await page.locator('#sort').selectOption('variants');
 await expect(page.locator('article.card[data-group] h3').first()).toHaveText('Picasso Deseur');
 await page.locator('#sort').selectOption('rarity');
 const firstRarity=await page.locator('article.card[data-group]').first().getAttribute('data-rarity');
 expect(firstRarity).toBe('Commune');
 await page.locator('#rarity').selectOption('Légendaire');
 await expect(page.locator('article.card[data-group]')).toHaveCount(4);
 await page.locator('#sort').selectOption('official');
 await page.locator('#rarity').selectOption('all');
 await expect(page.locator('article.card')).toHaveCount(68);
});

test('les miniatures responsives 384×512 sont disponibles et se décodent',async({page})=>{
 const response=await page.request.get('/data/thumbs-approved-105.json');
 expect(response.ok()).toBe(true);
 const data=await response.json();
 expect(data.images).toHaveLength(105);
 const unique=new Set(data.images.map(i=>i.thumb));
 expect(unique.size).toBe(105);
 const first=data.images[0];
 const thumb=await page.request.get('/'+first.thumb);
 expect(thumb.ok()).toBe(true);
 const dims=await page.evaluate(async p=>{
  const img=new Image();img.src='/'+p;
  await img.decode();return [img.naturalWidth,img.naturalHeight];
 },first.thumb);
 expect(dims).toEqual([384,512]);
});

test('les 10 originaux sont conservés en entier, seul le fond gris a été prolongé',async({page})=>{
 const response=await page.request.get('/data/gray-background-first10.json');
 expect(response.ok()).toBe(true);
 const data=await response.json();
 expect(data.items).toHaveLength(10);
 expect(data.items.map(x=>x.characterId)).toEqual(Array.from({length:10},(_,i)=>'COST-'+String(i+1).padStart(3,'0')));
 for(const item of data.items){
  expect(item.originalPixelsUntouched).toBe(true);
  expect(item.outputSize).toEqual([1200,1600]);
  const [left,top,w,h]=item.originalPixelPosition;
  expect([w,h]).toEqual(item.sourceSize);
  expect(left).toBeGreaterThanOrEqual(0);expect(top).toBeGreaterThanOrEqual(0);
  expect(left+w).toBeLessThanOrEqual(1200);expect(top+h).toBeLessThanOrEqual(1600);
  expect(item.image).toMatch(/^collection-validee\/assets\/gray-extended-first10\//);
  const img=await page.request.get('/'+item.image);
  expect(img.ok()).toBe(true);
 }
});
