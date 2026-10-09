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

test("les pages publiques ne débordent pas horizontalement sur mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-chromium", "Vérification réservée à l'écran mobile");
  for (const path of ["/", "/login"]) {
    await page.goto(path, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/TCG Deseur/i);
    // React renders asynchronously. Wait for initial paint, without relying on historical prototype selectors.
    await page.locator("body").waitFor({ state: "visible" });
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `Débordement horizontal sur ${path}`).toBeLessThanOrEqual(2);
  }
});
