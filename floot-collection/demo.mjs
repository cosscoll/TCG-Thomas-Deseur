import { CARDS } from '../data/cards.js';
import { getCollectionForecast } from './collection-forecast.mjs';
import { exportCollectionCsv } from './collection-export.mjs';
import { buildCollectionModel, filterCollectionCards, RARITY_LABELS, RARITY_ORDER, getDisplayedBoosterOdds } from './collection-model.mjs';
import {
  getDuplicateSummary, getCollectionGoals, normalizeAcquisitionHistory,
  getCommittedBoosterRecap,
} from './collection-insights.mjs';

// Fictional non-persistent holdings only; no account, API access or booster.
const samples = Object.freeze({
  sample: [
    { cardId: 'matelas', quantity: 4 },
    { cardId: 'fontaine', quantity: 2 },
    { cardId: 'etalon', quantity: 1 },
    { cardId: 'mouette', quantity: 1 },
    { cardId: 'chemise', quantity: 1 },
  ],
  empty: [],
  complete: CARDS.map(card => ({ cardId: card.id, quantity: 1 })),
});

// These example pack records are not derived from, or applied to, the sample holdings.
const sampleHistory = [
  { id: 'exemple-pack-1', openedAt: '2026-10-08T14:30:00Z',
    cardIds: ['matelas', 'matelas', 'matelas', 'matelas', 'fontaine'] },
  { id: 'exemple-pack-2', openedAt: '2026-10-09T09:15:00Z',
    cardIds: ['matelas', 'etalon', 'mouette', 'matelas', 'chemise'] },
];

const byId = id => document.getElementById(id);
const state = { scenario: 'sample', detailCards: [], detailIndex: 0, revealCount: 0, forecastAssumptions: null }; 
const revealDraw = getCommittedBoosterRecap(CARDS, [],
  ['matelas','matelas','matelas','matelas','fontaine']).cards;

function element(tag, className, content) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (content != null) node.textContent = String(content);
  return node;
}

function renderRarityStats(model) {
  const mount = byId('rarity-progress');
  mount.replaceChildren();
  for (const group of model.byRarity) {
    const tile = element('div', 'rarity-row');
    tile.dataset.rarity = group.id;
    const top = element('div', 'rarity-top');
    top.append(element('strong', '', group.label), element('span', '', `${group.unique} / ${group.total}`));
    const track = element('div', 'rarity-track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', `Progression de rareté ${group.label}`);
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(group.completionPercent));
    const fill = element('div', 'rarity-fill');
    fill.style.width = `${group.completionPercent}%`;
    track.append(fill);
    const jump = element('button', 'rarity-open', 'Voir les cartes');
    jump.type = 'button';
    jump.setAttribute('aria-label', `Voir les cartes de rareté ${group.label}`);
    jump.addEventListener('click', () => {
      byId('rarity').value = group.id;
      byId('ownership').value = 'all';
      byId('search').value = '';
      activateView('collection');
      render();
      byId('binder-title').scrollIntoView({ block: 'start' });
    });
    tile.append(top, track, jump);
    mount.append(tile);
  }
}

function createCard(card) {
  const article = element('article', 'collection-card');
  article.dataset.rarity = card.rarity;
  if (!card.owned) article.classList.add('not-owned');

  const art = element('div', 'art-placeholder');
  art.setAttribute('aria-label', 'Illustration en préparation');
  art.append(
    element('span', 'art-number', `#${String(card.index + 1).padStart(2, '0')}`),
    element('span', 'art-text', 'Visuel en préparation'),
  );

  const body = element('div', 'card-body');
  const rarity = element('p', 'rarity-name', RARITY_LABELS[card.rarity]);
  const title = element('h3', '', card.name);
  const meta = element('div', 'card-meta');
  const status = element('span', card.owned ? 'owned-status' : 'missing-status',
    card.owned ? `Possédée ×${card.quantity}` : 'Manquante');
  meta.append(status);
  if (card.hasDuplicates) {
    meta.append(element('span', 'extra-status',
      `+${card.extraCopies} exemplaire${card.extraCopies > 1 ? 's' : ''} en double`));
  }
  const showDetails = element('button', 'card-open', 'Voir la fiche');
  showDetails.type = 'button';
  showDetails.setAttribute('aria-label', `Voir la fiche de ${card.name}`);
  showDetails.addEventListener('click', () => openCardDetail(card.id, 'collection'));
  body.append(rarity, title, meta, showDetails);
  article.append(art, body);
  return article;
}

