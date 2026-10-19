/**
 * Compatibilité historique : les anciennes démonstrations GitHub Pages utilisaient
 * des clés de navigateur créées avant le nom officiel TCG-Thomas-Deseur.
 *
 * La lecture migre vers la clé courante UNE SEULE FOIS et préserve l'ancienne.
 * Aucun compte, booster ou inventaire du jeu FLOOT n'utilise ces clés locales.
 */
const CURRENT_PREFIX = "tcg-thomas-deseur:";
const LEGACY_PREFIX = "budget-illimite:";

export function readMigratedStorage(storage, key) {
  const value = storage.getItem(key);
  if (value !== null) return value;
  if (!key.startsWith(CURRENT_PREFIX)) return null;
  const legacyKey = LEGACY_PREFIX + key.slice(CURRENT_PREFIX.length);
  const legacyValue = storage.getItem(legacyKey);
  if (legacyValue !== null) storage.setItem(key, legacyValue);
  return legacyValue;
}
