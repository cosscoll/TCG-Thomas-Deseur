# TCG Deseur — état de référence à utiliser pour les travaux suivants

**Date de référence : 13 octobre 2026.** Ce dossier distingue les décisions approuvées, les opérations déjà publiées et les vérifications encore nécessaires. Il ne remplace pas les journaux techniques et ne contient aucune donnée privée de récompense.

## Édition en vigueur

Le **jeu connecté Floot** se trouve sur https://budget-illimite-tcg.floot.app/ et utilise l’**édition Origine** à 68 emplacements, dont 67 personnages nommés et une Carte mystère. Le catalogue public est composé de **33 Communes, 21 Rares, 8 Épiques, 4 Légendaires et 1 Hors-série**, plus l’emplacement neutre.

La base Floot de l’édition Origine est distincte de l’ancien prototype. L’ancien inventaire et les historiques n’ont pas été supprimés. Quatre illustrations de l’ancienne édition ont été rattachées sans ambiguïté au nouveau catalogue, la cinquième est conservée dans l’archive sans nouveau crédit.

**Limitation des boosters au 13 octobre : encore 24 heures dans Floot.** Le créateur a décidé de supprimer cette limitation **durant la bêta**, mais le correctif est bloqué par le quota Floot jusqu’à la fenêtre annoncée du 14 octobre à 11 h à Paris. Le traitement est programmé et décrit dans [issue #12](https://github.com/cosscoll/TCG-Thomas-Deseur/issues/12), sans garantie automatique de réussite.

### Probabilités des cinq cartes

Rangs 1–3 : Commune (100 % chacun). Rang 4 : Rare 90 % ou alternative 10 %. Rang 5 : Rare 80 %, Épique 17 %, Légendaire 2 %, Hors-série 1 %. Ces distributions ont été publiées dans le moteur Floot le 13 octobre et testées hors connexion, **mais l’ouverture réelle du NOUVEAU moteur sur un compte authentifié reste à recetter** (issue #11).

Une alternative est aujourd’hui choisie uniformément entre les **38 illustrations approuvées** sur la branche correspondante et rattachée au personnage auquel elle appartient. C’est une **interprétation technique provisoire**, pas une décision définitive sur les variantes.

## Illustrations officielles, séparées du serveur

Les 67 images principales et les 38 alternatives (105 au total) ont été converties en **WebP 3:4 de 768 × 1 024**. Les originaux demeurent inchangés. **105 miniatures 384 × 512** existent pour les performances mobiles. GitHub Pages affiche ces versions ; **Floot utilise encore les anciens liens des images** jusqu’à la migration préparée dans `data/migrations/floot-origin-uniform-105.sql`, à appliquer après sauvegarde, préflight et contrôle connecté.

Liens publics :

- [Galerie des 68 emplacements](https://cosscoll.github.io/TCG-Thomas-Deseur/collection-validee/)
- [Planche imprimable des 67 illustrations principales et des 38 alternatives](https://cosscoll.github.io/TCG-Thomas-Deseur/planches/)
- [Atelier de comparaison des 105 images avec annotations locales](https://cosscoll.github.io/TCG-Thomas-Deseur/audit-visuels/)
- [Atelier de maquettes carrées, Story et bannière exportables en PNG](https://cosscoll.github.io/TCG-Thomas-Deseur/kit-visuels/)
- [Suivi détaillé des 88 actions hors Floot](https://cosscoll.github.io/TCG-Thomas-Deseur/avancement/)
- [Page de test des utilisateurs volontaires](https://cosscoll.github.io/TCG-Thomas-Deseur/beta/)

Ces pages sont développées sur GitHub. La preuve d’un déploiement GitHub Pages n’est **jamais** une preuve de mise à jour des comptes ou boosters Floot.

## Sources officielles à privilégier

| Source | Usage | Statut |
| --- | --- | --- |
| `data/choix-cartes-2026-10-11.json` | 67 noms et liens images approuvés, 3 groupes écartés | Décision créateur |
| `data/raretes-validees-67.json` | Les 67 raretés par personnage | Décision créateur |
| `data/edition-staging-67.json` | Manifeste de migration conservant 67 noms, URLs et 38 variantes | Contenu actif dans Floot, **nom et statut de staging historiques** |
| `data/regles-booster-67.json` | Distributions validées des cinq positions | Contenu actif, **champ deploymentStatus daté d’avant le déploiement** |
| `data/approved-artwork-uniform-105.json` | Origine, format et SHA-256 des 105 images uniformisées | Publié sur GitHub, à migrer dans Floot |
| `data/thumbs-approved-105.json` | 105 miniatures WebP mobiles | Publié sur GitHub |
| `data/migrations/floot-origin-uniform-105.sql` | Mise à jour sûre des URLs (pré/postconditions) | **Préparé mais non exécuté** sur Floot |
| `data/suivi-88-actions.json` | Suivi détaillé des tâches et preuves GitHub | État documentaire, pas test Floot |

**Ne pas interpréter le libellé `STAGING_ONLY_NOT_LIVE` du fichier historique de règles comme une nouvelle preuve que Floot utilise encore 160 cartes.** Le statut du déploiement se trouve dans le rapport du 13 octobre et doit être revérifié en direct lors d’une intervention ultérieure.

## Rapports techniques actualisés

- [Rapport de déploiement Floot du 13 octobre](LIVRAISON_FLOOT_ORIGINE_68_2026-10-13.md).
- [Plan de reprise et de priorisation Floot](PLAN_REPRISE_FLOOT_14_10_2026.md).
- [Tests simulés et probabilités](ANALYSE_PROBABILITES_67_2026-10-13.md).
- [Comparaison 67 personnages ou 105 images](COMPARAISON_VARIANTES_67_VS_105_2026-10-13.md).
- [Audit catalogue, 105 références photographiques](AUDIT_CATALOGUE_67_2026-10-13.md).
- [Rapport des ressemblances visuelles, 30 paires à vérifier](REVUE_SIMILARITES_105_2026-10-13.md).
- [Revue de 12 paires de contraste](CONTRASTES_PUBLICS_2026-10-13.md).
- [Guide joueur et FAQ](GUIDE_JOUEUR_FAQ_ET_MESSAGES_2026-10-13.md).
- [Protocole de bêta-test](PROTOCOLE_BETA_ET_QUALITE_2026-10-13.md).
- [Sécurité, confidentialité et droits](SECURITE_CONFIDENTIALITE_ET_LEGAL_2026-10-13.md).
- [Gestion d’incident, sauvegardes et publication](RUNBOOK_EXPLOITATION_SAUVEGARDE_DEPLOIEMENT_2026-10-13.md).
- [Plan de communication](PLAN_COMMUNICATION_LANCEMENT_2026-10-13.md).
- [Sprints et risques](ROADMAP_SPRINTS_RISQUES_KPI_2026-10-13.md).

## Dossiers historiques à consulter uniquement pour retracer l’évolution

Les documents du 8 au 12 octobre peuvent parler de 49, 160, 161 cartes ou d’anciennes règles de combat. Ils restent archivés pour traçabilité, mais **ne font pas autorité** sur l’édition Origine actuelle. Le premier besoin de développement reste le retrait du délai bêta et la recette authentifiée du nouveau moteur.

## Décisions/contrôles humains non délégables

Valider les règles définitives des 38 variantes ; examiner les ressemblances entre images par costume/scène ; confirmer les droits d’images et de représentation ; approuver les conditions d’utilisation et la politique de confidentialité ; décider du lancement officiel et des modalités définitives des boosters. Les données privées du joueur et de la Carte mystère ne doivent jamais être copiées dans un dépôt public.

Le suivi des 88 actions compte **des livrables hors Floot** ; il ne faut jamais en déduire que le jeu connecté est certifié ou prêt pour le lancement officiel.
