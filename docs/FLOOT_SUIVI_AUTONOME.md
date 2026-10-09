# Suivi autonome — TCG Deseur

## Journal — avancement multi-lots du 9 octobre 2026, ~15:00 UTC

**Consigne :** ne pas s'arrêter après les doublons, avancer au maximum sur la collection, la progression, les boosters et l'historique, sans toucher aux illustrations.

- Nouveaux utilitaires : `collection-insights.mjs` (doublons par rareté, 15 jalons sans récompenses, historique daté fiable, bilan d'ouverture déjà confirmée, indicateur d'attente non autoritatif) et `collection-reconciliation.mjs` (diagnostic lecture seule entre tirage serveur et inventaire relu).
- La démonstration `floot-collection/demo.html` comporte maintenant **cinq espaces navigables** (collection, mes doublons, progression, historique, bilan booster) avec recherche, tris, compteurs, placeholders neutres, affichage mobile et données fictives indépendantes.
- Neuf tests Playwright spécifiques ont été écrits sous `e2e/binder-demo.spec.mjs`, **sans exécution réelle pour le moment**.
- **GitHub Actions confirmée :** [120 tests Node réussis, zéro échec](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37948492892). Le premier passage avait détecté une attente erronée « 6 objectifs atteints » au lieu des 7 réels ; elle a été corrigée.
- **Aucune attribution, création de compte, achat, génération d'image ou modification Floot.** Le quota Floot bloquait toujours les actions au dernier contrôle. La démo GitHub est une préparation, non le jeu en production.
- Synthèse intégrale : [COLLECTION_LIVRAISON_2026-10-09.md](COLLECTION_LIVRAISON_2026-10-09.md). La priorité suivante est l'intégration au classeur React/Kysely **existant** lorsque les sources Floot seront accessibles, puis typecheck, tests fonctionnels, publication et visibilité en ligne vérifiées.

## Journal — validation Chromium, export et accessibilité (9 octobre 2026, soir)

**Travail concret effectué sur GitHub :** suite de tests navigateur Chromium avec versions ordinateur et mobile dans `.github/workflows/deploy.yml`, configuration `floot-collection/playwright.config.mjs`, tests de la démo et audit Axe `e2e/binder-accessibility.spec.mjs`.

**Défauts et améliorations :**
- Navigation clavier dans le détail des cartes : correction de la perte de focus lorsque le bouton suivant devient désactivé.
- Contraste WCAG : suppression de la transparence des cartes non possédées, conservation d'une distinction visuelle par fond et bordure.
- Export CSV sécurisé des 49 cartes et des quantités, avec bouton sur la démo non connectée et tests de téléchargement.
- Les scénarios navigateur vérifient les cinq vues, de nombreuses largeurs mobiles et tablette, le téléchargement, la navigation et les critères d'accessibilité sélectionnés.

**Preuves :** [48 tests Chromium réussis et 142 tests Node réussis, aucun échec](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37978835656). Un audit Axe sans violation relevée **n'est pas une certification WCAG globale** ; il couvre seulement les règles et les situations examinées.

**Gestion CI :** un seul run pertinent par branche, grâce à `cancel-in-progress` (les runs plus anciens peuvent apparaître « cancelled », sans signaler un bug).

**Limite inchangée :** ces fichiers sont dans GitHub ; **l'application Floot en production n'a pas été modifiée**, son quota de développement empêchant encore l'accès aux sources ce 9 octobre. La démo et ses données fictives ne doivent jamais remplacer les possessions du serveur.

## Journal de reprise de collection — suite de session du 9 octobre 2026

**Objectif du lot :** poursuivre l'expérience de collection sans demander de nouvelles décisions à l'utilisateur, sans créer de visuels et sans toucher aux possessions des joueurs.

