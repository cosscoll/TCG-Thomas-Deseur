# Collection, boosters et comptes — branche dédiée

**Objectif produit prioritaire :** la chasse aux cartes, le classeur et les comptes. Le moteur de combat n'est pas modifié par ce chantier.

## Parcours fonctionnel aujourd'hui, sans backend

1. Le joueur ouvre un **booster de démonstration** contenant cinq cartes.
2. La cinquième carte est obligatoirement Rare, Épique, Légendaire ou Secrète.
3. Les cinq cartes sont conservées dans un **classeur de démonstration enregistré en localStorage**.
4. Le classeur distingue les cartes obtenues, à découvrir et en double. Il affiche le pourcentage de complétion, les cinq niveaux de rareté et les dernières ouvertures.
5. L'état persiste après rafraîchissement, sur le même navigateur/appareil.

**Les cartes de démonstration ne sont pas des cartes officielles**, ne sont pas synchronisées et ne doivent jamais être importées automatiquement dans un compte serveur. Un utilisateur peut modifier localStorage. Sans serveur, on ne peut garantir ni la rareté ni la propriété des cartes.

### Probabilités de référence

Pour les quatre premiers emplacements, les chances par emplacement sont :
| Rareté | Probabilité |
| --- | ---: |
| Commune | 55 % |
| Rare | 27 % |
| Épique | 12 % |
| Légendaire | 4 % |
| Secrète | 2 % |

Pour le dernier emplacement (Rare minimum), les poids 27/12/4/2 sont renormalisés sur 45 (donc Rare 60 %, Épique ~26,67 %, Légendaire ~8,89 %, Secrète ~4,44 %).

Un booster peut contenir plusieurs exemplaires de la même carte. Les doublons sont conservés et comptabilisés. Ces taux et politiques sont **provisoires** : à approuver avant l'ouverture officielle, en particulier s'il existe ultérieurement de la monnaie virtuelle, des achats, ou des systèmes d'échange.

## Préparation des comptes réels

La branche intègre `account/config.js`, `account/client.js`, `account/panel.js` et `account/cloud-collection.js`, ainsi qu'une migration SQL complète :

`supabase/migrations/20261009_tcg_accounts_collection.sql`

### La migration prévoit
- Inscription/connexion via Supabase Auth avec validation par e-mail et récupération de mot de passe.
- Profil par compte avec pseudonyme modifiable.
- Catalogue de 49 IDs correspondant à la version actuelle du site.
- Inventaire séparé pour chaque utilisateur et accessible en lecture **uniquement à ce compte (RLS)**.
- Historique des boosters et compteur de packs pour chaque joueur.
- Fonction serveur `tcg_claim_daily_booster()`, exécutée sur l'identité authentifiée, effectuant le tirage, la mise à jour de l'inventaire et l'historique **dans une seule transaction**.
- Attribution côté serveur : l'utilisateur ne choisit ni ses cartes, ni sa rareté, ni le compte crédité.

### Limite volontaire de pré-lancement
Une **proposition initiale** est codée dans la migration : **un booster gratuit par compte toutes les 24 heures** (premier booster disponible immédiatement). Cette règle est réversible avant déploiement et doit être approuvée dans les règles de jeu.

### Activation — non encore réalisée
Le connecteur Supabase ne retourne aucun projet à ce stade. Il faut :
1. Créer ou connecter un projet Supabase de **développement** ; choisir l'organisation et la région.
2. Configurer Supabase Auth (URL du site, URLs de redirection, confirmation d'e-mail, fournisseur SMTP et protections anti-bots).
3. **Faire examiner et tester la migration SQL dans un environnement de développement avant application.**
4. Remplir dans `account/config.js` l'URL Supabase et la clé **publishable/anon**, jamais `service_role` ou une clé secrète.
5. Tester les parcours inscription, confirmation, connexion, pseudonyme, récupération de mot de passe, déconnexion, premier booster, délai 24 h, historisation, doublons et rafraîchissement.
6. Tester un scénario de **deux utilisateurs distincts** : lecture, écriture et attribution de cartes d'un autre compte doivent échouer ; vérifier double-clic, concurrence et tentative de dépasser le quota.
7. Vérifier la suppression/export de données, la confidentialité, les emails transactionnels, la limitation des comptes abusifs et les règles RGPD avant l'ouverture au public.

**Important :** la migration est écrite, pas appliquée. Aucune authentification réelle ni collection serveur n'a été testée dans Supabase à ce jour. Les tests Chromium portent sur la démonstration locale et les états inactifs.

## Tests
- `npm test` couvre la collection, l'historique, les doublons, les cas malformés et les modules historiques.
- Le workflow **E2E Collection Budget Illimite** vérifie les parcours desktop, téléphone 390 px, clavier, ouverture, filtre et persistance après actualisation.
- Le frontend public `main` reste non modifié jusqu'à validation et fusion volontaire.

## Priorités suivantes
1. Valider les règles d'acquisition (gratuité, fréquence, récompenses, taux de rareté).
2. Raccorder un environnement Supabase et réaliser des essais avec deux vrais comptes de test.
3. Verrouiller et éprouver les RPC d'attribution, quotas et RLS.
4. Préparer une bêta de collection ouverte à un petit groupe, puis seulement une mise en production.
5. **Combat/PvP reporté** explicitement.
