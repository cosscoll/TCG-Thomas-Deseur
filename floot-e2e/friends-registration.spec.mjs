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
 const pseudonym=page.getByLabel(/pseudo|nom d'utilisateur|nom affiché|display name/i);
 await expect(pseudonym.first()).toBeVisible();
 expect(networkWrites).toEqual([]);
});
