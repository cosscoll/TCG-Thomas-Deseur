# Budget Illimité — TCG Thomas Deseur

**Prototype non officiel et expérimental** d'un jeu de cartes à collectionner inspiré d'apparitions, costumes et déguisements de Thomas Deseur. Ce projet n'est affilié à aucun créateur cité.

## Où se trouve le site ?

**Dépôt officiel de travail :** https://github.com/cosscoll/TCG-Thomas-Deseur

Le fichier `index.html` est **à la racine** du dépôt (branche `main`), avec `app.js`, `styles.css`, `data/` et `game/`. Il s'agit du prototype jouable **en solo**, pas encore d'un produit final.

**Publication web :** une action GitHub Pages se trouve dans `.github/workflows/deploy.yml`. La compilation et les 21 tests Node du premier lancement ont réussi. La dernière étape de publication est bloquée tant que **GitHub Pages n'est pas activé** dans les paramètres du dépôt. L'application GitHub utilisée par l'assistant n'a pas les droits nécessaires pour l'activer via API.

Pour activer la prévisualisation, depuis le dépôt GitHub :

1. Ouvrir **Settings → Pages**.
2. Dans **Build and deployment**, choisir **Source : GitHub Actions** (activer Pages si demandé).
3. Ouvrir **Actions → Test and publish TCG preview → Run workflow**, choisir `main`, puis lancer le workflow.

Après un déploiement réussi, l'adresse prévue est `https://cosscoll.github.io/TCG-Thomas-Deseur/`. **Ne pas considérer cette adresse comme active avant que GitHub indique une publication réussie.**

La branche `dev/thomas-deseur-tcg` de `cosscoll/Cosme-Collomb` est une **ancienne copie de sauvegarde**, et non l'emplacement où poursuivre le développement.

## Recherche visuelle Thomas Deseur

Le TCG s'appuie maintenant sur une **bibliothèque de 176 références visuelles authentiques** recensées dans trois galeries communautaires TierMaker ; elles ne sont pas toutes distinctes et leurs auteurs/droits restent à vérifier. Un index complémentaire contient **52 sources vidéo, épisodes, archives ou publications** utilisables pour retrouver les apparitions originales.

- **Galerie consultable en ligne :** https://cosscoll.github.io/TCG-Thomas-Deseur/research/
- **Données et provenance :** [research/visual-references.json](research/visual-references.json)
- **Sources vidéo et sociales :** [research/source-videos.json](research/source-videos.json)
- **État des 49 cartes :** [research/CORRESPONDANCES-49-CARTES.md](research/CORRESPONDANCES-49-CARTES.md)

Deux cartes possèdent un lien de vidéo source confirmé par son titre (`matelas` et `fontaine`). Les 176 captures ne sont **pas encore attribuées avec certitude aux 49 cartes**, et aucun visuel réel n'a été présenté à tort comme illustration finalisée. Les images distantes servent uniquement à la vérification des costumes, pas à une diffusion sous licence supposée.

### Extension de la recherche (8 octobre 2026)

La recherche de costumes comprend désormais :
- **176 références de captures de costumes** tirées de 3 collections TierMaker (vérification individuelle encore nécessaire).
- **26 photographies originales de Thomas Deseur sur scène** sur Wikimedia Commons, crédit et licence à respecter.
- **11 vignettes de vidéos YouTube** (elles ne représentent pas forcément Thomas).
- **18 autres contenus à examiner** : TikTok/Instagram, Twitch, scènes, LEGO, vidéos d'objets et collaborations.
- **52 sources vidéo / réseaux distinctes** dans `research/source-videos.json`.
- **18 des 49 cartes** ont au moins une piste documentaire, 2 vidéos de transformations clairement identifiées, mais **aucune illustration de carte finalisée**.

**<https://cosscoll.github.io/TCG-Thomas-Deseur/research/exploration.html>** — nouveaux visuels de spectacle, LEGO et vidéos.

**<https://cosscoll.github.io/TCG-Thomas-Deseur/research/>** — galerie des 176 captures communautaires.

Les données supplémentaires sont dans `research/stage-photos.json` et `research/extended-media.json`. Ces fichiers référencent les sources, ils ne revendiquent pas les droits sur les médias.

## Ce qui fonctionne actuellement

