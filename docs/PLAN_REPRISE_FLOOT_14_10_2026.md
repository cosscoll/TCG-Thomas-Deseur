# TCG Deseur — Plan de reprise optimisé après remise à zéro Floot

**Décision du créateur : 13 octobre 2026.** Ce document est une liste de travaux concrets à exécuter à partir du retour d'accès Floot, annoncé le **14 octobre 2026 à 09:00 UTC (11 h heure de Paris)**. Les dates/heures d'accès restent à vérifier avec un nouvel appel. **Les actions ci-dessous NE SONT PAS encore réalisées simplement parce qu'elles sont planifiées.**

## Source de vérité et périmètre à préserver

- **Floot ACTIF** : projet `1d1c3807-73a6-49c5-a59e-ec097d8caddf`, https://budget-illimite-tcg.floot.app ; publication de l'édition Origine le 13/10/2026 confirmée par job `daaedf69-a0bf-4509-95ec-55788ec8d0dc`.
- **GitHub** : `cosscoll/TCG-Thomas-Deseur` est le dépôt documentaire et de tests ; modifier GitHub **ne déploie pas** directement du code Floot.
- **68 emplacements** : 67 personnages connus (33 Communes, 21 Rares, 8 Épiques, 4 Légendaires, 1 Hors-série) + une **Carte mystère** sans divulgation du nom véritable, de l'illustration ou des modalités précises d'obtention.
- **105 illustrations retenues** : 67 principales + 38 alternatives, dont l'inventaire indépendant et la participation à la complétion restent à décider par le créateur. En production actuelle, illustration alternative uniformément tirée parmi 38 sur la branche 10 %, rattachée au personnage avec sa propre image mémorisée dans l'historique du booster.
- **Tirage ordinaire actuel** : rangs 1, 2, 3 = 100 % Commune chacun ; rang 4 = 90 % Rare ou 10 % illustration alternative ; rang 5 = 80 % Rare, 17 % Épique, 2 % Légendaire, 1 % Hors-série. Tirage depuis le serveur via `node:crypto.randomInt`.
- **Données acquises** : cinq anciennes cartes de l'édition 160 et leur historique sont conservés ; quatre correspondent à des images de l'édition 67 et ont été transférées avec audit, une demeure seulement en archive. **Ne jamais effacer les cartes existantes ni recommencer un import déjà comptabilisé.**
- **Historique du ticket bloquant** : premier booster sur l'ancienne édition réussi avec capture du créateur ; **premier booster réel de la nouvelle édition encore à tester** après réinitialisation bêta.

## Stratégie : 4 livraisons courtes plutôt qu'un immense déploiement invérifiable

### Lot A — P0 : boosters illimités pendant la bêta

**Issue propriétaire #12 :** https://github.com/cosscoll/TCG-Thomas-Deseur/issues/12

**Implémentation recommandée :**
- Ajouter une **source unique de vérité** côté backend, `BETA_UNLIMITED_BOOSTERS = true` ou configuration serveur équivalente ; désactiver la vérification `nextAvailable > maintenant` pour le POST normal quand ce drapeau est actif. Préserver le verrouillage par utilisateur et la transaction des cinq cartes.
- Faire lire le même drapeau par le GET de collection : `boosterUnlimited: true`, `nextAvailable: null` pendant la bêta. Adapter le contrat `collection_GET.schema.ts` **et** le retour POST `booster_POST.schema.ts` si le frontal exploite aussi `nextAvailable` après un tirage. L'ancienne date en base ne doit pas bloquer la bêta ni être effacée inutilement.
- Adapter l'état React du bouton (dont `opened`, `canOpen`, `countdown`, `nextAvailable` et les éventuels `disabled`). Après fermeture de l'animation, **le booster suivant est immédiatement ouvrable** sans recharger la page. Aucun texte « 24 heures » ni compte à rebours quand le drapeau est actif.
- Afficher **« Boosters illimités pendant la bêta »**, ne pas promettre un droit économique ou un achat.
- Distinguer le booster de collection (une seule récompense, contrôlée à part) des boosters ordinaires illimités ; la récompense finale demeure confidentielle.

**Recette à exiger avant de clôturer** :
1. 2 POST successifs sur un compte test autorisé, 5 cartes au premier + 5 au second ; histoire 2 tirages et **10 copies** ajoutées, compteur de uniques distincts, quantités ×2/×3 correctes.
2. Un même booster joué concurremment garde deux transactions distinctes sérialisées, **sans perte de carte** ni contournement des vérifications de possession.
3. Sans session : POST = 401 et aucune carte attribuée ; les autres comptes restent isolés.
4. En simulant `BETA_UNLIMITED_BOOSTERS=false` : un booster est suivi d'un refus 429 jusqu'à 24 h après, sans modification du stock.
5. La possibilité de réclamer le booster de complétion reste strictement unique.
6. Checkpoint → `run_tests` → `typecheck` → publication → état du job `succeeded` → HTTP public → vérification autorisée du fonctionnement réel.

### Lot B — P0/P1 : recette du classeur « Origine » réellement connecté

**Issue #11 :** https://github.com/cosscoll/TCG-Thomas-Deseur/issues/11

