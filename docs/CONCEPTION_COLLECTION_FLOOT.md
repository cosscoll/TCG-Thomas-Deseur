# TCG Deseur — Collection, raretés, doublons et classeur

**Référence produit de la phase actuelle — 9 octobre 2026.**

Les illustrations sont encore en création. Ce chantier traite les **données et les interactions de collection**, sans générer, remplacer, inventer ou anticiper les visuels. Le dossier de collection sera conçu pour recevoir ultérieurement des `imageUrl` réelles sans changer l'identité d'une carte ou les quantités d'un joueur.

## 1. Règles de base à préserver

- **Catalogue historique** : 49 cartes, identifiants inchangés. **17 Communes, 15 Rares, 10 Épiques, 4 Légendaires, 3 Secrètes.**
- Un compte possède **zéro, une ou plusieurs copies** de chaque identifiant. Une carte ne change pas d'identité lorsqu'un visuel est remplacé ou finalisé.
- **Collection unique** : nombre d'identifiants ayant une quantité ≥ 1. Exemple : 4 Matelas représentent **une seule carte unique**.
- **Exemplaires détenus** : somme des quantités de toutes les cartes.
- **Exemplaires supplémentaires (doublons)** : somme de `max(0, quantité - 1)`. Exemple : 4 Matelas représentent **3 exemplaires en double**.
- **Types de cartes en double** : nombre d'identifiants ayant une quantité > 1. Exemple : Matelas ×4 et Fontaine ×2 donnent **2 types en double**, **4 exemplaires supplémentaires**.
- **Cartes manquantes** : identifiants du catalogue dont la quantité est zéro.
- **Complétion** : `cartes uniques possédées / 49 × 100`, arrondie pour l'affichage. Les exemplaires supplémentaires ne peuvent pas faire monter cette jauge.
- Les mêmes calculs existent **indépendamment pour chaque rareté**, avec les bons dénominateurs (17/15/10/4/3).
- Un catalogue tronqué (48 cartes) ou de mauvaise répartition de raretés est rejeté pour éviter une fausse complétion à 100 %.\n- Le joueur ne peut pas créer ni modifier ses quantités depuis le navigateur : toutes les possessions proviennent du serveur authentifié et sont attribuées exclusivement par le serveur.

## 2. Exemple numérique contrôlable

Inventaire exemple (fictif, aucune donnée réelle) :

| Carte | Rareté | Quantité | Unique | Exemplaires en double |
| --- | --- | ---: | ---: | ---: |
| Matelas | Commune | 4 | 1 | 3 |
| Fontaine | Rare | 2 | 1 | 1 |
| Étalon | Épique | 1 | 1 | 0 |
| Mouette | Légendaire | 1 | 1 | 0 |
| Chemise | Secrète | 1 | 1 | 0 |

**Résultat attendu :** 5 cartes uniques sur 49 (**10 %** affichés), 9 exemplaires possédés, 4 exemplaires en double, 2 types de cartes en double, 44 cartes manquantes.

Si les 49 cartes sont détenues une fois chacune, le classeur atteint 100 % et **zéro doublon**. Si 100 exemplaires d'une seule carte sont obtenus, la progression reste à **1/49**.

## 3. Présentation du classeur (sans dépendance aux images)

### Vue d'ensemble

Afficher séparément :
- **Cartes découvertes** : `X / 49`
- **Progression de collection** : `XX %`
- **Total d'exemplaires** : `X`
- **Exemplaires en double** : `X`
- **Cartes manquantes** : `X`

Ne jamais utiliser le total des copies comme numérateur du pourcentage de collection.

### Navigation et filtres

- Possession : **Toutes / Possédées / Manquantes / Doublons**. Une carte en double apparaît également dans « Possédées ».
- Rareté : **Toutes / Commune / Rare / Épique / Légendaire / Secrète**.
- Recherche : nom ou identifiant, sans sensibilité à la casse ni aux accents.
- Tri : ordre du catalogue / rareté / nom / nombre d'exemplaires.
- Combiner les filtres plutôt que de les remplacer. Une combinaison vide doit afficher « Aucune carte ne correspond » et permettre de réinitialiser les filtres.

### Fiche de carte

