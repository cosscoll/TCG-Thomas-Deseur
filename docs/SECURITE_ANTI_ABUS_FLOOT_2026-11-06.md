# Protection anti-abus des inscriptions et comptes — TCG Deseur

Date : 6 novembre 2026. **Source préparée ; non activée sur Floot tant que la migration SQL et les tests réels ne sont pas passés.**

## À déployer dans cet ordre

1. Exécuter dans Floot Postgres le SQL idempotent `security/tcg-auth-ip-rate-windows.sql` ; vérifier l'existence de la table `tcg_auth_ip_rate_windows` et sa clé primaire.
2. Mettre en ligne les helpers Floot `tcgIpDigest.tsx` et `tcgAuthRateLimit.tsx`, puis les six endpoints modifiés de `floot-app/endpoints/`. **Ne jamais publier les endpoints avant la création de la table.**
3. Vérifier le typage et les tests Floot ; publier l'application.
4. Tester avec des comptes de recette créés pour le projet : inscription, connexion, récupération de mot de passe, échange de code cadeau, création de code administrateur.
5. Tester les réponses 429 après dépassement du quota avec des comptes *de test*, sans affecter les joueurs réels.
6. Contrôler les logs d'erreur et confirmer qu'aucune adresse IP brute, donnée de session ou mot de passe n'est journalisé.

## Limites par adresse IP Floot, fenêtre glissante par tranche de temps

| Opération | Maximum | Fenêtre |
| --- | ---: | --- |
| Inscription | 8 | 60 minutes |
| Connexion | 40 | 15 minutes |
| Demande de récupération | 8 | 60 minutes |
| Vérification d'un code de récupération | 20 | 15 minutes |
| Échange d'un code cadeau | 30 | 15 minutes |
| Création d'un code (administrateur) | 15 | 15 minutes |

Le compteur est atomique et persistant en PostgreSQL, partagé entre toutes les instances Floot. La clé est une empreinte HMAC SHA-256 dérivée de `JWT_SECRET` et de l'en-tête d'IP **fiable fixé par Floot**, `x-floot-client-ip`. Les IP ne sont pas sauvegardées en clair. Une IP absente ou invalide utilise une valeur de repli commune (protection stricte).

**À ne pas confondre :** ces limites ne vérifient pas les adresses e-mail et ne remplacent pas le CAPTCHA, l'activation des comptes, une MFA administrateur ou l'audit de restauration. Le quota e-mail du serveur doit être configuré indépendamment.

## En cas d'incident

Si les nouveaux endpoints rendent des erreurs 500, commencer par vérifier la présence de la migration SQL. En urgence, restaurer dans Floot la précédente version des endpoints, sans supprimer les comptes ni les données existantes. La table additive peut rester en base sans effet sur les anciens endpoints. Aucun cron ni automatisation planifiée n'est créé.
