import { test, expect } from "@playwright/test";

// This suite inspects public pages only. It does not log in or mutate state.
// Some tests are acceptance criteria and may FAIL until Floot is fixed.

for (const route of ["/", "/login"]) {
  test(`le document ${route} déclare le français`, async ({ page }) => {
    const response = await page.goto(route, { waitUntil: "load" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", /^fr(?:-|$)/i);
  });
}

test("les champs de connexion ont un nom accessible autre qu'un simple placeholder", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const inputs = [
    page.locator('input[type="email"]').first(),
    page.locator('input[type="password"]').first(),
  ];
  for (const input of inputs) {
    await expect(input).toBeVisible();
    const details = await input.evaluate((el) => {
      const ariaLabel = el.getAttribute("aria-label")?.trim() || "";
      const ariaLabelledBy = el.getAttribute("aria-labelledby")
        ?.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() || "")
        .filter(Boolean)
        .join(" ") || "";
      const nativeLabels = Array.from(el.labels || [])
        .map((label) => label.textContent?.trim() || "")
        .filter(Boolean)
        .join(" ");
      return { ariaLabel, ariaLabelledBy, nativeLabels };
    });
    const accessibleName = [details.ariaLabel, details.ariaLabelledBy, details.nativeLabels]
      .find(Boolean);
    expect(accessibleName, "Un placeholder seul ne suffit pas pour nommer un champ").toBeTruthy();
  }
});

test("une personne utilisant le clavier peut accéder aux champs de connexion", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const email = page.locator('input[type="email"]').first();
  await expect(email).toBeVisible();
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  // Avoid assuming a particular tab order; the focus must remain on an interactive control.
  const focus = await page.evaluate(() => {
    const el = document.activeElement;
    return { tag: el?.tagName.toLowerCase(), disabled: el?.hasAttribute("disabled") };
  });
  expect(["input", "button", "a", "select", "textarea"]).toContain(focus.tag);
  expect(focus.disabled).toBe(false);
});