**Livré dans le dépôt GitHub :**
- **Fiche de carte accessible** dans `floot-collection/demo.html` / `demo.mjs` / `demo.css` : modal native, nom/numéro/rareté, possession, quantité, doubles, navigation des fiches filtrées au clavier et fermeture Échap.
- **Navigation rapide** depuis chaque jauge de rareté vers les cartes correspondantes et depuis les chiffres de collection vers les Possédées, Manquantes et Doublons.
- **Accessibilité** : progression globale et progression des cinq raretés exposées comme barres de progression avec valeur courante.
- **Tests navigateur préparés** dans `e2e/binder-demo.spec.mjs` : fiches, clavier, changement de scénario, raccourcis par rareté et statistiques. Toujours **non exécutés en navigateur**.
- **Validation logicielle** : cinq tests de syntaxe ES modules ajoutés ; trois tests de conservation de la collection, dont **500 inventaires fictifs déterministes**, pour contrôler les égalités entre uniques, manquantes, exemplaires et doublons.
- **CI GitHub Actions `37950512726` : 130 tests Node réussis, zéro échec** le 9 octobre 2026. [Résultat](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37950512726).

**Production Floot :** aucun code de la collection publié dans Floot. Le quota gratuit 100/100 était toujours atteint au dernier contrôle, avec réinitialisation annoncée le **10 octobre à 09:00 UTC**. La démonstration GitHub Pages ne remplace pas le jeu et ne contient aucune donnée personnelle.

**Prochain vrai travail non réalisable avant accès Floot :** adapter les modules de collection déjà testés aux schémas actuels de `endpoints/collection_GET.ts`, `pages/_index.tsx`, `helpers/schema.tsx`, puis vérifier les deux comptes, la persistance et la liaison serveur. Contrôler types et tests avant checkpoint/publication. Aucune automatisation quotidienne TCG n'est active.

## Priorité utilisateur actualisée — 9 octobre 2026, 14:30 UTC

**Consigne la plus récente :** les illustrations des cartes ne sont pas terminées. Ne pas travailler sur de nouveaux visuels ni attendre les illustrations pour avancer. Concentrer les prochains travaux dans Floot **sur le classeur, les raretés, les cartes manquantes, la progression et la comptabilisation des doublons**. L'intégrité des comptes reste une contrainte de sécurité, mais ne doit plus absorber les développements de produit hors problème bloquant.

**Livrable GitHub dans la session :** `floot-collection/collection-model.mjs`, avec les fonctions de comptage des cartes uniques/exemplaires/doublons, progression par rareté, filtres, recherche, tri, badges de révélation et chances de rareté à afficher. **30 tests fonctionnels** validés dans GitHub Actions ; **73 tests Node réussis, 0 échec** : https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37945719773. Règles détaillées dans `docs/CONCEPTION_COLLECTION_FLOOT.md`.

**État Floot à 14:30 UTC :** application publique existante confirmée ; Floot refuse toujours les actions de développement (100/100) jusqu'à la réinitialisation annoncée le 10 octobre à 09:00 UTC. **Aucun changement de l'application active ni des possessions réelles**. Ne pas annoncer le module GitHub comme intégré ou publié dans Floot.

**Première étape lors de la prochaine session Floot :** lire `endpoints/collection_GET.ts`, `pages/_index.tsx`, `helpers/schema.tsx` ; vérifier la forme des données, puis intégrer les calculs et les filtres depuis le modèle testé **dans le classeur existant** (sans réinventer les visuels). Tester avec des données isolées, puis checkpoint et publication seulement après validation. Aucune automatisation récurrente n'est activée.

## Journal — aperçu de la collection, même session du 9 octobre 2026

