# Installation réelle des comptes joueurs — Budget Illimité TCG

**Projet Supabase déjà créé :** `kanzeqhvwwesddrxcrmx`  
**Organisation :** TCG thomas deseur  
**Site :** https://cosscoll.github.io/TCG-Thomas-Deseur/

## Situation actuelle

- Le projet existe et son URL publique est renseignée dans `account/config.js`.
- L'intégration Supabase de ChatGPT répond **Permission denied** sur ce projet malgré plusieurs reconnexions. Ne pas répéter cette manipulation.
- L'interface de connexion/inscription sur GitHub est développée et testée en mode hors connexion.
- **La base SQL n'est pas installée et la clé publishable n'est pas renseignée. Aucun compte réel n'est encore actif.**

## Seule opération manuelle incontournable : installer la migration SQL

1. Ouvrir l'[éditeur SQL du projet](https://supabase.com/dashboard/project/kanzeqhvwwesddrxcrmx/sql/new).
2. Ouvrir [le script complet de migration](../supabase/migrations/20261009_tcg_accounts_collection.sql) sur GitHub (bouton Raw pour copier le texte intégral), puis coller le contenu dans l'éditeur SQL.
3. Cliquer sur **Run** une seule fois. **En cas d'erreur, conserver le message exact ; ne pas relancer au hasard.** Le script est transactionnel (BEGIN/COMMIT).
4. Exécuter la requête de contrôle de `supabase/VERIFIER_INSTALLATION.sql`. Les résultats attendus sont **49 cartes** et des tables/procédures présentes avec RLS.

### Deuxième étape, après succès du SQL

Ouvrir le projet dans **Settings → API Keys** ou le bouton **Connect → Publishable key**.

La clé `sb_publishable_...` est **publique** et destinée au code navigateur. Elle peut être mise dans `account/config.js` avec l'URL déjà enregistrée ; **NE JAMAIS transmettre** la chaîne de connexion PostgreSQL, le mot de passe de base, `service_role`, une clé `sb_secret_...` ou un token personnel.

La publication ne doit intervenir qu'après validation des tables/RLS et des URL de redirection.

### Configuration des e-mails

Dans **Authentication → URL Configuration**, configurer :
- Site URL : `https://cosscoll.github.io/TCG-Thomas-Deseur/`
- Redirect URLs : `https://cosscoll.github.io/TCG-Thomas-Deseur/`

Dans **Authentication → Providers → Email**, activer **Email** et **Confirm email** (recommandé). Supabase peut limiter le nombre d'e-mails avec son fournisseur par défaut ; prévoir un SMTP dédié avant une ouverture à un grand public.

### Contrôle avec comptes de test

Créer deux comptes avec des adresses de test distinctes. Vérifier inscription, confirmation e-mail, connexion/déconnexion, pseudo, récupération du mot de passe et séparation des collections (RLS). Ne pas déclarer l'inscription opérationnelle avant d'avoir fait ces essais réels.

Le SQL prépare également une **règle provisoire** de booster gratuit toutes les 24 h ; il ne faut pas considérer cette règle comme définitive et les ouvertures cloud ne doivent pas être annoncées officielles avant validation du gameplay économique. Aucune clé secret ne doit être publiée dans GitHub.

## Référence sécurité

- Les cartes ne sont jamais attribuées par `localStorage` quand un compte est connecté.
- Les tables joueurs sont protégées par RLS.
- La fonction `tcg_claim_daily_booster()` opère côté serveur et tient un verrou sur la disponibilité du booster.
- Toute mise en production requiert un audit des politiques RLS et un test de concurrence sur le tirage.
