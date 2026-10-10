# TCG Deseur — Préparation des prochaines mécaniques de collection

Date : 10 octobre 2026. **Travail effectué sur GitHub uniquement.**
L'application jouable reste sur [Floot](https://budget-illimite-tcg.floot.app), distincte de la démonstration de GitHub Pages. Les derniers correctifs Floot relatifs à la sécurité et au classeur sont toujours **non publiés**, en attente de quota et de validation ([reprise précise](FLOOT_SESSION_2026-10-10_FIN_DU_QUOTA.md)).

## 1. Prévision mathématique des nouvelles cartes — implémentée sur GitHub

**Source :** `floot-collection/collection-forecast.mjs` ; **tests** : `tests/floot-collection-forecast.test.mjs`.

Le calcul lit le catalogue validé de 49 cartes et un **inventaire fourni explicitement**, qui peut être fictif. Il ne lit ni cookie, ni compte, ni état client persistant, ne génère pas de tirages et ne crée aucune récompense.

Hypothèses du serveur actuel : chaque emplacement 1–4 tire indépendamment une rareté avec probabilités **55 % Commune, 27 % Rare, 12 % Épique, 4 % Légendaire, 2 % Secrète** ; le cinquième est toujours Rare ou mieux, avec poids normalisés **27/45, 12/45, 4/45, 2/45**. À rareté fixée, les cartes sont équiprobables ; les doublons sont possibles entre emplacements.

Pour chaque rareté `r`, on définit `N_r` cartes totales, `M_r` cartes manquantes, `w_r` probabilité de la rareté dans un emplacement ordinaire et `v_r` probabilité au cinquième :

- **Probabilité d'une carte manquante dans un emplacement normal** : somme des `w_r × M_r/N_r`.
- **Probabilité d'une carte manquante au cinquième** : somme des `v_r × M_r/N_r`.
- **Au moins une nouvelle carte au prochain booster** : `1 - (1-p_normal)^4 × (1-p_final)`.
- **Nouvelles cartes *différentes* attendues dans le booster** : somme sur les raretés de `M_r × [1 - (1-w_r/N_r)^4 × (1-v_r/N_r)]`. Cela évite de compter deux fois une carte absente obtenue à plusieurs emplacements dans le même booster.
- **Au moins une Légendaire ou Secrète** : `1-(1-0.06)^4×(1-6/45)`, quel que soit le contenu initial du classeur.

Ce sont des chances **théoriques pour la prochaine ouverture**, pas une prédiction personnalisée de ce que le serveur va donner, ni une estimation de délai avant collection complète. La probabilité d'au moins une carte manquante est de **100 % avec une collection vide** et de **0 % avec une collection complète**.

**Interface développée :** onglet Probabilités, cinq barres par rareté, résumé chance de découverte / moyenne des cartes uniques / chance de rareté premium, et curseurs permettant d'essayer librement un inventaire fictif par rareté. Le bouton Réinitialiser revient au scénario choisi. Les changements des curseurs **ne modifient jamais le classeur**.

## 2. Rangs du collectionneur — implémentés sur GitHub

Calculés uniquement à partir des **IDs de cartes uniques**, et **sans monnaie, XP, objet, pack ou récompense**. Les seuils sont provisoires et doivent être validés comme règle produit avant d'être considérés comme officiels :

| Cartes uniques | Rang indicatif |
| ---: | --- |
| 0 | Débutant |
| 1 | Découvreur |
| 5 | Explorateur |
| 10 | Collectionneur |
| 20 | Passionné |
| 30 | Connaisseur |
| 40 | Expert |
| 49 | Collection complète |

Une carte obtenue dix fois ne fait pas progresser le rang davantage qu'une seule copie.

## 3. Ouverture des boosters en 3D — prévisualisation uniquement

Dans l'onglet **Bilan booster**, une séquence 3D CSS montre cinq cartes **prédéterminées**, déjà utilisées dans le récapitulatif fictif :
`matelas, matelas, matelas, matelas, fontaine`.
La première occurrence est une découverte, les trois suivantes sont des doubles, la cinquième (Rare) respecte le slot garanti. Chaque clic révèle une seule carte. Rejouer remet l'aperçu à zéro.

**Cette animation ne génère aucun tirage**, n'appelle aucun endpoint, ne demande pas de compte et ne modifie aucune collection. Le mode système `prefers-reduced-motion` retire les transitions. Des placeholders neutres remplacent les illustrations qui ne sont pas prêtes.

## 4. Validation et publication

Suites CI GitHub : `npm test` (logique), tests Playwright Chromium ordinateur/mobile pour les six vues, changements de scénarios, curseurs, révélation et vérification de l'absence de POST, audit Axe WCAG 2.0/2.1 A/AA. **Les résultats doivent être confirmés dans GitHub Actions après le dernier commit**, ne pas déduire leur réussite de leur simple création.

GitHub Pages reste une **prévisualisation statique** et ne constitue pas une publication du jeu Floot. Après le rétablissement du quota Floot, il faudra :

1. Priorité absolue : terminer les tests des correctifs Floot déjà en attente, régler le test jsdom/Radix, contrôler `Cache-Control` et l'authentification, checkpoint, publier et vérifier la version active.
2. Porter la logique analytique sans rupture vers l'API et le classeur Floot existants ; **ne pas exposer de nouveau tirage client**.
3. Examiner si les seuils de rang sont approuvés pour l'usage public ; ils restent provisoires dans l'aperçu.
4. Adapter les transitions 3D au composant de révélation existant plutôt que de créer un second parcours concurrent. Préserver la réponse déjà confirmée par le serveur et le traitement du même ID plusieurs fois.
5. Exécuter typecheck, suites Floot, tests des comportements de comptes autorisés, sauvegarde/checkpoint, publication, puis vérification du code réellement servi en production.

**Aucune illustration n'a été générée ou remplacée. Aucun compte ou inventaire joueur n'a été touché.**
