# TCG Deseur — nouvelles règles validées le 14 octobre 2026

**Statut : cahier des charges de la prochaine modification Floot ; ne signifie pas encore publié.**
**Priorité : ces décisions remplacent toute consigne précédente contradictoire** (notamment boosters illimités et objectif de complétion limité à 67).

Application Floot existante : `1d1c3807-73a6-49c5-a59e-ec097d8caddf`.
Production actuelle : https://budget-illimite-tcg.floot.app (ancien nom de domaine ; nom visible TCG Deseur).

## 1. Système de codes cadeaux administrable

Créer un espace administrateur protégé côté **serveur** (`users.role = 'admin'` vérifié sur chaque action), sans interface de création publique. L'administrateur choisit **lui-même la chaîne du code** et ses effets.

Effets composables, à partir de primitives validées (aucune injection de JavaScript ou de SQL par le code personnalisé) :
- Accorder X boosters de base.
- Accorder X boosters spéciaux avec règles de tirage explicites et contrôlées (ex. rareté minimale, nombre de cartes, sélection de pools de cartes approuvées).
- Créer un booster personnalisé depuis une liste de cartes officielles précises, ou depuis une distribution déclarative validée ; chaque ouverture doit être atomique et produire un historique fidèle des illustrations reçues.
- Accorder une ou plusieurs **cartes officielles précises**, en choisissant la version principale ou alternative par `artwork_id`.
- Autoriser les lots combinant plusieurs types de récompense ; réserver l'ajout d'autres effets à des types autorisés explicitement.

Paramètres configurables de chaque code : nom interne, code exact choisi par l'administrateur, type(s) de gain et quantités, limite totale d'utilisations, limite par joueur (par défaut une), activation/désactivation, date d'expiration facultative. Afficher un suivi agrégé des utilisations sans données personnelles inutiles. Gestion de collisions et de codes non valides, réponse neutre ne facilitant pas l'énumération. Normalisation déterministe des codes (majuscules, espaces externes, tirets facultatifs selon règle fixée une fois). Stocker le hachage du code, jamais le code brut ; ne pas afficher tous les codes secrets en clair.

Tout gain est transactionnel avec verrous serveur : un code déjà utilisé par ce joueur ou ayant atteint son quota n'accorde rien ; aucun double crédit par double clic/concurrence. Ne distribuer que les 105 artworks publics officiellement approuvés ; **la récompense exceptionnelle confidentielle doit rester hors des codes cadeaux** tant qu'une décision explicite contraire n'est pas donnée.

## 2. Collection complète = 105 illustrations distinctes

