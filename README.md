# TCG Deseur — état courant (11 octobre 2026)

**Catalogue créateur confirmé : 67 cartes distinctes et 38 illustrations alternatives, avec 3 groupes écartés.** Picasso Deseur est validé avec un rendu principal et deux alternatives.

**Raretés et probabilités de la nouvelle édition (validées le 12/10/2026) :** 67 cartes réparties en 33 Communes, 21 Rares, 8 Épiques, 4 Légendaires et 1 Hors-série. Boosters classiques : cartes 1–3 = 100 % Communes ; carte 4 = 90 % Rare / 10 % Alternative ; carte 5 = 80 % Rare / 17 % Épique / 2 % Légendaire / 1 % Hors-série. **Ces règles sont en préparation sur GitHub, pas encore activées dans le backend Floot.** Le mécanisme précis de sélection des alternatives reste à définir. [Règles et tests](docs/REGLES_BOOSTER_67_2026-10-12.md).

**Voir les fiches approuvées :** https://cosscoll.github.io/TCG-Thomas-Deseur/collection-validee/  
**Jouer / comptes et boosters réels :** https://budget-illimite-tcg.floot.app  
**Consignes de développement et priorités :** [Feuille de route opérationnelle](docs/PLAN_AUTONOME_SUITE_2026-10-11.md)

| Ressource | Utilité |
| --- | --- |
| [Choix approuvés](data/choix-cartes-2026-10-11.json) | Décisions exactes, noms, illustrations principales et alternatives |
| [Manifeste des 67 cartes](data/catalogue-valide-67.json) | Export public strict, lisible par le futur jeu |
| [Manifeste de préparation Floot](data/edition-staging-67.json) | 67 noms + raretés validées + 105 références de visuels, **non déployable tant que les variantes ne sont pas réglées** |
| [Galerie avec raretés](collection-validee/) | Voir les cartes, leurs raretés, leurs variantes et leurs provenances |
| [Générateur](scripts/build-approved-catalogue.mjs) | Reconstruit le manifeste et vérifie les identifiants |
| [Collection approuvée](collection-validee/) | Catalogue statique présenté sur GitHub Pages |
| [Atelier](tri-177/) | Éditeur des choix des cartes |
| [Ancienne démo à 160 illustrations](collection-161/) | Archive de démonstration, **pas** la nouvelle collection Floot |

**Attention aux deux environnements :** la collection approuvée est intégrée dans GitHub, **pas encore dans le jeu Floot**. Les comptes, les quotas et les boosters du jeu réel restent pilotés par son serveur. La prochaine tâche urgente est de diagnostiquer et rétablir l'ouverture des boosters du créateur sur Floot, puis de synchroniser prudemment la collection sans altérer les possessions des joueurs.

**État des vérifications :** tests d'intégrité et tests navigateur ajoutés au dépôt ; les résultats des exécutions GitHub Actions les plus récentes doivent être contrôlés. L'accès HTTP public indépendant à GitHub Pages n'a pas pu être vérifié depuis le présent environnement. Aucune attribution de booster au compte du créateur n'a été réalisée.

---

## Historique des éditions et des prototypes

Les passages ci-dessous sont **historiques** et décrivent notamment les versions à 49/160 cartes, avant la validation des 67 personnages. Ils ne décrivent pas le contenu actuel approuvé.

## Collection Origine — édition actuelle

**Jeu en ligne :** https://budget-illimite-tcg.floot.app  
**Aperçu des cartes visibles :** https://cosscoll.github.io/TCG-Thomas-Deseur/collection-161/

Le classeur comporte **160 cartes à découvrir** (159 standards et une Hors-série). Une fois le classeur complet, le joueur débloque **un booster spécial de cinq cartes**, dont le contenu est à découvrir lors de l'ouverture. Aucun achat requis.

La distribution officielle, l'inventaire persistant et le gain unique sont contrôlés par le serveur Floot. Les 49 cartes historiques sont archivées dans les comptes existants. Le dépôt GitHub contient également une démonstration utilisant des données fictives, sans distribution réelle.


---

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


