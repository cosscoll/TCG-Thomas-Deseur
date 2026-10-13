# TCG Deseur — repérage des ressemblances visuelles parmi 105 illustrations

**Ces éléments sont des paires candidates, pas des doublons confirmés.**

Analyse des 5 460 paires possibles parmi les 105 visuels publics approuvés. Les empreintes dHash comparent la disposition générale des nuances de gris dans l'image complète et son centre. Aucune photo originale, carte ou rareté n'est modifiée.

Paires franchissant les seuils stricts : 0. Les **30 plus proches visuellement**, même en l'absence de dépassement de seuil, sont soumises à une revue : 28 entre personnages distincts et 2 du même personnage.

Planche comparative des 30 premières paires : [consulter les images](../audit-visuels/assets/similarites-candidates.jpg).

| Illustration A | Illustration B | Distance totale | Distance centrale | Même groupe officiel | Résultat |
| --- | --- | ---: | ---: | --- | --- |
| td_2_023 | td_2_034 | 11 | 29 | Non | Revue nécessaire |
| td_3_010 | td_2_031 | 13 | 18 | Non | Revue nécessaire |
| td_2_035 | td_2_049 | 14 | 24 | Non | Revue nécessaire |
| td_3_009 | td_2_049 | 14 | 24 | Non | Revue nécessaire |
| td_1_014 | td_1_065 | 14 | 26 | Non | Revue nécessaire |
| td_2_030 | td_2_035 | 14 | 27 | Non | Revue nécessaire |
| td_1_012 | td_3_024 | 16 | 16 | Oui | Revue nécessaire |
| td_2_023 | td_2_049 | 16 | 18 | Non | Revue nécessaire |
| td_1_010 | td_1_019 | 19 | 16 | Non | Revue nécessaire |
| td_1_005 | td_1_019 | 21 | 16 | Non | Revue nécessaire |
| td_1_021 | td_3_002 | 16 | 22 | Non | Revue nécessaire |
| td_2_001 | td_3_038 | 16 | 24 | Non | Revue nécessaire |
| td_1_010 | td_3_038 | 16 | 25 | Non | Revue nécessaire |
| td_2_005 | td_lille | 16 | 25 | Non | Revue nécessaire |
| td_3_022 | td_3_036 | 16 | 26 | Non | Revue nécessaire |
| td_2_066 | td_2_049 | 16 | 28 | Non | Revue nécessaire |
| td_1_030 | td_1_045 | 16 | 34 | Non | Revue nécessaire |
| td_2_023 | td_1_040 | 17 | 22 | Non | Revue nécessaire |
| td_3_010 | td_2_052 | 17 | 22 | Non | Revue nécessaire |
| td_3_043 | td_2_045 | 17 | 22 | Non | Revue nécessaire |
| td_2_035 | td_1_063 | 23 | 17 | Non | Revue nécessaire |
| td_2_019 | td_2_048 | 17 | 24 | Non | Revue nécessaire |
| td_3_010 | td_3_022 | 17 | 24 | Non | Revue nécessaire |
| td_3_029 | td_3_014 | 17 | 24 | Non | Revue nécessaire |
| td_3_042 | td_2_045 | 24 | 17 | Non | Revue nécessaire |
| td_1_019 | td_1_045 | 17 | 25 | Non | Revue nécessaire |
| td_3_043 | td_3_003 | 17 | 26 | Non | Revue nécessaire |
| td_1_019 | td_1_030 | 17 | 27 | Non | Revue nécessaire |
| td_2_034 | td_3_041 | 17 | 27 | Oui | Revue nécessaire |
| td_1_028 | td_3_002 | 17 | 28 | Non | Revue nécessaire |

## Interprétation et limites

Une image recadrée différemment peut être un vrai doublon non détecté. Deux scènes ou personnages distincts avec des formes similaires peuvent être signalés à tort. Il faut vérifier la même tenue, le même costume ou la même situation à l'oeil avant toute fusion.

Ne jamais supprimer une carte sur la seule base de ces scores ; documenter les arbitrages dans l'atelier de revue et faire valider les décisions.

Commande reproductible : python scripts/reperer-similarites-105.py (Pillow requis).
