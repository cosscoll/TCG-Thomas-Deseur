# TCG Deseur — impact possible des 38 variantes sur la complétion (étude hypothétique)

> **Aucune modification de règle ni de serveur.** Modèle d’aide à la décision, fondé sur la politique technique provisoire de 10 % d’alternatives à l’emplacement 4, choisies de manière uniforme parmi 38 visuels.

## Scénarios étudiés

A — **67 personnages distincts** : une illustration alternative d’un personnage peut contribuer à sa découverte. C’est l’interprétation provisoire actuelle du classeur connecté.

B — **105 illustrations distinctes** : chaque visuel principal et chacun des 38 alternatifs doit être obtenu séparément ; une alternative ne compte alors pas comme acquisition de sa version principale. **Cette règle n’a pas été validée par le créateur.**

Les cinq probabilités d’emplacements et les 67 raretés ne changent pas entre les deux hypothèses. Aucune mécanique d’échange, pity-system, garantie ou récompense n’est ajoutée.

## Résultats de 750 cohortes fictives

| Mesure | A — 67 personnages | B — 105 images |
| --- | ---: | ---: |
| Minimum | 49 | 674 |
| 10e percentile | 153 | 1072 |
| Médiane | 280 | 1505 |
| Moyenne | 323 | 1588 |
| 90e percentile | 532 | 2145 |
| Maximum | 1575 | 4526 |

**Interprétation :** faire des 38 alternatives une condition supplémentaire pourrait rallonger fortement la complétion. Ce résultat dépend du choix uniforme des variantes ; modifier ce choix produirait d’autres chiffres. En bêta avec boosters illimités, le nombre de boosters reste le même mais n’est pas une durée en jours.

## Choix à soumettre au créateur (ne pas activer sans accord)

1. Les alternatives sont seulement des versions cosmétiques du même personnage, conservées dans l’historique de tirage.
2. Chaque alternative a son propre compteur d’inventaire, mais **n’est pas obligatoire** pour obtenir le booster de collection.
3. Chaque alternative a son compteur et **compte pour une collection complète de 105 illustrations** (plus difficile).

Le nombre de personnages du classeur public demeure **67 connus + une Carte mystère**, quelle que soit la décision ; une version graphique ne devient pas automatiquement un nouveau personnage.

Simulation reproductible : node scripts/comparer-variantes-collection.mjs --report ; aucune connexion Floot.
