# Préparation technique de la nouvelle édition — 12 octobre 2026

**Statut : préproduction uniquement. Aucune nouvelle carte créée dans Floot, aucune donnée joueur écrasée.**

## Livrables reproductibles

La référence éditoriale reste `data/choix-cartes-2026-10-11.json`, à partir de laquelle `scripts/build-approved-catalogue.mjs` reconstruit `data/catalogue-valide-67.json`.

Le nouvel outil `scripts/stage-approved-edition.mjs` transforme en lecture seule ce catalogue en un **schéma de transition**, contrôlé par `tests/stage-approved-edition.test.mjs`.

| Information | Vérification |
| --- | --- |
| Personnages approuvés | 67 |
| Illustrations principales | 67 |
| Illustrations alternatives rattachées au personnage | 38 |
| Total des illustrations existantes retenues | 105 |
| Décisions de rareté définitive | En attente du créateur |
| Règles d'obtention des variantes | En attente |
| Effet des variantes sur la complétion | En attente |
| Attribution aux comptes réels | Aucune |
| Migration des anciens inventaires | Aucune |

## Contrat technique du schéma de transition

- `schema: tcg-deseur-edition-staging-v1`
- `status: NON_DÉPLOYABLE_AVANT_DÉCISIONS`
- `cards[]` : exactement 67 personnages
- `characterId` : identifiant `COST-XXX` d'origine
- `title` : nom tel que validé
- `main` : `artworkId`, `assetPath`, `imageUrl`, `photoReference`
- `variants[]` : même structure, **rattachée au personnage** plutôt que distribuée en tant que carte additionnelle
- `rarity: null` et `variantsCollectingRule: null` : aucune règle inventée
- `questionsPending` : `rarityPerCharacter`, `variantObtainingRule`, `variantCompletionEffect`

**Important :** le staging est un document de préparation, pas un nouveau système de tirage. Les URLs d'images pointent vers les fichiers publics existants ; l'outil n'ajoute pas de dépendance d'hébergement supplémentaire.

Exécution locale au dépôt :

```bash
node scripts/stage-approved-edition.mjs
node scripts/stage-approved-edition.mjs --json
node --test tests/stage-approved-edition.test.mjs
```

Le mode par défaut imprime uniquement un bilan, le mode `--json` imprime le schéma complet **sans écrire dans la base**. Les contrôles empêchent les références d'images invalides, l'utilisation multiple d'une illustration, les collisions d'identifiants historiques et la perte silencieuse d'une variante.

## Sécurité et précautions d'intégration

1. **Ne pas toucher à la base Floot actuellement publiée** avant d'avoir vérifié les boosters et l'inscription réels avec des comptes de test autorisés.
2. Avant migration, réaliser un inventaire et une sauvegarde du catalogue serveur et des collections déjà enregistrées.
3. Conserver les identifiants des anciennes éditions en archive ; les ID `COST-XXX` ne correspondent pas directement aux anciens identifiants.
4. Ne pas transformer les 38 illustrations alternatives en 38 **cartes indépendantes** sans décision explicite sur leur obtention, rareté et complétion.
5. Quand le fichier des raretés sera disponible, vérifier **67/67** dans `scripts/validate-rarity-decisions.mjs` et intégrer uniquement les décisions validées, sans recalcul de rareté.
6. Préparer un déploiement versionné et réversible dans Floot, avec tests d'inscription, booster de cinq cartes, délai de 24 h, protection contre double tirage, inventaire, reconnexion et isolement entre comptes.
7. Ne jamais faire apparaître dans le catalogue public les détails d'une récompense non annoncée ; la communication concerne seulement le booster de collection accessible une fois la collection terminée.

## Tests et publication

La chaîne GitHub `Verify TCG Deseur` vérifie désormais le staging, l'intégrité des fichiers, les IDs historiques et les textes publics. Elle effectue ensuite les tests Chromium du catalogue sur ordinateur et mobile. Les résultats **doivent être vérifiés sur la dernière exécution** : ne pas généraliser un succès ancien aux futurs changements.

**Limite actuelle :** le quota Floot des modifications a été atteint le 12 octobre 2026. Remise à zéro annoncée pour le **13 octobre à 09:00 UTC** (11 h en France). L'accès ne sera réellement considéré rétabli qu'après un nouveau contrôle. Pendant cette limite, seul GitHub reçoit les préparatifs indépendants de Floot.

## Prochaine intervention Floot autonome

Priorité P0 : preuve d'une ouverture de booster **réelle, authentifiée, enregistrée puis retrouvée après reconnexion**, sans altérer les comptes tiers.

Priorité P1 : préparation contrôlée des tables et des pages de la nouvelle édition après validation des raretés et des règles de variantes. Ne pas fusionner prématurément les bases de 160 illustrations et 67 personnages.

Références : [audit de migration](./AUDIT_AVANT_MIGRATION_2026-10-12.md), [plan de test des amis](./BETA_AMIS_2026-10-12.md), [point technique](./POINT_REPRISE_AUTONOME_2026-10-12.md).