Chaque fiche présente au minimum :
- Nom provisoire existant ou identifiant de la carte ; **pas de nouveau nom inventé**.
- Rareté et distinction visuelle accessible par texte (ne pas dépendre uniquement d'une couleur).
- **Manquante** ou **Possédée ×N** ; pour les quantités > 1, afficher **N - 1 exemplaires supplémentaires**.
- Illustration facultative. Tant qu'aucune image officielle/finale n'a été intégrée, conserver un emplacement neutre. Ne pas afficher d'image fictive ni de photo non validée.

**À éviter :** les compteurs « 9/49 » lorsque 9 exemplaires incluent des doublons ; annoncer « nouvelle carte » alors qu'un exemplaire de cette carte existe déjà ; afficher des quantités issues d'un ancien compte après déconnexion.

### Récapitulatif de rareté

Cinq sections distinctes affichant les cartes uniques et la progression :
- Commune : `X / 17`
- Rare : `X / 15`
- Épique : `X / 10`
- Légendaire : `X / 4`
- Secrète : `X / 3`

Un filtre « Doublons + Légendaire » ne doit afficher que les cartes **Légendaires possédées à au moins deux exemplaires**.

## 4. Révélation d'un booster enregistré

Règles inchangées : **5 cartes par booster** ; la cinquième est **Rare minimum** ; **un booster gratuit toutes les 24 heures** selon la règle provisoire actuelle.

Probabilités **par emplacement de rareté**, pas taux d'obtention d'une carte particulière :

| Rareté | Chacun des 4 premiers emplacements | 5e emplacement garanti |
| --- | ---: | ---: |
| Commune | 55 % | 0 % |
| Rare | 27 % | 60 % |
| Épique | 12 % | 26,67 % |
| Légendaire | 4 % | 8,89 % |
| Secrète | 2 % | 4,44 % |

Les pourcentages du dernier emplacement sont les poids 27/12/4/2 divisés par 45 et **arrondis pour affichage** ; les poids du tirage serveur restent inchangés.

### Les badges « Nouvelle carte » et « Doublon »

Pour chaque carte du booster **après confirmation du serveur** :
- La première occurrence d'une carte jusque-là manquante est **Nouvelle carte**.
- Toute occurrence ultérieure du même identifiant, y compris **dans ce booster**, est un **Doublon**.
- Exemple : le joueur n'a pas Matelas et obtient trois Matelas dans un même booster. Carte 1 : Nouvelle ; carte 2 : Doublon ×2 ; carte 3 : Doublon ×3.
- Si Matelas ×4 était déjà détenu, un nouveau Matelas doit afficher **×5** et **Doublon**, jamais « Nouvelle carte ».
- Fermer la révélation ne doit pas supprimer les exemplaires attribués. Actualiser le classeur avec la réponse **authentifiée** du serveur.

**Règle de sécurité :** le navigateur ne choisit pas les cartes reçues et ne modifie aucune quantité officielle. Les utilitaires de présentation ne sont pas un moteur de tirage ni un service d'attribution.

## 5. Contrat des données et rattachement à Floot

La source de vérité actuelle du jeu est **Floot + PostgreSQL**, et non l'ancien prototype GitHub Pages ou les migrations Supabase archivées.

Deux sources minimales sont nécessaires au modèle de lecture indépendant :

```js
const catalogue = [
  { id: 'matelas', name: 'Matelas', rarity: 'commune', imageUrl: null },
  { id: 'fontaine', name: 'Fontaine', rarity: 'rare', imageUrl: null },
  // ... les 47 autres cartes historiques du serveur
];
const inventaireAuthentifie = [
  { cardId: 'matelas', quantity: 4 },
  { cardId: 'fontaine', quantity: 2 },
];
```

Il s'agit d'un **contrat d'adaptation de l'interface**, non de l'affirmation que les endpoints Floot utilisent déjà exactement ces clés.

**À l'ouverture du quota :**
1. Lire `endpoints/collection_GET.ts`, son schéma, `helpers/schema.tsx` et `pages/_index.tsx`.
2. Vérifier les clés réelles du catalogue et de l'inventaire et créer un adaptateur qui en extrait **uniquement** `id / rarity / name / imageUrl` et `cardId / quantity`.
3. Faire respecter l'identité du joueur **au serveur**, à partir de la session validée, sans utiliser un `userId` arbitraire fourni par le navigateur.
4. Calculer le modèle côté affichage avec `buildCollectionModel(catalogue, inventaireAuthentifie)` et les filtres avec `filterCollectionCards(model, options)`. Aucun transfert de possessions depuis les anciennes simulations locales.
5. Si la réponse d'inventaire comporte plusieurs lignes pour le même identifiant, **ne pas compter deux fois en silence** : vérifier le schéma/les contraintes de la base et corriger l'adaptation.
6. Après un booster confirmé serveur, appeler `describeCommittedBooster(catalogue, inventaireAvantOuverture, idsReçus)` pour la présentation, **puis rafraîchir le serveur**. Ne jamais envoyer ces cinq cartes au serveur pour demander leur attribution.
7. Tester l'isolement de deux sessions avant publication. Les modifications de possession officielles restent dans les transactions PostgreSQL existantes.
8. Intégrer dans la page Floot existante plutôt que créer un nouveau site ou activer le prototype GitHub.

## 6. Composants déjà implémentés et vérifiés

- [Modèle de collection pur](../floot-collection/collection-model.mjs) : progression, cinq raretés, carte possédée/manquante, exemplaires supplémentaires, filtres combinables, recherche, tri, badges de révélation, taux de rareté affichés. Ne dépend pas de React, images, cookies, authentification ni serveur.
- [30 tests fonctionnels du modèle](../tests/floot-collection-model.test.mjs) : collections vides/complètes, un exemplaire ou plusieurs, progression par rareté, recherche avec accents, tris, cumul des doublons dans une même ouverture, cas invalides et contraintes de lot de cinq.
- [CI GitHub Actions](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37945719773) : **73 tests Node réussis sur 73, aucun échec**, le 9 octobre 2026. Cela **ne constitue pas** un test d'intégration à Floot ni à sa base.

## Extension fonctionnelle du 9 octobre 2026

Le [bilan de livraison](COLLECTION_LIVRAISON_2026-10-09.md) décrit les six volets réellement codés : espace doublons enrichi, 15 jalons informatifs, historique trié sans déduire la nouveauté d'anciennes cartes, bilan des cinq cartes d'un booster déjà confirmé, diagnostic lecture seule avant/après attribution, et démonstration à **cinq sections**.

Sources complémentaires : `floot-collection/collection-insights.mjs`, `floot-collection/collection-reconciliation.mjs`, `tests/floot-collection-insights.test.mjs`, `tests/floot-collection-reconciliation.test.mjs` et `e2e/binder-demo.spec.mjs`.

**Résultat CI actuel :** 120 tests Node réussis sur 120. Les tests navigateur Playwright ne sont pas encore exécutés, et le code de jeu Floot n'a pas été modifié. Les visuels restent volontairement absents.

## 7. Démonstration visuelle non connectée

Une interface indépendante a été préparée dans `floot-collection/demo.html`, `demo.mjs` et `demo.css`. Elle utilise **le modèle métier réel de cette préparation**, mais uniquement avec **trois inventaires fictifs**. Elle n'utilise pas d'image, de compte utilisateur, d'API privée ni de stockage persistant. Les filtres et compteurs fonctionnent sur ces exemples sans attribuer de carte.

**Publication :** le workflow GitHub Pages de la version `9bff5a24df2eb8664ab991f454727f4535801091` s'est terminé en succès ; l'URL publique ne peut pas être vérifiée par requête HTTP indépendante depuis l'environnement actuel. Elle est donc donnée sans garantie de consultation externe : https://cosscoll.github.io/TCG-Thomas-Deseur/floot-collection/demo.html

**Tests :** la [CI GitHub](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37946338311) a passé **80 tests Node sur 80**, dont sept tests statiques de la démo, **pas** un test Chromium. Un test Playwright réel devra encore vérifier l'exécution JavaScript, les filtrages et les débordements mobiles.

## 8. Travail restant pour considérer le classeur Floot terminé


- [ ] Confirmer l'accès au code Floot et la structure des réponses réelles.
- [ ] Adapter le modèle aux vrais objets du serveur et l'intégrer sans régression graphique.
- [ ] Valider sur deux comptes de test isolés que chaque joueur retrouve **son** inventaire, y compris après déconnexion/reconnexion.
- [ ] Vérifier les cas de doubles dans l'ouverture simultanée de boosters et la transaction de la base, sans toucher aux comptes réels.
- [ ] Tester les compteurs et filtres dans le navigateur, desktop et mobile, avec données autorisées.
- [ ] Tester le statut d'attente et les erreurs de réseau sans inventer une collection vide.
- [ ] Créer checkpoint, exécuter typecheck et tests, publier puis vérifier le jeu accessible **sur le domaine existant**.

**Conclusion d'étape : modèle métier et tests prêts, intégration Floot non effectuée, illustrations laissées en dehors de ce chantier.**
