# TCG Deseur — contrôle ciblé des contrastes, 13 octobre 2026

> Test de paires de couleurs explicites, pas une certification WCAG ni l’inspection de tous les états graphiques.

| Page | Élément | Texte | Fond | Contraste | AA texte normal 4,5:1 |
| --- | --- | --- | --- | ---: | --- |
| Collection | Texte principal | #fbf9fe | #100d1a | 18,35:1 | Oui |
| Collection | Texte secondaire | #c9bfd4 | #241a35 | 9,33:1 | Oui |
| Collection | Filtres et contrôles | #e0d5e7 | #100d1a | 13,56:1 | Oui |
| Bêta | Texte principal | #f7f3fb | #100c18 | 17,62:1 | Oui |
| Bêta | Texte secondaire | #d1c4d9 | #24182e | 10,13:1 | Oui |
| Atelier 105 | Texte principal | #f9f5ff | #120e1d | 17,66:1 | Oui |
| Atelier 105 | Texte secondaire | #d0c5dd | #241c32 | 9,88:1 | Oui |
| Atelier 105 | Bouton standard | #ffffff | #423450 | 11,42:1 | Oui |
| Atelier 105 | Bouton danger | #ffffff | #462b36 | 12,66:1 | Oui |
| Suivi 88 | Texte secondaire | #d9cce1 | #241a35 | 10,73:1 | Oui |
| Suivi 88 | Accent sur fond principal | #f7c98e | #130e21 | 12,32:1 | Oui |
| Atelier PNG | Accent secondaire | #f7d2a0 | #241c33 | 11,39:1 | Oui |

**Minimum de ces paires : 9,33:1.**

Non couverts : dégradés, focus/hover/disabled, overlays, contraste non textuel, zoom, lecteurs d’écran et interface authentifiée Floot.

Commande : node scripts/check-contrast-static.mjs --write.