- Vérifier une session réelle autorisée : classeur **0..68**, 67 noms exacts, aucune « Carte REF-... » dans les nouvelles cartes, répartition 33/21/8/4/1, Carte mystère masquée, aucune donnée privée dans les réponses anonymes.
- Confirmer que le compte du propriétaire montre **4 cartes remappées de l'ancien booster** et une archive accessible conservant ses 5 anciennes cartes.
- Vérifier la persistance après rechargement, sortie/reconnexion, filtres, compteur de doublons ×2, ×3, etc. et barre de progression basée sur les **personnages distincts**.
- Vérifier les variantes : si l'emplacement 4 sélectionne une alternative, l'illustration spécifique doit être visible **dans le récapitulatif/historique**, et non remplacée à l'affichage par le visuel principal. Les variantes sont encore rattachées au même personnage, en attente de décision finale du créateur.
- Détecter les erreurs serveur authentifiées sur une base factuelle via `get_logs` et, si nécessaire, les vrais logs de production ; **ne jamais conclure d'une suite mockée que la production marche**.

### Lot C — P1 : visuels et expérience utilisateur

- Uniformiser le **cadre d'affichage** des 105 illustrations en un ratio vertical unique (format de carte proposé : 3:4) ; tant que les versions exportées ne sont pas approuvées, respecter les images maîtresses originales (stockage séparé ou sauvegarde).
- Préparer un traitement **mixte** : fond prolongé / marges selon l'image pour préserver le sujet ; recadrage seulement si cela ne coupe ni personne, ni visage, ni costume ni accessoires. **Ne pas régénérer le personnage, la pose ou le costume.**
- Vérification technique automatique : chaque URL d'illustration répond HTTP 200 et se décode ; proportions identiques pour les 105 exports, pas d'image tronquée, taille raisonnable et revue d'échantillons délicats par le créateur.
- Prioriser une **amélioration légère CSS responsive** du classeur et de la modale avant tout effet 3D lourd ; vérifier 375 px et 1440 px, défilement vertical, grande carte, titre complet et image non déformée.
- Message « Carte mystère » uniquement — **jamais d'identité, de visuel ni de méthode d'obtention** dans les sources HTML/JS publiques.

### Lot D — P1/P2 : préparation du lancement officiel

- **Corriger les métadonnées SEO HTML Floot** : le document initial affiche encore une ancienne description « 49 cartes », alors que le frontend annonce 68. Corriger description/title/public social metadata, republier et contrôler via HTTP.
- Compte : création, connexion, déconnexion, expiration/récupération de session, récupération mot de passe (attention aux restrictions de domaine expéditeur), isolations multi-comptes.
- Mode bêta : invitation de quelques amis, canal de remontée de bugs, contrôle des données sauvegardées, limitation anti-abus technique (requêtes simultanées) **sans cooldown imposé au joueur**.
- Vérifier performances et erreurs de production ; tester le responsive mobile et accessibilité du classeur.
- Avant lancement officiel, demander **l'accord explicite du créateur** pour rétablir les 24 heures et confirmer la règle d'inventaire/complétion des 38 variantes. Ne pas changer unilatéralement ces décisions.

## Ordonnancement intelligent pour ne pas épuiser le quota Floot

1. **Avant toute modification :** vérifier l'état réel du quota ; relire d'un coup, avec `read_files`, les **5–8 fichiers Floot utiles**. Ne pas ré-explorer l'ancienne base 160 ; la nouvelle utilise les tables `*_origin`.
2. Appliquer un **lot de patches groupés** par fonctionnalité (backend + types + frontend + tests), plutôt que de nombreuses micro-modifications. Ne pas utiliser `execute_sql` pour débloquer un délai utilisateur : l'issue demande un changement de logique, pas un reset de compte.
3. Un checkpoint par lot cohérent. Avant chaque publication, valider TypeScript et tests fonctionnels. **Économiser les publications** : publier au terme d'un lot prouvé, vérifier le job et le bundle réel.
4. Commencer par Lot A, puis Lot B **avant** d'étendre le périmètre. Les lots C et D sont secondaires par rapport au fait de pouvoir collectionner et tester sans friction.
5. En cas d'épuisement du quota, documenter le **dernier état exact déployé** et ne jamais annoncer qu'une modification GitHub a mis Floot en ligne.

## Actifs de recette déjà prêts sur GitHub

- `floot-e2e/mock-booster.spec.mjs` : scénarios Playwright **mockés et sans attribution réelle**, mis à niveau le 13 octobre pour les **68 cartes** et la distribution des cinq rangs. Le scénario optionnel `TCG_BETA_UNLIMITED=1` teste deux boosters successifs **après publication effective du mode illimité** ; ne pas l'activer avant, puisqu'il échouerait légitimement sur la version encore limitée.
- `.github/workflows/floot-public-smoke.yml` : sécurité des API anonymes et tests publics ; jamais de connexion au vrai compte.
- `data/edition-staging-67.json`, `data/raretes-validees-67.json`, `data/regles-booster-67.json` : sources de vérité documentaire, les 38 alternatives ne doivent pas devenir arbitrairement 38 nouveaux personnages.
- `docs/LIVRAISON_FLOOT_ORIGINE_68_2026-10-13.md` : rapport précis d'intégration Floot, sauvegarde des 5 anciennes cartes, preuves réelles et incertitudes.
- `scripts/check_published_approved.py` : contrôle externe des images publiées GitHub Pages.

**Porte de sortie** : bêta fluide et reproductible = deux boosters successifs sans délai, inventaire et images persistés, 68 emplacements corrects, aucune fuite de données, aucune récompense indue, pas de crash mobile ; le lancement officiel reste une décision distincte.
