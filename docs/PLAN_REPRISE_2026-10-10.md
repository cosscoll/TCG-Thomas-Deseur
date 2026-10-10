# TCG Deseur — Plan d'intervention du 10 octobre 2026

> **Modification de priorité du 9 octobre à 14:30 UTC :** la consigne la plus récente est de concentrer les développements sur **collection, rareté, doublons, progression et classeur**, pendant que les visuels sont encore en cours de création. La section « comptes » demeure un critère de sécurité mais **le premier lot produit à intégrer devient le modèle de collection**, dont les 28 tests ont déjà réussi sur GitHub : [modèle](../floot-collection/collection-model.mjs), [conception](CONCEPTION_COLLECTION_FLOOT.md). Ne pas remplacer les cartes ni leurs identifiants. Le calendrier ci-dessous reste un inventaire des risques techniques et doit être réordonné suivant cette priorité.


**Préparé le :** 9 octobre 2026 — aucun changement applicatif Floot effectué dans ce document.  
**Application active :** https://budget-illimite-tcg.floot.app  
**Projet Floot existant :** `1d1c3807-73a6-49c5-a59e-ec097d8caddf`  
**GitHub :** archive historique et documentation, **pas** source de déploiement Floot.

**Plan actualisé après la session du 9 octobre :** [livrables de collection](COLLECTION_LIVRAISON_2026-10-09.md). L'espace doublons, la progression, le bilan d'ouverture, l'historique et le diagnostic des quantités sont déjà préparés et testés sur GitHub. **Ne pas recommencer ces modules de zéro.** Priorité suivante : adapter les fonctions à la réponse réelle de `collection_GET` et au classeur Floot, sans toucher aux illustrations. Les anciens risques de session restent des contrôles de sécurité obligatoires avant publication.

> **Livraison réalisée le 10 octobre 2026 :** l'intégration du classeur au vrai Floot est effectuée et publiée. Source de vérité pour la suite : [compte rendu d'intégration](FLOOT_INTEGRATION_2026-10-10.md). Les étapes de ce plan décrivant l'intégration comme future sont désormais historiques ; la priorité suivante est une recette authentifiée isolée et des vérifications visuelles, et non de reconstruire les modules sur GitHub.

## But de la session

Fiabiliser les **comptes**, l'**ouverture des boosters** et le **classeur** en s'appuyant sur le code Floot existant. Aucun combat, PvP, illustration, paiement, monnaie, changement de domaine, migration destructive ou création d'un autre projet.

**Floot :** quota de développement de 100 actions/jour atteint le 9 octobre. Réinitialisation annoncée le **10 octobre à 09:00 UTC (11:00 à Paris)**. Recontrôler le quota à la reprise ; un ancien blocage n'est pas un blocage actuel. Économiser des actions en lisant des fichiers par lots et en validant par chantier.

## 0. Reprise sûre (P0, avant toute modification)

- [ ] Confirmer `get_publish_status`, l'identifiant Floot, le domaine public et le statut du déploiement ; **ne pas** renommer le sous-domaine.
- [ ] Lire `list_files` puis les sources **actuelles** (la documentation peut avoir du retard) : `helpers/useAuth.tsx`, `helpers/getSetServerSession.tsx`, `helpers/getServerUserSession.tsx`, `pages/_index.tsx`, `endpoints/auth/logout_POST.schema.ts`, `endpoints/auth/logout_POST.ts`, `endpoints/auth/session_GET.ts`, `endpoints/booster_POST.ts`, `endpoints/collection_GET.ts`, `endpoints/profile_POST.ts`.
- [ ] Consulter les logs serveurs et navigateur ; si une erreur est rapportée, commencer par les logs, puis la reproduction.
- [ ] Contrôler en **lecture seule** le schéma et les données agrégées : comptes, sessions, catalogue (49), inventaire, ouvertures et historique. Ne pas exposer d'adresses e-mail, jetons ou inventaires individuels.
- [ ] Comparer **chaque identifiant historique et sa rareté** avec un export Floot contenant **uniquement** `id` et `rarity` : `node scripts/compare_floot_catalogue.mjs <fichier-cartes-sans-donnees-joueurs.json>`. Le comparateur a passé **12 tests unitaires locaux et 43 tests GitHub globaux**, mais **le vrai catalogue PostgreSQL n'a pas encore été exporté ou comparé**. Vérifier les noms des colonnes et les slugs depuis le schéma réel avant de produire le fichier.
- [ ] Noter la version Floot et les checkpoints déjà créés : `f77054b1-6146-4bb5-be51-459f2e078178` et `a918f096-11de-401b-91c9-4f0695639b6d`.
- [ ] Ne pas assimiler la présence de code à un test concluant. Préserver le déploiement existant tant que les corrections ne sont pas validées.

