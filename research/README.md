# Recherche iconographique — Thomas Deseur

Date de constitution : 8 octobre 2026.

## Résultats actuels

- **176 URLs** de captures de costumes trouvées sur **trois galeries publiques communautaires** TierMaker.
- **27 sources complémentaires** (épisodes YouTube, archives d'épisodes, TikTok, article de presse, publication Instagram).
- Deux apparitions directement identifiées dans des **titres officiels de vidéos Amixem** :
  - **Matelas** — 24 juillet 2022 — https://www.youtube.com/watch?v=qfL_GCXtYCU
  - **Fontaine** — 26 mars 2023 — https://www.youtube.com/watch?v=X1MSeqV4ZUw
- D'autres incarnations ont des indices documentaires : Dieu (vidéo retirée), personnage de parodie Vilebrequin, costume de radar, cosplay Poudlard. Elles demandent une vérification image par image.

**Point important** : 176 captures ne signifient pas 176 costumes, et 22 liens ne signifient pas 22 costumes validés. Plusieurs captures peuvent représenter le même costume. Des liens peuvent disparaître. Les origines exactes et les droits de chaque capture ne sont pas encore établis.

## Emplacement des données

- `visual-references.json` : tous les liens d'images, leur galerie de provenance, un identifiant stable (`REF-1-001`, `REF-2-001`, `REF-3-001`) et les champs encore à documenter.
- `source-videos.json` : vidéos et contenus d'origine avec leurs degrés de certitude.
- `index.html` : galerie de recherche et interface d'attribution manuelle (associations stockées dans le navigateur).

Galerie en ligne : https://cosscoll.github.io/TCG-Thomas-Deseur/research/

Sources principales :

1. https://tiermaker.com/create/costumes-de-thomas-deseur--vido-100-et-1000-couches--16494982 — **67 fichiers référencés**
2. https://tiermaker.com/create/costume-do-thomas-deseur-srie-100-couches-16050059 — **66 fichiers référencés**
3. https://tiermaker.com/create/personnages-thomas-deseur-17442760 — **43 fichiers référencés**

## Protocole pour transformer une référence en illustration réelle

1. Afficher la capture, vérifier qu'il s'agit bien de Thomas Deseur et relever son identifiant dans cette archive.
2. Retrouver la vidéo originale et son horodatage précis (pas seulement un titre ou une miniature).
3. Nommer le déguisement ou le personnage, puis rapprocher cette apparition d'un ID de carte existant.
4. Écarter les doublons, les montages trompeurs et les fichiers à qualité insuffisante.
5. Vérifier l'autorisation de reproduire l'image ou, si nécessaire, créer une **illustration dérivée autorisée et fidèle à une véritable référence**.
6. Ajouter un média optimisé au catalogue et enregistrer : titre, vidéaste, lien, timecode, crédit, origine et autorisation.

## Droits et limitations

Les images originales proviennent de vidéos réalisées par des tiers et de captures de contributeurs TierMaker. Nous **ne les avons pas copiées dans le dépôt** et aucun droit de réutilisation n'est présumé. La galerie affiche des liens directs distants uniquement à des fins de référence : le site source peut bloquer les prévisualisations ou supprimer les fichiers.

Cette recherche ne constitue **pas** une validation d'usage public ou commercial de l'image de Thomas Deseur, ni des droits d'auteur sur les vidéos et photographies. Les quatre portraits fictifs précédemment générés ne sont pas retenus comme images de carte.

## Vérification ZEVENT 2026

Les recherches d'octobre 2026 ont permis d'identifier plusieurs noms de cartes liés au ZEVENT 2026 : `loft_rejoint`, `loft_quitte`, `sacrifice_capillaire`, `sosies`, `chiffon` et `crossover_mcfly`. Deux concepts — `chemise` et `display_jdg` — ne disposent pas d'une réalisation confirmée. La source des objectifs annoncés n'est pas une preuve de visuel ; la progression et les clips sont renseignés dans `source-videos.json` et `card-mapping-status.json`.
