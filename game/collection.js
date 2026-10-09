import { simulateBooster } from "./booster.js";

export const COLLECTION_VERSION = 1;
export const LOCAL_COLLECTION_KEY = "budget-illimite:demo-collection:v1";
export const COLLECTION_HISTORY_MAX = 20;

export function emptyCollection() {
  return { version: COLLECTION_VERSION, opened: 0, copies: {}, history: [] };
}

/** Entirely untrusted browser data: ONLY a demo, never a source of server rewards. */
export function normalizeCollection(raw, cards) {
  const fallback = emptyCollection();
  if (!raw || typeof raw !== "object" || Array.isArray(raw) || raw.version !== COLLECTION_VERSION) return fallback;
  const allowed = new Set(cards.map(card => card.id));
  if (!Number.isSafeInteger(raw.opened) || raw.opened < 0 || raw.opened > 1000000) return fallback;
  if (!raw.copies || typeof raw.copies !== "object" || Array.isArray(raw.copies)) return fallback;
  const copies = Object.create(null);
  let sum = 0;
  for (const [id, quantity] of Object.entries(raw.copies)) {
    if (!allowed.has(id) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 5000000) return fallback;
    copies[id] = quantity;
    sum += quantity;
  }
  if (sum !== raw.opened * 5) return fallback;
  const history = Array.isArray(raw.history) ? raw.history.slice(0, COLLECTION_HISTORY_MAX)
    .filter(pack => Array.isArray(pack) && pack.length === 5 && pack.every(id => allowed.has(id)))
    .map(pack => [...pack]) : [];
  return { version: COLLECTION_VERSION, opened: raw.opened, copies, history };
}
export function collectionStats(state, cards) {
  const copies = state.copies ?? {};
  const unique = cards.filter(card => (copies[card.id] ?? 0) > 0).length;
  const total = cards.reduce((sum, card) => sum + (copies[card.id] ?? 0), 0);
  return {
    unique,
    total,
    missing: cards.length - unique,
    duplicates: total - unique,
    opened: state.opened,
    completion: Math.round(unique / Math.max(1, cards.length) * 100),
  };
}

/**
 * Returns a NEW state. The 5th card in a pack must be at least rare.
 * Duplicates are kept, including repeated cards in a single opening.
 */
export function applyPack(previous, draw, cards) {
  const byId = new Map(cards.map(card => [card.id, card]));
  if (!Array.isArray(draw) || draw.length !== 5) throw new Error("Un booster contient cinq cartes.");
  if (draw.some(card => !card || byId.get(card.id)?.rarity !== card.rarity)) throw new Error("Carte de booster invalide.");
  if (draw[4].rarity === "commune") throw new Error("La cinquième carte doit être rare ou meilleure.");
  const state = normalizeCollection(previous, cards);
  const copies = { ...state.copies };
  const results = [];
  for (const card of draw) {
    const quantityBefore = copies[card.id] ?? 0;
    copies[card.id] = quantityBefore + 1;
    results.push({ ...card, newCard: quantityBefore === 0, copies: copies[card.id] });
  }
  return {
    state: {
      version: COLLECTION_VERSION,
      opened: state.opened + 1,
      copies,
      history: [draw.map(card => card.id), ...state.history].slice(0, COLLECTION_HISTORY_MAX),
    },
    results,
  };
}
export function openDemoPack(previous, cards, random = Math.random) {
  return applyPack(previous, simulateBooster(cards, random), cards);
}