## 1. Lot A — Authentification et isolation (P0, à faire d'abord)

### A1. Déconnexion serveur et cache React Query

**Piste issue de l'audit du bundle publié, à reproduire :** le client de déconnexion pourrait parser une réponse HTTP d'erreur sans vérifier `response.ok`, tandis que l'état client est déjà remis à `null`.

**Intervention :**
- [ ] Contrôler le client `postLogout` et `useAuth.logout`.
- [ ] N'annoncer une déconnexion réussie qu'après confirmation serveur. Une panne réseau ou un statut d'erreur doit rester visible et récupérable.
- [ ] Empêcher le partage accidentel du cache `tcg-collection` entre deux identités. Favoriser des clés de requêtes incluant `userId` et nettoyer/invalider les requêtes au changement d'identité.
- [ ] Prévoir un résultat cohérent si la session est déjà expirée côté serveur (HTTP 401) ; ne pas bloquer l'utilisateur sur une interface incohérente.

**Critères d'acceptation :** déconnexion normale puis `GET /_api/collection` → 401 ; refus simulé de déconnexion → pas de faux message de succès ; rechargement cohérent.

### A2. Résultats asynchrones après changement de compte

**Piste à confirmer :** succès d'ouverture ou de changement de pseudo arrivant après déconnexion/connexion d'un autre compte.

- [ ] Vérifier les callbacks de mutation dans `pages/_index.tsx`.
- [ ] Identifier l'utilisateur au déclenchement de la mutation et ignorer tout succès tardif si la session courante est différente.
- [ ] Ne pas réinjecter l'ancien compte via `onLogin` après reconnexion d'un autre joueur.
- [ ] Ne pas ouvrir la révélation des cartes A dans la session B.

**Critères :** session A lance booster/profil → réponse retardée → déconnexion A et connexion B → aucun pseudo, inventaire ou modal de A dans B.

### A3. Expiration / révocation

