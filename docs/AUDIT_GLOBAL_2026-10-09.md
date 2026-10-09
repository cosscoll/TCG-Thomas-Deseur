# Archive — audit du prototype de combat du 9 octobre 2026

> **Archive historique.** Ce document concerne une ancienne version et ne décrit pas l'application active. Le développement de TCG Deseur et les comptes serveur sont maintenant sur Floot. Ne pas appliquer les instructions Supabase ni reprendre les objectifs de combat de cette archive. Consulter [la reprise Floot](FLOOT_REPRISE_2026-10-09.md) et le [README](../README.md).

**Date : 9 octobre 2026**  
**Référence :** `cosscoll/TCG-Thomas-Deseur`, branche `main`  
**Périmètre :** gameplay, catalogue, UX/UI, accessibilité, mobile, technique, sécurité, performance, référencement, progression, PvP, déploiement et qualité.

## Synthèse
Le projet est un **prototype solo jouable publié via GitHub Pages**, mais **pas une plateforme TCG complète**. La boucle « deck de huit cartes → combat contre Billy → résultat local » fonctionne dans le code et les simulations. Les systèmes de cartes possédées, véritable collection, serveur, compte utilisateur, multijoueur, classements et échanges ne sont pas implémentés dans le dépôt publié.

**Verdict :** montrer en tant que **démonstration technique publique**, mais ne pas annoncer une bêta grand public stabilisée ni un jeu complet.

## Limites de vérification
- Lecture directe de la branche `main`, inventaire du dépôt GitHub et inspection des sources `index.html`, `app.js`, `styles.css`, `data/cards.js`, `game/*.js`, tests et CI.
- Le dernier workflow GitHub Pages connu (`b768662b`) s'est terminé en **succès** le 8 octobre 2026.
- L'exécution CI Node du 8 octobre (`fdde468d`) a exécuté **21 tests : 21 réussis, 0 échec**. Les changements ultérieurs ont essentiellement porté sur les recherches et l'archivage de fichiers, et non sur le moteur solo.
- Simulations complémentaires du moteur par exécution JavaScript en mémoire : **9 séries de 200 matchs**, 3 niveaux de Billy × 3 stratégies du joueur, sans match bloqué.
- **Aucune capture graphique ni test Playwright/Chrome/Safari/Firefox/mobile n'a pu être réalisé pendant cet audit.** L'outil de navigation visuelle disponible est bloqué par l'insuffisance de crédits Firecrawl. Aucun score Lighthouse, Core Web Vitals, audit axe ou test avec de vrais joueurs n'est disponible. Les conclusions d'ergonomie reposent donc sur le code, non sur des mesures observées.

## État réel des fonctionnalités
| Domaine | Constat vérifiable | État |
| --- | --- | --- |
| Catalogue | 49 IDs uniques : 17 communes, 15 rares, 10 épiques, 4 légendaires, 3 secrètes ; noms provisoires | Prototype |
| Fiches | Rareté, rôle, PV, attaques, 2 liens vidéo officiels et repérage local | Fonctionnel mais contenu non final |
| Deck | Huit cartes uniques, suppression/ajout, suggestion équilibrée, sauvegarde navigateur | Implémenté |
| Solo | Combats tour par tour : frappe rapide, capacité, concentration, échange, réserve, 3 KO | Implémenté |
| IA | Billy en Découverte, Normal, Expert ; adversaire à deck fixe | Implémenté, calibrage insuffisant |
| Progression | Victoires/défaites/séries, 6 badges, données dans localStorage | Local uniquement |
| Booster | Tirage simulé de cinq cartes, dernier emplacement rare ou mieux | Démo, aucune carte obtenue |
| Compte et cloud | Aucun service connecté au frontend | Absent |
| Économie | Aucun Budget réel, inventaire possédé ni déduction de crédit | Absent |
| PvP | Aucun lobby/matchmaking/partie synchronisée dans le site publié | Absent |
| Échanges/rang | Aucun trading/ELO/classement | Absent |
| Application installable | Pas de manifest web app ni service worker | Absent |

## Constats par domaine

### A. Game design — **priorité très haute**
1. **Identité ludique encore à définir** : le prototype fonctionne comme un jeu d'affrontement simplifié, mais n'a pas la boucle distinctive d'un TCG de collection (obtenir des cartes, les faire progresser, construire des synergies, gagner de nouveaux contenus).
2. **49 cartes qui ne se différencient que statistiquement** : `cardStats()` déduit les PV, dégâts et archétype d'un hash de l'ID. Pas de compétence propre, d'effet spécifique, de synergie, d'histoire ou de rareté à impact tactique.
3. **Rareté dissociée de la jouabilité** : elle colore la carte, mais ne modifie pas son pouvoir, sa distribution en deck, son acquisition (absente) ni sa valeur dans une collection. Ce n'est pas forcément une erreur de design, mais il faut une règle explicite.
4. **Quatre rôles distribués mécaniquement** : 13 Assaut, 11 Rempart, 7 Tacticien et 18 Chaos ; répartition non conçue manuellement.
5. **Faible rejouabilité** : deck fixe de Billy, victoire à 3 KO uniquement, sans défis, modes, variantes, objectifs de saison, boss ni cartes aux compétences uniques.
6. **Pas de sauvegarde de la partie en cours** : rafraîchir la page remet le match à zéro. Seuls deck, difficulté et compteurs sont conservés.

