import { test, expect } from "@playwright/test";

test("parcours complet : boosters, classeur, historique, actualisation et filtres", async ({ page }) => {
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("h1")).toContainText("La chasse aux cartes");
  await expect(page.locator("#collectionGrid .binder-card")).toHaveCount(49);
  await expect(page.locator("#collectionUnique")).toHaveText("0 / 49");
  await expect(page.locator("#accountSetup")).toBeVisible();
  await expect(page.locator("#accountAnonymous")).not.toBeVisible();

  await page.locator("#openBooster").click();
  await expect(page.locator("#boosterDialog")).toBeVisible();
  await expect(page.locator("#boosterResults .booster-result")).toHaveCount(5);
  await expect(page.locator("#collectionTotal")).toHaveText("5");
  await expect(page.locator("#collectionOpened")).toHaveText("1");
  await page.locator("#openAgain").click();
  await expect(page.locator("#collectionTotal")).toHaveText("10");
  await expect(page.locator("#collectionOpened")).toHaveText("2");

  await page.locator("#boosterDialog .close-dialog").click();
  await page.reload();
  await expect(page.locator("#collectionTotal")).toHaveText("10");
  await expect(page.locator("#summaryOpened")).toHaveText("2");
  await page.locator("#collectionOwnedFilter").selectOption("owned");
  await expect(page.locator("#collectionGrid .binder-card.owned").first()).toBeVisible();
  await page.locator("#collectionOwnedFilter").selectOption("missing");
  await expect(page.locator("#collectionGrid .binder-card.missing").first()).toBeVisible();
  await page.locator("#collectionOwnedFilter").selectOption("all");
  await page.locator("#collectionSearch").fill("matelas");
  await expect(page.locator("#collectionGrid .binder-card")).toHaveCount(1);
  await page.locator("#collectionSearch").fill("");
  await page.locator("#collectionOwnedFilter").selectOption("all");
  await expect(page.locator("#recentOpenings .collection-history-row")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test.describe("mobile 390px", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  test("le booster et le classeur sont utilisables au doigt, sans débordement", async ({ page }) => {
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto("/");
    await expect(page.locator("#collectionGrid .binder-card")).toHaveCount(49);
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
    await page.locator("#openBooster").click();
    await expect(page.locator("#boosterDialog")).toBeVisible();
    await expect(page.locator("#boosterResults .booster-result")).toHaveCount(5);
    await expect(page.locator("#collectionTotal")).toHaveText("5");
    await page.locator("#boosterDialog .close-dialog").click();
    await page.locator("#collectionOwnedFilter").selectOption("owned");
    await expect(page.locator("#collectionGrid .binder-card.owned").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test("clavier : ouverture et fermeture de booster, compte non configuré expliqué", async ({ page }) => {
  await page.goto("/");
  await page.locator("#openBooster").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#boosterDialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#boosterDialog")).not.toBeVisible();
  await expect(page.locator("#collectionTotal")).toHaveText("5");
  await expect(page.locator("#accountMessage")).toContainText("Supabase");
});

test("ancien prototype solo isolé et toujours jouable", async ({ page }) => {
  await page.goto("/solo/");
  await expect(page.locator("#cardGrid .tcg-card")).toHaveCount(49);
  await expect(page.locator("#deckCount")).toHaveText("8 / 8");
  await page.locator("#startMatch").click();
  await expect(page.locator("#turnInfo")).toHaveText("C'est ton tour");
});
