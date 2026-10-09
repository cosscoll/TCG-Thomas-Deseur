import { test, expect } from "@playwright/test";

// Public, non-authenticated smoke tests for the LIVE Floot app.
// Never create accounts, submit login credentials, open boosters, or modify player data.

test("l'accueil public affiche TCG Deseur sans erreur JavaScript non interceptée", async ({ page }) => {
  const uncaughtErrors = [];
  page.on("pageerror", (error) => uncaughtErrors.push(error.message));
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/TCG Deseur/i);
  await expect(page.locator("body")).toContainText(/TCG\s*Deseur/i);
  await expect(page.locator("body")).not.toContainText(/Internal Server Error|Application error/i);
  expect(uncaughtErrors).toEqual([]);
});

test("la connexion dispose de champs e-mail et mot de passe sans soumettre de données", async ({ page }) => {
  const response = await page.goto("/login", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/TCG Deseur/i);
  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await expect(email).toHaveValue("");
  await expect(password).toHaveValue("");
});

test("les pages publiques restent lisibles aux différentes largeurs", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Vérification mobile et tablette");
  const viewports = [
    { width: 320, height: 750 },
    { width: 393, height: 852 },
    { width: 412, height: 915 },
    { width: 820, height: 1180 },
  ];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const path of ["/", "/login"]) {
      const response = await page.goto(path, { waitUntil: "load" });
      expect(response?.status()).toBe(200);
      await expect(page).toHaveTitle(/TCG Deseur/i);
      // Floot may hydrate after the initial HTML has loaded.
      await expect(page.locator("#root")).not.toBeEmpty();
      await page.evaluate(async () => { await document.fonts.ready; });
      const layout = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        body: document.body.scrollWidth - document.body.clientWidth,
      }));
      expect(layout.document, `Débordement document à ${viewport.width}px sur ${path}`).toBeLessThanOrEqual(2);
      expect(layout.body, `Débordement body à ${viewport.width}px sur ${path}`).toBeLessThanOrEqual(2);
    }
  }
});

// This file deliberately does not exercise boosters or forms requiring accounts.
