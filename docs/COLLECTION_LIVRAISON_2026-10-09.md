# TCG Deseur — Livrables Collection (session du 9 octobre 2026)

**Demande en cours :** avancer sur le maximum de fonctionnalités **collection, raretés, doublons et classeur**, les illustrations étant encore en création.

**Périmètre :** pas de nouveaux visuels, pas de combats, pas d'échanges, pas de boutique, pas de création ou modification de comptes joueurs. Les 49 identifiants historiques et les probabilités de booster restent inchangés.

## Complément de session — fiches et navigation des cartes (15:06–15:15 UTC)

**Fonctions ajoutées après les six premiers lots :**
- **Fiche individuelle** depuis le classeur ou l'espace Doublons : rareté, numéro de catalogue, statut Possédée/Manquante, quantité et exemplaires supplémentaires. Les illustrations restent explicitement en préparation.
- **Navigation entre les fiches** avec boutons précédent/suivant et flèches clavier ; fermeture avec Échap (élément natif `<dialog>`), sans modification des quantités.
- **Raccourcis directs par rareté** depuis les barres de progression vers les cartes correspondantes du classeur.
- **Raccourcis depuis les statistiques** : Possédées, Manquantes et Doublons, avec filtres cohérents.
- **Accessibilité des barres de progression** : valeurs accessibles pour la progression totale et les cinq raretés.
- **Contrôles supplémentaires** : tests statiques du câblage UI, tests Node de syntaxe des modules et des scénarios Playwright, nouveaux scénarios de navigation clavier et du détail des cartes.

**Vérification actuelle :** [GitHub Actions `37950227745`](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37950227745), **127 tests Node réussis sur 127, zéro échec**, commit `d7a46bb2e14c22a7c7fb632a85b9eb9271acf0ec`.

**Réserve de validation :** les tests Playwright de parcours réels existent dans `e2e/binder-demo.spec.mjs`, mais **n'ont pas été exécutés**. Les tests Node valident la logique, la présence de contrôles et la syntaxe, pas le comportement réel de l'interface dans Chromium. L'application Floot reste inchangée.

## État réel au terme du développement GitHub

### Développé et testé dans les modules indépendants

| Chantier | Livrable | Testé |
| --- | --- | --- |
| 1. Doublons avancés | Décompte des exemplaires supplémentaires, types de doublons, ventilation par rareté, liste et tri ; un doublon reste aussi une carte possédée | Tests Node |
| 2. Progression | 15 jalons informatifs : 1/5/10/25/49 uniques, 1 découverte pour chacune des 5 raretés et complétion de chaque rareté ; futurs objectifs mis en avant | Tests Node |
| 3. Ouvertures de boosters | Récapitulatif **après attribution serveur** : nouvelles découvertes, copies supplémentaires dans un même booster, rareté la plus haute, 5 cartes, taux normal/garanti, indice de délai non autoritatif | Tests Node |
| 4. Historique | Validation des ouvertures enregistrées et horodatées, tri récent, rareté par ouverture et 5 cartes ; **ne prétend pas savoir** si une ancienne carte était nouvelle ou en double lorsque l'historique est partiel | Tests Node |
| 5. Classeur / UX | Aperçu interactif à cinq sections (collection, doublons, progression, historique, bilan booster), filtres et tris, états vides, placeholders neutres, responsive CSS et accès clavier | Tests Node statiques ; tests navigateur préparés, **pas encore exécutés** |
| 6. Cohérence des inventaires | Diagnostic entre inventaire avant/ouverture confirmée/inventaire serveur relu ; signale les divergences et demande un rechargement sans inventer une attribution | Tests Node |

**CI vérifiée :** [GitHub Actions — exécution 37948492892](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/37948492892), **120 tests exécutés, 120 réussis, 0 échec** le 9 octobre 2026 vers 15:00 UTC. Cette réussite concerne les tests présents dans GitHub ; les tests Playwright de navigation réelle ne font pas partie de cette exécution.

### Sources à conserver pour l'intégration

