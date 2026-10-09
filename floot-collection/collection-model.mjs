/**
 * TCG Deseur — modèle de lecture du classeur.
 *
 * No account access, storage, random draws or DB writes.
 * Catalogue and inventory MUST be loaded from the authenticated Floot server.
 * All calculations here are presentation-only and never grant or own cards.
 * Images are optional, because the card artwork is still being produced.
 */

export const RARITY_ORDER = Object.freeze([
  'commune', 'rare', 'epique', 'legendaire', 'secrete',
]);

export const RARITY_LABELS = Object.freeze({
  commune: 'Commune',
  rare: 'Rare',
  epique: 'Épique',
  legendaire: 'Légendaire',
  secrete: 'Secrète',
});

const NORMAL_WEIGHTS = Object.freeze({
  commune: 55, rare: 27, epique: 12, legendaire: 4, secrete: 2,
});
const GUARANTEED_WEIGHTS = Object.freeze({
  commune: 0, rare: 27, epique: 12, legendaire: 4, secrete: 2,
});

/** Show odds as published, but DO NOT use this function to draw cards. */
export function getDisplayedBoosterOdds() {
  const sum = Object.values(GUARANTEED_WEIGHTS).reduce((a, b) => a + b, 0);
  return {
    normalSlots: { ...NORMAL_WEIGHTS },
    fifthSlot: Object.fromEntries(
      RARITY_ORDER.map(rarity => [rarity, GUARANTEED_WEIGHTS[rarity] / sum * 100]),
    ),
  };
}

function ensureCatalogue(catalogue) {
  if (!Array.isArray(catalogue) || !catalogue.length) {
    throw new Error('Le catalogue est indisponible.');
  }
  const ids = new Set();
  return catalogue.map((card, index) => {
    if (!card || typeof card !== 'object' ||
        typeof card.id !== 'string' || !/^[a-z0-9_]+$/.test(card.id) ||
        !RARITY_ORDER.includes(card.rarity)) {
      throw new Error('Le catalogue contient une carte invalide.');
    }
    if (ids.has(card.id)) {
      throw new Error('Le catalogue contient un identifiant en double.');
    }
    ids.add(card.id);
    return {
      index,
      id: card.id,
      name: typeof card.name === 'string' && card.name.trim() ? card.name.trim() : card.id,
      rarity: card.rarity,
      // Do not invent illustrations: the actual URL is always optional.
      imageUrl: typeof card.imageUrl === 'string' && card.imageUrl.trim()
        ? card.imageUrl.trim() : null,
    };
  });
}

function readQuantities(inventory, catalogueById) {
  if (!Array.isArray(inventory)) throw new Error("L'inventaire est indisponible.");
  const quantities = new Map();
  for (const row of inventory) {
    if (!row || typeof row !== 'object' ||
        typeof row.cardId !== 'string' || !catalogueById.has(row.cardId) ||
        !Number.isSafeInteger(row.quantity) || row.quantity < 0) {
      throw new Error("L'inventaire contient une quantité ou carte invalide.");
    }
    if (quantities.has(row.cardId)) {
      // A duplicate DB row may indicate a broken unique constraint or a join.
      // Never silently double credit the count of a card.
      throw new Error("L'inventaire contient deux lignes pour la même carte.");
    }
    quantities.set(row.cardId, row.quantity);
  }
  return quantities;
}

function safeAdd(a, b) {
  const n = a + b;
  if (!Number.isSafeInteger(n)) {
    throw new Error("La quantité totale dépasse la limite d'entier fiable.");
  }
  return n;
}

function percent(a, b) {
  return b ? Math.round(a / b * 100) : 0;
}

/**
 * Count unique collected cards separately from extra copies.
 * The server's authenticated inventory is authoritative; this is a read model.
 */
