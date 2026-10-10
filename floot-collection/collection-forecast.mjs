/**
 * TCG Deseur — exact, READ-ONLY collector probabilities and progression.
 *
 * Cards are drawn independently with replacement INSIDE each rarity:
 * slots 1-4 have the regular weights; slot 5 guarantees rare or higher.
 * The server alone draws, persists and decides actual results.
 * This is a mathematical forecast, NOT a random pack generator.
 */
import { buildCollectionModel, getDisplayedBoosterOdds, RARITY_ORDER, RARITY_LABELS } from './collection-model.mjs';

const rankLadder = Object.freeze([
  { at: 0, title: 'Débutant' },
  { at: 1, title: 'Découvreur' },
  { at: 5, title: 'Explorateur' },
  { at: 10, title: 'Collectionneur' },
  { at: 20, title: 'Passionné' },
  { at: 30, title: 'Connaisseur' },
  { at: 40, title: 'Expert' },
  { at: 49, title: 'Collection complète' },
]);
const clamp = value => Math.max(0, Math.min(1, value));

/** Illustrative collection rank, strictly from unique cards, WITHOUT prizes/XP. */
export function getCollectorRank(model) {
  if (!model || model.total !== 49 || !Number.isInteger(model.unique) ||
      model.unique < 0 || model.unique > model.total) {
    throw new Error('Le classement demande une collection complète et valide.');
  }
  const level = rankLadder.reduce((index, milestone, i) =>
    model.unique >= milestone.at ? i : index, 0);
  const next = rankLadder[level + 1] ?? null;
  return {
    level: level + 1,
    title: rankLadder[level].title,
    unique: model.unique,
    currentThreshold: rankLadder[level].at,
    nextThreshold: next?.at ?? null,
    nextTitle: next?.title ?? null,
    remaining: next ? next.at - model.unique : 0,
    progressPercent: next
      ? Math.round((model.unique - rankLadder[level].at) / (next.at - rankLadder[level].at) * 100)
      : 100,
    maxLevel: rankLadder.length,
    complete: next === null,
    rewards: false,
  };
}

/**
 * Exact probability of 1+ NOT-YET-OWNED cards in the NEXT single booster.
 * Expected new distinct cards accounts for multiple copies of the same NEW
 * card inside the 5 slots; it is NOT merely the sum of new draw probabilities.
 *
 * All probabilities assume uniform choice among the cards of each rarity,
 * independently per slot, as with the existing server weights.
 */
export function getCollectionForecast(catalogue, inventory) {
  const model = buildCollectionModel(catalogue, inventory);
  const odds = getDisplayedBoosterOdds();
  const byRarity = model.byRarity.map(group => {
    const pRegular = odds.normalSlots[group.id] / 100;
    const pGuaranteed = odds.fifthSlot[group.id] / 100;
    const unknownRatio = group.missing / group.total;
    const perCardRegular = pRegular / group.total;
    const perCardGuaranteed = pGuaranteed / group.total;
    // Inclusion/exclusion over draws: each card counted only once even if
    // its ID comes up in several slots.
    const chanceSpecificMissingCard =
      clamp(1 - (1 - perCardRegular) ** 4 * (1 - perCardGuaranteed));
    return {
      id: group.id,
      label: RARITY_LABELS[group.id],
      missing: group.missing,
      total: group.total,
      chanceNewRegular: clamp(pRegular * unknownRatio),
      chanceNewGuaranteed: clamp(pGuaranteed * unknownRatio),
      chanceSpecificMissingCard,
      expectedNewUnique: group.missing * chanceSpecificMissingCard,
    };
  });
  const pRegularNew = byRarity.reduce((sum, group) => sum + group.chanceNewRegular, 0);
  const pGuaranteedNew = byRarity.reduce((sum, group) => sum + group.chanceNewGuaranteed, 0);
  const anyNew = clamp(1 - (1 - pRegularNew) ** 4 * (1 - pGuaranteedNew));
  const expectedNewUnique = byRarity.reduce((sum, group) => sum + group.expectedNewUnique, 0);
  const expectedNewCopies = 4 * pRegularNew + pGuaranteedNew;
  const premium = new Set(['legendaire', 'secrete']);
  const pPremiumNormal = byRarity.reduce((sum, group) =>
    sum + (premium.has(group.id) ? odds.normalSlots[group.id] / 100 : 0), 0);
  const pPremiumFifth = byRarity.reduce((sum, group) =>
    sum + (premium.has(group.id) ? odds.fifthSlot[group.id] / 100 : 0), 0);
  return {
    ownedUnique: model.unique,
    missing: model.missing,
    chanceNewPerRegularSlot: clamp(pRegularNew),
    chanceNewFifthSlot: clamp(pGuaranteedNew),
    chanceAtLeastOneNew: anyNew,
    chanceNoNew: 1 - anyNew,
    expectedNewUnique,
    expectedNewCopies,
    chanceAtLeastOneLegendaryOrSecret: clamp(
      1 - (1 - pPremiumNormal) ** 4 * (1 - pPremiumFifth)
    ),
    byRarity,
    rank: getCollectorRank(model),
  };
}
