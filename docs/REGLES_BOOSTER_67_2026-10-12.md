# Règles validées — boosters classiques, édition 67 cartes

**Décision du créateur : 12 octobre 2026, 12:31 UTC.** Les probabilités ci-dessous remplacent les suggestions précédentes pour la nouvelle édition, pas celles de l'application Floot tant que celle-ci n'a pas été mise à jour.

## Probabilités obligatoires

| Position dans le booster | Issue et pourcentage |
| --- | --- |
| Carte 1 | Commune : 100 % |
| Carte 2 | Commune : 100 % |
| Carte 3 | Commune : 100 % |
| Carte 4 | Rare : 90 % ; Alternative : 10 % |
| Carte 5 | Rare : 80 % ; Épique : 17 % ; Légendaire : 2 % ; Hors-série : 1 % |

Chaque position totalise **100 %**, et le booster ordinaire totalise **cinq cartes**. La quatrième position comporte une branche spéciale **Alternative** qui n'est **pas une rareté**. Elle **remplace** le résultat Rare de cette position, sans s'ajouter comme sixième carte. La cinquième est toujours Rare ou supérieure.

**Moyenne théorique sur 100 boosters, uniquement en nombre de positions tirées (pas en cartes uniques)** : 300 Communes dans les positions 1 à 3 ; 90 Rares et 10 Alternatives en position 4 ; 80 Rares, 17 Épiques, 2 Légendaires et 1 Hors-série en position 5. Il s'agit d'une espérance, **pas** d'une garantie sur 100 ouvertures.

## Raretés approuvées de la collection

Fichier source conservé : `data/raretes-validees-67.json`. Il contient les 67 décisions individuelles exactes, sans aucune carte de récompense non annoncée.

| Rareté | Cartes distinctes |
| --- | ---: |
| Commune | 33 |
| Rare | 21 |
| Épique | 8 |
| Légendaire | 4 |
| Hors-série | 1 |
| **Total** | **67** |

**38 illustrations alternatives existantes** sont rattachées à ces personnages. Elles ne constituent pas, à ce stade, une sixième rareté.

## Ce qui reste à définir sans présumer du choix du créateur

Le taux de **10 %** sur la carte 4 est fixé, mais plusieurs règles distinctes restent ouvertes :
- Quel critère de sélection parmi les 38 alternatives, et quelles alternatives sont éligibles ?
- Une alternative remplace-t-elle une carte de base dans l'inventaire, s'y ajoute-t-elle, ou conserve-t-elle la même identité de personnage avec un visuel différent ?
- Les alternatives sont-elles nécessaires pour terminer la collection ?
- Une même carte peut-elle apparaître plusieurs fois dans un booster ?

Ces questions **ne modifient pas** les pourcentages décidés. Elles empêchent seulement l'activation d'un tirage de variantes en production sans règle vérifiable.

## Statut technique

- `data/regles-booster-67.json` : source de vérité des cinq positions, et statut explicite `STAGING_ONLY_NOT_LIVE`.
- `game/booster-plan-67.js` : sélection déterministe des **catégories** par position avec entier uniforme entre 0 et 99 fourni de l'extérieur ; n'attribue aucune carte.
- `tests/booster-plan-67.test.mjs` : contrôle les 100 issues possibles de chaque position et les frontières exactes 90/10 et 80/17/2/1.
- `data/raretes-validees-67.json` : rarétés renseignées par le créateur, validées en intégralité.
- `scripts/stage-approved-edition.mjs` : prépare le catalogue nominatif avec ses raretés, **mais ne peut pas encore déployer les alternatives**.
- `scripts/validate-rarity-decisions.mjs` : garde-fou contre les cartes manquantes ou les noms modifiés.

**Sécurité du tirage réel** : au déploiement, le serveur devra utiliser un générateur aléatoire cryptographique uniforme, choisir le résultat de chaque position puis une illustration admissible selon les règles ultérieures. La transaction devra enregistrer les cinq cartes et le délai de 24 h atomiquement. Le navigateur ne décide d'aucun résultat de tirage.

**Ne pas modifier le booster de fin de collection**, ni annoncer dans le catalogue public la composition de cette récompense.

**À ne pas confondre** : le code du prototype historique `game/booster.js` et le moteur actuel Floot continuent provisoirement avec leurs règles existantes. Les nouvelles probabilités sont préparées dans GitHub, pas encore publiées dans le backend Floot.
