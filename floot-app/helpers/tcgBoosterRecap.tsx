import { RARITIES, RARITY_LABELS, type Rarity } from "./tcgCollection";
export type ConfirmedDrawnCard = {
  id: string; name: string; rarity: string; newCard: boolean; quantity: number;
};
/** Display only: never draws, grants or persists any card. */
export function summarizeConfirmedBooster(cards: ConfirmedDrawnCard[], completionReward = false) {
  if (!Array.isArray(cards) || ![5,100].includes(cards.length) || cards.some(card =>
    !card || typeof card.id !== "string" || !card.id ||
    typeof card.name !== "string" ||
    !RARITIES.includes(card.rarity as Rarity) ||
    typeof card.newCard !== "boolean" ||
    !Number.isSafeInteger(card.quantity) || card.quantity < 1
  ) || (cards.length===5 && !completionReward && cards[4].rarity === "commune")) {
    throw new Error("Récapitulatif de booster invalide.");
  }
  const newCards = cards.filter(card => card.newCard).length;
  const rarity = [...cards].sort((a,b) => RARITIES.indexOf(b.rarity as Rarity) - RARITIES.indexOf(a.rarity as Rarity))[0].rarity as Rarity;
  return {
    total: cards.length,
    newCards,
    duplicates: cards.length - newCards,
    highestRarity: rarity,
    highestLabel: RARITY_LABELS[rarity],
    byRarity: RARITIES.map(rarity => ({
      rarity, count: cards.filter(card => card.rarity === rarity).length,
    })),
  };
}
