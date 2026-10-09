# TCG Deseur — Matrice de recette Floot

**Version préparée :** 9 octobre 2026  
**Application à contrôler :** https://budget-illimite-tcg.floot.app  
**Projet de développement :** `1d1c3807-73a6-49c5-a59e-ec097d8caddf`

> Ce document définit **des tests à réaliser**. Ce ne sont pas des résultats. Les tests CI publics non authentifiés sont séparés des tests multi-comptes qui nécessitent un environnement autorisé.

## 1. Méthode et environnement

1. Vérifier que le projet Floot **existant** est accessible, lire la version actuelle et les logs. Ne pas supposer les sources identiques à l'audit du 9 octobre.
2. Reconstituer la structure d'API et les contraintes SQL depuis les sources : l'ancien dépôt GitHub ne fait **pas** foi pour le serveur actuel.
3. Ne jamais utiliser le compte ou l'inventaire d'un vrai joueur. Priorité aux tests unitaires avec doubles de services/transaction ; pour les E2E authentifiés, exiger des comptes de test dédiés, un contexte isolé et des autorisations claires. L'essai précédent de création/nettoyage de comptes de test dans une seule exécution a été bloqué : ne pas contourner cette restriction.
4. Obtenir avant les mutations de test une stratégie de nettoyage sûre ou utiliser une base dédiée. Une simulation ne doit pas faire croire à un parcours de production validé.
5. Capturer les résultats sans exposer de cookies, JWT, mots de passe, e-mails personnels, données individuelles ou secrets.
6. Ne pas publier si un scénario **P0** a échoué et reste non corrigé ; documenter explicitement les scénarios non exécutés.

### États de résultat

**RÉUSSI** : résultat et preuve observés.  
**ÉCHEC** : résultat contraire à l'attendu.  
**BLOQUÉ** : outil, accès ou environnement absent.  
**NON TESTÉ** : pas encore exécuté.  
**SANS OBJET** : hors périmètre, justification écrite.

Conserver pour chaque scénario : date/heure UTC, version Floot, environnement, méthode, résultat, référence du test ou journal **expurgé**, correctif et nouveau résultat le cas échéant.

## 2. Comptes et sessions — priorité P0

| ID | Scénario | Attendu | Moyen conseillé |
| --- | --- | --- | --- |
| A01 | Visiteur anonyme → `GET /_api/auth/session` | HTTP 401 ; aucune donnée de joueur | Contrôle public existant |
| A02 | Visiteur anonyme → collection/profil/booster | HTTP 401 ; ni inventaire ni compte divulgué | Contrôle public existant |
| A03 | Compte de test A → connexion correcte | Session reconnue ; identité A seulement | E2E isolé |
| A04 | A → déconnexion normale → appel privé | Session révoquée, appel privé refusé, UI non connectée | E2E isolé |
| A05 | Déconnexion → erreur réseau ou réponse HTTP 500 simulée | Aucun faux succès ; message de reprise ; cache et serveur cohérents | Test simulé |
| A06 | Expiration ou révocation serveur simulée → collection | Reconnexion demandée ; pas d'inventaire conservé visiblement comme s'il était actuel | Test isolé |
| A07 | Mutation profil A lancée → connexion B avant réponse A | Pseudonyme, identité, cache et interface de B inchangés | Test retard artificiel |
| A08 | Booster A lancé → connexion B avant réponse A | Aucune modale/collection A affichée pour B ; attribution A reste dans A | Test retard artificiel |
| A09 | Deux comptes dédiés A et B → lecture des collections | Chaque compte lit uniquement ses propres données ; A ne peut cibler B | Test isolé |
| A10 | Rechargement ou nouvel onglet avec session valide | Identité cohérente, pas de connexion fantôme | Navigateur isolé |
| A11 | E-mail avec majuscules/espaces → inscription/login | Normalisation cohérente ; pas de compte dupliqué par seule casse | Test isolé |
| A12 | Mot de passe oublié | Lien/code délivré et échange validé uniquement si domaine d'e-mail configuré ; aucune promesse non vérifiée | Environnement de test autorisé |

