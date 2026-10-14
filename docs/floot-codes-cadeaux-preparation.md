# TCG Deseur — préparation de la fonctionnalité Codes cadeaux

**Statut au 14 octobre 2026 : code préparé, pas encore appliqué au site Floot.**

Le quota journalier Floot de 100 actions a été atteint le 14 octobre. Reprise des intégrations dans Floot possible après la réinitialisation du 15 octobre 2026 à 09:00 UTC (11:00 à Amsterdam/Paris).

## Fonctionnalités à intégrer

- Espace « Codes cadeaux » connecté au compte du joueur.
- Codes de réduction de type **boosters cadeaux** (de 1 à 100 par code), conservés dans un solde distinct des boosters illimités de la bêta.
- Codes offrant **une carte officielle précise** (par référence `COST-xxx`, uniquement des cartes publiques déjà approuvées).
- Générateur de codes réservé au rôle **admin**, avec nombre d'utilisations autorisées et date d'expiration facultative.
- Code aléatoire de 96 bits, stockage uniquement de son hachage SHA-256, utilisable une seule fois par compte et soumis à une limite globale de distributions.
- Opérations transactionnelles PostgreSQL, compteur et inventaire atomiques, suivi des utilisations.
- Ouverture des boosters cadeaux par cinq cartes selon les probabilités officielles ; ne déduit pas les boosters gratuits de la bêta.
- Historique des cartes offertes et des boosters cadeaux distinct du booster de collection.

## Réalisation préparée

Un lot d'intégration a été produit comprenant la migration SQL, les trois endpoints serveur (création de code, utilisation de code, ouverture d'un booster cadeau), leurs contrats client, un composant React et sa feuille de style, des fonctions utilitaires et des tests unitaires.

**Important :** les fichiers Floot, la migration SQL, le typecheck Floot et le déploiement restent à exécuter. Ne pas afficher la fonctionnalité comme publiée avant tests. Aucun code cadeau réel n'a été généré et aucune donnée de joueur modifiée.

Le fonctionnement doit préserver la confidentialité du contenu du booster de complétion.
