# TCG Deseur — backlog, dépendances, Definition of Done et indicateurs

Version 13 octobre 2026. Objectif immédiat : transformer l'édition Origine en bêta testable et stable, puis préparer un lancement explicitement validé.

## Sprints opérationnels, sans dates promises

### Sprint 0 — Base documentaire et sécurité des données (réalisé en grande partie)

Source de vérité des 67 noms et cinq raretés ; 38 alternatives rattachées ; 105 exports 3:4 ; source photos documentée ; tests de probabilité ; simulations ; plan d'intégration d'images SQL non destructif ; documentation de sauvegarde. Terminer seulement après revue des anomalies détectées.

### Sprint 1 — Correction P0 : boosters illimités en bêta (à réaliser dans Floot)

Issue #12. Une configuration serveur unique supprime le délai pour les boosters ordinaires ; GET collection et POST booster cohérents ; l'interface supprime le décompte en bêta. Protéger transaction, cinq cartes, historiques, doublons, récompense unique. Tests puis publication et recette autorisée avec deux ouvertures consécutives.

**Livrables :** code backend, types, interface, tests unitaires et E2E, checkpoint, déploiement prouvé, journaux vérifiés.

### Sprint 2 — Collection connectée et images (dépend du Sprint 1)

Issue #11 : 68 emplacements, 67 noms/raretés officiels, Carte mystère masquée, image principale/variante exacte, inventaire persistant, progression et archive ancienne. Préflight et migration des 105 liens vers le nouveau dossier public, aucun changement des comptes, du nombre d'exemplaires ou de la 68e privée. Tester mobile 320/393 et tablette 820.

### Sprint 3 — Qualité et bêta volontaires

Tests de compte/session, retour utilisateur, anonymisation des rapports, benchmark de chargement, monitoring des erreurs, maintenance des contenus. Prévoir audit de droits/identité et textes légaux avant diffusion large.

### Sprint 4 — Lancement officiel (dépend des décisions du propriétaire)

Décider de la règle officielle de quotas, des 38 variantes, des autorisations de diffusion, du canal support et de la stratégie de communication. Mettre en place sauvegardes testées, procédures incidents et indicateurs adaptés à la protection des données. Publication officielle seulement après accord du créateur.

## Dépendances critiques

Boosters illimités en bêta → pouvoir tester deux ouvertures → valider persistance et doublons → comparer visuels tirés → appliquer migration d'images → tester compatibilité mobile → inviter des joueurs.

Droits sur photos et représentation → autorisation des campagnes/teasers. Politique de confidentialité approuvée → activation d'analytique/retention. Règle définitive des variantes → calcul final de la complétion et textes de lancement.

## Definition of Done (DoD)

Un ticket est terminé lorsque :
1. L'objectif et les critères d'acceptation sont explicites.
2. Le code ou le document pointe vers un commit/version identifiable.
3. Les tests concernés sont verts ; les simulations sont étiquetées comme telles.
4. Les données et les secrets du joueur restent protégés ; pas de fuite du visuel privé.
5. Le bon site est réellement publié et un contrôle HTTP est passé.
6. Une recette utilisateur réelle est réalisée lorsqu'un compte authentifié est nécessaire.
7. La documentation et les messages visibles sont à jour ; les décisions non prises restent « à valider ».
8. Le retour arrière et les données existantes sont préservés.

Le succès d'un workflow GitHub Pages n'établit pas la réussite d'une publication Floot.

## Matrice de risques

| Risque | Impact | Prévention | Responsable de décision |
| --- | --- | --- | --- |
| Booster échoue en production | Critique | Logs SQL, tests transactionnels, reprise, recette réelle | Développement |
| Données de joueur perdues | Critique | Sauvegarde, migration avec préflight, pas d'écrasement | Exploitation |
| Secret exposé dans un fichier public | Critique | Contrôles publics + revues avant déploiement | Développement |
| Autorisations photo/personnalité absentes | Critique | Vérifier titulaires et consentements | Éditeur |
| Probabilités modifiées par accident | Élevé | Source de référence, tests des 100 seuils | Développement |
| Variantes comptées différemment | Élevé | Documenter politique provisoire, décision explicite | Créateur |
| Bugs responsive | Moyen | Tests Chromium + Safari/manuels | QA |
| Documentation datée du prototype 160 | Moyen | Documentation active séparée des archives | Coordination |

## KPI proposés (non collectés à ce jour)

- Ouvertures réussies (%) = POST autorisés validés / POST autorisés tentés.
- Cohérence du compte = nombre de copies après tirage - nombre de copies avant = 5 pour chaque booster réussi.
- Complétion par compte = personnages connus possédés distincts / 67.
- Doublons par compte = exemplaires totaux - personnages distincts.
- Fréquence des raretés = résultats par emplacement / ouvertures, comparés aux probabilités théoriques.
- Images disponibles = images 200 + décodables / 105.
- Bugs P0 ouverts, taux de reproduction et délai de correction.
- Inscription puis premier booster et rétention à définir seulement après examen RGPD.

Aucune valeur d'usage réelle n'est inventée dans cette liste.

## Tickets GitHub déjà ouverts

#12 : suppression 24 h en bêta. #11 : recette 68 cartes. #9 : comptes et vrai booster. #8 : cache privé. #7 : responsive 820 px. #6 : langue des pages. #1 : ancien moteur combat, hors priorité actuelle. Ne clôturer que sur preuves.

## Méthode de travail

Rassembler les modifications liées dans un lot, une seule publication après tests, conserver une trace des décisions, vérifier une nouvelle fois en production. Planifier le prochain lot seulement après avoir documenté les écarts du précédent.
