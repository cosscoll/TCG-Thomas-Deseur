import { test, expect } from "@playwright/test";

// Tests strictly anonymous public behaviour of the LIVE Floot project.
// No accounts, passwords, sessions, database fixtures, or successful booster claims.
// A rejected POST /booster is not supposed to consume any allowance.

const PRIVATE_KEYS = new Set([
  "email", "password", "passwordhash", "token", "accesstoken",
  "refreshtoken", "cookie", "cookies", "userid", "displayname",
  "cardid", "inventory", "owned", "drawn", "history", "profile",
]);

function privateFields(value, path = "") {
  if (Array.isArray(value)) return value.flatMap((v, n) => privateFields(v, `${path}[${n}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => {
      const at = path ? `${path}.${key}` : key;
      const norm = key.toLocaleLowerCase("en").replace(/[^a-z0-9]/g, "");
      return PRIVATE_KEYS.has(norm) ? [at] : privateFields(child, at);
    });
  }
  return [];
}

const cases = [
  { name: "classeur personnel", method: "GET", route: "/_api/collection" },
  { name: "ouverture du booster", method: "POST", route: "/_api/booster" },
  { name: "modification du profil", method: "POST", route: "/_api/profile" },
  { name: "validation de session", method: "GET", route: "/_api/auth/session" },
];

for (const api of cases) {
  test(`accès anonyme rejeté : ${api.name}`, async ({ request }) => {
    const response = api.method === "GET"
      ? await request.get(api.route, { failOnStatusCode: false })
      : await request.post(api.route, {
        data: {}, failOnStatusCode: false,
        headers: { "Content-Type": "application/json" },
      });
    expect(response.status(), `${api.route} doit être privé`).toBe(401);
    const contentType = response.headers()["content-type"] ?? "";
    expect(contentType).toContain("application/json");
    const body = await response.json();
    expect(privateFields(body)).toEqual([]);
    expect(JSON.stringify(body)).not.toMatch(/@\w+\.|bearer\s|eyJ[A-Za-z0-9_-]{20,}/i);
  });
}

test("sans session, le classeur d'un joueur ne s'affiche pas", async ({ page }) => {
  const response = await page.goto("/", { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.getByText("Ton classeur sera disponible dès que tu auras créé un compte.")).toBeVisible();
  await expect(page.getByRole("button", { name: /Ouvrir mon booster/i })).toHaveCount(0);
});

test("aucun formulaire de connexion n'est soumis lors de la vérification clavier", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const email = page.locator('input[type="email"]').first();
  const password = page.locator('input[type="password"]').first();
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await expect(email).toHaveValue("");
  await expect(password).toHaveValue("");
});