**Cas particulier A06 :** JWT, cookie et enregistrement de session doivent être cohérents. Le JWT a été corrigé à sept jours dans le code connu ; vérifier l'expiration effective côté serveur au-delà de la seule valeur du token.

## 3. Booster et persistance — priorité P0

| ID | Scénario | Attendu | Moyen conseillé |
| --- | --- | --- | --- |
| B01 | Premier booster du compte de test | Exactement 5 tirages, 5 exemplaires attribués, historique +1, quota activé | E2E isolé |
| B02 | Deuxième demande immédiate de ce compte | Refus de quota ; aucune modification d'inventaire/historique | E2E isolé |
| B03 | Deux POST simultanés sur compte ayant un statut de quota existant | Une attribution maximum ; pas de double débit | Test transactionnel |
| B04 | Deux POST simultanés sur un **compte neuf sans ligne** de statut booster | Une seule attribution ; traiter la course lors de l'initialisation de ligne (point spécifique à examiner) | Test transactionnel isolé |
| B05 | Échec forcé à l'intérieur de la transaction avant le commit | Aucune attribution partielle ; historique/quota/inventaire inchangés | Test avec service/DB de test |
| B06 | Réponse réseau perdue après commit de l'ouverture | Les 5 cartes existent au rechargement ; aucune nouvelle attribution sans quota | E2E simulé |
| B07 | Même carte tirée 2 fois dans un booster | Quantité augmentée de 2, pas d'exemplaire perdu | Test déterministe avec RNG simulé |
| B08 | Booster → déconnexion → reconnexion | Même inventaire et même historique serveur | E2E isolé |
| B09 | Quatre premiers emplacements, tirages aux seuils | Probabilités **55/27/12/4/2**, limites exactes | Unitaires Floot |
| B10 | Cinquième emplacement, tirages aux seuils | Aucun tirage Commun ; poids **27/12/4/2 sur 45** | Unitaires Floot |
| B11 | POST non connecté ou session expirée | Aucun tirage attribué ; statut HTTP adapté | Contrôle anonyme + test isolé |
| B12 | Deux sessions distinctes du même compte en parallèle | Un seul booster possible sur 24 h, indépendamment de l'appareil | Test transactionnel isolé |

**Points à auditer dans le SQL et le code, sans présumer de défaut :** existence d'une contrainte unique `(user_id, card_id)` sur l'inventaire, initialisation du verrou de quota pour un nouvel utilisateur, comportement d'un `INSERT ... ON CONFLICT`, choix de la transaction et de son niveau d'isolation, synchronisation de l'historique et des quantités. La structure réelle doit être lue avant toute requête.

## 4. Classeur et interface — priorité P1

| ID | Scénario | Attendu | Moyen conseillé |
| --- | --- | --- | --- |
| C01 | Catalogue visible sans session | 49 fiches, aucune possession personnelle inventée | Navigateur |
| C02 | Filtre « possédées » | Uniquement cartes de quantité positive | Test unitaire / navigateur connecté |
| C03 | Filtre « manquantes » | Uniquement quantité nulle | Test unitaire / navigateur connecté |
| C04 | Filtre « doublons » | Uniquement quantité supérieure à 1 | Test unitaire / navigateur connecté |
| C05 | Recherche texte puis filtre rareté | Intersection correcte, état vide explicite, remise à zéro possible | Navigateur |
| C06 | Complétion par rareté | Nombres corrects et total borné par le catalogue, sans confondre copies et cartes uniques | Test déterministe |
| C07 | Révélation progressive | Cinq cartes, ordre stable, clavier/Escape fonctionnels, pas de carte perdue si fermeture | Navigateur connecté/isolé |
| C08 | Export JSON du classeur | Uniquement données du compte connecté, quantités et identité cohérentes, fichier bien formé | Test isolé |
| C09 | Déconnexion après consultation | Les données de A ne restent pas visibles lorsque B arrive | E2E deux comptes |
| C10 | Page française et accessibilité | `html lang=fr`, intitulés des champs, focus, contrôle de mouvement réduit | Navigateur, revue |
| C11 | Mobile 393 px / 412 px et tablette 820 px | Aucun débordement gênant, contrôles accessibles, modales visibles | Playwright/screenshot |
| C12 | Erreur serveur sur collection | État d'erreur et possibilité de relancer, sans fabriquer une collection vide comme si elle était confirmée | Simulation API |