- **Livrable supplémentaire :** une interface statique de démonstration créée dans `floot-collection/demo.html`, `demo.mjs` et `demo.css` : statistiques, jauges par rareté, filtres et tris, badges de doublons, placeholders neutres pour les visuels encore en fabrication. Elle utilise des **données de démonstration uniquement** et ne change aucun inventaire réel.
- **Tests :** sept tests statiques ajoutés sous `tests/floot-binder-demo.test.mjs`. Une première exécution a échoué sur un faux positif concernant un commentaire du fichier JS, puis le problème a été corrigé. La [dernière CI GitHub réussie](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37946338311) donne **80 tests réussis, 0 échec**.
- **Déploiement :** GitHub Pages a confirmé `completed/success` pour [ce workflow](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37946337589). **La requête HTTP directe vers l'URL Pages a échoué depuis les outils disponibles** (résolution DNS/accès interdit). Il est interdit d'affirmer que l'URL est vérifiée accessible et visible ; il faudra ouvrir la page dans un vrai navigateur pour lever cette incertitude.
- **Floot actif :** aucun changement. L'application `https://budget-illimite-tcg.floot.app` reste publiée, mais ne contient pas encore ce nouveau module.
- **Prochaine action :** tester l'aperçu en navigateur puis, lorsque Floot sera disponible, lire les composants du classeur courant et y intégrer les données/statistiques sans reconstruire toute l'interface.

## État au 9 octobre 2026

**Décision utilisateur la plus récente (13:42 UTC) : une seule session de travail à la fois, sans automatisation récurrente.** La tâche « Développement TCG Deseur » a été désactivée et « Brief du matin » réactivé le 9 octobre 2026. Les deux changements ont été confirmés. **Ne pas créer ni réactiver d'automatisation TCG sans nouvelle instruction explicite.**

**Mode de travail :** une session active commence lorsque l'utilisateur le demande. Dans cette session, choisir un lot concret, auditer, corriger, tester, puis livrer sans multiplier les confirmations. En dehors d'une session active, ne prétendre à aucune exécution de développement en arrière-plan. Les documents servent à conserver l'état et la prochaine étape.

**Blocage Floot du 9 octobre :** quota de 100 actions de développement atteint ; réinitialisation annoncée le 10 octobre 2026 à 09:00 UTC. Retester l'accès lors d'une nouvelle session ; ne pas supposer qu'un refus historique demeure actuel.

## Organisation opérationnelle — session manuelle, non planifiée

**Source active :** application Floot existante. **Sauvegardes documentaires :** GitHub. La file priorisée ci-dessous s'utilise à chaque session manuelle, et non comme programme d'exécution future automatique.

### Source de vérité et état connu

- **Floot actif :** projet `1d1c3807-73a6-49c5-a59e-ec097d8caddf`, application publique https://budget-illimite-tcg.floot.app. **Aucune création de nouveau projet.**
- **GitHub :** `cosscoll/TCG-Thomas-Deseur` contient prototype historique, catalogue, documents et vérifications publiques, mais **pas encore le code serveur Floot actuel ni une sauvegarde PostgreSQL**.
- **Documentation exécutable :** [plan du 10 octobre](PLAN_REPRISE_2026-10-10.md), [36 critères de recette](MATRICE_RECETTE_FLOOT.md), [audit des risques](FLOOT_REPRISE_2026-10-09.md).
- **Contrôle public :** `scripts/check_floot_public.py` (six contrôles précédemment exécutés) ; `floot-e2e/` et `.github/workflows/floot-public-smoke.yml` créés pour des tests publics **manuels**, sans authentification. L'exécution réelle des nouveaux tests Playwright et du workflow reste à confirmer.
- **Quota :** lors du dernier contrôle le 9 octobre, 100 actions Floot consommées ; relancer **une vérification fraîche** à la reprise, ne pas présumer que le blocage persiste.

### File d'exécution : une seule priorité technique active à la fois

