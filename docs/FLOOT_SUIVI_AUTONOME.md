# Suivi autonome — TCG Deseur

## État au 9 octobre 2026

**Demande :** compléter l'audit, puis développer le projet en autonomie sans attendre des demandes « continue ».

**Programmation : préparée, non activée.** La tentative de création a renvoyé `too_many_active_automations` : cinq tâches actives pour une limite de cinq. Aucun automatisme existant n'a été changé. Aucun achat ni changement d'abonnement n'a été réalisé.

**Rythme proposé :** une session quotidienne vers midi, fuseau Europe/Paris, à partir du 10 octobre 2026. Ce créneau se situe après la réinitialisation Floot annoncée à 09:00 UTC. La planification serait flexible ; l'heure exacte d'exécution ne serait pas garantie.

**Action nécessaire pour l'activation :** libérer un créneau avec l'accord de Cosme, puis créer la tâche « Développement TCG Deseur ». Ne pas annoncer qu'elle fonctionne tant que la création n'est pas confirmée et qu'une exécution n'a pas été observée.

## Organisation opérationnelle — 9 octobre 2026

**État : plan de travail enregistré, exécution récurrente non activée.** Une nouvelle vérification des tâches le 9 octobre constate cinq automatisations actives sur cinq, notamment deux briefs matinaux proches. Ne désactiver ni modifier aucune automatisation existante sans accord explicite. L'utilisateur a demandé un fonctionnement autonome ; la seule exécution de ce plan à une date future nécessitera un créneau de tâche et une création confirmée. Une tâche ChatGPT n'offre pas à elle seule une session Floot garantie : à chaque occurrence, vérifier les outils réellement disponibles.

**Créneau envisagé :** chaque jour vers **12 h, heure Europe/Paris**, en mode flexible, première date possible 10 octobre après la réinitialisation Floot annoncée à 09:00 UTC. Ne pas promettre une exécution à minute fixe.

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
