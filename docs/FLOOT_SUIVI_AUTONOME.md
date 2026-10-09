# Suivi autonome — TCG Deseur

## État au 9 octobre 2026

**Demande :** compléter l'audit, puis développer le projet en autonomie sans attendre des demandes « continue ».

**Programmation : préparée, non activée.** La tentative de création a renvoyé `too_many_active_automations` : cinq tâches actives pour une limite de cinq. Aucun automatisme existant n'a été changé. Aucun achat ni changement d'abonnement n'a été réalisé.

**Rythme proposé :** une session quotidienne vers midi, fuseau Europe/Paris, à partir du 10 octobre 2026. Ce créneau se situe après la réinitialisation Floot annoncée à 09:00 UTC. La planification serait flexible ; l'heure exacte d'exécution ne serait pas garantie.

**Action nécessaire pour l'activation :** libérer un créneau avec l'accord de Cosme, puis créer la tâche « Développement TCG Deseur ». Ne pas annoncer qu'elle fonctionne tant que la création n'est pas confirmée et qu'une exécution n'a pas été observée.

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