Une [page de démonstration du classeur](floot-collection/demo.html) permet désormais de vérifier les compteurs, les catégories de rareté, les doublons et les filtres avec trois inventaires fictifs (vide, partiel, complet). Elle est **isolée du jeu Floot**, ne se connecte à aucun compte et n'attribue aucune carte. Le [déploiement GitHub Pages du prototype](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37946337589) a réussi, mais **l'accès HTTP public de la page n'a pas pu être vérifié indépendamment depuis cet environnement**. URL proposée, non certifiée : https://cosscoll.github.io/TCG-Thomas-Deseur/floot-collection/demo.html

La [suite GitHub Actions du 9 octobre](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37946338311) a validé **80 tests sur 80**, dont sept contrôles statiques destinés à maintenir cette démonstration non connectée. Cet état était historique : les tests Chromium ont ensuite été exécutés (66 parcours réussis le 10 octobre).

**Livraison élargie du 9 octobre :** [six volets fonctionnels préparés](docs/COLLECTION_LIVRAISON_2026-10-09.md) — doubles avancés, 15 objectifs de collection sans récompense, bilan d'un booster confirmé, historique de tirages, cinq vues dans la démo et diagnostic d'inventaire. [120 tests Node réussis sur 120](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37948492892). **État historique du 9 octobre** : les tests ont depuis été exécutés et le classeur a été intégré dans Floot le 10 octobre.

**Validation de la collection (9 octobre, soirée) :** [48 parcours Chromium ordinateur/mobile et 142 tests Node réussis](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37978835656). La démo comporte maintenant une fiche de carte navigable au clavier, des raccourcis par rareté et de possession, un export CSV sécurisé (données **fictives uniquement**), ainsi qu'un contrôle Axe WCAG 2.0/2.1 A/AA sur les vues testées. Voir le [journal de livraison](docs/COLLECTION_LIVRAISON_2026-10-09.md). **Ce n'est pas une publication des nouveaux modules dans Floot.**

**Dernière version Floot :** le bilan de révélation des cinq cartes est également publié, avec **six suites de tests Floot réussies**. [Preuves et limites de validation](docs/FLOOT_INTEGRATION_2026-10-10.md).

**Nouvelles préparations du 10 octobre (GitHub uniquement) :** [simulateur exact de découverte, rangs de collectionneur et révélation 3D](docs/EVOLUTION_COLLECTION_2026-10-10.md). Validation : [155 tests Node et 66 tests navigateur Chromium réussis](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38076323343). Ces travaux ne sont **pas** publiés dans le jeu Floot et ne modifient aucun compte ni inventaire. La réouverture du quota Floot est annoncée pour le 11 octobre à 09:00 UTC. Les correctifs Floot déjà en attente restent prioritaires.

**Version active du 10 octobre :** les fonctions de classeur auparavant préparées sur GitHub sont désormais **intégrées et publiées directement dans Floot**. [Journal complet de publication et tests](docs/FLOOT_INTEGRATION_2026-10-10.md). Les 49 IDs/raretés historiques ont été comparés à PostgreSQL et concordent exactement. TypeScript propre, cinq suites Jasmine réussies, publication réussie et HTTP public vérifié ; **le parcours authentifié n'est pas encore testé en navigateur**.

## Priorité actuelle : la collection, sans les illustrations

Les visuels des cartes sont toujours en préparation. Le travail de développement est recentré sur **les raretés, les quantités possédées, les doublons, les cartes manquantes, les statistiques de complétion, la recherche et les filtres du classeur**.

Le [modèle de collection indépendant des images](floot-collection/collection-model.mjs) et sa [conception fonctionnelle détaillée](docs/CONCEPTION_COLLECTION_FLOOT.md) sont enregistrés sur GitHub. Les [30 tests du modèle](tests/floot-collection-model.test.mjs) ont été validés dans la [CI GitHub (71/71)](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37945719773). **État historique du 9 octobre** : le classeur a ensuite été intégré et publié dans Floot ; les nouveaux rangs, prévisions et l'animation 3D restent, eux, uniquement sur GitHub.

Les questions de combat, de PvP, de boutique, d'échange ou de génération de visuels restent hors périmètre ; les règles de tirage existantes restent inchangées.

## Périmètre actuel

Le chantier concerne uniquement les comptes joueurs, l'ouverture de boosters et le classeur.

