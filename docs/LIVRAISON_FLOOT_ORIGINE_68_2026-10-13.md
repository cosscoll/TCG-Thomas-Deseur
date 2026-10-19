# Livraison Floot — Édition Origine 68 cartes, 13 octobre 2026

## Statut prouvé

**Publication de la nouvelle édition confirmée par Floot** : job `daaedf69-a0bf-4509-95ec-55788ec8d0dc` terminé avec état `succeeded`, URL publique https://tcg-thomas-deseur.floot.app.

Un contrôle HTTP de production confirme `GET /` → **200** et des API privées protégées sans cookie (`/_api/collection`, `/_api/booster`, `/_api/completion` → **401**). Le vrai module JavaScript d'accueil publié `/_assets/_index-C7uR0Gd7.js` répond **200** et inclut les textes « ÉDITION ORIGINE · 68 CARTES », « 67 cartes officielles », les nouvelles probabilités et l'archive de l'ancienne édition. Il ne contient aucun des noms/références privés interdits de la récompense. Ces vérifications ne remplacent **pas** l'ouverture authentifiée d'un booster **nouvelle édition**.

**Tests du projet Floot : 16 suites Jasmine réussies, zéro échec ; TypeScript : zéro erreur.**
Checkpoint Floot **`7fabec83-ae3b-461d-a676-b3ff8cc54a71`**, « Édition Origine — classeur 68 cartes et nouveaux boosters ».

### Base et intégrité vérifiées en lecture seule

| Élément | Valeur confirmée |
| --- | ---: |
| Cartes publiques ordinaires | 67 |
| Commune | 33 |
| Rare | 21 |
| Épique | 8 |
| Légendaire | 4 |
| Hors-série | 1 |
| Carte mystère conservée côté serveur uniquement | 1 |
| Entrées du catalogue, y compris emplacement mystère | 68 |
| Illustrations alternatives rattachées aux 67 cartes | 38 |
| Anciennes lignes d'inventaire conservées | 5 |
| Ancien booster conservé en historique | 1 |
| Illustrations anciennes liées avec certitude à un personnage de la nouvelle édition | 4 |
| Lignes de transfert auditées et crédits dans le nouveau classeur | 4 |

L'illustration d'une cinquième ancienne carte ne correspond à aucun des visuels approuvés de la nouvelle édition. Elle **reste dans l'archive** sans nouveau crédit.

Les anciennes tables (`tcg_cards_161`, `tcg_inventory_161`, `tcg_pack_history_161`) **n'ont pas été supprimées** ; les nouvelles tables dédiées sont `tcg_cards_origin`, `tcg_inventory_origin`, `tcg_pack_history_origin`, `tcg_reward_claims_origin`, `tcg_origin_imports`. Les transferts de cartes sont enregistrés et idempotents. Les ID, noms, illustrations et raretés des 67 cartes proviennent **exclusivement** de `data/edition-staging-67.json`, lui-même dérivé des validations originales. La 68e n'est jamais publiée dans le manifeste GitHub.

## Probabilités ordinaires effectivement intégrées au serveur

| Rang | Distribution exacte |
| --- | --- |
| Carte 1 | 100 % Commune |
| Carte 2 | 100 % Commune |
| Carte 3 | 100 % Commune |
| Carte 4 | 90 % Rare / 10 % Illustration alternative |
| Carte 5 | 80 % Rare / 17 % Épique / 2 % Légendaire / 1 % Hors-série |

Le tirage utilise `node:crypto.randomInt` **côté serveur**. Les cartes et leurs quantités sont écrites dans la même transaction que l'historique de cinq cartes. Une ouverture crédite cinq cartes exactement ; le délai existant de **24 heures** est conservé, même après changement d'édition. Les rares possibilités de doublon dans un même booster incrémentent correctement la quantité de la référence de base. Le compteur de cartes distinctes est séparé du compteur de copies.

**Politique technique provisoire des 38 alternatives** : lorsque le 10 % se produit à l'emplacement 4, une des 38 illustrations existantes est choisie uniformément ; elle garde l'identité et la rareté du personnage auquel elle appartient, augmente son compteur de copies et enregistre **l'illustration exacte dans l'historique du booster**. Cette décision d'implémentation est **à confirmer par le créateur**, notamment sur le statut d'une variante en tant qu'objet de collection indépendant. Elle ne compte pas comme un 69e personnage et n'est pas nécessaire pour atteindre les 67 personnages distincts dans cette version.

## Confidentialité de la Carte mystère

Le site et son API n'affichent que **« Carte mystère »** avant obtention. Pas de nom réel, photo, illustration ni indication concernant les modalités précises d'obtention ; le booster de complétion annonce seulement un contenu à découvrir. Les données confidentielles restent stockées dans la base serveur et ne figurent ni dans le manifeste GitHub ni dans le bundle d'accueil vérifié.

## Blocages / validations qui restent

1. **Aucune ouverture du nouveau booster 67 n'a encore été vérifiée sur un compte authentifié en production.** La capture du 13 octobre confirme une ouverture réussie avec l'ancien moteur, **avant la migration**. Le test du nouveau moteur doit confirmer les cinq cartes, leur ordre, leur persistance et le délai. Ne pas ouvrir une deuxième fois le booster du propriétaire pendant son délai de 24 h.
2. **Décisions alternatives à confirmer** : sélection uniforme entre 38, héritage de rareté, comptabilisation de la variante dans l'inventaire/complétion. Le stockage de l'illustration exacte dans l'historique permet une reprise sans perdre cette information.
3. **Métadonnées HTML de Floot** : la description du projet affiche encore l'ancien nombre de cartes dans le document initial. Le `update_project_metadata` a été tenté, mais refusé car le quota quotidien Floot est épuisé ; il faut corriger cela lors de la prochaine reprise. Les textes React visibles et le bundle public sont, eux, à jour.
4. **Formats d'images** : l'uniformisation bitmap 105 illustrations (fond étendu/recadrage, visuels sources préservés) reste un chantier distinct ; les conteneurs de cartes utilisent déjà un encadrement CSS.
5. Contrôler la connexion, le classeur de 68 cartes et l'archive des cinq anciennes, ainsi que le responsive sur le site connecté ; aucun passage au lancement officiel sans ces recettes.

**Quota Floot** : la prochaine reprise technique a été annoncée pour le **14 octobre 2026 à 09:00 UTC (11 h heure de Paris)** ; la publication du 13 octobre a été réussie avant ce blocage.

Ce document est un rapport d'exécution ; les fichiers JSON historiques de décision restent inchangés pour conserver la traçabilité de ce qui était validé versus la politique technique provisoire.
