# Vérification avant intégration Floot — collection approuvée

**Établi le 12 octobre 2026 (GitHub uniquement).** Ce contrôle ne modifie pas les comptes joueurs, ne consomme aucun booster et n'attribue aucune carte.

## Source de vérité

- `data/choix-cartes-2026-10-11.json` : **67 cartes validées**, **3 groupes écartés**, **aucune à examiner**.
- `data/catalogue-valide-67.json` : noms exacts, visuel principal, tous les visuels alternatifs et photos sources.
- Parmi les 67 cartes : **38 visuels alternatifs existants** ; **105 fichiers WebP sélectionnés** au total. Les visuels non sélectionnés sont conservés sur disque mais **ne font pas partie de cette édition**.
- Un seul personnage retenu a **deux variantes** : Picasso Deseur. Le nombre de variantes par carte est variable (0, 1 ou davantage).
- La sélection ne comporte **aucun Shiny produit ni validé**.

## Provenance documentaire désormais affichée dans la galerie

Chaque carte du nouveau catalogue public peut indiquer sa galerie documentaire et sa référence photographique. La provenance d'image ne vaut pas preuve de l'épisode ou de la scène exacte.

| Galerie de photographie | Cartes approuvées |
| --- | ---: |
| Costumes — vidéos 100 et 1000 couches | 43 |
| Série 100 couches | 15 |
| Personnages Thomas | 8 |
| Braderie de Lille 2026 | 1 |
| **Total** | **67** |

L'affichage de la source a été testé par simulation du code navigateur ; les filtres ont renvoyé respectivement **43, 15, 8 et 1** fiches et **67** pour « Toutes ». L'exécution Chromium GitHub Actions constitue le contrôle complémentaire en conditions de navigateur.

## Incompatibilité réelle entre l'ancien inventaire et la nouvelle édition

L'ancien modèle de jeu comporte **49 identifiants techniques historiques** ; la nouvelle édition approuvée contient **67 identifiants `COST-XXX`**.

**Nombre d'IDs strictement identiques : 0.**

Cela signifie qu'une substitution naïve de catalogue ferait perdre les correspondances des comptes existants. Ne pas migrer les inventaires à partir de la seule ressemblance des noms.

Un diagnostic reproductible et sans écriture se trouve dans `scripts/check-migration-compat.mjs` et le garde-fou dans `tests/migration-compat.test.mjs`. Ils doivent être verts avant préparation d'une migration.

### Stratégie de reprise Floot

1. Restaurer d'abord la possibilité d'ouvrir les boosters sans modifier le catalogue de production.
2. Sauvegarder le schéma et les inventaires existants ; lire toutes les références réellement stockées dans les tables Floot.
3. Définir un rapprochement **manuel, validé** entre cartes anciennes et nouvelles ; les 49 anciens IDs restent consultables pendant la transition.
4. Attribuer les raretés à la nouvelle édition seulement après décision éditoriale : **aucune rareté ne doit être générée automatiquement**.
5. Définir si une variante est un objet collectionnable distinct, sa probabilité et son impact sur la complétion (ce n'est pas indiqué dans le fichier de tri).
6. Tester l'ouverture, le refus de quota, l'atomicité d'un lot de cinq, le comptage des doublons, l'historique et la récompense finale sans exposer le contenu de cette récompense sur le client.
7. Faire un checkpoint, publier, puis contrôler le site **réellement** en production, sur desktop et mobile.

**Priorité immédiate :** compte du propriétaire signalant une impossibilité d'ouvrir un booster. La correction doit découler du diagnostic du code et de la base Floot, pas d'une attribution arbitraire depuis GitHub.

## Preuves de validation et limites

La suite GitHub Actions `Verify TCG Deseur` exécute les tests Node, les scénarios Chromium et le contrôle HTTP du catalogue public. La première version du catalogue a passé l'ensemble des tâches le 11 octobre 2026 (exécution 38174528911). Toute modification postérieure doit repasser la CI ; ne pas extrapoler le succès historique.

**Attention :** le catalogue GitHub Pages n'est pas l'application authentifiée Floot. La galerie affiche les fiches publiques, sans inventaires personnels.
