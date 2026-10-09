import { CARDS } from '../data/cards.js';
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
const state = { scenario: 'sample' };

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
    const fill = element('div', 'rarity-fill');
    fill.style.width = `${group.completionPercent}%`;
    track.append(fill);
    tile.append(top, track);
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
  body.append(rarity, title, meta);
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
    return article;
  }));
  byId('duplicate-empty').hidden = summary.types !== 0;
}

function renderGoals(model) {
  const summary = getCollectionGoals(model);
  byId('goals-summary').textContent = `${summary.achieved} / ${summary.total} atteints`;
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

function render() {
  const model = buildCollectionModel(CARDS, samples[state.scenario]);
  byId('unique').textContent = `${model.unique} / ${model.total}`;
  byId('copies').textContent = String(model.copies);
  byId('extras').textContent = String(model.extraCopies);
  byId('missing').textContent = String(model.missing);
  byId('completion').textContent = `${model.completionPercent} %`;
  byId('progress-fill').style.width = `${model.completionPercent}%`;
  renderRarityStats(model);
  renderDuplicateDetails(model);
  renderGoals(model);
  renderHistory();
  renderBoosterRecap();

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

for (const button of document.querySelectorAll('[data-scenario]')) {
  button.addEventListener('click', () => {
    state.scenario = button.dataset.scenario;
    for (const other of document.querySelectorAll('[data-scenario]')) {
      other.setAttribute('aria-pressed', String(other === button));
    }
    render();
  });
}

for (const id of ['duplicate-rarity', 'duplicate-sort']) {
  byId(id).addEventListener('change', render);
}

for (const button of document.querySelectorAll('[data-view]')) {
  button.addEventListener('click', () => {
    for (const control of document.querySelectorAll('[data-view]')) {
      control.setAttribute('aria-pressed', String(control === button));
    }
    for (const panel of document.querySelectorAll('[data-view-panel]')) {
      panel.hidden = panel.dataset.viewPanel !== button.dataset.view;
    }
  });
}

byId('clear-filters').addEventListener('click', () => {
  byId('search').value = '';
  byId('ownership').value = 'all';
  byId('rarity').value = 'all';
  byId('sort').value = 'catalogue';
  render();
  byId('search').focus();
});
render();
