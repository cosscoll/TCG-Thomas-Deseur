# TCG Deseur — Le jeu de collection

Jeu de collection indépendant et non officiel inspiré des apparitions et personnages de Thomas Deseur.

**Application active :** https://budget-illimite-tcg.floot.app  
**Connexion :** https://budget-illimite-tcg.floot.app/login

## Plateforme de référence

**Le développement actif, les comptes et la collection serveur sont sur Floot.** Le projet à reprendre est `1d1c3807-73a6-49c5-a59e-ec097d8caddf`.

Ce dépôt conserve le catalogue historique, les prototypes, leurs tests et la documentation. **Il ne contient pas encore une sauvegarde du code actuel de Floot.** Aucun export ni mécanisme de synchronisation automatique n'est configuré ici.

| Emplacement | Usage |
| --- | --- |
| Application Floot | Jeu actif avec comptes, boosters et collection serveur |
| Ce dépôt GitHub | Catalogue historique, prototypes et documentation de reprise |
| GitHub Pages | Démonstration locale historique, indépendante des comptes Floot |
| `solo/` | Ancien prototype de combat, conservé en archive |
| `account/` et `supabase/` | Ancienne préparation Supabase, abandonnée ; ne pas l'activer |

Le prototype statique reste accessible à https://cosscoll.github.io/TCG-Thomas-Deseur/. Sa collection locale ne doit jamais être importée comme inventaire officiel.

## Périmètre actuel

Le chantier concerne uniquement les comptes joueurs, l'ouverture de boosters et le classeur.

L'application propose des boosters de cinq cartes, cinq raretés, une révélation progressive, un classeur avec filtres et recherche, un historique, la modification du pseudonyme et un export JSON. Le catalogue historique comporte 49 cartes.

La règle affichée est provisoire : **un booster gratuit par compte toutes les 24 heures**, avec une cinquième carte Rare ou supérieure. Le tirage et l'attribution doivent rester côté serveur. Aucun achat, aucune monnaie, aucun combat/PvP et aucune nouvelle illustration ne font partie du chantier actuel.

## État vérifié le 9 octobre 2026

Floot confirme que l'application est publiée. Les pages d'accueil et de connexion répondent HTTP 200. Les API de session, collection, booster et profil rejettent les appels anonymes avec HTTP 401.

**Ces contrôles ne valident pas un parcours joueur connecté**, la séparation de deux comptes, la concurrence des boosters, la délivrabilité des e-mails ou l'ergonomie mobile. La base et le code serveur n'ont pas pu être relus pendant cette reprise : le quota quotidien Floot était épuisé.

Résultats, blocage, points à corriger et méthode de reprise : [Reprise Floot du 9 octobre](docs/FLOOT_REPRISE_2026-10-09.md). Organisation du travail demandé en autonomie : [Suivi autonome](docs/FLOOT_SUIVI_AUTONOME.md). La programmation est préparée, mais son activation est bloquée par la limite de tâches actives.

## Vérifier la version publique

Le contrôle ci-dessous utilise uniquement la bibliothèque standard Python. Il teste deux pages et quatre refus d'accès anonymes ; il ne crée pas de compte, n'utilise aucune session et ne demande aucune récupération de mot de passe.

```bash
python3 scripts/check_floot_public.py
# Windows : py scripts/check_floot_public.py
```

Il affiche un résultat JSON et retourne un code non nul si un contrôle échoue. Il n'est pas encore intégré à un workflow planifié.

## Organisation historique du dépôt

```text
.
├── index.html                   Prototype statique de collection
├── styles.css                   Interface du prototype
├── app.js                       Contrôleur du prototype
├── data/cards.js                Catalogue historique des 49 cartes
├── game/                        Moteurs locaux et anciens modules
├── account/                     Ancienne intégration Supabase, inactive
├── supabase/                    Migrations historiques, ne pas appliquer
├── solo/                        Ancien prototype de combat
├── tests/                       Tests du prototype historique
├── e2e/                         Tests navigateur du prototype
├── scripts/check_floot_public.py Contrôle HTTP de l'application Floot
├── .github/workflows/           Workflows du prototype
├── docs/                        Documentation et archives
└── research/                    Recherches et références
```

Les documents marqués **Archive** décrivent d'anciennes étapes. Leurs instructions Supabase et leurs objectifs de combat ne sont plus le plan de développement.

## Tester le prototype historique

```bash
python3 -m http.server 8000
npm test
npm run balance
```

Ouvrir http://localhost:8000/. Ces commandes concernent le code historique de ce dépôt, **pas** l'application Floot ni sa base.

## Sauvegarde du code Floot à préparer

Après récupération de l'accès, exporter les sources réellement présentes dans Floot, avec leurs dépendances et la version du projet. Les conserver dans un emplacement distinct et clairement documenté, sans écraser le catalogue, les prototypes ou l'historique Git.

Vérifier ensuite les sources exportées et leur correspondance au déploiement. Une sauvegarde du code ne remplace pas une sauvegarde PostgreSQL. Ne pas annoncer une synchronisation effectuée tant que l'export et sa vérification n'ont pas eu lieu.
