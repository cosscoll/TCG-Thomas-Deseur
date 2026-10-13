# TCG Deseur — étude quantitative des boosters (simulation hors ligne)

> **Simulation, pas comportement garanti ni tirage réel**. Aucun compte, aucune carte, aucun booster Floot utilisé.

Source : `data/edition-staging-67.json` et `data/regles-booster-67.json`. Les cartes alternatives sont choisies **uniformément parmi les 38 visuels** uniquement pour la simulation ; elles comptent pour le personnage de base, comme dans la règle serveur temporaire. Ce traitement des alternatives reste à faire confirmer.

## Hypothèses et volumes

- 1 000 000 boosters fictifs, 5 000 000 positions simulées.
- 1 000 joueurs fictifs indépendants, collection vide et boosters sans échange entre joueurs.
- Graine pseudo-aléatoire reproductible : 20261013. Le serveur réel utilise un générateur cryptographique, contrairement à cet outil purement analytique.
- Probabilités **par emplacement** fixées par le créateur : 1–3 Communes à 100 %, position 4 Rare 90 % ou Alternative 10 %, position 5 Rare 80 % / Épique 17 % / Légendaire 2 % / Hors-série 1 %.

## Fréquences observées et attentes théoriques

| Emplacement | Catégorie | Observé | Observé (%) | Attendu (%) |
| --- | --- | ---: | ---: | ---: |
| 1 | Commune | 1 000 000 | 100,000 % | 100 % |
| 2 | Commune | 1 000 000 | 100,000 % | 100 % |
| 3 | Commune | 1 000 000 | 100,000 % | 100 % |
| 4 | Rare | 900 047 | 90,005 % | 90 % |
| 4 | alternative | 99 953 | 9,995 % | 10 % |
| 5 | Rare | 799 907 | 79,991 % | 80 % |
| 5 | Épique | 170 130 | 17,013 % | 17 % |
| 5 | Légendaire | 20 040 | 2,004 % | 2 % |
| 5 | Hors-série | 9 923 | 0,992 % | 1 % |

## Temps nécessaire pour les 67 personnages distincts

| Indicateur | Nombre de boosters | À un booster/jour |
| --- | ---: | ---: |
| Meilleur des 1 000 cas simulés | 75 | 75 jours |
| 10e percentile | 140 | 140 jours |
| Médiane | 276 | 276 jours |
| Moyenne | 322 | 322 jours |
| 90e percentile | 564 | 564 jours |
| Maximum simulé | 1 470 | 1 470 jours |

La conversion en jours suppose exactement un booster par jour sans jours manqués, et ne s’applique pas à la bêta où les boosters doivent être illimités. **Ce ne sont pas des dates de fin garanties**.

Les cartes Légendaires (2 % sur la 5e position, réparties entre 4 personnages) constituent probablement le principal facteur de durée : une Légendaire donnée a 0,5 % de chance par booster, hors alternatives. Pour la seule Hors-série, la probabilité est de 1 % par booster, hors alternatives.

## Doublons et progression

- 130 064 répétitions au sein du **même booster** sur 1 000 000 ouvertures simulées. Un même personnage peut aussi réapparaître dans les boosters suivants, ce qui n’augmente pas la progression en cartes distinctes.
- Les alternatives ne créent pas de personnage supplémentaire : la progression requiert les **67 personnages connus**, pas les 105 visuels.

## Réserves et décisions

Le modèle ne comprend pas : échange de cartes, carte de récompense, bonus anti-doublons, achats, récompenses éventuelles, futurs changements de rareté, ou variations de l’algorithme après lancement. Il **ne prouve pas** la conformité statistique du serveur Floot sans recette authentifiée en production.

Pour réduire la difficulté sans toucher aux taux validés, une étude ultérieure pourrait comparer un système d’échanges ou de protection contre les doublons. **Aucun de ces mécanismes n’est décidé ni activé.**

## Validation du programme

Commande reproductible : `node scripts/simuler-boosters-67.mjs --report`.