function renderDuplicateDetails(model) {
  const summary = getDuplicateSummary(model, {
    rarity: byId('duplicate-rarity').value,
    sort: byId('duplicate-sort').value,
  });
  byId('duplicates-summary').textContent =
    `${summary.types} type${summary.types > 1 ? 's' : ''} · ${summary.extraCopies} copie${summary.extraCopies > 1 ? 's' : ''}`;
  const mount = byId('duplicate-list');
  mount.replaceChildren(...summary.cards.map(card => {
    const article = element('article', 'insight-card');
    article.dataset.rarity = card.rarity;
    article.append(
      element('span', 'rarity-name', RARITY_LABELS[card.rarity]),
      element('h3', '', card.name),
      element('strong', 'number-emphasis', `×${card.quantity}`),
      element('p', 'subnote', `1 carte de collection + ${card.extraCopies} copie${card.extraCopies > 1 ? 's' : ''} supplémentaire${card.extraCopies > 1 ? 's' : ''}`),
    );
    const details = element('button', 'card-open', 'Voir la fiche');
    details.type = 'button';
    details.addEventListener('click', () => openCardDetail(card.id, 'duplicates'));
    article.append(details);
    return article;
  }));
  const byRarity = byId('duplicate-rarity-summary');
  byRarity.replaceChildren(...summary.byRarity.map(group => {
    const tile = element('div', 'mini-stat');
    tile.dataset.rarity = group.id;
    tile.append(
      element('strong', '', group.label),
      element('span', '', `${group.types} type${group.types > 1 ? 's' : ''} · +${group.extraCopies} copie${group.extraCopies > 1 ? 's' : ''}`),
    );
    return tile;
  }));
  byId('duplicate-empty').hidden = summary.types !== 0;
}

function renderGoals(model) {
  const summary = getCollectionGoals(model);
  byId('goals-summary').textContent = `${summary.achieved} / ${summary.total} atteints`;
  const rank = getCollectionForecast(CARDS, samples[state.scenario]).rank;
  byId('rank-level').textContent = `${rank.level} / ${rank.maxLevel}`;
  byId('rank-title').textContent = rank.title;
  byId('rank-remaining').textContent = rank.complete
    ? 'Collection terminée'
    : `Encore ${rank.remaining} carte${rank.remaining > 1 ? 's' : ''} pour ${rank.nextTitle}`;
  byId('rank-fill').style.width = `${rank.progressPercent}%`;
  byId('rank-track').setAttribute('aria-valuenow', String(rank.progressPercent));
  const next = byId('next-goals');
  next.replaceChildren(...(summary.next.length ? summary.next : [{
    id:'all-complete', label:'Tous les jalons de collection sont atteints', remaining:0,
  }]).map(goal => {
    const tile = element('div', 'next-goal');
    tile.append(
      element('strong', '', goal.label),
      element('span', '', goal.remaining
        ? `Encore ${goal.remaining} carte${goal.remaining > 1 ? 's' : ''}`
        : 'Collection complétée'),
    );
    return tile;
  }));
  const mount = byId('goals-list');
  mount.replaceChildren(...summary.goals.map(goal => {
    const row = element('article', `goal-card${goal.achieved ? ' goal-achieved' : ''}`);
    const title = element('h3', '', goal.label);
    const progressText = element('span', 'goal-count', `${goal.progress} / ${goal.target}`);
    const progress = element('progress', '', '');
    progress.max = goal.target;
    progress.value = goal.progress;
    progress.setAttribute('aria-label', goal.label);
    row.append(
      title, progressText, progress,
      element('p', 'subnote', goal.achieved ? 'Objectif atteint' :
        `Encore ${goal.remaining} carte${goal.remaining > 1 ? 's' : ''} à découvrir`),
    );
    return row;
  }));
}

function renderHistory() {
  const entries = normalizeAcquisitionHistory(CARDS, sampleHistory);
  byId('history-summary').textContent = `${entries.length} exemples`;
  const mount = byId('history-list');
  mount.replaceChildren(...entries.map(event => {
    const item = element('article', 'history-item');
    const title = element('div', 'history-heading');
    const date = new Date(event.openedAt).toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
    });
    title.append(
      element('strong', '', `Booster fictif · ${date}`),
      element('span', 'rarity-name', `Meilleure rareté : ${RARITY_LABELS[event.rarest]}`),
    );
    const items = element('ol', 'history-cards');
    for (const card of event.cards) {
      const row = element('li', '', card.name);
      row.append(element('span', 'rarity-name', RARITY_LABELS[card.rarity]));
      items.append(row);
    }
    item.append(title, items,
      element('p', 'subnote', 'Statut nouvelle carte / doublon historique non déterminable sans inventaire daté.'),
    );
    return item;
  }));
}

