# TCG-Thomas-Deseur — corrections de sécurité (5 novembre 2026)

## Périmètre
Le jeu est publié sur https://tcg-thomas-deseur.floot.app. Les sources dans `floot-app/` sont une copie de référence et un commit GitHub ne déploie pas Floot. GitHub Pages n'héberge pas les comptes ni le serveur.

## Mesures appliquées et publiées
- Vérification de l'origine des requêtes sur les 10 routes POST (Origin, Sec-Fetch-Site), contrôle de la taille déclarée du corps (16 Kio).
- Codes cadeaux : dix essais maximum par utilisateur et par fenêtre de quinze minutes, enregistrés en PostgreSQL avant l'analyse du code, même si ce dernier est invalide.
- Récupération : HMAC-SHA-256 avec clé serveur pour les codes à huit chiffres, au lieu d'un hachage sans clé. Les codes de récupération créés avant le changement doivent être redemandés.
- Migration additive appliquée : `security/tcg-gift-attempt-windows.sql` ; aucune collection de joueurs supprimée.

## Contrôles exécutés
- Vérification TypeScript : sans erreurs.
- Tests Jasmine ciblés : validés.
- Tests de prévisualisation : requêtes intersites refusées (403), booster/cadeau anonymes refusés (401).
- Publication de la version renforcée le 5 novembre 2026.

## Restant à traiter
1. Domaine d'envoi de réinitialisation non vérifié ; `noreply@example.com` reste une adresse d'exemple dans le code.
2. Protection complémentaire contre les inscriptions automatisées : quota par source et vérification des e-mails.
3. Tests de concurrence et de limite sur des comptes de recette séparés ; surveillance des erreurs réelles.
4. Sauvegardes restaurables, droits d'accès aux secrets, export et suppression des données et revue juridique.
5. Audit indépendant de la plateforme et tests d'intrusion autorisés.

Ce travail réduit des risques identifiés, sans être une certification de sécurité ou une revue exhaustive.
