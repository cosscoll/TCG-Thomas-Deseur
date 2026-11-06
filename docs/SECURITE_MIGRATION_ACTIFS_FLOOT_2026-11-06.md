# Séparation du code privé et des actifs publics — TCG Deseur

**Objet :** supprimer toute dépendance du jeu publié à GitHub Pages avant de rendre le dépôt source privé. Cette procédure est préparée, **pas exécutée**. Ne jamais rendre GitHub privé avant de réussir l'ensemble des contrôles et l'ouverture d'un historique joueur.

## Périmètre réel

- 67 cartes de base + 38 alternatives = **105 illustrations publiques** référencées par `tcg_cards_origin.image_path` et `tcg_cards_origin.variants[*].imagePath`.
- 1 carte de récompense confidentielle peut nécessiter un traitement distinct. **Ne pas publier son identité dans le manifeste public**. Lui donner un nom d'objet de stockage imprévisible si son image doit être publique.
- `tcg_pack_history_origin.artworks` contient les URL des images au moment du tirage. Les anciennes variantes ou ressources héritées peuvent différer des 105 images courantes : il faut **les inventorier et les copier aussi**, sinon les historiques des 679 boosters enregistrés risquent de se dégrader.
- Les références numériques, les inventaires, les codes cadeaux, les probabilités et le classement ne doivent pas être modifiés.
- Le portail documentaire GitHub Pages ne doit plus être une dépendance. Les pages légales existent déjà sur Floot; si la galerie reste souhaitée, la recréer sur Floot avant la bascule.

## Phase 1 — Inventaire en lecture seule

Exécuter dans Floot `query_database` :

```sql
SELECT COUNT(*) AS cards,
       COUNT(*) FILTER (WHERE normal_booster) AS public_cards
FROM tcg_cards_origin;

SELECT COUNT(*) AS public_variants
FROM tcg_cards_origin c
CROSS JOIN LATERAL jsonb_array_elements(c.variants::jsonb) AS variant
WHERE c.normal_booster = true;

SELECT COUNT(DISTINCT image_path) AS distinct_base_images
FROM tcg_cards_origin WHERE normal_booster = true;

SELECT DISTINCT u.url
FROM (
  SELECT image_path AS url FROM tcg_cards_origin
  UNION
  SELECT x.variant->>'imagePath' AS url
  FROM tcg_cards_origin c CROSS JOIN LATERAL
       jsonb_array_elements(c.variants::jsonb) x(variant)
  UNION
  SELECT jsonb_array_elements_text(h.artworks::jsonb) AS url
  FROM tcg_pack_history_origin h
) AS u
WHERE u.url LIKE '%github.io/%'
ORDER BY u.url;

SELECT COUNT(*) FROM tcg_pack_history_origin;
```

L'inventaire doit inclure **toutes** les images historiques et la récompense cachée, sans divulguer l'identité de cette dernière dans des résultats publics ou commits.

## Phase 2 — Copie, sans toucher aux joueurs

Utiliser le stockage d'actifs du projet **Floot** (et non `static/` ou une nouvelle API publique) :

1. Récupérer chaque ancienne illustration depuis la liste ci-dessus et vérifier son statut HTTP, son type MIME et ses octets.
2. Envoyer ses octets sur Floot Storage en WebP, via l'upload de fichier du projet ou `_floot.storageUpload` dans la VM. Pour les formats historiques différents, conserver les octets d'origine.
3. Choisir un nom stable sans donnée privée. Pour le visuel confidentiel, utiliser un nom aléatoire non dérivable de son identité.
4. Vérifier indépendamment que l'URL hébergée par **le domaine Floot publié** renvoie l'image correcte et le même contenu (SHA-256), sans nécessiter de session.
5. Enregistrer les correspondances `old_url -> new_url` dans une table de migration dédiée **après vérification**.

Table de correspondance, à créer par `execute_sql` une seule fois :

```sql
CREATE TABLE IF NOT EXISTS tcg_public_artwork_migration (
  old_url text PRIMARY KEY,
  new_url text NOT NULL UNIQUE,
  sha256_hex char(64) NOT NULL,
  copied_at timestamptz NOT NULL DEFAULT now()
);
```

Ne pas utiliser d'URL de prévisualisation `*.sandbox.floot.app` : les chemins persistants doivent résoudre sur le **jeu publié**.

