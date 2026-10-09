# Comptes joueurs — intégration V0.2

## Statut
L'interface permet de se connecter, créer un compte, se déconnecter, demander et confirmer une réinitialisation du mot de passe, et synchroniser un deck de huit cartes **uniquement si un projet Supabase valide est connecté**.

Au 9 octobre 2026, le connecteur Supabase ne voit **aucun projet**. Les comptes sont donc explicitement **inactifs** dans la branche de développement. Aucun compte de démonstration fictif n'est présenté comme réel.

## Activer les comptes
1. Créer ou désigner un projet Supabase isolé pour le jeu et vérifier les paramètres d'authentification. Activer la confirmation e-mail et configurer un fournisseur e-mail adapté à la production, protection anti-bots et limitation des tentatives.
2. Dans Supabase Auth, ajouter l'URL de GitHub Pages correspondant au site à la liste des URL de redirection ; configurer Site URL.
3. Appliquer **en environnement de développement** la migration \`supabase/migrations/20261009_player_accounts.sql\`.
4. Remplir **seulement** \`url\` et \`publishableKey\` dans \`account/config.js\`. Jamais de clé \`service_role\`, token de gestion, mot de passe SMTP ou secret JWT côté client.
5. Tester l'inscription, le courriel de confirmation, la connexion, la récupération de mot de passe, la déconnexion et la restauration du deck sur deux comptes distincts.
6. Vérifier concrètement la RLS : un joueur ne peut ni lire, ni modifier, ni supprimer le deck d'un autre avec l'API publique et son propre JWT.

## Périmètre volontairement restreint
- Seuls les decks sont synchronisés à la demande (pas de fusion implicite ni d'écrasement du deck local lors d'une connexion).
- Les badges et statistiques solo sont toujours locaux. Un navigateur est entièrement contrôlé par le joueur : jamais prendre ces données comme source pour des récompenses, inventaires ou classement officiels.
- Une sauvegarde de deck \`text[]\` doit encore être validée côté serveur selon le catalogue du jeu lors de l'introduction d'une économie/matchmaking ; le contrôle de longueur seul ne suffit pas.
- L'authentification Supabase stocke sa session côté navigateur. Utiliser une politique CSP stricte et auditer la dépendance CDN avant une publication officielle.
- Prévoir politique de confidentialité, export/suppression de compte, règles anti-abus et support utilisateur avant lancement.

## Contrôles CI
\`npm test\` vérifie le moteur et des cas de capacités. L'authentification réelle **ne peut pas être validée en CI sans environnement Supabase dédié** et comptes de test isolés.