## 5. Contrôles publics déjà disponibles

Script préexistant : `scripts/check_floot_public.py` — accueil, connexion et quatre APIs privées en accès anonyme (6 assertions HTTP, précédemment réussies).  
Nouveau dossier dédié : `floot-e2e/` — `public.spec.mjs`, `playwright.config.mjs`, `test_public_check.py`.  
GitHub Actions : `.github/workflows/floot-public-smoke.yml` (**déclenchement manuel uniquement**).

Pour les tests unitaires réseau simulé :

```bash
python -m unittest discover -s floot-e2e -p 'test_public_check.py' -v
```

Pour les six contrôles HTTP publics réels :

```bash
python scripts/check_floot_public.py
```

Pour les tests navigateur, après installation de `@playwright/test@1.56.1` et Chromium :

```bash
npx playwright test --config=floot-e2e/playwright.config.mjs
```

**Ne pas confondre** les tests `e2e/` historiques (ancien prototype local) et les tests `floot-e2e/` ciblant l'application active. Les tests navigateur nouvellement créés **n'ont pas encore été exécutés sur la version publique** : ils peuvent révéler des défauts de responsive ou de formulaire.

## 6. Critères de publication et retour arrière

**Pas de mise en ligne** si échec non résolu sur authentification, séparation des comptes, attribution de boosters ou cohérence des données.

Avant publication :
- [ ] Lecture des sources Floot actuelles + typecheck propre.
- [ ] Suites Floot pertinentes passées.
- [ ] Tests unitaires et d'intégration nécessaires pour le lot, ou limites explicitées.
- [ ] Vérification navigateur au moins sur l'accueil et la connexion.
- [ ] Checkpoint de **code** enregistré, avec description du lot.
- [ ] Publication sur le domaine existant, statut `succeeded` vérifié.
- [ ] Smoke test public post-déploiement.
- [ ] Mise à jour du journal `docs/FLOOT_SUIVI_AUTONOME.md`.

**Retour arrière :** un checkpoint Floot concerne le code/configuration, pas une sauvegarde de la base ni une remise à l'état antérieur de la production. Il faut préparer séparément les sauvegardes/migrations de base et vérifier leur disponibilité. Ne pas restaurer un checkpoint sans évaluer l'impact de schéma.

## 7. Ordre concret pour préserver le quota Floot

1. Rassembler les sources nécessaires avec `read_files` et `list_files` plutôt que des appels répétés.
2. Vérifier les risques A04–A08 puis B03–B05.
3. Implémenter seulement les corrections justifiées.
4. Tester immédiatement le premier lot ; conserver assez d'actions pour typecheck, tests et publication.
5. Publier un lot stable ; si le quota manque, **ne pas** publier en aveugle.
6. Ajouter les preuves et le reste à faire au suivi GitHub.

**Règle :** aucun compte, collection ou règle du jeu ne doit être modifié pour faciliter les tests. Aucun secret ni donnée personnelle ne doit être ajouté au dépôt public.

## Références

- [Plan priorisé du 10 octobre](PLAN_REPRISE_2026-10-10.md)
- [Audit de reprise précédent](FLOOT_REPRISE_2026-10-09.md)
- [Suivi autonome](FLOOT_SUIVI_AUTONOME.md)