### B. IA et équilibrage — **priorité haute**
L'expert utilise une évaluation immédiate d'une seule action (`expertActionScore()`), pas une planification de plusieurs tours. L'IA normale a quelques heuristiques, mais toujours le même deck.

Simulation de **200 matchs par case** contre des decks tournants. Nombre de victoires de joueurs *scriptés* sur 200 :

| Stratégie joueur artificiel | Découverte | Normal | Expert |
| --- | ---: | ---: | ---: |
| Attaque systématique | 200 | 57 | 7 |
| Prudente (énergie, protection, échange) | 200 | 187 | 90 |
| Débutant passif (frappe simple, concentration périodique) | 0 | 0 | 0 |

**Interprétation :** de très fortes ruptures selon le style de jeu ; « Découverte » n'est pas nécessairement indulgent envers les vrais débutants. Ces chiffres **ne sont pas des taux de victoire réels** et ne permettent pas d'affirmer que le jeu est équilibré. Ajouter une matrice d'opposants, des tests entre decks diversifiés et des parties humaines.

### C. UX/UI et parcours — **priorité haute**
- Les 49 cartes ont le même point d'interrogation comme illustration ; les noms techniques compliquent l'identification et le choix. Les médias ne sont pas le sujet de ce cycle, mais l'expérience devra à terme être lisible même sans artwork.
- La page superpose catalogue, atelier, arène, badges, boosters et liens d'archives de recherche. Le chemin primaire « jouer tout de suite » manque de séparation et de hiérarchie.
- Navigation principale avec six liens et défilement horizontal sur petite largeur ; à confirmer en navigateur et à réduire en une navigation de jeu compacte.
- Le tutoriel existe dans `<details>`, mais n'accompagne pas les premiers tours ; pas d'explication contextuelle des blocages, avantages stratégiques ou limites de tour.
- La sélection du deck nécessite d'ouvrir une fiche de carte puis de revenir à l'atelier ; comparer les cartes ou remplacer directement une carte pourrait être plus rapide.
- Les boutons, couleurs de rareté, dialogues natifs et jauges accessibles constituent une base raisonnable, mais leurs interactions au clavier/tactile ne sont pas validées.

### D. Technique et fiabilité — **priorité moyenne/haute**
**Points favorables :** moteur de combat modulaire et pur, changements d'état immuables, seeds reproductibles, validations de decks/actions, 21 tests CI passés, 100 matchs complets dans la suite unitaire, mode local ne dépendant pas d'un serveur.

**Manques :**
- Le test UI simule un DOM minimal : **aucun test E2E réel** n'est présent ; pas de visual regression, tests tactiles, captures mobiles, compatibilité navigateur ou test accessibilité automatisé.
- Pas de contrôle de l'état du match après actualisation ni migration de sauvegarde plus sophistiquée que `version: 1`.
- `app.js` regroupe la quasi-totalité de l'UI ; prévoir séparation par services/écrans/modules lors de l'évolution.
- `README.md` conserve des consignes périmées (« pas de déploiement public », workflow désormais absent, chemin local tronqué) ; documentation à réaligner.
- GitHub Pages publie indépendamment du workflow de tests : il faut un déploiement qui **attend le succès de tests** pour empêcher une version cassée d'être mise en ligne.
- Pas de suivi de crashs ou d'erreurs clients, pas de télémétrie d'événements utiles, pas de versionnement utilisateur visible ni de procédure de rollback testée.

### E. Mobile, accessibilité, performance — **validation incomplète**
- Le CSS contient plusieurs breakpoints (1200, 850, 680, 600, 550, 450, 375 px), grilles adaptatives, en-tête horizontal défilant, `prefers-reduced-motion` pour les boosters.
- Attention à la densité des boutons en arène et à la lisibilité des petits textes (`.67rem`–`.72rem` sur de nombreux éléments) ; évaluer en 320/375/390/430 px et avec zoom 200 %.
- Contrôler contrastes WCAG, taille des cibles tactiles, navigation Tab, Escape des modales, gestion du focus, annonces de l'historique du combat.
- Pas de score de performance réel disponible. L'interface principale est légère en scripts, sans framework ni grandes images actuellement : **signal positif architectural**, non une mesure Lighthouse.
- Aucune PWA installable à ce jour : il existe un site responsive, pas une application installable/offline.

