# TCG Deseur — miroir des sources Floot

Ce dossier regroupe **les fichiers du jeu récupérés et versionnés depuis l'éditeur Floot** lors de la mise à jour du 16 octobre 2026. La branche `main` contient maintenant les composants liés à la collection, aux boosters, à l'inscription, aux cadeaux et à la base, ainsi que les tests associés.

Ce dossier n'est **ni une seconde application active ni un déploiement autonome** : Floot fournit le routeur de pages, l'hébergement, la gestion des variables d'environnement, les endpoints `/_api/*` et la base PostgreSQL. Les fichiers de ce miroir permettent d'auditer et de continuer le développement sur GitHub. Pour reconstituer un environnement complet en dehors de Floot, il reste à adapter le runtime, les imports des composants préinstallés et les migrations du schéma, sans exporter de secrets ni données joueurs.

## Accès
- Jeu public : https://budget-illimite-tcg.floot.app
- Sources : https://github.com/cosscoll/TCG-Thomas-Deseur/tree/main/floot-app
- Portail GitHub Pages : https://cosscoll.github.io/TCG-Thomas-Deseur/
- Journal : ../docs/floot-reprise-2026-10-16.md

## Règles impératives
Les 38 illustrations alternatives sont conditionnées à la possession préalable de leur carte de base. Le classeur a 105 illustrations visibles. La réserve standard régénère au plus un booster toutes les 12 h et s'arrête à trois. Les packs cadeaux sont des crédits séparés, les codes sont vérifiés côté serveur, et la récompense finale n'est pas divulguée dans le catalogue public.

## État des contrôles
Floot publié le 16 octobre. TypeScript et Jasmine validés ; deux comptes de recette ont effectué inscription, ouverture et reconnexion. Le parcours administrateur réel de codes cadeaux et la validation visuelle authentifiée sur appareils réels restent à terminer. Ce miroir doit être resynchronisé après toute future modification dans Floot. Ne pas supposer qu'un push sur GitHub republie automatiquement le backend Floot.
