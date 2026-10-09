/**
 * TCG Deseur — derivative, READ-ONLY collection experience.
 * No rewards, trades, imports, inventory writes, RNG, requests or persistence.
 * The caller MUST use the currently authenticated server response.
 */
import {
  RARITY_ORDER, RARITY_LABELS, describeCommittedBooster, buildCollectionModel,
} from './collection-model.mjs';

function assertModel(model) {
  if (!model || !Array.isArray(model.cards) || !Array.isArray(model.byRarity) ||
      !Number.isSafeInteger(model.unique) || !Number.isSafeInteger(model.extraCopies)) {
    throw new Error('Modèle de collection invalide.');
  }
}

function percent(value, target) {
  return target ? Math.round(Math.min(value, target) / target * 100) : 0;
}

const GOALS = Object.freeze([1, 5, 10, 25, 49]);

/** Informative collection milestones. These DO NOT award prizes or grant cards. */
export function getCollectionGoals(model) {
  assertModel(model);
  const overall = GOALS.map(target => ({
    id: `unique-${target}`,
    group: 'collection',
    label: target === 1 ? 'Découvrir une première carte' : `Découvrir ${target} cartes différentes`,
    progress: Math.min(model.unique, target),
    target, remaining: Math.max(0, target - model.unique),
    completionPercent: percent(model.unique, target),
    achieved: model.unique >= target,
  }));
  const rarities = model.byRarity.flatMap(group => [
    {
      id: `first-${group.id}`,
      group: group.id,
      label: `Découvrir une carte ${group.label.toLowerCase()}`,
      progress: Math.min(1, group.unique),
      target: 1,
      remaining: Math.max(0, 1 - group.unique),
      completionPercent: percent(group.unique, 1),
      achieved: group.unique >= 1,
    },
    {
      id: `complete-${group.id}`,
      group: group.id,
      label: `Compléter les ${group.total} cartes de rareté ${group.label.toLowerCase()}`,
      progress: group.unique,
      target: group.total,
      remaining: group.missing,
      completionPercent: percent(group.unique, group.total),
      achieved: group.unique === group.total,
    },
  ]);
  return {
    goals: [...overall, ...rarities],
    total: overall.length + rarities.length,
    achieved: [...overall, ...rarities].filter(g => g.achieved).length,
    // Display priorities that are not yet reached, not reward levels.
    next: [...overall, ...rarities].filter(g => !g.achieved)
      .sort((a, b) => a.remaining - b.remaining || a.target - b.target).slice(0, 3),
  };
}

/** View of duplicates — quantity includes the keeper copy, extraCopies does not. */
export function getDuplicateSummary(model, { rarity = 'all', sort = 'extra-desc' } = {}) {
  assertModel(model);
  if (rarity !== 'all' && !RARITY_ORDER.includes(rarity)) throw new Error('Rareté inconnue.');
  if (!['extra-desc', 'rarity', 'catalogue', 'name'].includes(sort)) throw new Error('Tri inconnu.');
  const rows = model.cards
    .filter(card => card.quantity > 1 && (rarity === 'all' || card.rarity === rarity))
    .map(card => ({
      id: card.id, name: card.name, rarity: card.rarity,
      quantity: card.quantity, extraCopies: card.extraCopies,
      imageUrl: card.imageUrl,
      index: card.index,
    }));
  rows.sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name, 'fr') || a.index - b.index;
    if (sort === 'rarity') return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity) || b.extraCopies - a.extraCopies || a.index - b.index;
    if (sort === 'catalogue') return a.index - b.index;
    return b.extraCopies - a.extraCopies || a.index - b.index;
  });
  return {
    cards: rows,
    types: rows.length,
    extraCopies: rows.reduce((sum, card) => sum + card.extraCopies, 0),
    totalCopiesOfDuplicateTypes: rows.reduce((sum, card) => sum + card.quantity, 0),
    byRarity: RARITY_ORDER.map(id => ({
      id, label: RARITY_LABELS[id],
      types: rows.filter(c => c.rarity === id).length,
      extraCopies: rows.filter(c => c.rarity === id).reduce((sum, c) => sum + c.extraCopies, 0),
    })),
  };
}