L'application propose des boosters de cinq cartes, cinq raretés, une révélation progressive, un classeur avec filtres et recherche, un historique, la modification du pseudonyme et un export JSON. Le catalogue historique comporte 49 cartes.

La règle affichée est provisoire : **un booster gratuit par compte toutes les 24 heures**, avec une cinquième carte Rare ou supérieure. Le tirage et l'attribution doivent rester côté serveur. Aucun achat, aucune monnaie, aucun combat/PvP et aucune nouvelle illustration ne font partie du chantier actuel.

## État vérifié le 9 octobre 2026

Floot confirme que l'application est publiée. Les pages d'accueil et de connexion répondent HTTP 200. Les API de session, collection, booster et profil rejettent les appels anonymes avec HTTP 401.

**Ces contrôles ne valident pas un parcours joueur connecté**, la séparation de deux comptes, la concurrence des boosters, la délivrabilité des e-mails ou l'ergonomie mobile. Cette limite date de la reprise du 9 octobre : la base et le code serveur ont été relus et vérifiés le 10 octobre, sans accès à des comptes authentifiés de test.

Résultats, blocage, points à corriger et méthode de reprise : [Reprise Floot du 9 octobre](docs/FLOOT_REPRISE_2026-10-09.md).

**Plan d'intervention prêt pour le 10 octobre 2026 :** [consulter les corrections, scénarios de tests et critères de publication](docs/PLAN_REPRISE_2026-10-10.md).

**Recette détaillée Floot :** [matrice des 36 scénarios comptes, boosters, classeur et publication](docs/MATRICE_RECETTE_FLOOT.md). Le workflow [Floot — contrôle public](.github/workflows/floot-public-smoke.yml) utilise les tests séparés dans [`floot-e2e/`](floot-e2e/), sans accès aux comptes réels et sans planification récurrente ; ses tests se déclenchent maintenant lors des modifications de la recette publique (ou manuellement). Organisation du travail demandé en autonomie : [Suivi autonome](docs/FLOOT_SUIVI_AUTONOME.md). La programmation quotidienne « Développement TCG Deseur » a été **désactivée** le 9 octobre 2026 à la demande de l'utilisateur ; « Brief du matin » a été réactivé. Le développement reprend uniquement lors d'une session demandée explicitement, sans tâche récurrente.

## Vérifier la compatibilité des 49 cartes

Le catalogue historique est dans `data/cards.js`. Un comparateur en **lecture seule** permet de vérifier qu'un export non personnel du catalogue Floot contient exactement les **mêmes 49 identifiants et raretés**, sans cartes nouvelles, manquantes ou dupliquées.

```bash
node scripts/compare_floot_catalogue.mjs chemin/vers/cartes-floot-anonymisees.json
```

Le fichier JSON attendu est un tableau de lignes `{"id":"matelas","rarity":"commune"}` et doit contenir **uniquement** ces deux champs. Vérifier les noms de colonnes et les valeurs réelles dans Floot avant de produire le fichier ; ne jamais exporter un inventaire ni des informations joueurs.

Le script dispose de **12 tests unitaires**, intégrés à `npm test`. Le workflow [GitHub Actions du 9 octobre](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37943567646) a terminé avec **43 tests réussis et zéro échec**. Le vrai catalogue PostgreSQL n'a pas encore été comparé.

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

Un [vérificateur d'intégrité en lecture seule](scripts/verify_floot_export.py) et sa [procédure détaillée](docs/SAUVEGARDE_CODE_FLOOT.md) sont maintenant disponibles. Ils ont été testés sur des exports fictifs, **pas encore sur les sources Floot réelles**. Les tests d'accessibilité supplémentaires sont dans [`floot-e2e/accessibility.spec.mjs`](floot-e2e/accessibility.spec.mjs).


Après récupération de l'accès, exporter les sources réellement présentes dans Floot, avec leurs dépendances et la version du projet. Les conserver dans un emplacement distinct et clairement documenté, sans écraser le catalogue, les prototypes ou l'historique Git.

Vérifier ensuite les sources exportées et leur correspondance au déploiement. Une sauvegarde du code ne remplace pas une sauvegarde PostgreSQL. Ne pas annoncer une synchronisation effectuée tant que l'export et sa vérification n'ont pas eu lieu.
