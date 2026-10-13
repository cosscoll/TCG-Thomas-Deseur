# TCG Deseur — repérage des ressemblances visuelles parmi 105 illustrations

**Ces éléments sont des paires candidates, pas des doublons confirmés.**

Analyse des 5 460 paires possibles parmi les 105 visuels publics approuvés. Les empreintes dHash comparent la disposition générale des nuances de gris dans l'image complète et son centre. Aucune photo originale, carte ou rareté n'est modifiée.

Paires candidates : 0 ; entre personnages différents : 0 ; entre versions d'un même personnage : 0.

Planche comparative des 30 premières paires : [consulter les images](../audit-visuels/assets/similarites-candidates.jpg).

| Illustration A | Illustration B | Distance totale | Distance centrale | Même groupe officiel | Résultat |
| --- | --- | ---: | ---: | --- | --- |

## Interprétation et limites

Une image recadrée différemment peut être un vrai doublon non détecté. Deux scènes ou personnages distincts avec des formes similaires peuvent être signalés à tort. Il faut vérifier la même tenue, le même costume ou la même situation à l'oeil avant toute fusion.

Ne jamais supprimer une carte sur la seule base de ces scores ; documenter les arbitrages dans l'atelier de revue et faire valider les décisions.

Commande reproductible : python scripts/reperer-similarites-105.py (Pillow requis).
