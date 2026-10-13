import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{await page.goto('/beta/');});
test('la page de test propose inscription et accès au vrai jeu, sans serveur secondaire',async({page})=>{
 await expect(page).toHaveTitle(/Test entre amis — TCG Deseur/);
 await expect(page.getByRole('link',{name:/Créer un compte ou se connecter/})).toHaveAttribute('href','https://budget-illimite-tcg.floot.app/login?mode=register');
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

test('le testeur peut enregistrer localement son rapport et modifier son navigateur sans rapport périmé',async({page})=>{
 const networkWrites=[];
 page.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))networkWrites.push(request.url());});
 await page.getByLabel('Navigateur utilisé').selectOption('Safari');
 await page.getByLabel('Ouverture du premier booster').selectOption('Échec');
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 await expect(page.locator('#output')).toHaveValue(/Navigateur : Safari/);
 const downloadPromise=page.waitForEvent('download');
 await page.getByRole('button',{name:'Enregistrer en .txt'}).click();
 const download=await downloadPromise;
 expect(download.suggestedFilename()).toBe('tcg-deseur-retour-de-test.txt');
 await page.getByLabel('Navigateur utilisé').selectOption('Firefox');
 await expect(page.locator('#output')).toBeEmpty();
 await expect(page.locator('#copy')).toBeDisabled();
 await expect(page.locator('#download')).toBeDisabled();
 await expect(page.locator('#share')).toBeDisabled();
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 await expect(page.locator('#output')).toHaveValue(/Navigateur : Firefox/);
 expect(networkWrites).toEqual([]);
});
test('le partage du rapport nécessite toujours une action du testeur',async({page})=>{
 await page.evaluate(()=>{
  Object.defineProperty(navigator,'share',{configurable:true,value:async function(details){window.__betaShared=details;}});
 });
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 expect(await page.evaluate(()=>window.__betaShared??null)).toBe(null);
 await page.getByRole('button',{name:'Partager mon retour'}).click();
 const shareData=await page.evaluate(()=>window.__betaShared);
 expect(shareData.title).toContain('TCG Deseur');
 expect(shareData.text).toContain('RETOUR DE TEST');
});
test('masque les informations sensibles courantes dans un commentaire avant téléchargement',async({page})=>{
 await page.locator('#comments').fill('Contact testeur@example.com URL https://exemple.fr/?access_token=fake123456&code=0000 Authorization: Bearer fakeToken12345');
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 const text=await page.locator('#output').inputValue();
 expect(text).not.toContain('testeur@example.com');
 expect(text).not.toContain('fake123456');
 expect(text).not.toContain('fakeToken12345');
 expect(text).not.toContain('code=0000');
});

test('classement local P0/P1 des erreurs sans envoi automatique',async({page})=>{
 const writes=[];page.on('request',r=>{if(['POST','PUT','PATCH','DELETE'].includes(r.method()))writes.push(r.url())});
 await page.getByLabel('Ouverture du premier booster').selectOption('Échec');
 await page.getByLabel('Illustrations visibles et lisibles').selectOption('Échec');
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 await expect(page.locator('#output')).toHaveValue(/P0 — bloquant/);
 await expect(page.locator('#output')).toHaveValue(/Booster, Images/);
 expect(writes).toEqual([]);
 await page.getByRole('button',{name:'Effacer mes réponses'}).click();
 await page.getByLabel('Illustrations visibles et lisibles').selectOption('Échec');
 await page.getByRole('button',{name:'Préparer mon compte rendu'}).click();
 await expect(page.locator('#output')).toHaveValue(/P1 — majeur/);
});
