import { test, expect } from '@playwright/test';

// Local static DEMONSTRATION — not the authenticated game on Floot.
// Existing Playwright config launches a local server from the GitHub archive.

test.beforeEach(async ({ page }) => {
  await page.goto('/floot-collection/demo.html');
  await expect(page).toHaveTitle(/TCG Deseur.*classeur/i);
});

test('tableau de collection : cinq cartes, neuf copies, quatre doubles', async ({ page }) => {
  await expect(page.locator('#unique')).toHaveText('5 / 49');
  await expect(page.locator('#copies')).toHaveText('9');
  await expect(page.locator('#extras')).toHaveText('4');
  await expect(page.locator('#missing')).toHaveText('44');
  await expect(page.locator('#completion')).toHaveText('10 %');
  await expect(page.locator('#cards .collection-card')).toHaveCount(49);
});

test('le filtre doublons affiche deux cartes et reste combinable avec la rareté', async ({ page }) => {
  await page.locator('#ownership').selectOption('duplicates');
  await expect(page.locator('#cards .collection-card')).toHaveCount(2);
  await page.locator('#rarity').selectOption('rare');
  await expect(page.locator('#cards .collection-card')).toHaveCount(1);
  await expect(page.locator('#cards .collection-card h3')).toHaveText('Fontaine');
});

test('la recherche tolère les majuscules et les accents', async ({ page }) => {
  await page.locator('#search').fill('MATElaS');
  await expect(page.locator('#cards .collection-card')).toHaveCount(1);
  await expect(page.locator('#cards .collection-card h3')).toHaveText('Matelas');
  await page.locator('#search').fill('inconnu');
  await expect(page.locator('#no-results')).toBeVisible();
  await page.locator('#clear-filters').click();
  await expect(page.locator('#cards .collection-card')).toHaveCount(49);
});

test('mes doublons : quantités par type et filtre Commune', async ({ page }) => {
  await page.getByRole('button', {name:'Mes doublons'}).click();
  await expect(page.locator('#view-duplicates')).toBeVisible();
  await expect(page.locator('#duplicates-summary')).toHaveText('2 types · 4 copies');
  await expect(page.locator('#duplicate-list .insight-card')).toHaveCount(2);
  await page.locator('#duplicate-rarity').selectOption('commune');
  await expect(page.locator('#duplicate-list .insight-card')).toHaveCount(1);
  await expect(page.locator('#duplicate-list')).toContainText('Matelas');
});

test('progression : jalons sans récompenses', async ({ page }) => {
  await page.getByRole('button', {name:'Progression'}).click();
  await expect(page.locator('#goals-summary')).toHaveText('7 / 15 atteints');
  await expect(page.locator('#goals-list .goal-card')).toHaveCount(15);
  await expect(page.locator('#goals-list')).toContainText('Objectif atteint');
});

test('historique : deux boosters exemples, aucune fausse attribution', async ({ page }) => {
  await page.getByRole('button', {name:'Historique'}).click();
  await expect(page.locator('#history-summary')).toHaveText('2 exemples');
  await expect(page.locator('#history-list .history-item')).toHaveCount(2);
  await expect(page.locator('#history-list .history-cards li')).toHaveCount(10);
  await expect(page.locator('#view-history')).toContainText('non déterminable');
});

test('bilan booster : deux découvertes et trois copies supplémentaires', async ({ page }) => {
  await page.getByRole('button', {name:'Bilan booster'}).click();
  await expect(page.locator('#recap-new')).toHaveText('2');
  await expect(page.locator('#recap-extra')).toHaveText('3');
  await expect(page.locator('#recap-best')).toHaveText('Rare');
  await expect(page.locator('#recap-list .recap-card')).toHaveCount(5);
  await expect(page.locator('#odds-body tr')).toHaveCount(5);
  await expect(page.locator('#view-recap')).toContainText("n'ouvre aucun booster");
});

test('scénarios vide et complet recalculent les statistiques et les objectifs', async ({ page }) => {
  await page.getByRole('button',{name:'Collection vide'}).click();
  await expect(page.locator('#unique')).toHaveText('0 / 49');
  await expect(page.locator('#extras')).toHaveText('0');
  await page.getByRole('button',{name:'Progression'}).click();
  await expect(page.locator('#goals-summary')).toHaveText('0 / 15 atteints');
  await page.getByRole('button',{name:'49 cartes obtenues'}).click();
  await expect(page.locator('#goals-summary')).toHaveText('15 / 15 atteints');
  await page.getByRole('button',{name:'Collection',exact:true}).click();
  await expect(page.locator('#completion')).toHaveText('100 %');
});

test('navigation sans erreur JavaScript et sans débordement sur écran étroit', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 393, height: 852});
  for(const section of ['Mes doublons','Progression','Historique','Bilan booster','Collection']) {
    await page.getByRole('button',{name:section,exact:true}).click();
    await expect(page.locator('#view-' + (section === 'Mes doublons' ? 'duplicates' : section === 'Progression' ? 'goals' : section === 'Historique' ? 'history' : section === 'Bilan booster' ? 'recap' : 'collection'))).toBeVisible();
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(2);
  }
  expect(errors).toEqual([]);
});


test('la fiche Matelas indique les 4 exemplaires et 3 copies en double', async ({page}) => {
  await page.getByRole('button',{name:'Voir la fiche de Matelas'}).click();
  const modal=page.locator('#card-detail');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#detail-title')).toHaveText('Matelas');
  await expect(modal.locator('#detail-status')).toHaveText('Possédée');
  await expect(modal.locator('#detail-quantity')).toHaveText('4');
  await expect(modal.locator('#detail-extras')).toHaveText('3');
  await page.keyboard.press('Escape');
  await expect(modal).not.toBeVisible();
});

test('la navigation de la fiche respecte les cartes filtrées', async ({page}) => {
  await page.locator('#ownership').selectOption('duplicates');
  await expect(page.locator('#cards .collection-card')).toHaveCount(2);
  await page.getByRole('button',{name:'Voir la fiche de Matelas'}).click();
  const modal=page.locator('#card-detail');
  await expect(modal.locator('#detail-position')).toHaveText('1 / 2');
  await modal.locator('#detail-next').click();
  await expect(modal.locator('#detail-title')).toHaveText('Fontaine');
  await expect(modal.locator('#detail-quantity')).toHaveText('2');
  await expect(modal.locator('#detail-next')).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(modal.locator('#detail-title')).toHaveText('Matelas');
});

test('la fiche des doublons est accessible depuis la vue Mes doublons', async ({page}) => {
  await page.getByRole('button',{name:'Mes doublons'}).click();
  await page.locator('#duplicate-list .card-open').first().click();
  const modal=page.locator('#card-detail');
  await expect(modal.locator('#detail-status')).toHaveText('Possédée');
  await expect(modal.locator('#detail-extras')).toHaveText('3');
  await modal.locator('#detail-close').click();
  await expect(modal).not.toBeVisible();
});

test('la fiche se met à jour après changement de scénario sans conserver une ancienne quantité', async ({page}) => {
  await page.getByRole('button',{name:'Voir la fiche de Matelas'}).click();
  await expect(page.locator('#detail-quantity')).toHaveText('4');
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Collection vide'}).click();
  await page.getByRole('button',{name:'Voir la fiche de Matelas'}).click();
  await expect(page.locator('#detail-status')).toHaveText('Manquante');
  await expect(page.locator('#detail-quantity')).toHaveText('0');
});
