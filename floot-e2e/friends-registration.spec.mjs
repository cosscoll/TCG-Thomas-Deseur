import {test,expect} from '@playwright/test';

// Contrôle d'accès PUBLIC à l'inscription du jeu Floot.
// Jamais de POST, de compte fabriqué, d'adresse réelle ou de mot de passe.
test('un nouvel ami peut trouver l’inscription depuis l’écran de connexion',async({page})=>{
 const networkWrites=[];
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))networkWrites.push({method:r.method(),path:new URL(r.url()).pathname})});
 const response=await page.goto('/login',{waitUntil:'domcontentloaded'});
 expect(response?.status()).toBe(200);
 await expect(page.locator('input[type="email"]').first()).toBeVisible();
 await expect(page.locator('input[type="password"]').first()).toBeVisible();
 const candidate=page.locator('button, a, [role="tab"]').filter({hasText:/s['’]?inscrire|inscription|créer.*compte/i}).first();
 await expect(candidate,'Le visiteur doit pouvoir découvrir comment créer un compte').toBeVisible();
 await candidate.click();
 await expect(page.locator('input[type="email"]').first()).toBeVisible();
 await expect(page.locator('input[type="password"]').first()).toBeVisible();
 // Le mode d'inscription doit demander un pseudonyme ou un nom d'utilisateur,
 // sans imposer un partage préalable de session.
 const fields=await page.locator('input').evaluateAll(inputs=>inputs.map(i=>({
  type:i.type,name:i.name,placeholder:i.placeholder,
  ariaLabel:i.getAttribute('aria-label'),
  label:i.labels?.[0]?.textContent?.trim().slice(0,70)||null
 })));
 console.log('TCG_SIGNUP_FIELDS',JSON.stringify(fields));
 const pseudonym=page.getByLabel(/pseudo|nom d'utilisateur|nom affiché|display name/i)
  .or(page.getByPlaceholder(/pseudo|nom d'utilisateur|nom affiché|display name/i));
 await expect(pseudonym.first(),'Champ de pseudonyme introuvable dans le formulaire d’inscription').toBeVisible();
 expect(networkWrites).toEqual([]);
});

test('le formulaire d’inscription reste utilisable sur mobile et tablette, sans envoyer de données',async({page})=>{
 const writes=[];
 page.on('request',request=>{
  if(!['GET','HEAD'].includes(request.method()))writes.push(new URL(request.url()).pathname);
 });
 for(const width of [320,393,820]){
  await page.setViewportSize({width,height:860});
  await page.goto('/login');
  const signup=page.getByRole('button',{name:/s['’]?inscrire/i}).first();
  await expect(signup).toBeVisible();
  await signup.click();
  await expect(page.getByRole('button',{name:'Créer mon compte'})).toBeVisible();
  await expect(page.locator('#register-display-name')).toBeVisible();
  await expect(page.getByText('Au moins 8 caractères.')).toBeVisible();
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow,'Débordement horizontal inscription '+width+'px').toBeLessThanOrEqual(2);
 }
 expect(writes).toEqual([]);
});

test('le lien d’invitation ouvre directement le formulaire d’inscription',async({page})=>{
 const networkWrites=[];
 page.on('request',r=>{if(!['GET','HEAD'].includes(r.method()))networkWrites.push(r.url());});
 const response=await page.goto('/login?mode=register',{waitUntil:'domcontentloaded'});
 expect(response?.status()).toBe(200);
 await expect(page.getByRole('heading',{name:'Créer mon compte'})).toBeVisible();
 await expect(page.locator('#register-display-name')).toBeVisible();
 await expect(page.getByRole('button',{name:'Créer mon compte'})).toBeVisible();
 expect(networkWrites).toEqual([]);
});
test('les surfaces invitées ne révèlent aucun contenu de récompense non annoncé',async({page})=>{
 for(const path of ['/', '/login?mode=register']){
  await page.goto(path);
  const visible=await page.locator('body').innerText();
  expect(visible).not.toMatch(/carte secrète|chevelu|récompense secrète/i);
 }
});
