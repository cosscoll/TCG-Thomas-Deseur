# Budget Illimité — TCG Thomas Deseur

**Prototype non officiel et expérimental** d'un jeu de cartes à collectionner inspiré d'apparitions, costumes et déguisements de Thomas Deseur. Ce projet n'est affilié à aucun créateur cité.

## Périmètre définitif des visuels : costumes et apparitions marquantes

**On recherche seulement Thomas Deseur dans un costume, un déguisement, un rôle visuellement identifiable, un camouflage, une transformation (maquillage/coiffure) ou une situation visuelle vraiment exceptionnelle.**

**Sont exclus du catalogue de cartes :** portraits ordinaires, photographies de scène où il porte des vêtements habituels, simples interviews, vidéos LEGO/objets/streams où aucun look particulier n'est attesté, miniatures qui montrent une autre personne, et toute image dont l'identité est incertaine.

- [Apparitions correspondant au vrai critère du TCG](https://cosscoll.github.io/TCG-Thomas-Deseur/research/exploration.html) : 9 situations documentées (2 camouflages Amixem, 4 rôles dans un même Reel Boulanger, 1 personnage de vidéo météo, 1 roi en spectacle, 1 mise en scène dans les moules). Ce ne sont **pas 9 illustrations déjà extraites**.
- [176 captures candidates à identifier dans les vidéos 100 couches](https://cosscoll.github.io/TCG-Thomas-Deseur/research/) : elles ne sont pas validées individuellement.
- [Table de sélection stricte au format JSON](research/costume-only.json) : seul ce fichier fait foi pour le périmètre ciblé.
- Les autres photographies et liens recherchés auparavant sont conservés comme **archives hors cible**, pour ne pas perdre les recherches, mais ils ne comptent pas comme visuels du TCG.

**0 image de carte définitivement validée et autorisée à ce stade.** Ne pas confondre vidéos dont l'apparition est documentée et captures réellement identifiées/licenciées.

## Où se trouve le site ?

**Dépôt officiel de travail :** https://github.com/cosscoll/TCG-Thomas-Deseur

Le fichier `index.html` est **à la racine** du dépôt (branche `main`), avec `app.js`, `styles.css`, `data/` et `game/`. Il s'agit du prototype jouable **en solo**, pas encore d'un produit final.

**Site public actuel (V0.1) :** https://cosscoll.github.io/TCG-Thomas-Deseur/ — dernier déploiement de `main` confirmé par GitHub Pages. Ce site n'est pas la version V0.2.

**Développement V0.2 :** [branche `dev/v0.2-gameplay-comptes`](https://github.com/cosscoll/TCG-Thomas-Deseur/tree/dev/v0.2-gameplay-comptes) — capacités de douze cartes pilotes, plusieurs decks de Billy, interface de comptes préparée et tests. La V0.2 n'est pas publiée sur GitHub Pages.

**Création de comptes :** prévue avec Supabase Auth, migrations RLS pour sauvegarder un deck. Aucun projet Supabase n'est actuellement connecté, donc l'inscription reste désactivée. Voir [documentation des comptes](docs/COMPTES_JOUEURS_V02.md).

**Validation :** `npm test` (31 scénarios automatisés lors du premier contrôle V0.2) ; workflow Playwright en développement sur la branche V0.2 ; `npm run balance` pour les simulations.

La branche `dev/thomas-deseur-tcg` de `cosscoll/Cosme-Collomb` est une **ancienne copie de sauvegarde**, et non l'emplacement où poursuivre le développement.

## Recherche visuelle Thomas Deseur

Le TCG s'appuie maintenant sur une **bibliothèque de 176 références visuelles authentiques** recensées dans trois galeries communautaires TierMaker ; elles ne sont pas toutes distinctes et leurs auteurs/droits restent à vérifier. Un index complémentaire contient **56 sources vidéo, épisodes, archives ou publications** utilisables pour retrouver les apparitions originales.

- **Galerie consultable en ligne :** https://cosscoll.github.io/TCG-Thomas-Deseur/research/
- **Données et provenance :** [research/visual-references.json](research/visual-references.json)
- **Sources vidéo et sociales :** [research/source-videos.json](research/source-videos.json)
- **État des 49 cartes :** [research/CORRESPONDANCES-49-CARTES.md](research/CORRESPONDANCES-49-CARTES.md)

Deux cartes possèdent un lien de vidéo source confirmé par son titre (`matelas` et `fontaine`). Les 176 captures ne sont **pas encore attribuées avec certitude aux 49 cartes**, et aucun visuel réel n'a été présenté à tort comme illustration finalisée. Les images distantes servent uniquement à la vérification des costumes, pas à une diffusion sous licence supposée.

### Extension de la recherche (8 octobre 2026)

La recherche de costumes comprend désormais :
- **176 références de captures de costumes** tirées de 3 collections TierMaker (vérification individuelle encore nécessaire).
- **26 photographies originales de Thomas Deseur sur scène** sur Wikimedia Commons, crédit et licence à respecter.
- **11 vignettes de vidéos YouTube**, **1 affiche promotionnelle de la ville de Lille**, et **5 images de presse / scène** (elles ne représentent pas forcément Thomas).
- **21 autres contenus à examiner** : TikTok/Instagram, Twitch, scènes, LEGO, vidéos d'objets et collaborations.
- **56 sources vidéo / réseaux distinctes** dans `research/source-videos.json`.
- **18 des 49 cartes** ont au moins une piste documentaire, 2 vidéos de transformations clairement identifiées, mais **aucune illustration de carte finalisée**.

**<https://cosscoll.github.io/TCG-Thomas-Deseur/research/exploration.html>** — nouveaux visuels de spectacle, LEGO et vidéos.

**<https://cosscoll.github.io/TCG-Thomas-Deseur/research/>** — galerie des 176 captures communautaires.

Sept apparitions **hors 100 couches** sont recensées dans `research/discovered-looks.json` : Noël, Pâques, Halloween, Saint-Valentin (campagne Boulanger), personnage céleste de l'ancien sketch météo, roi au Zénith, et campagne de la Braderie de Lille dans les moules. Ces personnages / apparitions concernent quatre œuvres originales, pas encore sept cartes illustrées.

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