function renderBoosterRecap() {
  // This is a hypothetical ALREADY COMMITTED pack, for UI preview only.
  const result = getCommittedBoosterRecap(CARDS, [],
    ['matelas', 'matelas', 'matelas', 'matelas', 'fontaine']);
  byId('recap-new').textContent = String(result.firstDiscoveries);
  byId('recap-extra').textContent = String(result.duplicateCopies);
  byId('recap-best').textContent = RARITY_LABELS[result.highestRarity];
  const list = byId('recap-list');
  list.replaceChildren(...result.cards.map(card => {
    const item = element('li', 'recap-card');
    item.dataset.rarity = card.rarity;
    item.append(
      element('strong', '', `Carte ${card.position} · ${RARITY_LABELS[card.rarity]}`),
      element('span', '', CARDS.find(c => c.id === card.id)?.name ?? card.id),
      element('span', card.newUnique ? 'owned-status' : 'extra-status',
        card.newUnique ? 'Nouvelle découverte' : `Doublon · ×${card.quantityAfter}`),
    );
    return item;
  }));
  const odds = getDisplayedBoosterOdds();
  const body = byId('odds-body');
  body.replaceChildren(...RARITY_ORDER.map(rarity => {
    const row = element('tr', '');
    for (const value of [
      RARITY_LABELS[rarity],
      `${odds.normalSlots[rarity]} %`,
      `${odds.fifthSlot[rarity].toLocaleString('fr-FR', { maximumFractionDigits: 2 })} %`,
    ]) row.append(element('td', '', value));
    return row;
  }));
}

function displayProbability(chance) {
  return new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 }).format(chance);
}

function renderForecast() {
  const baseModel = buildCollectionModel(CARDS, samples[state.scenario]);
  const counts = state.forecastAssumptions ?? Object.fromEntries(
    baseModel.byRarity.map(group => [group.id, group.unique]));
  // A hypothetical inventory with ONE of the first N cards of each rarity.
  // Card identities do not affect these rarity-uniform analytical probabilities.
  const hypothetical = CARDS.filter(card => {
    const rarityCards = CARDS.filter(item => item.rarity === card.rarity);
    return rarityCards.findIndex(item => item.id === card.id) < counts[card.rarity];
  }).map(card => ({cardId: card.id, quantity: 1}));
  const forecast = getCollectionForecast(CARDS, hypothetical);
  const sliders = byId('forecast-sliders');
  if (sliders.children.length === 0) {
    for (const group of baseModel.byRarity) {
      const label = element('label', 'forecast-control');
      label.dataset.rarity = group.id;
      label.append(
        element('strong', '', group.label),
        element('span', 'forecast-control-count', ''),
      );
      const control = element('input', '');
      control.type = 'range';
      control.min = '0';
      control.max = String(group.total);
      control.step = '1';
      control.dataset.rarity = group.id;
      control.setAttribute('aria-label', 'Cartes possédées — ' + group.label);
      control.addEventListener('input', () => {
        const settings = Object.fromEntries(
          [...sliders.querySelectorAll('input')].map(input =>
            [input.dataset.rarity, Number(input.value)]));
        state.forecastAssumptions = settings;
        renderForecast();
      });
      label.append(control);
      sliders.append(label);
    }
  }
  for (const control of sliders.querySelectorAll('input')) {
    control.value = String(counts[control.dataset.rarity]);
    control.parentElement.querySelector('.forecast-control-count').textContent =
      `${counts[control.dataset.rarity]} / ${control.max} cartes obtenues`;
  }
  byId('forecast-new').textContent = displayProbability(forecast.chanceAtLeastOneNew);
  byId('forecast-unique').textContent = forecast.expectedNewUnique.toLocaleString('fr-FR', {
    maximumFractionDigits: 2, minimumFractionDigits: 2,
  });
  byId('forecast-premium').textContent =
    displayProbability(forecast.chanceAtLeastOneLegendaryOrSecret);
  byId('forecast-normal').textContent = displayProbability(forecast.chanceNewPerRegularSlot);
  byId('forecast-guaranteed').textContent = displayProbability(forecast.chanceNewFifthSlot);
  byId('forecast-status').textContent = `${forecast.missing} / 49 manquantes`;
  byId('forecast-rows').replaceChildren(...forecast.byRarity.map(group => {
    const chance = 1 - (1 - group.chanceNewRegular) ** 4 * (1 - group.chanceNewGuaranteed);
    const row = element('article', 'forecast-row');
    row.dataset.rarity = group.id;
    const head = element('div', 'forecast-row-heading');
    head.append(
      element('strong', '', group.label),
      element('span', '', `${group.missing} / ${group.total} manquantes`),
      element('strong', 'forecast-number', displayProbability(chance)),
    );
    const track = element('div', 'forecast-track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', `Chance de découvrir une ${group.label.toLowerCase()}`);
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', '100');
    track.setAttribute('aria-valuenow', String(Math.round(chance * 100)));
    const fill = element('span', 'forecast-fill');
    fill.style.width = `${chance * 100}%`;
    track.append(fill);
    row.append(head, track);
    return row;
  }));
}