export function buildCollectionModel(catalogue, inventory) {
  const catalogueCards = ensureCatalogue(catalogue);
  const catalogueById = new Map(catalogueCards.map(card => [card.id, card]));
  const quantities = readQuantities(inventory, catalogueById);

  const cards = catalogueCards.map(card => {
    const quantity = quantities.get(card.id) ?? 0;
    return {
      ...card,
      quantity,
      owned: quantity >= 1,
      missing: quantity === 0,
      hasDuplicates: quantity > 1,
      extraCopies: Math.max(0, quantity - 1),
    };
  });

  const byRarity = RARITY_ORDER.map(id => {
    const subset = cards.filter(card => card.rarity === id);
    const unique = subset.filter(card => card.owned).length;
    const copies = subset.reduce((sum, card) => safeAdd(sum, card.quantity), 0);
    return {
      id, label: RARITY_LABELS[id],
      total: subset.length,
      unique, missing: subset.length - unique,
      copies, extraCopies: copies - unique,
      duplicateTypes: subset.filter(card => card.hasDuplicates).length,
      completionPercent: percent(unique, subset.length),
    };
  });

  const total = cards.length;
  const unique = cards.filter(card => card.owned).length;
  const copies = cards.reduce((sum, card) => safeAdd(sum, card.quantity), 0);
  return {
    cards,
    total,
    unique,
    missing: total - unique,
    copies,
    extraCopies: copies - unique,
    duplicateTypes: cards.filter(card => card.hasDuplicates).length,
    completionPercent: percent(unique, total),
    complete: unique === total,
    byRarity,
  };
}

function searchable(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
}

/** Ownership filters are inclusive: a duplicate is also a possessed card. */
export function filterCollectionCards(model, {
  ownership = 'all',
  rarity = 'all',
  search = '',
  sort = 'catalogue',
} = {}) {
  if (!model || !Array.isArray(model.cards)) throw new Error('Modèle de collection invalide.');
  if (!['all', 'owned', 'missing', 'duplicates'].includes(ownership)) {
    throw new Error('Filtre de possession inconnu.');
  }
  if (rarity !== 'all' && !RARITY_ORDER.includes(rarity)) {
    throw new Error('Filtre de rareté inconnu.');
  }
  if (!['catalogue', 'rarity', 'name', 'copies-desc'].includes(sort)) {
    throw new Error('Tri de collection inconnu.');
  }
  const query = searchable(search);
  const results = model.cards.filter(card =>
    (rarity === 'all' || card.rarity === rarity) &&
    (ownership === 'all' ||
      (ownership === 'owned' && card.owned) ||
      (ownership === 'missing' && card.missing) ||
      (ownership === 'duplicates' && card.hasDuplicates)) &&
    (!query || searchable(card.name).includes(query) || searchable(card.id).includes(query))
  );
  const rarityIndex = value => RARITY_ORDER.indexOf(value);
  return [...results].sort((a, b) => {
    if (sort === 'rarity') {
      return rarityIndex(b.rarity) - rarityIndex(a.rarity) || a.index - b.index;
    }
    if (sort === 'name') {
      return a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }) || a.index - b.index;
    }
    if (sort === 'copies-desc') {
      return b.quantity - a.quantity || a.index - b.index;
    }
    return a.index - b.index;
  });
}

/**
 * Presentation-only "new" and "duplicate" badges after a SERVER-COMMITTED pack.
 * This does not create cards. The inventory returned by the server must be
 * refreshed afterwards, even if the same ID was obtained several times.
 */
export function describeCommittedBooster(catalogue, previousInventory, drawIds) {
  const cards = ensureCatalogue(catalogue);
  const byId = new Map(cards.map(card => [card.id, card]));
  if (!Array.isArray(drawIds) || drawIds.length !== 5) {
    throw new Error('Un booster validé doit contenir cinq cartes.');
  }
  const counts = readQuantities(previousInventory, byId);
  const result = drawIds.map((id, index) => {
    const card = byId.get(id);
    if (!card) throw new Error('Booster : carte inconnue.');
    const quantityBefore = counts.get(id) ?? 0;
    const quantityAfter = safeAdd(quantityBefore, 1);
    counts.set(id, quantityAfter);
    return {
      position: index + 1,
      id,
      rarity: card.rarity,
      newUnique: quantityBefore === 0,
      duplicate: quantityBefore >= 1,
      quantityBefore,
      quantityAfter,
    };
  });
  if (result[4].rarity === 'commune') {
    throw new Error('La cinquième carte doit être Rare ou supérieure.');
  }
  return result;
}
