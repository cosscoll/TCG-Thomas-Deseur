import { test, expect } from "@playwright/test";

test("parcours desktop : catalogue, cartes, deck, combat et booster", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#cardGrid .tcg-card")).toHaveCount(49);
  await expect(page.locator("#deckCount")).toHaveText("8 / 8");
  await page.locator("#cardGrid .tcg-card").first().click();
  await expect(page.locator("#cardDialog")).toBeVisible();
  await expect(page.locator("#detailCombat")).toContainText("PV");
  await page.locator("#cardDialog .dialog-close").click();
  await expect(page.locator("#cardDialog")).not.toBeVisible();

  await page.locator("#balancedDeck").click();
  await expect(page.locator("#deckComposition")).toContainText("Assaut : 2");
  await page.locator("#resetDeck").click();

  await page.locator("#startMatch").click();
  await expect(page.locator("#turnInfo")).toHaveText("C'est ton tour");
  await page.locator("#focusAction").click();
  await expect(page.locator("#turnInfo")).toHaveText("C'est ton tour", { timeout: 6000 });
  await page.locator("#burstAction").click();
  await expect(page.locator("#turnInfo")).toHaveText("C'est ton tour", { timeout: 6000 });
  await expect(page.locator("#battleLog li").first()).toBeVisible();

  await page.locator("#simulateBooster").click();
  await expect(page.locator("#boosterDialog")).toBeVisible();
  await expect(page.locator("#boosterResults .booster-result")).toHaveCount(5);
  await expect(page.locator("#accountSetup")).toBeVisible();
  await expect(page.locator("#accountAnonymous")).not.toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("mobile 390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("catalogue, combats et panneau de comptes lisibles", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator("#cardGrid .tcg-card")).toHaveCount(49);
    const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(pageOverflow, "La page ne doit pas déborder horizontalement").toBeLessThanOrEqual(2);
    await page.locator("#startMatch").click();
    await expect(page.locator("#quickAction")).toBeEnabled();
    await page.locator("#quickAction").click();
    await expect(page.locator("#turnInfo")).toHaveText("C'est ton tour", { timeout: 6000 });
    await expect(page.locator("#accountSetup")).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test("accessibilité clavier : ouverture et fermeture native de la fiche", async ({ page }) => {
  await page.goto("/");
  await page.locator("#cardGrid .tcg-card").first().focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#cardDialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#cardDialog")).not.toBeVisible();
});