| Ordre | Lot | Statut au 9 octobre | Fichiers/zone de travail | Condition de clôture |
| --- | --- | --- | --- | --- |
| 0 | Reprise de l'accès Floot et lecture des sources | En attente du quota | `list_files`, logs, helpers d'authentification, endpoints | Version identifiée, risques reclassés sur preuve |
| 1 | Déconnexion cohérente et cache entre comptes | À reproduire | `helpers/useAuth.tsx`, endpoint et schéma logout | Erreur réseau/500 ne crée pas de faux succès ; session serveur et UI cohérentes |
| 2 | Mutations tardives et session expirée | À reproduire | `pages/_index.tsx`, React Query, helpers session | Aucun pseudo/modal/inventaire de A n'apparaît dans la session B |
| 3 | Double ouverture de booster et atomicité | Non testé en conditions multiutilisateur | `endpoints/booster_POST.ts`, contraintes PostgreSQL, tests isolés | Un seul booster attribué en concurrence ; 5 cartes et quota cohérents |
| 4 | Classeur, filtres, révélation, export JSON | À vérifier en navigateur authentifié | `pages/_index.tsx`, CSS, endpoint collection | Persistance, doublons et 49 cartes cohérents ; mobile et clavier vérifiés |
| 5 | Récupération du mot de passe, export/suppression de données | Configuration à vérifier | `endpoints/auth/`, configuration e-mail | Tests de sécurité, délivrabilité vérifiée ; aucune suppression réelle |
| 6 | Export versionné code Floot et documentation | À préparer après déblocage | Dossier GitHub séparé du prototype | Correspondance avec Floot vérifiée, aucun secret, pas de prétendue sauvegarde DB |

Les lots 1 et 2 sont les premiers travaux **à exécuter** si le code confirme les soupçons. Ne jamais appliquer une correction simplement parce qu'elle figure dans un audit basé sur un bundle ancien.

### Règles de gestion du quota et des sessions

**Début d'une exécution**
1. Relire les consignes utilisateur et l'état le plus récent du suivi GitHub ; confirmer le vrai statut Floot.
2. Choisir **un** lot prioritaire non clos. Lire les sources concernées par groupe, sans répéter les mêmes audits.
3. Classer le problème : reproduit / suspect / non applicable. Pour un problème prouvé, corriger et ajouter un test pertinent.
4. Garder une marge de quota pour `typecheck`, `run_tests`, checkpoint et publication. Préférer une correction testée à plusieurs fonctionnalités inachevées.

**Fin d'une exécution**
1. Documenter l'heure, la version avant/après, le lot, le code réellement modifié, les tests exécutés, leurs résultats et les limites.
2. Créer un checkpoint après un lot cohérent et validé ; ne publier que si les contrôles suffisants ont été passés.
3. Vérifier explicitement la fin du job de publication. Un changement seulement dans GitHub n'est **pas** une publication Floot.
4. Laisser **une prochaine action précise** pour l'exécution suivante, pas une liste vague d'idées.

**Si le quota est bloqué :** ne pas retenter les appels à répétition. Travailler uniquement sur la documentation, les tests hors production et les questions de design technique sûres. Ne pas déplacer le développement vers GitHub Pages ou Supabase.

**Si une connexion manque :** consigner le blocage et ne pas prétendre avoir développé. Ne jamais intervenir sur les données réelles, contourner une restriction d'accès, prendre un abonnement ou contacter des tiers.

### Format standard du compte rendu

```text
Date/heure UTC :
Version Floot inspectée :
Lot choisi :
État avant / problème reproduit :
Code changé :
Tests réussis / échoués / non exécutés :
Checkpoint :
Statut publication et URL :
Base de données réelle touchée : non/oui (détails strictement agrégés) :
Bloqueurs :
Prochaine action précise :
```

L'objectif est de **faire avancer l'application, pas d'accumuler de la documentation**. Si le code devient accessible et qu'un problème reproductible est identifié, travailler directement sur sa correction.

## Journal — session du 9 octobre 2026 (à partir de 13:50 UTC)

**Périmètre de cette session :** préparation et correction des outils de contrôle publics, sans développement Floot direct (quota de 100 actions toujours connu comme atteint), sans création de comptes de test ni modification des inventaires réels.