/**
 * Accepts an already saved history from the authenticated server. The shape is
 * an adapter contract, not a claim that Floot's endpoint already sends this.
 *
 * Entries are { id, openedAt: ISO timestamp with timezone, cardIds: [5 known IDs] }.
 * Historical "new" status cannot be reconstructed reliably from truncated logs.
 */
export function normalizeAcquisitionHistory(catalogue, entries, { limit = 20 } = {}) {
  if (!Array.isArray(catalogue) || !Array.isArray(entries)) {
    throw new Error("Historique ou catalogue indisponible.");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new Error('Limite invalide.');
  const byId = new Map(catalogue.map(card => [card.id, card]));
  // Verify completeness AND exact rarity distribution before presenting history.\n  buildCollectionModel(catalogue, []);
  const seen = new Set();
  const parsed = entries.map((entry, index) => {
    if (!entry || typeof entry !== 'object' ||
        typeof entry.id !== 'string' || !/^[\w:-]{1,128}$/.test(entry.id) ||
        seen.has(entry.id) ||
        typeof entry.openedAt !== 'string' ||
        !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(entry.openedAt) ||
        !Number.isFinite(Date.parse(entry.openedAt)) ||
        !Array.isArray(entry.cardIds) || entry.cardIds.length !== 5) {
      throw new Error("Entrée d'historique invalide.");
    }
    seen.add(entry.id);
    const cards = entry.cardIds.map(id => {
      const card = byId.get(id);
      if (!card || !RARITY_ORDER.includes(card.rarity)) {
        throw new Error("L'historique référence une carte inconnue.");
      }
      return { id: card.id, name: card.name || card.id, rarity: card.rarity };
    });
    if (cards[4].rarity === 'commune') throw new Error("Historique : cinquième carte invalide.");
    return {
      id: entry.id,
      index,
      openedAt: new Date(entry.openedAt).toISOString(),
      cards,
      rarest: [...cards].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))[0].rarity,
      rarityCounts: Object.fromEntries(RARITY_ORDER.map(id => [id, cards.filter(c => c.rarity === id).length])),
      // Intentionally unknown; never invent an earlier inventory snapshot.
      newDiscoveries: null,
      duplicateCopies: null,
    };
  });
  return parsed.sort((a, b) => Date.parse(b.openedAt) - Date.parse(a.openedAt) || a.index - b.index).slice(0, limit);
}

/** Breakdown after a pack has ALREADY been issued by the server. */
export function getCommittedBoosterRecap(catalogue, beforeInventory, committedDrawIds) {
  const cards = describeCommittedBooster(catalogue, beforeInventory, committedDrawIds);
  const firstDiscoveries = cards.filter(card => card.newUnique).length;
  return {
    cards,
    count: cards.length,
    firstDiscoveries,
    duplicateCopies: cards.length - firstDiscoveries,
    byRarity: RARITY_ORDER.map(id => ({
      id, label: RARITY_LABELS[id],
      count: cards.filter(card => card.rarity === id).length,
      newDiscoveries: cards.filter(card => card.rarity === id && card.newUnique).length,
    })),
    highestRarity: [...cards].sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity))[0].rarity,
  };
}

/** Informational countdown only. The server always decides real availability. */
export function getBoosterAvailabilityHint(nextAvailableAt, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error('Heure courante invalide.');
  if (nextAvailableAt == null) return { known: false, remainingMs: null, elapsed: null };
  const deadline = typeof nextAvailableAt === 'string' ? Date.parse(nextAvailableAt) : NaN;
  if (!Number.isFinite(deadline)) throw new Error('Échéance booster invalide.');
  const remainingMs = Math.max(0, deadline - now);
  return { known: true, remainingMs, elapsed: remainingMs === 0 };
}
