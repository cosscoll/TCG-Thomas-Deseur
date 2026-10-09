/**
 * TCG Deseur — reconciliation of a booster already committed by Floot.
 *
 * A READ-ONLY consistency diagnostic, not an inventory update.
 * "Mismatch" can result from another authorized opening or a stale snapshot;
 * it is not proof of a DB vulnerability. Reload the authenticated collection.
 */
import { buildCollectionModel } from './collection-model.mjs';
import { getCommittedBoosterRecap } from './collection-insights.mjs';

export function compareCommittedPackToInventory(catalogue, beforeInventory, afterInventory, drawIds) {
  const before = buildCollectionModel(catalogue, beforeInventory);
  const after = buildCollectionModel(catalogue, afterInventory);
  // Enforces five known cards and guaranteed final rarity; no random draw.
  const recap = getCommittedBoosterRecap(catalogue, beforeInventory, drawIds);
  const increments = new Map();
  for (const card of recap.cards) {
    increments.set(card.id, (increments.get(card.id) ?? 0) + 1);
  }
  const afterById = new Map(after.cards.map(card => [card.id, card]));
  const discrepancies = before.cards.flatMap(card => {
    const expectedQuantity = card.quantity + (increments.get(card.id) ?? 0);
    const observedQuantity = afterById.get(card.id).quantity;
    if (!Number.isSafeInteger(expectedQuantity)) {
      throw new Error('Quantité attendue trop élevée.');
    }
    return expectedQuantity === observedQuantity ? [] : [{
      id: card.id,
      expectedQuantity,
      observedQuantity,
      difference: observedQuantity - expectedQuantity,
    }];
  });
  return {
    matches: discrepancies.length === 0,
    expectedGain: 5,
    observedGain: after.copies - before.copies,
    uniqueBefore: before.unique,
    uniqueAfter: after.unique,
    firstDiscoveries: recap.firstDiscoveries,
    additionalCopies: recap.duplicateCopies,
    discrepancies,
    // Do not "fix" the user collection on the client; ask Floot for a fresh read.
    needsServerRefresh: discrepancies.length > 0,
  };
}
