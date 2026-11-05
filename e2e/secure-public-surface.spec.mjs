import { test, expect } from '@playwright/test';

// Security regression tests of the PUBLIC site without authentication.
// The local server is only for rendered UI checks: exclusions/404s are tested
// separately on the deployed GitHub Pages site by check_published_approved.py.

test('public landing page links to Floot but exposes no source or photo archive', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TCG Thomas Deseur/);
  await expect(page.getByRole('heading', { name: /La chasse aux cartes/ })).toBeVisible();
  await expect(page.locator('a[href="https://tcg-thomas-deseur.floot.app/"]')).not.toHaveCount(0);
  await expect(page.locator('a[href*="/tri-177/"]')).toHaveCount(0);
  await expect(page.locator('a[href*="/floot-app/"]')).toHaveCount(0);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'none'");
  expect(csp).toContain("connect-src 'none'");
});

test('gallery contains precisely 67 public bases and 38 alternatives, without scripts', async ({ page }) => {
  await page.goto('/collection-validee/');
  await expect(page.getByRole('heading', { name: /105 illustrations/ })).toBeVisible();
  await expect(page.locator('article.tile')).toHaveCount(105);
  await expect(page.locator('article.tile .chip', { hasText: 'Carte de base' })).toHaveCount(67);
  await expect(page.locator('article.tile .chip', { hasText: 'Variante' })).toHaveCount(38);
  await expect(page.locator('article.tile img')).toHaveCount(105);
  await expect(page.locator('script')).toHaveCount(0);
  await expect(page.locator('a[href*="/tri-177/"]')).toHaveCount(0);
  await expect(page.locator('a[href*="data/"]')).toHaveCount(0);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(csp).toContain("script-src 'none'");
});

test('published artwork samples decode at the expected 768×1024 format', async ({ page }) => {
  await page.goto('/collection-validee/');
  for (const index of [0, 50, 104]) {
    const art = page.locator('article.tile img').nth(index);
    await art.scrollIntoViewIfNeeded();
    await expect.poll(() => art.evaluate(img => img.complete && img.naturalWidth === 768 && img.naturalHeight === 1024), {
      message: 'Approved illustration ' + index + ' failed to decode',
    }).toBe(true);
  }
});

test('legal page remains linked and loads without interactive dependencies', async ({ page }) => {
  await page.goto('/legal/');
  await expect(page).toHaveTitle(/TCG Deseur/);
  await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
  await expect(page.locator('script')).toHaveCount(0);
});

test('landing and gallery remain usable on narrow and tablet viewports', async ({ page }) => {
  for (const path of ['/', '/collection-validee/']) {
    await page.goto(path);
    for (const width of [320, 393, 820]) {
      await page.setViewportSize({ width, height: 830 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, path + ' horizontal overflow at ' + width + 'px').toBeLessThanOrEqual(2);
    }
  }
});
