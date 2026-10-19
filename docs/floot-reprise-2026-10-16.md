# TCG Deseur — transmission de développement, reprise le 16 octobre 2026

> **MISE À JOUR DU 16 OCTOBRE 2026 — PUBLICATION CONFIRMÉE.** Les paragraphes historiques ci-dessous décrivent l'état bloqué au **15 octobre**, avant la reprise. Le code des 105 illustrations, les boosters rechargeables toutes les 12 heures, les codes cadeaux, le classeur et les corrections UI ont depuis été intégrés dans Floot et publiés avec succès sur https://tcg-thomas-deseur.floot.app (job `313bedcd-aff2-4ed8-8534-00740d1a65cb`, état `succeeded`). Le contrôle TypeScript est propre ; 20 fichiers Jasmine courants réussis et un fichier supplémentaire de validation des codes réussit séparément. Deux comptes temporaires ont chacun créé un compte et ouvert 5 cartes ; déconnexion/reconnexion et persistance validées, puis les comptes ont été supprimés. Accès anonymes aux API protégées : 401 ; création de code par joueur non-admin : 403. Les 525 historiques présents avant la publication ont été réconciliés sans écraser les inventaires, avec 2 629 copies préservées et 101 illustrations distinctes. Un checkpoint Floot a été créé. Les fichiers sources principaux ont été sauvegardés sur GitHub dans `floot-app/`. **Non validés encore** : émission puis utilisation réelle d'un code par un administrateur autorisé, examen manuel du rendu mobile sous session et tests visuels complets de la nouvelle galerie. La galerie publique GitHub a été corrigée pour présenter uniquement les 105 illustrations publiques, sans emplacement confidentiel. Cette mise à jour ne transforme pas les tests partiels en validation de bout en bout des codes cadeaux.



**État au 15 octobre 2026 vers 09:11 UTC : Floot a de nouveau épuisé le quota Free (100 actions de construction par cycle).** La limite se réinitialise le **16 octobre 2026 à 09:00 UTC (11 h à Paris)**. L'application est toujours publiée à https://tcg-thomas-deseur.floot.app mais **la nouvelle version du code Floot n'a PAS été republiée**. Ne jamais annoncer les fonctionnalités comme livrées sans tests et publication vérifiés.

Projet Floot `1d1c3807-73a6-49c5-a59e-ec097d8caddf`.

## Modifications réellement enregistrées le 15 octobre

### Données, migration SQL

Nouvelles colonnes `tcg_pack_status.stock INTEGER NOT NULL DEFAULT 1` et `recharge_at TIMESTAMPTZ`. Les comptes existants ont été crédités d'une réserve initiale de 3 ; pour les nouveaux comptes le code d'inscription crée un statut avec stock 1 et recharge 12 h plus tard.

Tables SQL ajoutées : `tcg_artwork_inventory(user_id,artwork_id,card_id,quantity)`, `tcg_gift_codes`, `tcg_gift_redemptions`, `tcg_gift_packs`; schema Kysely auto-actualisé dans `helpers/schema.tsx`.

La migration historique a réconcilié tous les 524 boosters anciens de l'utilisateur existant, chacun avec 5 URL d'illustration valides, plus les 4 exemplaires initiaux importés. Vérification SQL au moment de la migration : **2 624 exemplaires**, **101 illustrations distinctes**, dont **33 alternatives distinctes** ; total officiel à obtenir **105 illustrations publiques**. Historiques et inventaires anciens conservés intacts. **Attention** : le site public utilise encore l'ancienne version tant que la nouvelle publication Floot n'est pas faite. Il peut continuer à enregistrer de nouveaux boosters entre-temps. Avant publication, réconcilier les nouveaux historiques dont `tcg_pack_history_origin.id > 524` (sans recompter les anciens) dans `tcg_artwork_inventory`, et traiter les éventuelles modifications de quantities ; ne pas effacer les données réelles.

### Code Floot modifié dans l'éditeur, pas encore publié

