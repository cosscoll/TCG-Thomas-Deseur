import { test, expect } from "@playwright/test";

test("boosters, classeur local, doublons et sauvegarde après actualisation",async({page})=>{
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#cardGrid .tcg-card")).toHaveCount(49);
  await expect(page.locator("#collectionGrid .binder-card")).toHaveCount(49);
  await expect(page.locator("#collectionUnique")).toHaveText("0 / 49");
  await expect(page.locator("#accountSetup")).toBeVisible();
  await expect(page.locator("#accountAnonymous")).not.toBeVisible();
  await page.locator("#simulateBooster").click();
  await expect(page.locator("#boosterDialog")).toBeVisible();
  await expect(page.locator("#boosterResults .booster-result")).toHaveCount(5);
  await expect(page.locator("#collectionTotal")).toHaveText("5");
  await expect(page.locator("#collectionOpened")).toHaveText("1");
  await page.locator("#rerollBooster").click();
  await expect(page.locator("#collectionTotal")).toHaveText("10");
  await expect(page.locator("#collectionOpened")).toHaveText("2");
  await page.locator("#boosterDialog .dialog-close").click();
  await page.reload();
  await expect(page.locator("#collectionTotal")).toHaveText("10");
  await expect(page.locator("#collectionOpened")).toHaveText("2");
  await page.locator("#collectionOwnedFilter").selectOption("owned");
  await expect(page.locator("#collectionGrid .binder-card.owned").first()).toBeVisible();
  await page.locator("#collectionOwnedFilter").selectOption("missing");
  await expect(page.locator("#collectionGrid .binder-card.missing").first()).toBeVisible();
  await expect(page.locator("#recentOpenings .collection-history-row")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test.describe("mobile 390px",()=>{
 test.use({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 test("ouvrir un booster et consulter les cartes sur téléphone",async({page})=>{
  const errors=[];
  page.on("pageerror",error=>errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#collectionGrid .binder-card")).toHaveCount(49);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(2);
  await page.locator("#simulateBooster").click();
  await expect(page.locator("#boosterResults .booster-result")).toHaveCount(5);
  await expect(page.locator("#collectionTotal")).toHaveText("5");
  await page.locator("#boosterDialog .dialog-close").click();
  await page.locator("#collectionOwnedFilter").selectOption("owned");
  await expect(page.locator("#collectionGrid .binder-card.owned").first()).toBeVisible();
  expect(errors).toEqual([]);
 });
});

test("clavier: fermeture du dialogue et navigation du classeur",async({page})=>{
 await page.goto("/");
 await page.locator("#simulateBooster").focus();
 await page.keyboard.press("Enter");
 await expect(page.locator("#boosterDialog")).toBeVisible();
 await page.keyboard.press("Escape");
 await expect(page.locator("#boosterDialog")).not.toBeVisible();
 await expect(page.locator("#collectionTotal")).toHaveText("5");
});
