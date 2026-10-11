# TCG Deseur — feuille de route opérationnelle (11 octobre 2026)

**Objet :** conserver les choix terminés par le créateur, livrer la collection publique, sécuriser les boosters, puis seulement intégrer la nouvelle édition dans le jeu actif.

**État de référence :** collection validée le 11/10/2026, comprenant **67 cartes de base, 38 illustrations alternatives et trois groupes écartés**. Il n'existe à ce jour **aucune illustration Shiny produite** dans cette sélection.

## 0. Références et frontières techniques

| Composant | Emplacement | État |
| --- | --- | --- |
| Choix originaux du créateur | `data/choix-cartes-2026-10-11.json` | Confirmés, inclut Picasso Deseur et ses deux alternatives |
| Manifeste strict / passerelle de migration | `data/catalogue-valide-67.json` | Préparé, pas intégré à Floot |
| Générateur vérifiable | `scripts/build-approved-catalogue.mjs` | Préparé |
| Catalogue public GitHub Pages | `collection-validee/` | Code publié sur `main`, rendu sur l'URL publique non encore certifié |
| Ancien simulateur à 160 illustrations | `collection-161/` | Conservé séparément comme démonstration historique |
| Application active | Projet Floot `1d1c3807-73a6-49c5-a59e-ec097d8caddf` | Comptes et boosters réels ; **pas encore synchronisé** avec les 67 cartes |
| Projet Supabase ancien | Historique uniquement | **Ne pas réactiver** sans raison |
| Code Floot en production | Projet Floot connecté | Source de vérité pour l'auth, les tirages, le quota, la BDD |

**Point essentiel :** ne jamais annoncer une synchronisation de la collection dans Floot uniquement parce que GitHub Pages a été modifié. Ne jamais attribuer de cartes ou de boosters depuis un script statique GitHub Pages.

## 1. Sprint P0 — booster du propriétaire, priorité absolue à la reprise de Floot

**Contrainte constatée le 11/10/2026 :** Floot refuse les actions de développement, quota journalier atteint (100 actions). Prochain réarmement annoncé : 12 octobre 2026 à 09:00 UTC (11 h à Paris). Ce verrou empêche toute réparation et toute opération directe sur le compte dans la présente session. Recontrôler le quota à chaque reprise ; ne pas considérer le réarmement comme une exécution automatique.

### Diagnostic avant toute mutation

1. Lire `get_logs` (serveur, navigateur si disponible), puis les journaux de production via la procédure officielle Floot.
2. Inspecter le code **actuel** des fichiers `endpoints/booster_POST.ts`, `endpoints/collection_GET.ts`, `endpoints/completion_POST.ts`, `endpoints/auth/session_GET.ts`, la logique du bouton booster dans `pages/_index.tsx`, le schéma et les tests associés.
3. Lire le schéma PostgreSQL, la table des comptes, des délais/quotas, des historiques et des inventaires **en lecture seule**. Identifier le compte par l'adresse exacte communiquée en privé dans le chat, sans l'inscrire dans ce dépôt ni dans un log public.
4. Distinguer : non-connexion/401, 403, délai de 24 h légitime, 429, défaut d'état du client, catalogue incomplet, problème de transaction ou erreur 500. Vérifier si le bouton est bloqué visuellement ou si le serveur refuse effectivement une ouverture.
5. Établir le comportement attendu à partir du code actuel. Ne pas confondre le blocage de l'outil Floot (quota de développement) avec un blocage du joueur en production.

### Intervention et preuves

1. Corriger la cause globale si elle empêche tous les joueurs d'ouvrir un booster, sans supprimer la limitation générale ni la vérification côté serveur.
2. Si le compte du créateur est seul concerné, vérifier identité et état en base. La demande privée autorise à corriger **ce compte**, pas à toucher aux comptes des tiers. Si le besoin réel est un déblocage manuel de la prochaine ouverture, privilégier une **exception ciblée, auditable et unique**, après vérification du schéma et de ses effets sur l'historique, plutôt qu'un quota illimité ou des cartes accordées en masse.
3. Éviter de consommer un booster réel pendant les tests non nécessaires. Tests unitaires transactionnels d'abord, E2E sur environnement dédié quand disponible. Ne jamais prétendre avoir vérifié un parcours authentifié sans l'avoir exécuté.
4. Checkpoint Floot, `typecheck`, suites métier, `publish_app`, attente du succès effectif, puis contrôle du site public et de l'API. Consigner le résultat ou les blocages.

**Critère de fin P0 :** le propriétaire peut ouvrir un booster selon le droit qui lui a été accordé, et le serveur crée exactement cinq cartes + une trace de tirage dans la bonne collection. Une affirmation de réussite doit reposer sur une vérification réelle ; sinon noter « non vérifié ».

## 2. Sprint P1 — fiabilisation du catalogue GitHub (indépendant de Floot)

- **Source de vérité :** les choix du créateur sont sauvegardés sans modifier ses noms, sans retirer une alternative et sans créer de nouveaux costumes.
- **Modèle :** 67 personnages/cartes de base, chaque personnage possède un rendu principal et 0..N variantes. Les 38 variantes illustrées sont attachées à leurs personnages et **ne sont pas des personnages distincts**.
- **Pas de Shiny fictif :** aucune variante Shiny n'a été demandée/produite dans la sauvegarde actuelle ; conserver un emplacement futur sans générer une fausse image.
- **Intégrité :** toutes les illustrations utilisées doivent correspondre au même groupe `COST-XXX`, et toutes doivent exister dans `collection-161/assets/cards`.
- **Export :** produire un manifeste JSON reproductible, avec ID de groupe, nom exact, illustration, photo source et toutes les alternatives. Ne jamais mettre de données personnelles/joueurs dans cet export public.
- **Recette :** tests Node + Chromium sur desktop/mobile, navigation et filtres, Picasso Deseur (2 alternatives), images non cassées, absence de débordement à 320/393/820 px, états vides.
- **Publication :** vérifier le dépôt GitHub **et** l'URL GitHub Pages après propagation. Si l'HTTP public n'est pas testable, l'écrire explicitement et ne pas présenter le déploiement comme confirmé.
- **CI :** `Verify TCG Deseur` doit se déclencher lors des modifications à `collection-validee/**`, `tri-177/**`, `data/**` et `tests/**`.