## Phase 3 — Migration transactionnelle des URL

Avant de modifier les URL, sauvegarder les anciennes valeurs dans des tables internes à la même base :

```sql
CREATE TABLE IF NOT EXISTS tcg_cards_origin_artwork_backup_20261106 AS
SELECT id, image_path, variants FROM tcg_cards_origin;

CREATE TABLE IF NOT EXISTS tcg_pack_history_artwork_backup_20261106 AS
SELECT id, artworks FROM tcg_pack_history_origin;
```

Vérifier que chaque URL GitHub actuellement utilisée, y compris celles des tirages historiques, a une ligne vérifiée dans `tcg_public_artwork_migration`. **Si une seule URL manque, ne pas lancer les UPDATE.**

Mettre ensuite à jour les URL des cartes, variantes et historiques dans une seule transaction SQL (Floot `execute_sql` l'encapsule déjà) :

```sql
UPDATE tcg_cards_origin c
SET image_path = COALESCE((SELECT m.new_url
                           FROM tcg_public_artwork_migration m
                           WHERE m.old_url = c.image_path),c.image_path),
    variants = COALESCE((
      SELECT jsonb_agg(
        CASE WHEN m.new_url IS NOT NULL
             THEN jsonb_set(v.item, '{imagePath}',to_jsonb(m.new_url),true)
             ELSE v.item END
        ORDER BY v.ordinal
      )
      FROM jsonb_array_elements(c.variants::jsonb) WITH ORDINALITY v(item,ordinal)
      LEFT JOIN tcg_public_artwork_migration m
             ON m.old_url = v.item->>'imagePath'
    ), '[]'::jsonb)
WHERE c.image_path LIKE '%github.io/%'
   OR c.variants::text LIKE '%github.io/%';

UPDATE tcg_pack_history_origin h
SET artworks = COALESCE((
  SELECT jsonb_agg(to_jsonb(COALESCE(m.new_url,v.value)) ORDER BY v.ordinal)
  FROM jsonb_array_elements_text(h.artworks::jsonb)
       WITH ORDINALITY v(value,ordinal)
  LEFT JOIN tcg_public_artwork_migration m ON m.old_url=v.value
),'[]'::jsonb)
WHERE h.artworks::text LIKE '%github.io/%';
```

**Attention :** l'exécution devra être adaptée si l'inspection révèle des URL relatives ou des images encore hébergées ailleurs. La requête de migration ne doit pas modifier le champ `drawn` ni les inventaires.

## Phase 4 — Recette avant toute privatisation

Vérifications bloquantes :

- [ ] 67 bases + 38 variantes visibles après migration, au bon ratio, sur le vrai domaine Floot.
- [ ] La récompense confidentielle reste non divulguée aux joueurs non éligibles.
- [ ] Ouverture d'une collection, détails d'une carte, variantes, historique de booster et profil : images correctes.
- [ ] Aucune URL `github.io` résiduelle dans `tcg_cards_origin.image_path`, `variants` ou `tcg_pack_history_origin.artworks`.
- [ ] Nombre de cartes, nombre d'inventaires, quantités, boosters et codes cadeaux inchangés.
- [ ] Stockage Floot testé sur ordinateur et téléphone, y compris sans session pour les images publiques.
- [ ] Déploiement Floot effectué et vérifié.
- [ ] Les chemins `/_api/collection` et les actions POST restent fermés en l'absence de session.
- [ ] Nouvelle galerie publique sur Floot si elle doit être conservée.

**Seulement après succès :** dans GitHub Settings → General → Danger Zone → Change repository visibility → **Private**. Le connecteur GitHub actuel ne permet pas cette modification administrative; elle doit être faite dans les réglages GitHub par le titulaire. Les anciennes copies publiques ou caches ne seront pas effacés rétroactivement.

## Restauration

Avant d'agir, relever l'état du déploiement Floot. En cas de carte cassée, restaurer d'abord les URL sauvegardées (sans toucher aux inventaires), puis republier Floot et vérifier la santé des trois API publiques/privées. Ne pas rendre GitHub privé avant la fin de cette restauration.

Les sauvegardes SQL servent uniquement à une restauration ciblée des **URL d'images**. Elles ne sont pas une solution générale de sauvegarde de la base de données.