**Résultats enregistrés dans GitHub :**
- `scripts/check_floot_public.py` : détection récursive des champs privés dans des réponses anonymes, y compris dans les objets imbriqués et les tableaux ; messages de diagnostic sans valeur privée.
- `floot-e2e/test_public_check.py` : trois tests supplémentaires (courriel imbriqué, jeton dans un tableau, métadonnée sans données personnelles), en plus des onze scénarios déjà présents.
- `floot-e2e/public.spec.mjs` : contrôle responsive préparé à **320, 393, 412 et 820 px** sur les pages `/` et `/login`, sans ouverture de booster ni utilisation de compte.
- Correction des références obsolètes à l'automatisation : **aucune tâche quotidienne TCG active**. « Brief du matin » a été réactivé conformément à la décision utilisateur.

**Vérifications observées :** 14 tests unitaires Python exécutés localement, **14 réussis, zéro échec** ; vérification de syntaxe JavaScript du test Playwright avec `node --check`, sans erreur. Les nouveaux tests Playwright **n'ont pas été exécutés contre le site Floot** : le réseau du conteneur ne permet pas d'atteindre l'hôte. Il n'est pas possible d'en déduire le comportement responsive réel.

**Publication active :** vérification `get_publish_status` : `published=true`, domaine `https://budget-illimite-tcg.floot.app`, visibilité publique, forfait Floot gratuit. Aucune publication ni modification applicative Floot dans cette session.

**Limites / prochaine action :** à la reprise des actions Floot, relire les helpers d'authentification et l'endpoint de déconnexion, reproduire les cas A04–A08 puis corriger les défauts démontrés. Ensuite exécuter `typecheck`, tests unitaires Floot et contrôles navigateur autorisés. Ne pas confondre les nouveaux contrôles anonymes avec un test des transactions, des comptes ou de PostgreSQL. Ne pas réactiver d'automatisation.

## Journal complémentaire — même session du 9 octobre 2026

**Chantier réalisé sans accès aux sources Floot :** nouveaux tests publics d'accessibilité et contrôles pour l'intégrité d'un futur export de code.

- Test Playwright `floot-e2e/accessibility.spec.mjs` créé : `html lang=fr` sur accueil/connexion, nom accessible des champs de connexion, navigation clavier. **Non exécuté contre Floot**, donc pas de validation UX revendiquée ; le constat antérieur sur `lang` reste à reproduire.
- Vérificateur `scripts/verify_floot_export.py` et 13 tests `floot-e2e/test_export_integrity.py` créés. **13 tests unitaires exécutés et réussis localement, zéro échec.** Ils couvrent empreintes, version, fichiers manquants, chemins traversants, liens symboliques, fichiers inattendus et manifeste invalide.
- Workflow manuel `.github/workflows/floot-public-smoke.yml` mis à jour pour inclure les tests hors réseau `test_*.py`. **Non déclenché** à ce stade.
- Guide `docs/SAUVEGARDE_CODE_FLOOT.md` rédigé ; **aucune sauvegarde effective du code Floot ou de PostgreSQL réalisée**.
- La publication Floot reste inchangée. La tâche TCG récurrente reste désactivée ; le projet ne doit être traité que lors d'une session expressément demandée.

**Prochaine intervention directe sur le jeu :** dès que le quota Floot autorise la lecture des sources, corriger seulement les défauts réellement reproduits sur la déconnexion / isolation / session, avec tests et publication conditionnés à un résultat valide.

## Journal complémentaire — vérification du catalogue historique (9 octobre 2026)

**Contexte :** la lecture/modification du code Floot est limitée par le quota ; aucune donnée de compte, aucune ouverture de booster et aucun changement applicatif n'ont eu lieu pendant ces travaux.

**Code et vérifications réalisés :**

