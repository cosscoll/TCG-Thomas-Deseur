import { test, expect } from "@playwright/test";

// Installation only: no account creation, no POST, no booster or collection mutation.
test("depuis l'accueil, le bouton Installer le jeu est visible et mène au parcours simple",async({page})=>{
  const res=await page.goto("/",{waitUntil:"domcontentloaded"});
  expect(res?.status()).toBe(200);
  const action=page.getByRole("button",{name:/Installer le jeu/i}).first();
  await expect(action).toBeVisible();
  await action.click();
  await expect(page).toHaveURL(/\/installer$/);
  await expect(page.getByRole("heading",{level:1})).toContainText(/écran d’accueil/i);
});

test("PWA sur le nouveau domaine : manifeste, icône et mode standalone installables",async({request})=>{
  const manifest=await request.get("/manifest.json");
  expect(manifest.status()).toBe(200);
  const json=await manifest.json();
  expect(json.name).toBe("TCG-Thomas-Deseur");
  expect(json.start_url).toBe("/");
  expect(json.scope).toBe("/");
  expect(json.display).toBe("standalone");
  expect(json.icons?.length).toBeGreaterThan(0);
  const icon=await request.get(json.icons[0].src);
  expect(icon.status()).toBe(200);
  expect(icon.headers()["content-type"]).toMatch(/image\/png/);
});

test("l'invite native reste disponible après navigation interne accueil → installer",async({page})=>{
  await page.goto("/",{waitUntil:"domcontentloaded"});
  await expect(page.getByRole("button",{name:/Installer le jeu/i}).first()).toBeVisible();
  await page.evaluate(()=>{
    window.__tcgPromptClicks=0;
    const event=new Event("beforeinstallprompt",{cancelable:true});
    Object.assign(event,{
      prompt:async()=>{window.__tcgPromptClicks++;},
      userChoice:Promise.resolve({outcome:"accepted"})
    });
    window.dispatchEvent(event);
  });
  await page.locator("header").getByRole("link",{name:"Installer"}).click();
  await expect(page.getByRole("button",{name:/Installer le jeu maintenant/i})).toBeVisible();
  await page.getByRole("button",{name:/Installer le jeu maintenant/i}).click();
  await expect(page.getByRole("status")).toContainText(/Installation acceptée/i);
  expect(await page.evaluate(()=>window.__tcgPromptClicks)).toBe(1);
});

test("Instagram Android : accès Chrome et copie du lien sans mensonge sur l'installation",async({browser,baseURL})=>{
  const context=await browser.newContext({
    userAgent:"Mozilla/5.0 (Linux; Android 14; Redmi Note) AppleWebKit/537.36 Chrome/132.0 Mobile Safari/537.36 Instagram 370.0"
  });
  try{
    const page=await context.newPage();
    const res=await page.goto(new URL("/installer",baseURL).href,{waitUntil:"domcontentloaded"});
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/Instagram, Facebook/)).toBeVisible();
    const link=page.getByRole("link",{name:/Ouvrir avec Chrome/i});
    await expect(link).toBeVisible();
    expect(await link.getAttribute("href")).toContain("com.android.chrome");
    await expect(page.getByRole("button",{name:/Copier le lien/i})).toBeVisible();
    await expect(page.getByText(/⋮/).first()).toBeVisible();
  }finally{await context.close();}
});

test("iPhone Instagram : instructions Safari, sans faux bouton d'installation directe",async({browser,baseURL})=>{
  const context=await browser.newContext({
    userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Instagram 365.0"
  });
  try{
    const page=await context.newPage();
    const res=await page.goto(new URL("/installer",baseURL).href,{waitUntil:"domcontentloaded"});
    expect(res?.status()).toBe(200);
    await expect(page.getByText(/ouvre cette page dans Safari/i)).toBeVisible();
    await expect(page.getByRole("button",{name:/Copier le lien pour Safari/i})).toBeVisible();
    await expect(page.getByRole("link",{name:/Ouvrir avec Chrome/i})).toHaveCount(0);
  }finally{await context.close();}
});

test("installation : mise en page smartphone sans débordement horizontal",async({page},testInfo)=>{
  test.skip(testInfo.project.name!=="mobile-chromium","Contrôle mobile seulement");
  await page.setViewportSize({width:320,height:750});
  const res=await page.goto("/installer",{waitUntil:"domcontentloaded"});
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading",{level:1})).toBeVisible();
  const excess=await page.evaluate(()=>({
    html:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    body:document.body.scrollWidth-document.body.clientWidth
  }));
  expect(excess.html).toBeLessThanOrEqual(2);
  expect(excess.body).toBeLessThanOrEqual(2);
});
