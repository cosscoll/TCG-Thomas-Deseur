import {test,expect} from "@playwright/test";
const route="/verification-photos/";
test.beforeEach(async({page})=>{
 await page.goto(route);
 await expect(page.locator("#status")).toContainText("69 résultat(s)");
});
test("illustrations principales : 69 paires réellement comparées, sans noms",async({page})=>{
 await expect(page.locator(".pair-card")).toHaveCount(69);
 await expect(page.locator(".pair-card .pair-figure")).toHaveCount(138);
 const example=page.locator('.pair-card[data-card="td_1_001"]');
 await expect(example).toContainText("REF-1-002");
 await expect(example).toContainText("REF-1-001");
 await expect(example).toContainText("COST-002");
 await expect(example.locator("img")).toHaveCount(2);
 await expect(example.locator("img").first()).toHaveAttribute("src",/REF-1-002__/);
 await expect(example.locator("img").last()).toHaveAttribute("src",/td-1-001.webp/);
});
test("91 variantes mises à part, sans effacer les rendus",async({page})=>{
 await page.getByRole("button",{name:"Variantes à part (91)"}).click();
 await expect(page.locator(".pair-card")).toHaveCount(91);
 await expect(page.locator(".compared-to")).toHaveCount(91);
 await page.getByRole("button",{name:"Toutes les paires (160)"}).click();
 await expect(page.locator(".pair-card")).toHaveCount(160);
});
test("17 photos originales sans illustration, un groupe complet manquant",async({page})=>{
 await page.getByRole("button",{name:"Photos sans rendu (17)"}).click();
 await expect(page.locator(".pair-card")).toHaveCount(17);
 await page.locator("#group").selectOption("COST-048");
 await expect(page.locator(".pair-card")).toHaveCount(3);
 await expect(page.locator("#results")).toContainText("Ce costume n'a actuellement aucune illustration");
});
test("recherche par vraie photo, mauvaise ancienne étiquette et série",async({page})=>{
 await page.locator("#search").fill("REF-1-002");
 await expect(page.locator(".pair-card")).toHaveCount(1);
 await expect(page.locator('.pair-card').first()).toHaveAttribute("data-card","td_1_001");
 await page.locator("#search").fill("");
 await page.locator("#series").selectOption("177");
 await expect(page.locator(".pair-card")).toHaveCount(1);
 await expect(page.locator(".pair-card").first()).toContainText("REF-177-LILLE");
});
test("export CSV répertorie les 160 associations et les doublons",async({page})=>{
 const [file]=await Promise.all([page.waitForEvent("download"),page.locator("#export").click()]);
 expect(file.suggestedFilename()).toBe("TCG_Deseur_Correspondances_Photo_Carte_160.csv");
 const fs=await import("node:fs/promises");
 const text=await fs.readFile(await file.path(),"utf8");
 expect(text.split("\r\n").filter(Boolean)).toHaveLength(161);
 expect(text).toContain("td_1_001");
 expect(text).toContain("REF-1-002");
 expect(text).toContain("set_aside");
});
test("la photo et l'illustration sont chargées, sans débordement sur mobile",async({page})=>{
 const item=page.locator(".pair-card").first();
 for(const img of await item.locator("img").all()){
  await img.scrollIntoViewIfNeeded();
  await expect.poll(()=>img.evaluate(e=>e.complete&&e.naturalWidth>0),{timeout:10000}).toBe(true);
 }
 for(const width of [320,390,820,1200]){
  await page.setViewportSize({width,height:750});
  const overflow=await page.evaluate(()=>Math.max(
   document.documentElement.scrollWidth-document.documentElement.clientWidth,
   document.body.scrollWidth-document.body.clientWidth));
  expect(overflow,"horizontal overflow at "+width+"px").toBeLessThanOrEqual(2);
 }
});
