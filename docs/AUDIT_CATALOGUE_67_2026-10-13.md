# TCG Deseur — audit reproductible du catalogue de 67 personnages

> Rapport automatique limité aux **67 personnages publics**. Aucune identité de la Carte mystère ou donnée utilisateur n’est exportée. L’origine documentaire indiquée n’est **pas** une attribution vidéo/scène certifiée.

## Contrôles techniques réussis

- 67 personnages : identifiants, noms, références principales et raretés identiques dans les **choix du créateur**, la collection publiée, le catalogue Floot préparatoire et les raretés approuvées.
- 105 illustrations référencées une seule fois, dont **38 alternatives** ; 105 références de photos uniques.
- 105 empreintes SHA-256 d’originaux distinctes ; 105 empreintes SHA-256 des exports distinctes. **Cela ne permet pas de conclure à l’absence de doublons de costume ou de scène**.
- Pour chaque illustration, correspondance de photo source documentée et image finale normalisée en **768 × 1 024 px**.

| Rareté | Personnages | Alternatives associées |
| --- | ---: | ---: |
| Épique | 8 | 6 |
| Commune | 33 | 17 |
| Légendaire | 4 | 4 |
| Rare | 21 | 11 |
| Hors-série | 1 | 0 |

## Alertes de revue humaine (non bloquantes)

Les rapports de dimensions sont un **signal de contrôle**, pas un défaut établi. Une marge étendue peut être esthétique ou nécessiter une retouche selon la photo. Les anciens regroupements documentaires peuvent différer des regroupements artistiques validés par le créateur.

| Carte | Illustration | Type d’alerte | Justification |
| --- | --- | --- | --- |
| COST-001 | td_1_004 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-017 | td_3_043 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-021 | td_3_016 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-025 | td_3_032 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-037 | td_3_029 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-042 | td_3_002 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-051 | td_1_051 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-053 | td_1_052 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-056 | td_1_059 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-061 | td_1_060 | moyen | Larges marges de fond prolongé; contrôle humain du rendu recommandé |
| COST-070 | td_lille | fort | Larges marges de fond prolongé; contrôle humain du rendu recommandé |

## Fichiers à utiliser

- **Atelier visuel** : https://cosscoll.github.io/TCG-Thomas-Deseur/audit-visuels/ — revue côte à côte, annotations locales et exports JSON/CSV.
- **Matrice exhaustive** : `data/audit-catalogue-105.csv` — 105 lignes avec noms, raretés, source documentaire, URL, dimensions, sommes de contrôle et priorité de revue.
- Source de vérité : `data/choix-cartes-2026-10-11.json`, `data/raretes-validees-67.json`, `data/edition-staging-67.json`.

## Limites et suite

Le rapprochement de costumes et de scènes **demande une validation visuelle humaine**. Les URLs documentaires ne garantissent pas une vidéo ou une séquence spécifique. Ne modifier ni noms ni regroupements approuvés sur la base de cette seule analyse. Les éventuels choix de retouche ou d’alternative pourront être importés après validation du propriétaire.

Rapport régénérable par `node scripts/audit-edition-67.mjs --write`.
