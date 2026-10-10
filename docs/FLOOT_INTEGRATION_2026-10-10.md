# TCG Deseur — Intégration réelle Floot du 10 octobre 2026

## Résultat publié

**Projet de production :** `1d1c3807-73a6-49c5-a59e-ec097d8caddf` (Floot, PostgreSQL intégré).  
**URL conservée :** https://budget-illimite-tcg.floot.app  
**État :** publication Floot réussie le 10 octobre 2026, job `79101791-9a0f-4da6-8a4d-a870a7e66639` terminé avec `succeeded`.  
**Checkpoint Floot :** « Classeur TCG complet et comptes isolés », id `da85422a-28b7-466e-8d17-a07f424b7da6`.  
**Aucune base de données joueur modifiée manuellement.**

Le développement réalisé directement sur Floot remplace la simple préparation GitHub. **Le dépôt GitHub reste l'archive historique, la documentation et les suites d'essai de la démo, mais n'est pas le code de production Floot.** Ne pas recopier le code de l'ancien prototype GitHub comme production, ni migrer Supabase.

## Fonctions réellement intégrées à la page principale

- **`helpers/tcgCollection.tsx`** — validation des 49 cartes, des 5 répartitions, des inventaires et quantités, calcul des uniques/manquantes/doublons/copies et pourcentages, filtres combinables, tri, recherche tolérante aux accents, 15 jalons informatifs sans récompenses et export CSV protégé contre l'injection de formules.
- **`components/TcgBinder.tsx` + `components/TcgBinder.module.css`** — interface de collection privée utilisant directement la réponse authentifiée de `/_api/collection`. Statistiques cliquables, progression globale/par rareté, quatre rubriques « Mes cartes / Mes doublons / Objectifs / Historique », recherche et filtres, fiches dialog, placeholders neutres (aucun visuel fictif), CSV, responsive.
- **`pages/_index.tsx`** — intégration effective de `TcgBinder` au classeur existant, rendu conditionné à la session et `key={userId}` ; les réponses d'une mutation de booster ou de profil initiée sur un compte A sont ignorées lorsque l'utilisateur courant a changé.
- **`endpoints/auth/logout_POST.schema.ts` et `helpers/useAuth.tsx`** — refus d'une fausse réussite de déconnexion en cas d'erreur HTTP ou de payload non conforme ; effacement des caches de collection après confirmation serveur, pas avant.
- **Aucune modification des transactions de tirage** `booster_POST.ts`, du catalogue PostgreSQL ou des stocks de cartes.

### Historique et limitations de données

L'endpoint authentifié `collection_GET` expose `cards`, `owned`, `opened`, `nextAvailable` et les **10 dernières ouvertures** (identifiants des cinq cartes + date). L'interface affiche leur composition et rareté en se basant uniquement sur les identifiants connus. Elle **ne prétend pas reconstruire** le statut nouveau/doublon d'une ancienne ouverture, faute d'inventaire daté.

Le CSV produit uniquement les colonnes : ID, Carte, Rareté, Possédée, Exemplaires, Doublons supplémentaires. Il n'inclut ni identifiant de compte, ni e-mail, ni jeton. L'ancien export JSON personnel reste disponible séparément.

## Preuves techniques

- **Lecture DB en lecture seule :** `tcg_cards` contient exactement 49 cartes réparties 17/15/10/4/3.
- **Comparaison de tous les IDs/raretés à `data/cards.js` :** 49 sur 49 concordants, **aucun identifiant ou groupe de rareté manquant, nouveau ou modifié**.
- **Floot typecheck :** propre.
- **Floot Jasmine :** cinq suites exécutées, cinq réussies : `themeMode.spec.tsx`, `getBoosterRarity.spec.tsx`, `tcgCollection.spec.tsx`, `tcgBinderRender.spec.tsx` et `tcgLogout.spec.tsx`.
- **Déploiement Floot :** job terminé avec succès, même domaine maintenu.
- **HTTP du site publié en production :** GET `/` **200**, GET `/login` **200**, GET `/_api/collection` sans cookie **401**.
- **Vérification de l'actif frontend publié :** le script HTML `/_assets/index-CyGNFMGJ.js` référence le chunk de page `/_assets/_index-Bj7LXhvA.js` servi HTTP **200**, qui contient effectivement les libellés « Mes doublons », « Objectifs de collection », « Dernières ouvertures » et `tcg-deseur-ma-collection.csv`.

**Non vérifié :** parcours de connexion et collection avec un compte authentifié réel, persistance entre appareils, comportement visuel du classeur en production sur téléphone, concurrence réelle des boosters. Le preview Floot n'était pas ouvert dans un navigateur au moment de la tentative de capture ; la capture n'a pas été obtenue. Ne pas déduire un test end-to-end authentifié du succès des suites unitaires.

## Suite prioritaire (session future, pas tâche automatisée)

1. Tester en navigateur le vrai classeur avec **des comptes de test autorisés**, jamais sur les comptes/inventaires de joueurs existants, quand une méthode légitime et non destructive est disponible.
2. Contrôler la navigation responsive et les modales dans le site publié. Vérifier accessibilité, erreurs réseau, déconnexion et changement d'identité.
3. Vérifier la cohérence transactionnelle des boosters en environnement isolé sans consommer le quota de vrais joueurs.
4. Si les illustrations officielles arrivent, les associer aux IDs **sans changer les quantités, les raretés ou les comptes**.
5. Mettre à jour le journal GitHub après chaque nouveau changement Floot, puis refaire checkpoint/typecheck/tests/publication/contrôles publics.

**Aucune automatisation récurrente « développement TCG » ne doit être créée sans nouvelle demande explicite.**