### F. Sécurité, données et plateforme — **bloquant pour le PvP, pas pour la démo statique**
- Le site actuel est essentiellement du HTML/CSS/JS statique. **Aucun backend Supabase n'est connecté et aucun secret serveur n'a été relevé dans les fichiers de frontend inspectés.** On ne peut pas attribuer au site public des failles hypothétiques d'un backend non déployé.
- Les données `localStorage` sont modifiables par l'utilisateur : acceptable pour une démo solo symbolique, **impropre à un inventaire, un classement ou une monnaie ayant une valeur**.
- Les anciens fichiers Edge Functions/Supabase fournis dans une archive, mais non intégrés au dépôt actuel, présentent des points à corriger **avant** déploiement : fonctions SECURITY DEFINER et RPC privilégiées, writes PvP non atomiques, confidentialité de la pioche, expiration des tours, CORS/rate limiting.
- Pour le vrai PvP, prévoir authentification, autorité serveur, contrôle des actions et RNG serveur, RLS testées, transactions atomiques pour boosters, échanges et résultats de partie, protections anti-abus et tests de concurrence.
- Le consentement, les données de compte et la politique de confidentialité doivent être conçus lors de l'ajout des fonctionnalités personnelles et des services tiers ; ne pas copier aveuglément un bandeau cookies sans traceurs concernés.

### G. Référencement et préparation produit — **pas encore engagés**
- `<meta name="robots" content="noindex,nofollow">` est présent sur la page du jeu : **le site exclut volontairement son indexation**. C'est cohérent avec un prototype, incompatible avec un futur objectif de visibilité SEO.
- Pas de `sitemap.xml`, métadonnées sociales Open Graph, favicon/identité éditoriale finale, canonical ni pages de présentation séparées pour une acquisition organique.
- Une plateforme lancée devra distinguer page d'accueil publique, espace de jeu et éventuelles pages de règles / communauté.
- Les éventuels droits d'utilisation d'images et d'identité devront être clarifiés avant diffusion commerciale, sans rouvrir ici le chantier graphique.

## Priorisation — plan de travail proposé

### P0 — Avant une bêta solo publique sérieuse
1. **Décider la boucle de jeu** : pourquoi collectionner, que gagnent les joueurs, quelles stratégies sont possibles, quelle place donner aux raretés.
2. **Spécifier 49 cartes jouables** : rôles manuels, capacités distinctes, coût/énergie, effets, limites de decks, règles versionnées et tests.
3. **Rééquilibrer Billy** sur les vrais profils débutants et avancés ; diversifier ses decks et créer des adversaires/challenges.
4. **Refaire le parcours joueur** : accueil orienté « Jouer », onboarding en situation, sélection rapide du deck, combat lisible, résultat et revanche.
5. **Valider le site dans de vrais navigateurs** et corriger responsive/tactile/clavier.

### P1 — Passer d'une démo à un vrai jeu de collection
6. Concevoir inventaire possédé, progression, récompenses et boosters réellement acquis.
7. Créer la sauvegarde de partie et le compte sécurisé ; décider si le solo offline doit continuer.
8. Construire le backend Supabase avec RLS et économie transactionnelle **avant** de relier les récompenses.
9. Mettre en place un déploiement conditionné aux tests, un suivi d'erreurs et une stratégie de retour arrière.

### P2 — Plateforme évoluée
10. PvP sécurisé, matchmaking, délais de tours, abandon/déconnexion, observabilité.
11. Classé, saisons, échanges, anti-triche, modération et outils administrateurs.
12. PWA, optimisation avancée, suivi produit, SEO/publication et tests de charge.

## Critères d'acceptation pour la prochaine version solo
- Un nouveau joueur comprend le but et termine son premier combat sans documentation externe.
- Chaque carte a une vraie raison stratégique d'être choisie ; ses effets sont visibles et testés.
- Une partie s'exécute sur 320 px, sur mobile courant, au clavier et dans au moins deux moteurs de navigateur.
- L'IA ne propose jamais de coup illégal ; aucun scénario de test n'entraîne un match bloqué.
- Le deck est modifiable simplement et conservé de manière fiable.
- Le futur pipeline de publication bloque un déploiement si les tests échouent.
- **La portée de cette version reste solo** : ne pas promettre collection cloud et PvP tant que la sécurité et les opérations serveur ne sont pas vérifiées.

## Décision proposée
**Le bon prochain chantier n'est pas le PvP ni les médias. C'est une V0.2 centrée sur gameplay, vraie variété des cartes, équilibrage, onboarding, UX combat, responsive et tests navigateur.** C'est le socle à stabiliser avant d'investir dans l'économie et la compétition.