La collection standard comporte **67 illustrations principales + 38 alternatives = 105 illustrations distinctes**, chacune possédée indépendamment par son `artwork_id`. L'obtention d'une alternative ajoute cette illustration précise (et l'exemplaire correspondant), mais ne doit pas accorder gratuitement l'illustration principale du personnage ; inversement idem. Une carte peut indiquer son personnage d'origine et sa version, sans confusion.

UI : 2 vues ou filtres « Principales » et « Alternatives », progression et doublons par illustration, historique visuel et information possédée/manquante. Afficher `X / 105` distinctes ; éviter de compter deux fois la même variante. Le booster final de complétion est débloqué **uniquement après possession des 105 illustrations distinctes**, vérifiée atomiquement côté serveur, une seule réclamation par compte.

Migration sans effacement : conserver `tcg_inventory_origin` (agrégé par personnage) et les inventaires historiques. Créer un inventaire par artwork distinct ; reconstruire les possessions anciennes **uniquement à partir des véritables URLs/artwork_ids enregistrés dans l'historique complet** et d'autres preuves incontestables ; ne pas inventer l'illustration d'une quantité héritée sans preuve. Prévoir un audit et un rapport de migration avant modification des progressions existantes. Vérifier qu'aucun utilisateur ne perd un gain ni des doublons.

IMPORTANT : ne divulguer jamais publiquement le nom, l'illustration, l'identifiant, la rareté, ni même l'existence d'une carte secrète ; présenter seulement « complète la collection pour débloquer un booster exceptionnel » et ne montrer son contenu qu'après obtention autorisée. Le total visible avant récompense demeure **105**.

## 3. Un booster régénéré toutes les 12 heures, stock maximum 3

**Désactiver définitivement le mode bêta à boosters ordinaires illimités.** Chaque joueur dispose d'une réserve de boosters standards régénérée **à raison d'un booster toutes les 12 heures**, avec au maximum **3 boosters standards non ouverts en réserve**. Chaque ouverture classique consomme 1 crédit disponible ; si crédit nul, bloquer côté serveur et afficher le prochain chargement. Montrer `0 à 3 boosters disponibles` et le délai de recharge dans l'interface. Donner au nouveau compte une première ouverture disponible immédiatement, puis renouveler à cadence 12 h.

Choix d'implémentation pour la réserve : si la réserve est pleine à 3, suspendre la recharge sans accumuler des unités invisibles ; lorsqu'un joueur consomme un booster depuis 3/3, reprendre un délai complet de 12 h avant le suivant. Calculer côté serveur dans une transaction avec verrou par utilisateur ; les mises à jour doivent résister aux ouvertures simultanées, aux multiples appareils, aux refreshs et aux retards de connexion. Ne plus reprendre le cooldown de 24 h.

Les crédits de **boosters cadeaux/sociaux/personnalisés** sont comptés dans un portefeuille distinct pour que des codes octroyant X boosters puissent réellement fonctionner même avec un plafond de 3 crédits régénérables. L'UI doit distinguer clairement la réserve régénérable (max 3) et les gains cadeaux. Vérifier avec le porteur s'il préfère un plafond global : par défaut seul le stock **régénéré** est plafonné à 3, car un code peut octroyer un nombre arbitraire de boosters.

## 4. Archives invisibles dans la nouvelle interface

Supprimer du rendu de la page principale et du classeur les blocs « Archive personnelle — cartes de l'ancienne édition de 160 » et « Ancienne collection — retrouver mes 49 cartes historiques » et tous liens/menus vers ces archives. **Ne pas supprimer les tables, inventaires ou données historiques** en base : seules les archives disparaissent de l'interface. Ne pas les renvoyer inutilement à un compte client si un endpoint peut l'éviter sans risque.

## 5. Fenêtre d'ouverture de booster

Sous les 5 cartes révélées, supprimer **tout** le récapitulatif : liste des cartes, « Bilan de ce booster », compte des nouvelles cartes, doublons et rareté maximale. Après avoir révélé toutes les cartes, afficher un bouton très visible **« Ouvrir un autre booster »** uniquement si le joueur détient encore un booster ouvrable dans son stock standard ou cadeau. Le clic lance le nouveau tirage **côté serveur**, remet la révélation à la première carte et affiche cinq nouvelles cartes sans rechargement. Bloquer les clics simultanés, afficher chargement/erreurs, et synchroniser réserve et classeur. Si stock épuisé : ne pas afficher un bouton qui ne fonctionne pas ; indiquer plutôt le délai de recharge ou l'absence de boosters.

## Ordre de travail et critères de validation

1. Migration schéma/stock 12 h et plafond 3, avec tests d'horloge, reprise à 3/3, nouvel utilisateur, connexions simultanées et absence de régression.
2. Inventaire indépendant des 105 illustrations et condition de booster exceptionnel à 105/105, récupération probante depuis l'historique, tests de sécurité/confidentialité.
3. Rendu alternatives et suppression des archives UI sans détruire les données.
4. Simplification de la fenêtre de booster, bouton conditionné au stock restant, récupération des erreurs et tests.
5. Codes cadeaux administrables et effets personnalisables dans un ensemble de règles sûres, tests de concurrence et de quotas.
6. Typecheck, tests Jasmine, tests HTTP d'accès, parcours utilisateur authentifié sur compte de test, audit desktop/mobile, publication Floot, vérification de la version publique.

Aucune des modifications de ce document n'est réputée livrée tant qu'elle n'a pas été réellement intégrée, testée et publiée dans Floot.
