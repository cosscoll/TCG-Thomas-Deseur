# TCG Deseur — Suite de travail du 10 octobre 2026, quota Floot atteint

**Source de vérité de l'application :** projet Floot `1d1c3807-73a6-49c5-a59e-ec097d8caddf`, https://budget-illimite-tcg.floot.app. Les sources locales GitHub ne sont **pas** synchronisées automatiquement avec Floot.

## État confirmé de la production

L'application reste déclarée **publiée / publique** sur le domaine historique. Sa dernière publication **confirmée** dans la conversation précédente est le job Floot `9b0cfe0f-9765-433c-8f76-c81f4aeab79b`, effectué avant cette session, avec le classeur et le récapitulatif de booster.

**Les modifications détaillées ci-dessous sont enregistrées dans l'éditeur Floot, mais n'ont PAS été testées complètement, ni checkpointées, ni publiées.** Ne pas annoncer qu'elles sont en ligne. Floot a répondu « Daily build limit reached » le 10 octobre 2026 à ~16:54 UTC. Réinitialisation annoncée le **11 octobre 2026 à 09:00 UTC (11 h Europe/Zurich)**. Avant cette échéance, ne pas prétendre pouvoir publier ni agir sur ces fichiers. Si une nouvelle session a lieu après, recontrôler les outils au lieu de réutiliser l'ancien refus.

## Changements effectués dans Floot pendant cette session (prépublication)

### Authentification et isolation

- `helpers/useAuth.tsx` : la requête de session est réexaminée périodiquement (staleTime 60 s avec contrôle au retour sur l'onglet), et la déconnexion annule également une éventuelle requête de session en cours avant de vider le cache.
- `helpers/getServerUserSession.tsx` : lecture supplémentaire de `sessions.expiresAt` et refus d'une session expirée selon la base, indépendamment du jeton signé.
- `endpoints/collection_GET.schema.ts` : prise en charge de `AbortSignal`, `cache: "no-store"`, `credentials: "include"`.
- `pages/_index.tsx` : React Query transmet le signal d'annulation à l'appel de collection. L'interface de déconnexion et les autres règles développées le 10 octobre restent en place.
- Ces changements cherchent à éviter la réapparition de données d'un ancien compte lorsqu'une requête se termine trop tard.

### Catalogues et boosters

- `endpoints/collection_GET.ts` : tri déterministe des cartes par identifiant et des dix dernières ouvertures par date **puis identifiant**.
- `helpers/verifyBoosterCatalogue.tsx` **créé** : refuse tout tirage si le pool serveur ne contient pas exactement 49 IDs uniques et les quotas 17/15/10/4/3.
- `endpoints/booster_POST.ts` : appel à cette vérification après lecture du catalogue et **avant** les modifications transactionnelles d'inventaire et de quota.
- `helpers/verifyBoosterCatalogue.spec.tsx` **créé**, cinq cas : catalogue correct, 48 cartes, doublon d'identifiant, mauvaise répartition, rareté inconnue.

### Interface et tests

- `components/TcgBinder.tsx` : navigation des fiches au clavier avec flèches gauche/droite ; conservation du focus lorsqu'un bouton précédent/suivant devient désactivé au bord du catalogue.
- `helpers/tcgCollectionRequest.spec.tsx` **créé** : tests d'annulation de requête, HTTP 401 et lecture normale, **suite exécutée et réussie** avant le blocage.
- `helpers/tcgBinderRender.spec.tsx` : nouveau test de fiche. **Attention : le premier essai a échoué à cause d'une incompatibilité de constructeur `Event` entre jsdom et la bibliothèque Radix**, erreur diagnostiquée à partir des traces ; une adaptation `globalThis.Event = window.Event` (et `CustomEvent`) a été ajoutée au banc de test juste avant que Floot bloque les actions. **Cette adaptation n'a pas encore été validée**. Ne pas retirer le contrôle de navigation pour masquer un échec ; vérifier d'abord le comportement de la fiche et du focus.

## Vérifications effectuées

- **Lecture seule des contraintes PostgreSQL :** `tcg_inventory` a une clé unique `(user_id,card_id)` et un `CHECK(quantity > 0)` ; `tcg_pack_status` a une clé unique sur `user_id`. La route `booster_POST` utilise `FOR UPDATE` et une transaction.
- **Agrégrats de santé SQL :** 49 cartes, **zéro quantité négative ou nulle**, zéro statut `opened` négatif et zéro ligne d'historique mal formée au moment du contrôle.
- **Typecheck :** propre sur les modifications successives, y compris les derniers changements de test (résultat automatique de l'outil Floot).
- **Avant l'ajout du test de navigation modale :** 7 suites Jasmine du projet réussies.
- **Après l'ajout du test :** une suite `tcgBinderRender.spec.tsx` échouait sur la simulation `jsdom` + Radix ; l'adaptation du banc de test est **non exécutée**.
- **Nouvelle suite `tcgCollectionRequest.spec.tsx` :** exécutée et réussie.
- Aucun nouveau compte, aucune ouverture de booster, aucune modification de l'inventaire réel ; les requêtes SQL d'audit étaient en lecture seule.
- **Aucun checkpoint ni déploiement depuis ces modifications** à cause du quota épuisé.

## Travaux réalisés côté GitHub (sans impact sur la production)

- `floot-e2e/guest-security.spec.mjs` ajouté au dépôt : tests **anonymes** à lancer dans Chromium contre l'application publiée (GET collection/session, POST booster/profil, page publique et focus des champs). Aucun identifiant ou booster réel requis ; ne doit jamais transmettre de credentials. **Non exécuté** : le workflow GitHub de tests Floot est en déclenchement manuel, et le conteneur actuel n'accède pas au domaine GitHub brut.
- Les anciens tests Chromium de la démonstration GitHub ne valident pas les comptes du Floot actuel.

## Ordre précis de reprise — sans redemander les objectifs

1. Vérifier que le quota Floot est de nouveau disponible et relire **les fichiers courants** (ils peuvent avoir changé).
2. Relancer `typecheck` et les huit suites Jasmine, en commençant par `helpers/tcgBinderRender.spec.tsx`. En cas d'erreur `Event`/jsdom, réparer le mock/test ; en cas d'échec réel du focus, réparer l'interface. **Ne pas publier un test rouge**.
3. Vérifier les endpoints authentifiés en lecture seule via comptes fictifs autorisés si disponibles ; éviter les comptes de vrais joueurs et toute attribution de booster de production.
4. Vérifier explicitement les propriétés de `Cache-Control` des réponses **privées** de `collection_GET`, `session_GET` et `booster_POST`. Si la configuration ne marque pas les réponses `private, no-store`, corriger le serveur et ajouter des tests (pas de cache partagé de collections).
5. Créer un checkpoint nommé pour ce lot, puis publier sur **le domaine Floot existant**. Attendre le résultat `succeeded`.
6. Vérifier HTTP 200 sur accueil/connexion, HTTP 401 sur collection et booster en anonyme, puis vérifier que les nouveaux assets publiés contiennent les corrections. Tester en navigateur réel lorsqu'un accès est possible. Documenter explicitement les tests authentifiés non réalisés.

**Règle produit :** ne pas générer ou remplacer les illustrations en cours de création ; ne pas ajouter de combats, de commerce ou d'échanges. Aucune automatisation récurrente TCG n'est active.
