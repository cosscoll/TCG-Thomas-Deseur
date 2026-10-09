import { CARDS } from '../data/cards.js';
import { buildCollectionModel, filterCollectionCards, RARITY_LABELS } from './collection-model.mjs';

// Local, non-persistent EXAMPLE holdings only. No account, API, localStorage or booster.
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

function render() {
  const model = buildCollectionModel(CARDS, samples[state.scenario]);
  byId('unique').textContent = `${model.unique} / ${model.total}`;
  byId('copies').textContent = String(model.copies);
  byId('extras').textContent = String(model.extraCopies);
  byId('missing').textContent = String(model.missing);
  byId('completion').textContent = `${model.completionPercent} %`;
  byId('progress-fill').style.width = `${model.completionPercent}%`;
  renderRarityStats(model);

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

byId('clear-filters').addEventListener('click', () => {
  byId('search').value = '';
  byId('ownership').value = 'all';
  byId('rarity').value = 'all';
  byId('sort').value = 'catalogue';
  render();
  byId('search').focus();
});
render();
