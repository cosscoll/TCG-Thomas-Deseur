# TCG Deseur — audit UX/UI, accessibilité et performance de la partie GitHub

Date : 13 octobre 2026. Périmètre vérifiable : accueil GitHub Pages, catalogue de 68 emplacements, galerie de comparaison des 105 illustrations, page de bêta. Les écrans connectés Floot sont hors du périmètre des modifications directes.

## Constats et actions effectuées

- Accueil : ancienne affirmation erronée selon laquelle Floot utilisait toujours le catalogue 160 corrigée. Les deux environnements et les travaux de bêta restants sont distingués.
- Catalogue : les 105 illustrations WebP uniformisées 768 × 1 024 sont chargées avec repli vers l'original en cas d'erreur ; les visuels principaux et alternatifs ont un ratio 3:4. Les 67 noms et les cinq raretés sont validés par un fichier de référence.
- Recherche : filtre par nom/référence, par rareté, par présence/quantité de variantes, par galerie photographique d'origine.
- Tri ajouté : ordre officiel, nom alphabétique, rareté puis nom, nombre de variantes.
- Maquette de revue : images d'origine et images uniformisées présentées côte à côte, décision locale puis export possible. Les deux représentations restent distinctes, sans réinterpréter un costume.
- Navigation : les pages publiques fournissent des liens vers le jeu, le catalogue et les sources de référence ; la page de bêta affiche un formulaire de retour sans envoi automatique.
- Référencement : balises canonical de l'accueil et du catalogue, sitemap public excluant la bêta et l'atelier, métadonnées de partage sans image inventée.
- Confidentialité : emplacement de la Carte mystère avec texte neutre et point d'interrogation ; pas de nom privé ni de mécanisme dans les pages publiques.

## Contrôles automatiques disponibles

Tests GitHub Actions : Node sur la cohérence des données, Playwright/Chromium sur les pages publiques, contrôles de l'absence de débordement horizontal aux largeurs 320/393/820, décodage des 105 images, scan des textes publics de la carte mystère et comptes fictifs sans POST de production.

**Précision :** un test en Chromium et une grille CSS ne prouvent ni le rendu identique sur Safari, ni la navigation parfaite par technologie d'assistance, ni l'absence de défaut visuel de chaque sujet. Les tests humains restent requis.

## Risques UX restants

| Priorité | Sujet | Mesure |
| --- | --- | --- |
| P1 | Confirmation manuelle des 11 images à marges importantes | Revue via atelier, corriger les images nécessaires sans remplacer la pose |
| P1 | Texte des noms très longs | Tester largeur 320 px, 200 % zoom, lecture de fiche |
| P1 | Cartes alternatives et doublons dans Floot | Vérifier que la version exacte du tirage reste visible après reconnexion |
| P1 | Accessibilité réelle | Contrôle clavier, focus visible et lecteur d'écran dans des environnements divers |
| P1 | Ancien problème de 48 px de débordement Floot à 820 px | Vérifier sur déploiement connecté, issue GitHub #7 |
| P2 | Qualité du flou ajouté aux 105 images | Contrôle des zones étendues particulièrement sur td_lille |
| P2 | Temps de décodage sur téléphone bas de gamme | Mesurer p95 image/DOMContentLoaded/LCP avant des optimisations de poids |
| P2 | Affichage des métadonnées d'origine | Ne pas confondre provenance de galerie avec vidéo de création |

## Critères de fin pour chaque écran

Lisibilité du nom complet ; aucune différence entre nom officiel et fiche ; contraste utilisable sur fond sombre ; ordre logique au clavier ; focus visible ; états erreur et chargement ; aucun débordement horizontal ; 105 images chargées ; ratio 3:4 ; secret intact ; test automatique vert ET inspection humaine d'un échantillon.

## État

**Livrables réalisés dans GitHub et vérifiables par CI**, mais pas certification WCAG complète. Floot nécessite une recette séparée des pages authentifiées ; GitHub et Floot n'ont pas une feuille de styles partagée automatiquement.