- Comparateur en lecture seule `scripts/compare_floot_catalogue.mjs` : prend une liste publique/anonymisée `[{id,rarity}]` et compare chaque identifiant et rareté aux **49 cartes** définies dans `data/cards.js`. Détecte doublons, éléments manquants/inattendus et changements de rareté.
- Validation renforcée : noms de cartes au format slug strict et raretés canoniques seulement ; refus de champs additionnels afin de limiter le risque d'introduire des données personnelles dans les rapports de vérification.
- Tests `tests/floot-catalogue.test.mjs` : **12 scénarios passés localement**, comprenant également les identifiants ressemblant à des e-mails et les raretés non canoniques.
- **GitHub Actions : exécution 37943567646 réussie, 43 tests Node au total, 0 échec**, le 9 octobre 2026 à 14:21 UTC. Les nouveaux tests de comparaison sont intégrés à `npm test`.
- Tests du vérificateur de sauvegarde préparés précédemment : 13 scénarios réussis localement, non exécutés par le workflow GitHub CI du prototype.
- Tentative de lancement automatique supplémentaire des tests navigateur publics depuis GitHub : **refusée par les contrôles de sécurité de l'outil** ; aucun changement de déclencheur n'a été appliqué. Ne pas insister ou contourner ce refus.

**Floot publié :** inchangé à https://budget-illimite-tcg.floot.app. **Important :** le succès GitHub valide les tests du catalogue historique et des scripts, **pas** la concordance des 49 lignes réellement stockées dans PostgreSQL Floot, ni la connexion joueur, les boosters ou l'UX mobile.

**Prochaine action concrète en session, quand Floot redevient accessible :** lire la structure réelle de `tcg_cards` et exporter uniquement les slugs/raretés (aucune donnée personnelle), comparer avec `scripts/compare_floot_catalogue.mjs`, puis traiter l'authentification et la séparation des comptes selon [la matrice de recette](MATRICE_RECETTE_FLOOT.md). Valider, créer un checkpoint et publier uniquement après vérifications.

## Dernier travail livré

Documentation de reprise et contrôle public sauvegardés dans le commit `ac74b09de944142cc42c7c0fe8b0f2da7a960ee5` de `cosscoll/TCG-Thomas-Deseur`.

Le script `scripts/check_floot_public.py` a réussi six contrôles le 9 octobre à 12:37:47 UTC : accueil et connexion HTTP 200, API de session/collection/booster/profil HTTP 401 sans authentification. L'application Floot était déjà publiée ; aucun nouveau déploiement Floot n'a été réalisé.

L'audit du code serveur et de PostgreSQL reste bloqué par le quota de développement. Les pistes sur la déconnexion, les réponses tardives et les sessions proviennent de la lecture du frontend public ; elles restent à reproduire.

## Première action lors de la reprise

Relire la documentation courante dans GitHub, vérifier l'accès au projet Floot existant et compléter l'audit du code/base. Ne pas répéter inutilement les contrôles HTTP déjà réussis et ne pas considérer un ancien refus de quota comme un refus actuel.

## Consigne préparée pour chaque exécution

Reprends et fais avancer TCG Deseur en autonomie, dans ce même chat, sans attendre que Cosme écrive « continue ». Utilise le connecteur Floot et le projet EXISTANT 1d1c3807-73a6-49c5-a59e-ec097d8caddf, publié à https://budget-illimite-tcg.floot.app. Le dépôt connecté cosscoll/TCG-Thomas-Deseur conserve les archives et la documentation ; il n'est pas encore un export des sources Floot.

Commence par lire les versions courantes de README.md, docs/FLOOT_REPRISE_2026-10-09.md et docs/FLOOT_SUIVI_AUTONOME.md dans GitHub, ainsi que le document de reprise « Texte collé(1).txt » s'il est accessible dans ce chat. Ne dépends pas d'un chemin scratch d'une ancienne exécution. Vérifie les dernières consignes de Cosme et l'état réel du projet pour ne pas répéter du travail terminé ni écraser une modification concurrente.

