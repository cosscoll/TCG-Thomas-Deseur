/**
 * A read-only CSV export of the current authenticated collection model.
 * No personal identifiers, rewards, storage, API calls or backend mutations.
 * The UI must initiate downloads ONLY on direct user action.
 *
 * Semicolon-delimited UTF-8 + BOM for a French spreadsheet, with strict
 * formula-injection defense even for user-controlled display names.
 */

const HEADERS = Object.freeze([
  'Identifiant', 'Carte', 'Rareté', 'Possédée',
  'Exemplaires', 'Doublons supplémentaires',
]);

function quoteCsv(value) {
  // Escape quotes, semicolons and line breaks. Prevent spreadsheet software
  // interpreting card names beginning with = + - @ or a tab as formulas.
  let text = String(value ?? '');
  text = text.replace(/[\r\n\t]+/g, ' ').trim();
  if (/^[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g, '""') + '"';
}

export function exportCollectionCsv(model, { includeMissing = true, bom = true } = {}) {
  if (!model || !Array.isArray(model.cards) || !Number.isSafeInteger(model.total) ||
      model.total !== 49 || model.cards.length !== 49) {
    throw new Error('La collection doit contenir le catalogue validé de 49 cartes.');
  }
  if (typeof includeMissing !== 'boolean' || typeof bom !== 'boolean') {
    throw new Error("Options d'export invalides.");
  }
  const ids = new Set();
  const lines = [HEADERS.map(quoteCsv).join(';')];
  for (const card of model.cards) {
    if (!card || !/^[a-z0-9_]+$/.test(card.id) || ids.has(card.id) ||
        !['commune','rare','epique','legendaire','secrete'].includes(card.rarity) ||
        !Number.isSafeInteger(card.quantity) || card.quantity < 0 ||
        !Number.isSafeInteger(card.extraCopies) ||
        card.extraCopies !== Math.max(0, card.quantity - 1)) {
      throw new Error("Le classeur contient une donnée invalide.");
    }
    ids.add(card.id);
    if (!includeMissing && !card.quantity) continue;
    const values = [
      card.id,
      card.name,
      card.rarity,
      card.quantity > 0 ? 'Oui' : 'Non',
      card.quantity,
      card.extraCopies,
    ];
    lines.push(values.map(quoteCsv).join(';'));
  }
  return (bom ? '\ufeff' : '') + lines.join('\r\n') + '\r\n';
}