- `floot-collection/collection-model.mjs` : modèle pur du classeur et des taux de rareté affichés.
- `floot-collection/collection-insights.mjs` : doublons, jalons, historique, récapitulatif et délai informatif.
- `floot-collection/collection-reconciliation.mjs` : comparaison en lecture seule d'inventaires.
- `floot-collection/demo.html`, `demo.mjs`, `demo.css` : **démonstration non connectée** utilisant des inventaires et ouvertures fictifs, zéro récompense et zéro donnée personnelle.
- `tests/floot-collection-model.test.mjs`, `tests/floot-collection-insights.test.mjs`, `tests/floot-collection-reconciliation.test.mjs`, `tests/floot-binder-demo.test.mjs` : suites Node.
- `e2e/binder-demo.spec.mjs` : **9 tests Playwright préparés**, qui doivent encore être exécutés avec l'ancien serveur statique de test. Ne pas les confondre avec un test de l'application Floot connectée.

## Limitations et risque de mauvaise interprétation

- **Floot : non modifié.** Quota quotidien de 100 actions épuisé ; lecture/modification refusée le 9 octobre à 14:30 UTC. Reset annoncé le 10 octobre à 09:00 UTC, vérifier l'état réel au début de la nouvelle session.
- **Aucune nouvelle fonctionnalité de collection n'est encore en production dans Floot.** Les modules sont prêts sur GitHub mais ne sont pas reliés au code React/Kysely/SQL réellement en ligne.
- Le dépôt GitHub conserve une ancienne démonstration statique et du code historique : **ne jamais activer la migration Supabase archivée**.
- La démo n'est pas un système d'ouverture de boosters. Son bouton de sélection de scénario ne met à jour que des quantités fictives non persistées.
- L'accès HTTP externe à la page GitHub Pages n'a pas pu être vérifié directement depuis l'outil web / le conteneur (site inaccessible dans ces environnements). Même si la publication GitHub réussit, il faut encore vérifier visuellement l'URL dans un navigateur.
- L'historique ne doit pas reconstituer un statut « Nouveau » ou « Doublon » à partir des seules ouvertures récentes. Le serveur peut disposer d'un historique partiel.
- Si un état serveur est incomplet (48 cartes) ou mal catégorisé, afficher une erreur explicite plutôt qu'une progression fausse.
- Ne pas afficher de données d'un compte déconnecté ou précédent : l'identité du joueur et l'invalidation du cache doivent être vérifiées à l'intégration.

## Prochain lot : intégration *dans le projet Floot existant*, pas de nouveau site

1. Confirmer la réinitialisation et lire `endpoints/collection_GET.ts` (+ schéma), `pages/_index.tsx`/CSS, `helpers/schema.tsx` et les tests Floot existants.
2. Traduire le contrat `{id,rarity,name,imageUrl}` et `{cardId,quantity}` vers les clés **réelles** des données serveur. Les modules ne doivent pas recevoir d'inventaire local modifiable.
3. Raccorder d'abord les compteurs, filtres, doubles et progression au classeur existant. Ne pas remplacer son interface par la démonstration GitHub sans une adaptation complète.
4. Consommer l'historique réel si disponible ; si son schéma ou ses métadonnées ne suffisent pas, afficher uniquement ce qui est vérifiable.
5. Le récapitulatif doit recevoir uniquement les cinq identifiants **après** une transaction serveur confirmée. En cas de perte de réponse, recharger le classeur au lieu de soumettre une deuxième ouverture.
6. Tests Floot isolés : deux comptes, historique, persistances, duplications, quotas, réseau perdu, cache d'identité, 320/393/412/820 px, clavier.
7. Checkpoint, typecheck, tests. Publier sur le même domaine **uniquement après réussite** ; vérifier le statut de publication et le résultat sur le site public. Ne jamais déclarer une modification en ligne avant ces vérifications.

## Lecture produit

[Conception fonctionnelle détaillée](CONCEPTION_COLLECTION_FLOOT.md) · [Plan de reprise](PLAN_REPRISE_2026-10-10.md) · [Journal de travail](FLOOT_SUIVI_AUTONOME.md)

**État final du lot GitHub : développé et testé unitairement ; intégration Floot et validation navigateur réelles non terminées.**
