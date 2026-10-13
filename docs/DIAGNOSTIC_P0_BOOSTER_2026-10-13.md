# Diagnostic P0 — booster affiché disponible, mais refusé

**Préparation du 13 octobre 2026 avant le retour du quota Floot à 09:00 UTC.**
L'incident est suivi dans [GitHub issue #10](https://github.com/cosscoll/TCG-Thomas-Deseur/issues/10).
Ce document ne conclut PAS sur la cause. Aucune carte ni quantité ne doit être écrite dans la base pour établir ce diagnostic.

## Fait reproductible

Le compte du propriétaire présente « Ton booster gratuit est prêt. » puis, après « Ouvrir mon booster », « Ouverture impossible pour le moment. La disponibilité va être actualisée. ». La capture confirme le problème **côté interface connectée** ; elle ne contient ni le code HTTP du POST ni les logs serveur.

## Ordre strict des vérifications après le retour de l'accès Floot

1. **Logs en premier**, avant toute modification : `get_logs(source="server", limit=50)`. Relever horaire, méthode, chemin, statut, durée, code d'erreur interne (sans copier les identifiants/cookies ou secrets). Les logs de l'incident peuvent ne plus être disponibles après leur période de rétention ; si c'est le cas, le signaler.
2. Relire les fichiers réels, avec leurs versions : `endpoints/booster_POST.ts`, `endpoints/booster_POST.schema.ts`, `endpoints/collection_GET.ts`, `endpoints/collection_GET.schema.ts`, `pages/_index.tsx` et les helpers d'authentification. Ne pas supposer qu'ils sont identiques à la dernière inspection.
3. Vérifier le code de réponse pour séparer les branches : `401/403` (session), `429` (délai), `4xx` de validation, `500`/erreur SQL, `200` mais réponse incompatible, et défaut de rafraîchissement après commit.
4. Contrôler en **lecture seule** le catalogue des cartes autorisées en booster, les contraintes des tables et l'état de l'historique du compte autorisé (identifiant à lire depuis la session côté serveur ; ne jamais publier son adresse e-mail ou l'ID réel).
5. Pour tout doute sur un POST **ayant pu committer**, vérifier l'historique et les possessions avant de relancer. Un toast d'erreur ne prouve PAS que le tirage est annulé.
6. Reproduire et corriger uniquement la cause confirmée. Exécuter `typecheck`, tests Jasmine Floot et la nouvelle suite GitHub Playwright avec APIs **simulées**, puis réaliser une validation authentifiée autorisée sans altérer un compte tiers.
7. Checkpoint, publication Floot, contrôle du job, test HTTP de la version réelle et vérification de cinq nouvelles cartes persistées. Clôturer #10 uniquement sur une preuve réelle.

## Requêtes SQL indicatives, lecture seule uniquement

Les noms de tables et colonnes ci-dessous proviennent d'une inspection Floot antérieure : **reconfirmer le schéma avant exécution**.

```sql
-- Horloge du serveur (évite de confondre UTC et fuseau du navigateur).
SELECT NOW() AS server_now_utc;

-- Pool des cartes ordinaires : vérifie les catégories non vides.
SELECT rarity, COUNT(*) AS cartes_admissibles
FROM tcg_cards_161
WHERE normal_booster = true
GROUP BY rarity ORDER BY rarity;

-- Contraintes SQL liées aux cartes et aux inventaires.
SELECT conrelid::regclass::text AS table_name, contype, conname,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid IN (
  'tcg_cards_161'::regclass,
  'tcg_inventory_161'::regclass,
  'tcg_pack_status'::regclass,
  'tcg_pack_history_161'::regclass
)
ORDER BY table_name, conname;

-- Totaux anonymisés (PAS de sélection de données personnelles).
SELECT
  (SELECT COUNT(*) FROM tcg_pack_history_161) AS boosters_enregistres,
  (SELECT COUNT(*) FROM tcg_inventory_161) AS positions_inventaire,
  (SELECT COUNT(*) FROM tcg_pack_status) AS statuts_de_disponibilite;
```

Pour un compte de test expressément autorisé, lire séparément ses seules lignes via une **valeur de user_id connue du serveur**, sans inscrire l'identifiant dans le ticket public. Par exemple, inspecter `opened` et `next_available` dans `tcg_pack_status`, puis rapprocher le nombre de boosters enregistrés et les cinq cartes associées dans `tcg_pack_history_161` avec les quantités de `tcg_inventory_161`. Ne pas présumer des noms de colonnes historiques tant que leur schéma n'a pas été revu.

**Interdits :** `UPDATE`, `INSERT`, `DELETE`, exécution du POST booster dans l'outil de diagnostic sans compte de test isolé et autorisé, reset manuel du cooldown, création d'un tirage fictif dans le vrai inventaire, export public de sessions/cookies.

## Matrice pour interpréter les résultats

| Observation | Diagnostic à poursuivre, sans présumer de la cause |
| --- | --- |
| GET collection = 200, POST booster = 401 | Session/gestion des cookies dans l'action POST |
| POST booster = 429 avec date future | Disponibilité divergente entre classeur et backend |
| POST booster = 500 avant insertion | Transaction, schéma, générateur de cartes ou contraintes |
| Historique augmenté + inventaire augmenté, mais toast d'erreur | Réponse invalide ou erreur après commit : rafraîchir la collection au lieu de débiter un second booster |
| Historique augmenté + inventaire non mis à jour | Transaction non atomique : escalade P0, pas de reset manuel |
| POST 200 avec moins de cinq cartes valides | Réponse serveur incomplète : ne jamais afficher une fausse ouverture |
| Pas de trace serveur du POST | Vérifier origine URL, route, réseau navigateur et déploiement de la version en ligne |

## Tests déjà livrés et prouvés

Sur GitHub Actions, `floot-e2e/mock-booster.spec.mjs` intercepte **toutes** les routes `/_api/` dans le navigateur avant tout appel réel. Il contient désormais :
- Un parcours simulé de cinq cartes et du délai de 24 h ;
- Une simulation d'erreur HTTP 500 sans récompense mensongère ;
- La persistance simulée après un rechargement ;
- Un cas où le serveur crédite le booster mais renvoie un récapitulatif invalide ;
- Une copie `×2` devenant `×3` sans progression artificielle des cartes uniques.

Le run GitHub Actions **38358673234** du 13 octobre 2026 a réussi (tests public/Playwright et sécurité anonyme). Ce résultat n'authentifie pas le propriétaire sur Floot et ne démontre pas la réparation du bug.

## Séparation des éditions

Le serveur Floot continue actuellement à utiliser sa collection provisoire. Les décisions du créateur pour les 67 cartes, les 38 variantes et les probabilités `1–3: Commune / 4: 90 % Rare, 10 % Alternative / 5: 80 % Rare, 17 % Épique, 2 % Légendaire, 1 % Hors-série` sont préservées dans GitHub. **Ne pas les déployer dans la même transaction que le correctif P0** tant que l'obtention et le suivi des variantes n'ont pas été validés.