function renderRevealFrame() {
  const count = state.revealCount;
  const cardEl = byId('reveal-card');
  cardEl.dataset.flipped = 'false';
  byId('reveal-position').textContent = `${count} / 5`;
  byId('reveal-progress').setAttribute('aria-valuenow', String(count));
  byId('reveal-progress-fill').style.width = `${count * 20}%`;
  byId('reveal-next').disabled = count === revealDraw.length;
  byId('reveal-next').textContent = count === revealDraw.length
    ? 'Les cinq cartes sont révélées'
    : count === 0 ? 'Révéler la première carte' : 'Révéler la carte suivante';
  byId('reveal-finished').hidden = count !== revealDraw.length;
  byId('reveal-history').replaceChildren(...revealDraw.slice(0, count).map(card => {
    const item = element('li', '', `#${card.position} · ${RARITY_LABELS[card.rarity]} · ${CARDS.find(c => c.id === card.id)?.name ?? card.id}`);
    item.dataset.rarity = card.rarity;
    return item;
  }));
  const face = cardEl.querySelector('.reveal-front');
  face.setAttribute('aria-hidden', String(count === 0));
  if (count === 0) {
    byId('reveal-rarity').textContent = '—';
    byId('reveal-name').textContent = '—';
    byId('reveal-status').textContent = '—';
    return;
  }
  const card = revealDraw[count - 1];
  cardEl.dataset.rarity = card.rarity;
  byId('reveal-rarity').textContent = RARITY_LABELS[card.rarity];
  byId('reveal-name').textContent = CARDS.find(c => c.id === card.id)?.name ?? card.id;
  byId('reveal-status').textContent =
    card.newUnique ? 'Nouvelle découverte' : `Doublon · ×${card.quantityAfter}`;
  // Re-start the flip animation for each *already-committed* sample card.
  // Reduced-motion CSS removes the transition for eligible users.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    cardEl.dataset.flipped = 'true';
  }));
}

function getVisibleDetailCards(source) {
  const model = buildCollectionModel(CARDS, samples[state.scenario]);
  if (source === 'duplicates') return getDuplicateSummary(model, {
    rarity: byId('duplicate-rarity').value,
    sort: byId('duplicate-sort').value,
  }).cards;
  return filterCollectionCards(model, {
    ownership: byId('ownership').value,
    rarity: byId('rarity').value,
    search: byId('search').value,
    sort: byId('sort').value,
  });
}

function paintCardDetail() {
  const card = state.detailCards[state.detailIndex];
  if (!card) return;
  const rarityName = RARITY_LABELS[card.rarity];
  byId('card-detail').dataset.rarity = card.rarity;
  byId('detail-rarity').textContent = rarityName;
  byId('detail-title').textContent = card.name;
  byId('detail-number').textContent = `#${String(card.index + 1).padStart(2, '0')}`;
  byId('detail-status').textContent = card.quantity > 0 ? 'Possédée' : 'Manquante';
  byId('detail-quantity').textContent = String(card.quantity);
  byId('detail-extras').textContent = String(card.extraCopies);
  byId('detail-position').textContent = `${state.detailIndex + 1} / ${state.detailCards.length}`;
  byId('detail-previous').disabled = state.detailIndex === 0;
  byId('detail-next').disabled = state.detailIndex === state.detailCards.length - 1;
}

function openCardDetail(cardId, source = 'collection') {
  state.detailCards = getVisibleDetailCards(source);
  state.detailIndex = state.detailCards.findIndex(card => card.id === cardId);
  if (state.detailIndex < 0) return;
  paintCardDetail();
  byId('card-detail').showModal();
}

