import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const tags = ['wcag2a','wcag2aa','wcag21a','wcag21aa'];

async function auditView(page, location) {
  const result = await new AxeBuilder({ page }).withTags(tags).analyze();
  return result.violations.map(v => ({
    location,
    rule: v.id,
    impact: v.impact,
    elements: v.nodes.slice(0, 3).map(n => n.target.join(' ')),
    description: v.help,
  }));
}

test('WCAG des cinq espaces de la collection fictive', async ({ page }) => {
  await page.goto('/floot-collection/demo.html');
  await expect(page.locator('#cards .collection-card')).toHaveCount(49);
  const findings = [...await auditView(page, 'classeur principal')];
  for (const [button, label] of [
    ['Mes doublons','doublons'],
    ['Progression','objectifs'],
    ['Historique','historique'],
    ['Bilan booster','bilan booster'],
  ]) {
    await page.getByRole('button', {name:button,exact:true}).click();
    findings.push(...await auditView(page, label));
  }
  expect(findings, 'Audit de toutes les vues de collection').toEqual([]);
});

test('WCAG de la fiche modale et d’une collection vide', async ({ page }) => {
  await page.goto('/floot-collection/demo.html');
  await page.getByRole('button', {name:'Voir la fiche de Matelas'}).click();
  await expect(page.locator('#card-detail')).toBeVisible();
  const findings = [...await auditView(page, 'fiche modale Matelas')];
  await page.keyboard.press('Escape');
  await page.getByRole('button', {name:'Collection vide'}).click();
  await expect(page.locator('#unique')).toHaveText('0 / 49');
  findings.push(...await auditView(page, 'classeur vide'));
  expect(findings, 'Audit de la fiche et du classeur vide').toEqual([]);
});
