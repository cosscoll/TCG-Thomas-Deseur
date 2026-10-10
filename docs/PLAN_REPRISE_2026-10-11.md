# Plan de reprise TCG Deseur — dès réouverture des actions Floot

**Plan consolidé le 10 octobre 2026.** Ceci n'est pas une tâche automatisée ni une garantie de travail en arrière-plan. Reprise à effectuer pendant une nouvelle session d'intervention, avec état du quota vérifié en temps réel.

**Floot production** : projet `1d1c3807-73a6-49c5-a59e-ec097d8caddf` — https://budget-illimite-tcg.floot.app  
**Code de conception/recette** : https://github.com/cosscoll/TCG-Thomas-Deseur  
**Quota bloqué le 10 octobre, réinitialisation indiquée le 11 octobre 2026 à 09:00 UTC.**

## A. Priorité sécurité/recette : finaliser les modifications déjà enregistrées dans Floot

Lire d'abord [FLOOT_SESSION_2026-10-10_FIN_DU_QUOTA.md](FLOOT_SESSION_2026-10-10_FIN_DU_QUOTA.md) ; les correctifs de session, la validation pré-tirage de 49 cartes et la navigation clavier **existent dans l'éditeur Floot, mais ne sont pas publiés**.

1. Relire l'arbre et les fichiers source courants Floot. Ne jamais écraser sans comparaison.
2. Exécuter `typecheck`, `run_tests` et notamment `helpers/tcgBinderRender.spec.tsx`. Le test de modale avait échoué sous jsdom/Radix à cause de constructeurs `Event` incompatibles, puis un correctif de l'environnement de test a été écrit mais **pas réexécuté** (quota). Vérifier et réparer sans cacher un défaut réel de focus.
3. Vérifier que les réponses privées `/_api/collection` et les réponses de session et booster utilisent une politique de cache appropriée, idéalement `private, no-store`, et que l'invalidation du client ne laisse pas les possessions du compte A visibles sur le compte B. Ne pas inventer de résultat pour deux comptes authentifiés sans véritable test autorisé.
4. Vérifier la transaction de booster, ses contraintes serveur 24 h et le pool exact 49 ID (17/15/10/4/3) sans ouvrir de booster réel.

## B. Deux bugs *détectés sur le site publié*, encore non corrigés

**Langue manquante** : [issue #6](https://github.com/cosscoll/TCG-Thomas-Deseur/issues/6). Chromium desktop/mobile voit `<html translate="no">` sur `/` et `/login`, sans `lang="fr"`. Corriger dans la configuration de document HTML global réellement utilisée par Floot, pas dans le prototype statique indépendant. Ajouter tests d'accueil/connexion/inscription si possible.

**Débordement à 820 px** : [issue #7](https://github.com/cosscoll/TCG-Thomas-Deseur/issues/7). Audit sur le jeu public : scrollWidth de **868 px pour 820 px de viewport**, soit 48 px. Diagnostic Chromium identifiant deux zones :
- Le décor `div._cardBack_1cxu7_1` de la page d'accueil, dont le bord droit atteint **868 px**.
- Le badge injecté `a#__Floot-madewithFloot` (branding du plan gratuit), bord droit **856 px**, avec certains descendants jusqu'à 860.

Adapter les règles responsive du héros (`cardsHero`, `cardBack`) et le positionnement supporté du badge pour rester dans l'écran **sans enlever le branding Floot**. Ne pas masquer l'ensemble par `overflow-x:hidden` sans traiter la cause.

**Preuves publiques :** [première recette](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38076417867) et [diagnostic des éléments débordants](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38076585497). Les échecs sont réels et ne doivent pas être supprimés des tests. Le premier run avait 20 réussites, 5 échecs (4 lang + 1 débordement) et 1 exclus.

## B bis. Vérification complémentaire du cache privé

Le contrôle réseau anonyme du 10 octobre 2026 a relevé **HTTP 401 sans `Cache-Control` et sans `Vary`** pour `/_api/collection`, `/_api/auth/session`, `/_api/profile` et `/_api/booster` : [exécution GitHub Actions](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38076774561). Aucun cookie n'est renvoyé lors du rejet anonyme. Ce seul constat **n'est pas la preuve d'une fuite ou d'un cache partagé**, mais les réponses **authentifiées** doivent être contrôlées avant de considérer la confidentialité du cache validée. Voir [issue #8](https://github.com/cosscoll/TCG-Thomas-Deseur/issues/8) pour le plan `Cache-Control: private, no-store`, tests et recette. Ne jamais se connecter avec de vrais comptes pour ces contrôles.

**Amélioration autonome de la CI :** `.github/workflows/floot-public-smoke.yml` a deux jobs indépendants : `anonymous-security` (6 contrôles Node sans navigateur ni compte, `scripts/check_floot_guest_security.mjs`) et `smoke` (pages publiques Chromium + accessibilité + responsive). Un échec visuel n'annule plus les résultats de sécurité. Les anciennes observations de 5 échecs visuels restent **réelles** et leur test n'a pas été désactivé.

## C. Fonctionnalités prêtes sur GitHub, à adapter après fiabilisation

**Preuve qualité :** [155 tests Node + 66 tests Chromium réussis](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38076323343). [Spécification](EVOLUTION_COLLECTION_2026-10-10.md).

- `floot-collection/collection-forecast.mjs` : chance mathématique exacte d'au moins une carte manquante au prochain booster, nouveaux IDs *distincts* attendus, rareté premium ; simulation par nombre de cartes possédées dans chaque rareté.
- Rangs provisoires calculés uniquement sur les IDs collectés, sans packs/monnaie/bonus : seuils 0/1/5/10/20/30/40/49.
- Atelier `floot-collection/demo.html`, `demo.mjs`, `demo.css` : carte 3D CSS recto/verso, cinq révélations successives, signalement premier exemplaire/doublon, respect du mouvement réduit. Cet atelier utilise **cinq cartes fictives prédéterminées** et n'a aucune API de récompense.
- **Ne pas importer aveuglément les modules JavaScript directement dans Floot** : adapter au code React/TypeScript et à la réponse authentifiée `collection_GET`. La prédiction doit utiliser uniquement des quantités venant du serveur, et l'animation uniquement un tirage `booster_POST` déjà confirmé côté serveur.
- Ne générer ni ne remplacer les illustrations en cours de création.

## D. Conditions de livraison

1. Tous les fichiers de production modifiés doivent passer **typecheck**, tests métier Floot, vérification des invariants de rareté et tests d'interface isolés.
2. Créer un checkpoint Floot signifiant, puis **publier sur le domaine existant**, attendre `succeeded`.
3. Vérifier HTTP public accueil/connexion, API privée en 401 sans cookies, assets JS contenant les nouveautés, et la recette Chromium live 320/393/412/820 desktop/mobile. La CI publique se déclenche sur changements dans `floot-e2e/**` ou `.github/workflows/floot-public-smoke.yml`, ou manuellement ; **un déploiement Floot ne déclenche pas automatiquement ces tests GitHub**.
4. Ne déclarer que les contrôles effectivement exécutés comme réussis ; si les tests de comptes autorisés manquent, le dire explicitement.
5. Mettre à jour le statut des issues #6/#7/#8 et le compte-rendu après correction vérifiée.

**Pas de tâches récurrentes TCG sans instruction explicite du propriétaire.**