Complète d'abord l'audit du code et de PostgreSQL qui était bloqué par le quota, puis corrige les défauts confirmés et enchaîne sur les priorités. Les pistes du 9 octobre sont la confirmation réelle de la déconnexion, les réponses booster/profil arrivant après un changement de session, l'expiration des sessions et les erreurs réseau. Ces pistes issues des bundles publics doivent être relues et reproduites, pas présentées comme déjà corrigées. Approfondis ensuite la séparation des comptes, l'atomicité et les ouvertures simultanées de boosters, la récupération du mot de passe, la persistance du classeur, la révélation, les filtres, l'accessibilité et le responsive.

Règles impératives : ne recrée pas d'application ; ne reviens pas à Supabase ; ne travaille que sur les comptes, les boosters et la collection. Conserve les 49 identifiants historiques, les collections existantes, cinq cartes par booster, une cinquième Rare ou supérieure et la règle provisoire d'un booster gratuit toutes les 24 heures. Conserve les probabilités actuelles. Aucun combat/PvP, aucune monnaie, boutique ou dépense, aucun changement d'abonnement, aucune création d'illustration ou de costume/personnage fictif. Ne supprime aucun compte ou donnée réelle ; ne fais pas de migration destructive ni de changement majeur d'infrastructure ou de domaine sans accord. Utilise des tests isolés autorisés, jamais les sessions des joueurs réels. Ne publie aucun secret, mot de passe, token, e-mail joueur ou inventaire individuel dans GitHub.

Vérifie Floot avec une lecture réelle à chaque reprise ; l'ancien refus de quota ne prouve pas un blocage actuel. Si une limite est réellement active, relève sa date de réinitialisation, ne multiplie pas les appels refusés et réalise seulement les autres tâches utiles indépendantes. Ne contourne pas les contrôles, ne crée pas d'infrastructure de remplacement et ne fais pas d'achat. Si une connexion ou une approbation bloque une action, décris précisément le blocage.

Avant de modifier, lis les sources actuelles et le guide Floot « floot-overview ». Travaille par ensemble cohérent et conserve une marge de quota pour vérifier et livrer. Contrôle les types, exécute les tests pertinents et corrige les échecs ; les contrôles anonymes HTTP ne suffisent pas à valider l'isolation ou la concurrence. Utilise les outils de test Floot et les scénarios API non destructifs ; effectue les tests navigateur quand ils sont accessibles et indique ce qui reste non testé. Crée un checkpoint après un lot validé ; publie sur le domaine EXISTANT seulement une version suffisamment vérifiée, puis confirme la fin du déploiement. Ne restaure pas un checkpoint pour contourner le quota ou sans vérifier ses effets.

Documente chaque exécution dans docs/FLOOT_SUIVI_AUTONOME.md : horodatage, version/commit/checkpoint, développements réalisés, résultats observés, état du déploiement, limites et prochain travail précis. Le code actif reste dans Floot. Prépare un export versionné séparé dans GitHub sans écraser les prototypes historiques ; n'annonce pas la sauvegarde du code ou de PostgreSQL sans l'avoir réellement effectuée.

Donne ici un compte rendu court et factuel lorsqu'un lot progresse, qu'une publication se termine ou qu'une décision est nécessaire. Distingue développé, testé, publié et opérationnel. N'envoie aucun message à d'autres personnes. Ne demande pas de confirmation pour les corrections, tests, documentation, checkpoints et publications suffisamment vérifiées déjà autorisés. Si toutes les priorités du périmètre sont réellement terminées et vérifiées, mets la tâche « Développement TCG Deseur » en pause et livre le bilan final.

## Journal à compléter après chaque session réelle

Ajouter la date, la version relue, le lot traité, les tests réellement exécutés et leurs résultats, le checkpoint, le statut final du déploiement, les blocages et la prochaine action. Ne pas inclure de secrets ou de données personnelles de joueurs.

Référence sur les tâches planifiées : https://learn.chatgpt.com/docs/automations
