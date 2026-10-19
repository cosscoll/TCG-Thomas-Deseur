# TCG-Thomas-Deseur — Édition Origine

> **Nom officiel : TCG-Thomas-Deseur.** Le sous-domaine Floot historique reste une adresse technique de service, **pas le nom du jeu**. Pour le changer sans perdre l’accès des joueurs, il faut prévoir une transition du domaine et de leurs liens existants.

**Jeu de collection publié sur Floot le 16 octobre 2026 :** [Ouvrir TCG Deseur](https://tcg-thomas-deseur.floot.app)

**Vitrine et galerie documentaire GitHub Pages :** https://cosscoll.github.io/TCG-Thomas-Deseur/

## Règles actuellement déployées

- **105 illustrations publiques à collectionner** : 67 cartes de base et 38 illustrations alternatives, chacune comptabilisée individuellement.
- Dans le classeur, l'alternative est placée **immédiatement après sa carte principale**. Elle ne peut être obtenue que lorsque cette base était **déjà possédée avant** le tirage ou l'attribution.
- **Un booster classique régénérable toutes les 12 heures**, avec un stock plafonné à **3** et un premier booster disponible dès l'inscription. Les boosters cadeaux sont conservés séparément.
- Chaque booster classique donne 5 cartes : trois Communes garanties, une 4e carte Rare (90 %) ou alternative éligible (10 %), une 5e Rare (80 %), Épique (17 %), Légendaire (2 %) ou Hors-série (1 %). Si aucune alternative n'est éligible, la 4e carte est Rare.
- La possession des **105 illustrations distinctes** permet de débloquer un **booster exceptionnel**, dont le contenu n'est pas révélé ici.
- Les joueurs peuvent créer un compte, ouvrir leurs boosters, retrouver leurs cartes et doublons, utiliser des codes cadeaux. L'administration peut créer des codes exacts de son choix : boosters classiques, spéciaux, personnalisés et cartes officielles, dans des limites contrôlées.
- Les anciennes collections ont été retirées de l'interface du jeu sans supprimer les données historiques de la base.

## Références uniques des illustrations — 16 octobre 2026

Une référence permanente à **8 chiffres** a été attribuée à chacune des **105 illustrations publiques** (67 cartes de base + 38 alternatives). Deux illustrations différentes ne partagent jamais le même numéro ; le numéro est associé à l'artwork ID interne et ne change pas après un tirage.

- [Référentiel lisible en CSV — 105 cartes](data/references-8-chiffres-105.csv)
- [Référentiel JSON officiel — 105 cartes](data/references-8-chiffres-105.json)
- [Voir les numéros dans la galerie des 105 illustrations](https://cosscoll.github.io/TCG-Thomas-Deseur/collection-validee/)

Pour les codes cadeaux spéciaux, le backend de préparation convertit la référence numérique en illustration officielle précise tout en conservant son ID technique historique. Les références ne sont **pas** elles-mêmes des codes cadeaux : l'administrateur crée un code de distribution distinct. Aucune référence ni identité de carte confidentielle n'est présente dans les fichiers publics.

**État Floot :** la base des 106 références, y compris une privée, a été migrée et les endpoints existants de collection/code cadeau ont été adaptés dans l'éditeur. **Cette évolution n'est pas encore republiée dans le jeu** (quota Floot épuisé le 16 octobre, remise à zéro le 17 octobre à 09:00 UTC).

**Classement global demandé :** joueurs classés par nombre d'illustrations différentes, puis par nombre total de boosters ouverts croissant à égalité. L'endpoint du classement a été écrit dans Floot mais l'interface n'a pas pu être intégrée avant blocage. Sources prêtes sur [la branche de reprise du classement](https://github.com/cosscoll/TCG-Thomas-Deseur/tree/dev/references-leaderboard-2026-10-16), sans prétendre qu'elle est déjà déployée.

## Développement et hébergement

| Surface | Usage |
| --- | --- |
| **Floot** — https://tcg-thomas-deseur.floot.app | Jeu fonctionnel : authentification, logique serveur, base de données, tirages et sauvegardes. |
| **GitHub** — `floot-app/` | Copie des fichiers source du jeu et du panneau codes cadeaux ; leur présence sur GitHub ne constitue pas un second hébergement backend. |
| **GitHub Pages** — `index.html`, `collection-validee/`, `avancement/` | Portail documentaire, aperçu et liens vers le jeu. GitHub Pages seul ne peut pas exécuter les endpoints Floot ni sa base PostgreSQL. |

### Tests vérifiés le 16 octobre 2026

- Contrôle TypeScript sans erreur.
- 21 fichiers de tests Jasmine réussis (20 tests courants et un fichier dédié aux codes cadeaux).
- Deux comptes de recette distincts ont réussi à s'inscrire, à ouvrir chacun un booster de 5 cartes et à retrouver leurs collections sauvegardées. Test de déconnexion/reconnexion réussi. Comptes éphémères ensuite supprimés.
- Vérification de refus serveur de la création de codes par un compte non administrateur (403), et de refus des accès anonymes aux API concernées (401).
- Publication Floot confirmée et page publique accessible en HTTPS (HTTP 200).

**Contrôles complémentaires encore nécessaires** : création et utilisation complète d'un code cadeau par un administrateur de test autorisé ; inspection visuelle mobile authentifiée ; validation utilisateur de la nouvelle interface et surveillance des premières ouvertures en production. Il n'y a pas lieu d'annoncer ces contrôles comme réussis avant leur réalisation.

## Ressources

- [Cahier des charges et ordre de priorité 1-2-3-4-5-6-8-9-7-10](docs/tcg-deseur-evolution-regles-2026-10-14.md).
- [Journal de reprise des migrations et des fonctionnalités](docs/floot-reprise-2026-10-16.md).
- [Tableau public des 88 actions historiques](avancement/).
- [Galerie des illustrations approuvées](collection-validee/).
- [Codes sources sauvegardés](floot-app/).

Aucun achat ni paiement n'est nécessaire. Le projet est une création indépendante. Les détails des récompenses confidentielles et les données personnelles des joueurs ne doivent pas être publiés sur ce dépôt.