- Catalogue interactif des **49 identifiants de cartes** extraits du code de booster remis (17 communes, 15 rares, 10 épiques, 4 légendaires, 3 secrètes).
- Filtres, recherche, fiches de cartes et suivi de documentation sauvegardé localement.
- Atelier de deck : sélection de **8 cartes distinctes**, recommandation automatique de deux cartes par archétype, récapitulatif des rôles, deck de départ, suppression et sauvegarde locale.
- **Mode solo jouable contre Billy** : 3 KO pour gagner, énergie, PV, capacités spéciales, protection, remplacement après KO et changements de cartes en réserve.
- **Billy en trois difficultés** : Découverte, Normal et Expert (ce dernier évalue les actions légales). Niveau verrouillé pendant une partie.
- **Palmarès local** : parties jouées, victoires, défaites, meilleure série et 6 défis symboliques ; aucune récompense monétaire ni objet virtuel à valeur.
- Quatre archétypes de combat aux statistiques **provisoires** et équilibrées indépendamment de la rareté.
- Simulateur de booster **sans gain réel**, 5 cartes dont la dernière est au minimum rare.
- Tests catalogue / boosters / moteur + CI GitHub Actions dans `.github/workflows/budget-illimite-tcg-tests.yml`.

### Exécuter sur son ordinateur

Depuis `` :

```bash
python3 -m http.server 8000
# sous Windows : py -m http.server 8000
# ou un autre serveur statique HTTP
```

Ouvrir ensuite `http://localhost:8000`. Il n'y a pas d'installation JS requise pour visualiser le jeu.

### Vérifier le moteur

```bash
npm test
npm run balance             # 200 graines par combinaison (9 combinaisons)
npm run balance:extended    # 1 000 graines par combinaison
```

Les simulations de balance comparent des stratégies artificielles ; elles ne représentent pas des taux de victoire réels entre humains. Node.js 22 recommandé. `npm test` utilise `node --test` ; aucun paquet NPM n'est requis.

## Structure

```text
index.html                       Interface de collection, deck, arène, boosters
styles.css                       Identité visuelle responsive
app.js                           Logique d'interface / mode solo
data/cards.js                    49 identifiants et raretés, sources à vérifier
game/engine.js                   Moteur solo déterministe + 3 IA et deck conseillé
game/progress.js                 Palmarès local et jalons symboliques
game/booster.js                  Simulation de tirage, sans économie réelle
tests/*.test.mjs                 Tests moteur, booster, données, progression et UI simulée
scripts/balance-report.mjs       Simulateur d'équilibrage reproductible
security/restrict_booster_rpc.sql Proposition de durcissement, NON APPLIQUÉE
docs/AUDIT_ET_FEUILLE_DE_ROUTE.md Audit de sécurité et plan de travail
docs/REGLES_DU_PROTOTYPE.md      Règles du mode solo
```

## Attention : deux moteurs différents

Le moteur solo `game/engine.js` est un **nouveau prototype indépendant**. L'archive d'origine mentionnait `engine.js` mais ne le contenait pas, pas plus que le site d'origine ou les migrations initiales. **Ce nouveau moteur ne doit pas être importé tel quel dans les anciennes Edge Functions PvP** : les signatures et règles doivent d'abord être réconciliées.

Les noms du catalogue sont des libellés provisoires dérivés des IDs. Aucune référence vidéo ni photographie n'a été inventée ou validée. Les statistiques de combat affichées sont temporaires et ne reflètent pas une recherche sur Thomas Deseur.

### Ce qui n'est PAS prêt

- Pas de connexion à Supabase (aucun projet lié accessible lors du contrôle).
- Pas de vrais comptes, PvP, ELO, économie en ligne, propriété des cartes ni échanges.
- Pas de contenu média final autorisé ou vérifié.
- Pas de déploiement public ; le site est conservé dans le dépôt dédié `cosscoll/TCG-Thomas-Deseur`.

Ne jamais committer de `service_role`, mot de passe ou secrets dans GitHub. Ne pas déployer `security/restrict_booster_rpc.sql` sans vérifier les signatures et les politiques réelles de la base cible.

## Roadmap

1. Valider le solo sur navigateur desktop et mobile et organiser des tests avec de vrais joueurs. Le moteur est testé automatiquement, mais l'interface n'a pas encore été validée en navigateur graphique.
2. Retrouver les sources du projet initial et identifier précisément les mécaniques d'origine.
3. Documenter les 49 apparitions et leurs médias avec liens, dates et statut de droits.
4. Rattacher un environnement Supabase de développement une fois les accès disponibles. Le dépôt GitHub autonome existe déjà.
5. Construire le backend PvP/économie par transactions atomiques, RLS et tests de concurrence.
6. Ajouter onboarding, progression, classements, échanges, puis publier après validation.

Voir le document des règles et l'audit détaillé dans `docs/`.
