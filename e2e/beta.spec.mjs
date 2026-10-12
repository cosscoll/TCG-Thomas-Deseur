import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/beta/');});
test('la page de test propose inscription et accès au vrai jeu, sans serveur secondaire',async({page})=>{
 await expect(page).toHaveTitle(/Test entre amis — TCG Deseur/);
 await expect(page.getByRole('link',{name:/Créer un compte ou se connecter/})).toHaveAttribute('href','https://budget-illimite-tcg.floot.app/login');
 await expect(page.getByRole('link',{name:/Accéder au jeu/})).toHaveAttribute('href','https://budget-illimite-tcg.floot.app/');
 await expect(page.getByRole('heading',{name:/Comment participer au test/})).toBeVisible();
 await expect(page.locator('form input[type="password"]')).toHaveCount(0);
 await expect(page.locator('form input[type="email"]')).toHaveCount(0);
 await expect(page.locator('form')).toHaveCount(1);
});
test('le compte rendu est uniquement local et contient les six étapes',async({page})=>{
 const remoteWrites=[];
 page.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))remoteWrites.push(request.url());});
 await page.getByLabel('Téléphone').check();
 await page.getByLabel('Inscription / création de compte').selectOption('Réussi');
 await page.getByLabel('Ouverture du premier booster').selectOption('Échec');
 await page.getByLabel('Un bug, une remarque ou une idée ?').fill('Bouton indisponible à la première ouverture');
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 const feedback=page.locator('#output');
 await expect(feedback).toHaveValue(/Appareil : Téléphone/);
 await expect(feedback).toHaveValue(/Inscription : Réussi/);
 await expect(feedback).toHaveValue(/Ouverture du premier booster : Échec/);
 await expect(feedback).toHaveValue(/Bouton indisponible/);
 await expect(page.locator('#copy')).toBeEnabled();
 expect(remoteWrites).toEqual([]);
});
test('les adresses et tokens saisis dans les remarques sont masqués avant copie',async({page})=>{
 await page.locator('#comments').fill('Message pour abc@example.com, token: secretX, password=bonjour');
 await page.locator('#prepare').click();
 const feedback=await page.locator('#output').inputValue();
 expect(feedback).not.toContain('abc@example.com');
 expect(feedback).not.toContain('secretX');
 expect(feedback).not.toContain('password=bonjour');
 expect(feedback).toContain('[adresse e-mail masquée]');
 await page.getByRole('button',{name:'Effacer mes réponses'}).click();
 await expect(page.locator('#output')).toBeEmpty();
});
test('la page de test reste lisible sur téléphone, tablette et ordinateur',async({page})=>{
 for(const width of [320,375,393,820,1280]){
  await page.setViewportSize({width,height:840});
  const sizes=await page.evaluate(()=>({
   doc:document.documentElement.scrollWidth-document.documentElement.clientWidth,
   body:document.body.scrollWidth-document.body.clientWidth
  }));
  expect(sizes.doc,'overflow document '+width).toBeLessThanOrEqual(2);
  expect(sizes.body,'overflow body '+width).toBeLessThanOrEqual(2);
 }
});