**Livré dans le dépôt :** choix validés, galerie publique, manifeste reproductible et tests. **À vérifier :** statut réel des actions GitHub et affichage HTTP public.

## 3. Sprint P2 — intégration **contrôlée** des 67 personnages dans Floot

**N'y procéder qu'après le rétablissement et la recette des boosters P0.**

1. Relire les données et IDs de production. Le dernier état documenté utilisait un catalogue historique à **49 cartes** ; d'autres modifications existent probablement. Reprendre uniquement la version effectivement en place.
2. Sauvegarder les tables/catalogues/inventaires concernés et prendre un checkpoint avant migration. Ne pas toucher à l'historique des boosters déjà gagnés.
3. Définir la stratégie de mapping depuis les anciens IDs `td_...` vers les groupes validés, sans réécrire les possessions existantes de façon destructive. Conserver en archive les cartes historiques qui n'ont pas de mapping fiable.
4. **Bloqueur métier :** les 67 cartes et leurs variantes n'ont pas encore reçu des raretés officielles. Ne pas affecter de rareté au hasard ni calculer des probabilités de booster sur des catégories arbitraires. Le système peut afficher les illustrations sans être rendu distribuable avant validation de cette règle.
5. Publier les 67 fiches avec leurs 38 visuels alternatifs, et des liens d'origine vérifiés si utiles. Les variantes d'une même carte partagent une identité de personnage : l'organisation des tirages de variantes devra être définie explicitement.
6. Les gains de progression et les conditions du booster final restent contrôlés côté serveur. Le public sait seulement qu'une collection complétée donne accès à un booster spécial. **Aucune identité, représentation, fichier ou propriété d'une surprise non annoncée ne doit apparaître dans le catalogue public, le JS livré au navigateur, les exports publics ni la documentation du site.**
7. Tests de non-régression pour quotas (24 h ou règle réellement en vigueur), hasard serveur, concurrence de deux requêtes, reconnexion, double appartenance, cartes manquantes/doublons, changements de compte, mobile et accessibilité.
8. Checkpoint, publication, recette du serveur vivant, rendu réel des cartes, aucun 404 d'images et aucune régression d'authentification.

**Critère P2 :** les 67 fiches et 38 illustrations alternatives sont visibles dans le jeu, correctement associées à l'inventaire serveur après migration prudente ; les comptes existants restent intacts. La distribution via boosters ne démarre qu'une fois les règles de rareté/variantes définies.

## 4. Sprint P3 — qualité produit et lancement

- Vérifier les problèmes Floot déjà identifiés : langue française `<html lang="fr">`, débordements autour de 820 px et en-têtes cache des routes privées (issues #6, #7, #8).
- Tester les pages 320/393/412/820/1280 px ; clavier, lecteur d'écran, labels, focus, animations réduites, contrôle des erreurs réseau.
- Vérifier le cycle d'un booster avec un compte de test : demande → attribution atomique → animation → cinq cartes reçues → inventaire → historique → recharge.
- Tester zéro, une, plusieurs variantes, filtres du classeur, recherche accentuée, export utilisateur sans information d'un autre compte.
- Faire un audit sécurité / RLS selon la base effective ; aucun secret d'API dans la page publique, jamais de distribution sans vérification du serveur.
- Documenter la version et les anomalies restantes, puis recontrôler la production après chaque publication.

## 5. Décisions à ne pas inventer

| Décision | Pourquoi elle doit être explicitement tranchée |
| --- | --- |
| Rareté officielle des 67 cartes | Influence directement les tirages et l'équilibrage |
| Disponibilité et taux d'apparition des 38 variantes | On sait quels rendus sont retenus, pas comment les joueurs les obtiennent |
| Variante comptant pour la complétion | À spécifier pour ne pas bloquer/débloquer prématurément les récompenses |
| Moment de bascule de l'ancien catalogue vers le nouveau | Préservation des comptes et historiques |

**Politique par défaut tant que ces décisions ne sont pas définies :** aucune mutation de progression ni de rareté. Les cartes peuvent être visualisées, mais pas être introduites silencieusement dans les tirages.

## 6. Traçabilité des livrables

- `data/choix-cartes-2026-10-11.json` : original des choix confirmés (67 Validée / 3 Écartée).
- `data/catalogue-valide-67.json` : projection publique stricte prête pour étude de migration.
- `scripts/build-approved-catalogue.mjs` : générateur sans accès aux comptes.
- `tests/catalogue-manifest.test.mjs` et `tests/collection-validee.test.mjs` : contrôles d'intégrité.
- `e2e/collection-validee.spec.mjs` : recette desktop/mobile du catalogue public.
- `collection-validee/` : galerie de référence indépendante du serveur Floot.
- `docs/PLAN_AUTONOME_SUITE_2026-10-11.md` : présent document.

**Intervention autonome = exécuter toutes les actions autorisées dans la session disponible, conserver les preuves, ne pas inventer de résultat, puis reporter uniquement ce qui est bloqué.** Cela ne signifie pas qu'un assistant continuera à développer une fois la conversation terminée ; une session explicite ou une tâche planifiée serait nécessaire pour une reprise future.