- `helpers/tcgBoosterStock.tsx` : calcul pur de recharge par tranche de 12 h et plafond 3, suspension à 3/3.
- `helpers/tcgArtworkCatalog.tsx` : affiche les 67 cartes de base chacune immédiatement suivie de ses variantes ; 105 publiques ; bonus absent jusqu'à obtention.
- `endpoints/auth/register_with_password_POST.ts` : création de réserve à l'inscription.
- `endpoints/booster_POST.ts` : décompte transactionnel/verrou utilisateur ; si plus de boosters classiques, utilise un cadeau enregistré ; alternatif tirable uniquement si base déjà possédée **avant le tirage** ; inventaire spécifique par illustration + héritage par personnage ; historique avec URLs et état `stock`.
- `endpoints/booster_POST.schema.ts` : nouveau contrat avec stock, cadeaux, illustration `artworkId`.
- `endpoints/collection_GET.ts` et `.schema.ts` : catalogue unique 105, progression par artwork, recharge, cadeaux, historique et récompense cachée uniquement si réclamée ; archives supprimées des réponses publiques.
- `endpoints/completion_POST.ts` : déblocage conditionné à 105/105, verrou sur réserve, une seule réclamation.
- `helpers/tcgCollection.tsx` : support des catalogues 105 et 106 (106 uniquement si récompense privée obtenue).
- `components/TcgBinder.tsx` : mise en page séquentielle dans les données, label alternative, meilleure recherche d'illustration dans l'historique.
- `pages/_index.tsx` : présentation 105, stock et timer, anciennes archives masquées, suppression des étiquettes/bilan sous les cartes révélées, bouton ouvrant le booster suivant si réserve disponible.

Dernier `typecheck` demandé par l'agent avant le dernier changement de CSS : **clean**. Aucune batterie de tests Jasmine complète n'a pu être exécutée depuis ces modifications et aucune publication Floot n'a été effectuée. Les modifications CSS envisagées (style visuel reliant base et alternative + bouton `finalActions`) ont été **REFUSÉES par le quota** et sont à refaire.

**ATTENTION aux interférences** : une automation de reprise à 11 h 05 le 15 octobre a été désactivée vers 09:05 UTC ; certains changements dans `helpers/tcgBoosterAvailability.tsx` et ses tests ont été réécrits parallèlement au travail de ce chat. Avant de reprendre, lire systématiquement les fichiers actuels, contrôler les erreurs et les tests ; ne jamais présumer que le code correspond exactement à ce rapport.

## Priorités utilisateur impératives

Ordre **1 → 2 → 3 → 4 → 5 → 6 → 8 → 9 → 7 → 10**, conforme au document [règles du 14 octobre](./tcg-deseur-evolution-regles-2026-10-14.md), amendé le 15.

**Tâches restantes cruciales** :
1. **Avant tout, vérifier et réparer les migrations/code enregistrés** ; la production utilise toujours la version ancienne et les historiques ont continué de s'enrichir. Refaire la migration incrémentale id>524 sans double attribution, valider l'inventaire et les stocks existants.
2. **Terminer les codes cadeaux admin et joueur** : les tables existent mais pas les endpoints ni le formulaire. Utilisateur doit choisir exactement le nom du code et ses récompenses combinables (N boosters classiques/spéciaux/personnalisés, cartes précises, alternatives seulement si base déjà détenue), quotas, expirations, hachage des codes, transactions, sécurité du rôle admin et anti-rejeu.
3. **Terminer le style** `components/TcgBinder.module.css` pour `data-alternative=true` et `altLink`; `pages/_index.module.css` pour `finalActions`. Contrôler order visuel juste après base, y compris sur mobile.
4. **Vérifier la gestion des codes cadeau/boosters spéciaux** et ne pas faire passer le résultat comme prêt avant mise en place du front.
5. **Jasmine, TypeScript, sécurité, tests réseau, deux comptes d'essai isolés** et contrôle post-déploiement public. Les comptes doivent créer leurs inventaires et les récupérer après reconnexion, sans contamination interjoueurs. Éviter de modifier les comptes authentiques durant la recette.
6. **Créer un checkpoint Floot**, republier sur le sous-domaine Floot existant et vérifier HTTP et UI réels.

Le quota de 100 actions semble aussi avoir été consommé par des interventions de l'automation programmée. Regrouper les écritures, éviter les allers-retours, et démarrer les tests ainsi que la publication suffisamment tôt. Si nécessaire publier d'abord un palier cohérent au lieu de bloquer toutes les livraisons.

## Critère de confidentialité

Aucun joueur non récompensé ne doit apprendre qu'il existe une carte bonus cachée. L'écran parle uniquement d'un « booster exceptionnel » après **105 illustrations**. Les codes ne permettent jamais d'obtenir la récompense réservée à cette complétion.
