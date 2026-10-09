# TCG Deseur — Le jeu de collection

**Jeu de collection indépendant et non officiel** inspiré des apparitions et personnages de Thomas Deseur. Ce dépôt est la **source de référence** du site et de l'application.

**Jeu avec comptes et collection serveur :** https://budget-illimite-tcg.floot.app/ (hébergé sur Floot, désormais présenté sous le nom TCG Deseur).

**Prototype statique sur GitHub Pages :** https://cosscoll.github.io/TCG-Thomas-Deseur/ — ses boosters restent des démonstrations locales, indépendantes des comptes Floot.

## Le jeu aujourd'hui

Le parcours principal est volontairement centré sur **ouvrir des boosters → découvrir des cartes → compléter le classeur**. Les combats ont été placés de côté.

### Ce qui fonctionne sans créer de compte

- Catalogue de **49 cartes**, réparties en **cinq raretés**.
- Ouverture d'un booster de **5 cartes**, avec dernier emplacement Rare ou mieux.
- Ajout automatique au **classeur de démonstration**, persistant dans ce navigateur.
- Suivi du nombre de cartes différentes, du nombre d'exemplaires, des doublons et du pourcentage de collection.
- Progression par rareté, filtres et recherche.
- Historique des dernières ouvertures.
- Interface adaptée au mobile, utilisation clavier et tests navigateur.

**Attention :** la collection sans compte est une **démonstration locale**. Elle peut être modifiée ou effacée par l'utilisateur et ne devient jamais une collection officielle. Aucune transaction et aucun achat réel.

### Comptes joueurs, collection officielle

Le code prépare une connexion via **Supabase Auth**, des profils à pseudonyme, un inventaire propre à chaque joueur, la récupération des mots de passe et l'attribution des cartes **par le serveur**. Les migrations SQL se trouvent dans `supabase/migrations/`.

Les comptes **ne sont pas encore activés** : aucun projet Supabase n'est connecté à cette application. Il faut d'abord sélectionner un projet de développement, déployer et auditer la migration, puis tester la connexion, le cloisonnement des inventaires et la résistance aux ouvertures simultanées.

Les boosters officiels sont prévus avec une règle **provisoire** d'un booster gratuit par 24 h, à confirmer avant activation. Aucun taux ni quota n'est présenté comme définitif.

## Organisation du dépôt

```text
.
├── index.html                   Site de collection principal
├── styles.css                   Interface et responsive
├── app.js                       Contrôleur de boosters/classeur/comptes
├── data/
│   └── cards.js                Catalogue des 49 identifiants et raretés
├── game/
│   ├── booster.js              Mécanique de tirage local (démo)
│   ├── collection.js           Inventaire local, doublons et progression
│   ├── engine.js               Ancien moteur de combat (en réserve)
│   └── progress.js             Anciennes statistiques solo
├── account/
│   ├── config.js               URL et clé publique Supabase (non renseignées)
│   ├── client.js               Authentification via Supabase
│   ├── panel.js                Interface de création/connexion de compte
│   └── cloud-collection.js     Inventaire distant et booster serveur
├── supabase/
│   └── migrations/             Schéma SQL non encore appliqué
├── solo/                       Prototype de combat précédent, isolé
│   ├── index.html
│   ├── app.js
│   └── styles.css
├── tests/                      Tests unitaires Node, moteur et collection
├── e2e/                        Tests réels Chromium sur ordinateur et mobile
├── .github/workflows/          Validation automatique GitHub Actions
├── docs/                       Règles, audit et feuille de route
└── research/                   Archives de recherche, distinctes du jeu
```

La partie jeu ne dépend pas des archives visuelles de `research/`. Aucune illustration générée n'est requise pour jouer au prototype.

## Tester localement

Le site est statique et fonctionne avec un simple serveur HTTP.

```bash
python3 -m http.server 8000
# ou sous Windows : py -m http.server 8000
```

Ouvrir http://localhost:8000/. Pour consulter le prototype solo d'origine : http://localhost:8000/solo/.

```bash
npm test
# tests navigateur dans la CI GitHub Actions
npm run balance
```

Les tests complets en navigateur sont exécutés sur les PR par le workflow `E2E Collection TCG Deseur`.

## Avant un lancement public officiel

1. Valider les règles de distribution (fréquence des boosters, probabilités, doublons, limite de cartes).
2. Relier un projet Supabase de **développement** puis tester les comptes et droits RLS avec **deux joueurs différents**.
3. Vérifier l'attribution transactionnelle des cinq cartes et le quota serveur avec des requêtes simultanées.
4. Ajouter gestion de compte (suppression/export), protection anti-abus, RGPD, suivi des erreurs et assistance.
5. Vérifier les droits nécessaires avant toute exploitation officielle d'un nom, personnage ou média.
6. Retirer `noindex` seulement une fois le lancement et les droits validés.

Le PvP, les combats, les classements et les échanges ne font **pas** partie du chantier actuel.

Documentation technique et état précis : [Collection et comptes](docs/COLLECTION_ET_COMPTES.md).