function moveCardDetail(offset) {
  const next = state.detailIndex + offset;
  if (next < 0 || next >= state.detailCards.length) return;
  state.detailIndex = next;
  paintCardDetail();
  // A disabled button loses focus in Chromium. When reaching either end,
  // transfer focus to the still-usable navigation button, so arrow keys
  // continue to bubble to the dialog on desktop and mobile keyboards.
  if (offset > 0 && byId('detail-next').disabled) {
    byId('detail-previous').focus();
  } else if (offset < 0 && byId('detail-previous').disabled) {
    byId('detail-next').focus();
  }
}

function render() {
  // An outdated view is never shown after the demonstration inventory changes.
  if (byId('card-detail').open) byId('card-detail').close();
  const model = buildCollectionModel(CARDS, samples[state.scenario]);
  byId('unique').textContent = `${model.unique} / ${model.total}`;
  byId('copies').textContent = String(model.copies);
  byId('extras').textContent = String(model.extraCopies);
  byId('missing').textContent = String(model.missing);
  byId('completion').textContent = `${model.completionPercent} %`;
  byId('progress-fill').style.width = `${model.completionPercent}%`;
  byId('overall-progress').setAttribute('aria-valuenow', String(model.completionPercent));
  renderRarityStats(model);
  renderDuplicateDetails(model);
  renderGoals(model);
  renderHistory();
  renderBoosterRecap();
  renderForecast();

  const shown = filterCollectionCards(model, {
    ownership: byId('ownership').value,
    rarity: byId('rarity').value,
    search: byId('search').value,
    sort: byId('sort').value,
  });
  const mount = byId('cards');
  mount.replaceChildren(...shown.map(createCard));
  byId('shown').textContent = `${shown.length} carte${shown.length > 1 ? 's' : ''} affichée${shown.length > 1 ? 's' : ''}`;
  byId('no-results').hidden = shown.length !== 0;
}

for (const id of ['search','ownership','rarity','sort']) {
  byId(id).addEventListener(id === 'search' ? 'input' : 'change', render);
}

for (const button of document.querySelectorAll('[data-shortcut]')) {
  button.addEventListener('click', () => {
    const kind = button.dataset.shortcut;
    if (kind === 'duplicates') {
      activateView('duplicates');
      byId('duplicate-rarity').value = 'all';
      render();
      byId('view-duplicates').scrollIntoView({ block: 'start' });
      return;
    }
    byId('ownership').value = kind;
    byId('rarity').value = 'all';
    byId('search').value = '';
    activateView('collection');
    render();
    byId('binder-title').scrollIntoView({ block: 'start' });
  });
}

for (const button of document.querySelectorAll('[data-scenario]')) {
  button.addEventListener('click', () => {
    state.scenario = button.dataset.scenario;
    for (const other of document.querySelectorAll('[data-scenario]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    state.revealCount = 0;
    state.forecastAssumptions = null;
    renderRevealFrame();
    render();
  });
}

for (const id of ['duplicate-rarity', 'duplicate-sort']) {
  byId(id).addEventListener('change', render);
}

function activateView(view) {
  for (const control of document.querySelectorAll('[data-view]')) {
    control.setAttribute('aria-pressed', String(control.dataset.view === view));
  }
  for (const panel of document.querySelectorAll('[data-view-panel]')) {
    panel.hidden = panel.dataset.viewPanel !== view;
  }
}

for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => activateView(button.dataset.view));
}

byId('export-demo-csv').addEventListener('click', () => {
  // Fictitious quantities only. No network request, real inventory, or mutation.
  const model = buildCollectionModel(CARDS, samples[state.scenario]);
  const csv = exportCollectionCsv(model);
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'tcg-deseur-collection-exemple.csv';
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

byId('forecast-restore').addEventListener('click', () => {
  state.forecastAssumptions = null;
  renderForecast();
});

byId('reveal-next').addEventListener('click', () => {
  if (state.revealCount >= revealDraw.length) return;
  state.revealCount++;
  renderRevealFrame();
});
byId('reveal-reset').addEventListener('click', () => {
  state.revealCount = 0;
  renderRevealFrame();
});

byId('detail-close').addEventListener('click', () => byId('card-detail').close());
byId('detail-previous').addEventListener('click', () => moveCardDetail(-1));
byId('detail-next').addEventListener('click', () => moveCardDetail(1));
byId('card-detail').addEventListener('click', event => {
  if (event.target === byId('card-detail')) byId('card-detail').close();
});
byId('card-detail').addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveCardDetail(-1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveCardDetail(1); }
});

byId('clear-filters').addEventListener('click', () => {
  byId('search').value = '';
  byId('ownership').value = 'all';
  byId('rarity').value = 'all';
  byId('sort').value = 'catalogue';
  render();
  byId('search').focus();
});
renderRevealFrame();
render();