- [ ] Contrôler `staleTime: Infinity` dans `helpers/useAuth.tsx` et les mécanismes de rafraîchissement.
- [ ] Tester un HTTP 401 sur les endpoints collection, booster et profil avec une session expirée **de test**.
- [ ] Distinguer « connexion requise » d'une erreur réseau/serveur.
- [ ] Vérifier cohérence JWT, cookie, enregistrement et expiration de session (un changement récent a aligné l'expiration JWT sur sept jours).

**Critères :** expiration/revocation détectée, reconnexion proposée, aucune donnée d'une session précédente réutilisée.

## 2. Lot B — Boosters et classeur (P0/P1)

### B1. Test transactionnel et concurrence

**Invariants existants à préserver :**
- Catalogue : 49 identifiants fixes, raretés 17/15/10/4/3.
- Cinq cartes par booster.
- Quatre premiers emplacements : 55 % commune, 27 % rare, 12 % épique, 4 % légendaire, 2 % secrète.
- Cinquième emplacement : Rare minimum, poids 27/12/4/2 sur 45.
- Un booster gratuit toutes les 24 heures par joueur (provisoire).
- Tirage cryptographique et attribution exclusivement serveur ; transaction et verrouillage côté PostgreSQL.

**Tests isolés à exécuter si l'outillage et les autorisations le permettent :**
- [ ] Joueur A : première ouverture → HTTP 200, cinq cartes dans l'inventaire, historique +1, quota décalé d'environ 24 h.
- [ ] Joueur A : deuxième ouverture immédiate → refus ; inventaire et historique inchangés.
- [ ] Joueur B : deux demandes simultanées → **exactement une seule** ouverture gagnante et une réponse de quota, total cinq cartes.
- [ ] Après nouvelle connexion : mêmes cartes, exemplaires, quantités, historique et compteur.
- [ ] Trois appels anonymes aux API privées → 401 (déjà contrôlé, réexécuter seulement si pertinent).
- [ ] Contrôler les doublons lorsque la même carte apparaît plusieurs fois : quantité cumulée exacte et indications de révélation cohérentes.
- [ ] Simuler une réponse réseau perdue après validation serveur : ne pas permettre un deuxième booster, recharger l'état plutôt que réattribuer.

**Ne jamais consommer les boosters des comptes réels pour tester.** Ne jamais créer/supprimer des comptes de test sans vérification des permissions et du mécanisme de nettoyage. Un essai de tests multiutilisateur automatisé a été bloqué précédemment : ne pas le contourner.

### B2. Classeur et UX

- [ ] Vérifier les filtres possédées/manquantes/doublons/rareté, recherche insensible aux majuscules et état « aucun résultat ».
- [ ] Contrôler la progression totale et par rareté, plus l'affichage des quantités réelles.
- [ ] Tester la révélation progressive : cinq cartes, fermeture/réouverture, retour au classeur, clavier et mobile.
- [ ] Tester export JSON : il doit concerner uniquement le joueur connecté et être cohérent avec les données serveur.
- [ ] Vérifier responsive iPhone ~393 px, Pixel ~412 px, tablette ~820 px et desktop ; scroll horizontal, tailles tactiles, contrastes, focus, modales, `prefers-reduced-motion`.
- [ ] Vérifier `lang="fr"` dans le HTML publié et les libellés accessibles.

## 3. Lot C — Préparation au lancement (P1/P2)

- [ ] Examiner délivrabilité des codes de récupération de mot de passe Floot ; domaine d'expédition à vérifier. **Ne pas annoncer opérationnel pour tous les joueurs sans test.**
- [ ] Préparer l'export des données personnelles et une procédure de demande de suppression, sans détruire un compte réel.
- [ ] Préparer un export **versionné** du code Floot dans un emplacement GitHub distinct du prototype ; vérifier correspondance des fichiers, dépendances et version. Ne jamais copier secrets, variables d'environnement, jetons ou données joueur.
- [ ] Documenter une stratégie de sauvegarde PostgreSQL distincte des checkpoints de code ; aucun export de base ne doit être revendiqué sans exécution réelle.
- [ ] Réévaluer seulement après validation des fonctionnalités principales le besoin d'optimisation de performances/SEO/PWA.

## 4. Stratégie de tests et publication

1. **Reproduction → correction → contrôle TypeScript → tests unitaires → tests d'intégration isolés → contrôle dans le navigateur.**
2. Les suites unitaires Floot existantes `helpers/themeMode.spec.tsx` et `helpers/getBoosterRarity.spec.tsx` avaient passé avant la dernière publication. Réexécuter après modification.
3. Le script GitHub `python3 scripts/check_floot_public.py` vérifie six contrôles **publics/anonymes seulement** ; il ne valide pas un parcours utilisateur connecté.
4. Publier **sur l'application Floot existante uniquement** si le lot est suffisamment vérifié ; créer d'abord un checkpoint nommé.
5. Attendre le statut explicite `succeeded` du job de publication, puis revérifier les pages et API publiques. Sur échec, ne pas annoncer la version comme publiée.
6. À chaque lot, documenter exactement : **développé / testé / publié / opérationnel / blocages**.

## 5. Ordre recommandé et définition de terminé

**Séquence minimale réaliste pour la première session avec quota :**
1. Relire sources et journal des erreurs.
2. Reproduire et corriger A1 (déconnexion) et A2 (mutations tardives) si avérés.
3. Vérifier A3 (expiration).
4. Contrôler TypeScript, suites unitaires et scenarios isolés autorisés.
5. Checkpoint + publication + contrôle si suffisamment concluants.
6. Si du quota reste, commencer B1 (concurrence).

**Terminé signifie** : code présent + test adapté observé + publication confirmée si demandée + parcours fonctionnel réellement vérifié. Les quatre états peuvent être différents.

## 6. Sécurité et périmètre

Ne pas créer de projet parallèle, ne pas revenir à Supabase, ne pas activer les anciennes migrations sous `supabase/`, ne pas modifier le prototype historique de combat, ne pas introduire de visuels fictifs. Ne pas modifier les règles d'acquisition ou l'identité des 49 cartes sans accord. Aucun paiement, abonnement, domaine, migration destructive ou suppression de données réelles sans autorisation explicite.

## Sources de transmission

- [Reprise technique du 9 octobre](FLOOT_REPRISE_2026-10-09.md)
- [Suivi autonome](FLOOT_SUIVI_AUTONOME.md)
- [README du dépôt](../README.md)
- [Script de contrôle HTTP public](../scripts/check_floot_public.py)

**Important :** les pistes A1/A2/A3 viennent de l'audit antérieur du frontend public, **pas** d'un test connecté concluant. Les vérifier contre les sources Floot actuelles avant d'appliquer les corrections.
