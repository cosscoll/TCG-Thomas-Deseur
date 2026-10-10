# TCG Deseur — Catalogue 161 et booster secret Chevelu

Date de préparation : 10 octobre 2026. **Cette livraison sur GitHub est un aperçu indépendant, pas un déploiement dans Floot.**

## Règle demandée

Le set comprend **161 cartes** : **159 standards**, **Lille** hors-série et **Chevelu** secrète. Le **booster spécial Chevelu** devient éligible lorsque le serveur constate que le joueur possède **chacune des 160 autres cartes** (quantité au moins 1), Lille comprise. Le joueur peut alors ouvrir ce booster **une seule fois** : son unique carte garantie est Chevelu. Chevelu a une probabilité **strictement nulle** dans les boosters normaux, y compris en cinquième position.

La règle d'éligibilité doit être calculée **dans une transaction serveur verrouillée**, en relisant la base ; jamais sur la seule foi d'un nombre affiché par le navigateur. En même transaction : vérification 160/160, insertion d'une revendication unique (clé primaire `user_id`), attribution de `td_chevelu`, écriture d'historique. Le code préparé dans `server/secret-booster-161.mjs` impose ce contrat.

**Cas Lille :** afin de ne pas bloquer définitivement l'accès à Chevelu, la carte hors-série Lille est obtenable dans les boosters normaux. Répartition proposée des chances de rareté pour chaque emplacement 1–4 : Commune 55 %, Rare 27 %, Épique 12 %, Légendaire 4 %, Hors-série 2 %. Cinquième : non Commune garantie, poids proportionnels 27/12/4/2. **Secrète : 0 % dans le pool normal.** Le catalogue devra conserver le délai de booster existant de 24 h pour les comptes.

## Inventaire des visuels

Depuis le PDF de 51 pages : **161 versions principales**, dont Chevelu (R183) et Lille (R043), et **22 anciennes versions archivées**. Les références et ID de rendu sont tracés dans `data/cards-161.js` et le manifeste de l'archive d'illustrations.

Répartition proposée (à ajuster éditorialement) : 95 Communes, 35 Rares, 18 Épiques, 11 Légendaires, 1 Hors-série, 1 Secrète. Les titres `Carte REF-...` sont provisoires : le PDF identifie les références et rendus, mais ne documente pas systématiquement des noms officiels d'apparition. Les raretés standards sont réparties mécaniquement entre les trois séries **et ne résultent pas encore d'un classement artistique carte par carte**.

## Fichiers disponibles dans GitHub

- `data/cards-161.js` : 161 IDs, référence PDF, code de rendu Rxxx, rareté proposée, chemin d'image et pool d'obtention.
- `game/collection-161.js` : validation du catalogue, probabilités, vérification du booster normal, compteur 160/160, état Chevelu et protection des doublons.
- `server/secret-booster-161.mjs` : contrat d'attribution serveur atomique après confirmation des prérequis et de la non-attribution précédente.
- `server/migration-161.sql` : schéma de tables **séparé** pour ne pas écraser les 49 anciennes cartes/inventaires.
- `scripts/generate-seed-161.mjs` : générateur SQL des 161 cartes.
- `collection-161/` : nouvelle page publique GitHub Pages avec galerie 161, filtres, états de progression et démonstration d'ouverture secrète **non autoritative**.
- `tests/collection-161.test.mjs`, `tests/secret-booster-161.test.mjs` : tests des invariants, refus si Lille manque, 20 demandes concurrentes simulées, idempotence, rollback.
- `e2e/collection-161.spec.mjs` et `e2e/collection-161-a11y.spec.mjs` : tests navigateur Chromium (desktop/mobile), manifest d'images et accessibilité.

## Images : étape restante, ne pas prétendre qu'elles sont publiées

Le paquet `TCG_Deseur_161_Visuels_WEBP_GitHub.zip` a été construit dans cette conversation : **161 images WebP** à qualité élevée, optimisées depuis les PNG extraits, plus `collection-161/assets/available.json`. L'archive des PNG originaux a été conservée séparément.

**Le transfert des fichiers image binaires vers le dépôt GitHub n'a pas abouti avec les actions GitHub disponibles** (les opérations de texte sont autorisées, mais les 161 images binaires du conteneur ne sont pas transférables en bloc par le connecteur actuel). Tant que ces fichiers ne sont pas publiés, le nouveau classeur affiche des emplacements neutres. Dès que l'archive WebP est déposée en conservant le chemin `collection-161/assets/cards/` et `collection-161/assets/available.json`, l'application chargera automatiquement les vraies illustrations ; la secrète n'apparaîtra qu'après 160/160 dans la simulation.

## Conservation des joueurs existants

L'ancienne application Floot possède **49 cartes historiques** et des inventaires réels. **Ne jamais supprimer, renommer ou assimiler arbitrairement ces cartes aux nouvelles images.** La migration prévoit des tables de la collection 161 indépendantes ; l'ancien inventaire et le rythme de booster actuel restent présents. Il faudra décider comment les collections historiques sont présentées aux joueurs (éventuellement un onglet archives), sans leur retirer des exemplaires ni les compter fictivement comme des références qu'ils n'ont pas reçues.

## Étapes impératives pour intégrer le jeu réel

1. Rétablir le quota d'actions Floot. Dernier refus confirmé du 10 octobre à 22:43 UTC : limite quotidienne atteinte, retour annoncé **11 octobre 2026 à 09:00 UTC**.
2. Terminer et tester les correctifs précédents du jeu en attente dans Floot (voir `docs/PLAN_REPRISE_2026-10-11.md`), sans abandonner les tests en échec.
3. Inspecter la **vraie** structure de tables et implémenter la migration `161` en conservant les données existantes ; ne pas exécuter aveuglément le brouillon SQL.
4. Transférer les 161 visuels dans un hébergement pérenne, vérifier chaque URL et l'intégrité des correspondances ID/R.
5. Modifier **côté serveur** la génération des boosters normaux (160 cartes possibles, 0 secrète), leur quota 24h, les appels de collection et le déblocage Chevelu. Tester la concurrence réelle sur base de test avant toute ouverture officielle.
6. Adapter l'interface Floot authentifiée (161 cartes et un pack secret conditionnel) ; tests de comptes multiples autorisés.
7. Créer checkpoint, publier, vérifier job réussi, HTTP public, assets visibles et comportement réel connecté.

**Conclusion :** le modèle 161 et le mécanisme serveur sont développés/testables sur GitHub. L'intégration dans le jeu authentifié Floot, la publication des 161 images et la migration réelle ne sont **pas encore effectuées**.
