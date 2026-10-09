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


test('la progression par rareté donne directement accès aux cartes correspondantes', async ({page}) => {
  await page.locator('.rarity-row[data-rarity="secrete"] .rarity-open').click();
  await expect(page.locator('#view-collection')).toBeVisible();
  await expect(page.locator('#rarity')).toHaveValue('secrete');
  await expect(page.locator('#cards .collection-card')).toHaveCount(3);
  await expect(page.locator('#cards .collection-card').first()).toHaveAttribute('data-rarity', 'secrete');
});

test('le détail d’une carte manquante annonce zéro exemplaire et pas de faux visuel', async ({page}) => {
  await page.getByRole('button',{name:'Collection vide'}).click();
  await page.getByRole('button',{name:'Voir la fiche de Matelas'}).click();
  await expect(page.locator('#detail-status')).toHaveText('Manquante');
  await expect(page.locator('#detail-extras')).toHaveText('0');
  await expect(page.locator('#card-detail')).toContainText('Illustration en préparation');
});


test('les statistiques ouvrent directement les possédées', async ({page}) => {
  await page.getByRole('button',{name:'Voir mes cartes'}).click();
  await expect(page.locator('#ownership')).toHaveValue('owned');
  await expect(page.locator('#cards .collection-card')).toHaveCount(5);
});

test('les statistiques ouvrent directement les manquantes', async ({page}) => {
  await page.getByRole('button',{name:'Voir les manquantes'}).click();
  await expect(page.locator('#ownership')).toHaveValue('missing');
  await expect(page.locator('#cards .collection-card')).toHaveCount(44);
});

test('le raccourci doublons affiche le véritable onglet des doublons', async ({page}) => {
  await page.getByRole('button',{name:'Voir les doublons'}).click();
  await expect(page.locator('#view-duplicates')).toBeVisible();
  await expect(page.locator('#duplicate-list .insight-card')).toHaveCount(2);
});

test('les cinq vues restent utilisables sur 320, 360, 393, 412 et 820 px', async ({page}) => {
  const sections=[
    ['Mes doublons', 'duplicates'],
    ['Progression', 'goals'],
    ['Historique', 'history'],
    ['Bilan booster', 'recap'],
    ['Collection', 'collection'],
  ];
  for(const width of [320,360,393,412,820]) {
    await page.setViewportSize({width,height:780});
    for(const [name,id] of sections) {
      await page.getByRole('button',{name,exact:true}).click();
      await expect(page.locator('#view-'+id)).toBeVisible();
      const overflow=await page.evaluate(() => Math.max(
        document.documentElement.scrollWidth-document.documentElement.clientWidth,
        document.body.scrollWidth-document.body.clientWidth,
      ));
      expect(overflow, `Débordement horizontal en ${width}px sur ${name}`).toBeLessThanOrEqual(2);
    }
  }
});

test('les onglets indiquent le panneau actif et restent contrôlables au clavier', async ({page}) => {
  const nav=page.getByRole('navigation',{name:'Sections du classeur'});
  await expect(nav.getByRole('button',{pressed:true})).toHaveCount(1);
  await nav.getByRole('button',{name:'Mes doublons'}).focus();
  await page.keyboard.press('Enter');
  await expect(nav.getByRole('button',{pressed:true})).toHaveText('Mes doublons');
  await expect(page.locator('#view-duplicates')).toBeVisible();
  await nav.getByRole('button',{name:'Collection',exact:true}).focus();
  await page.keyboard.press('Space');
  await expect(nav.getByRole('button',{pressed:true})).toHaveText('Collection');
});
