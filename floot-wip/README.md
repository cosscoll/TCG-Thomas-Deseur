# Sauvegarde partielle du développement Floot — 15 octobre 2026

Cette branche contient **une sauvegarde du code effectivement disponible dans cette conversation** pour le développement TCG Deseur effectué sur Floot le 15 octobre 2026. **Ce n'est pas un export intégral vérifié du projet Floot**, dont l'accès aux fichiers a été bloqué par le quota quotidien.

## Fichiers conservés

- `helpers/tcgBoosterStock.tsx` : fonctions de recharge toutes les 12 heures et réserve plafonnée à 3.
- `helpers/tcgArtworkCatalog.tsx` : catalogue des 67 cartes principales et des 38 alternatives, ordonné base puis variante.
- `endpoints/booster_POST.ts` : brouillon de l'endpoint serveur d'ouverture avec transaction, stock, variantes et boosters cadeaux.

## Développement restant dans Floot

Les changements du 15 octobre dans l'éditeur Floot et la base de données **ne sont pas synchronisés automatiquement** vers ce dépôt. Le détail est dans `docs/floot-reprise-2026-10-16.md` sur la branche principale. Les sept fichiers supplémentaires des codes personnalisés et la réconciliation SQL sont préparés dans l'archive fournie dans la conversation `TCG_Deseur_Codes_Personnalises_Integration_16_octobre.zip` ; ils ne sont pas encore intégrés au projet Floot.

## Statut

Les fichiers de cette branche sont des **sources de sauvegarde non intégrées au site GitHub Pages**. Ils ne doivent pas être considérés comme une application fonctionnelle déployée ou comme la totalité du projet Floot. Les comptes, tirages, cadeaux, sécurité et sauvegardes nécessitent le serveur backend et la base de données Floot. Ne pas fusionner directement dans `main` sans vérifier les fichiers et les tests sur Floot, ni exposer la récompense de complétion privée dans du code client.

Site Floot actuellement en production : https://budget-illimite-tcg.floot.app
