# Reprise Floot — TCG Deseur — 9 octobre 2026

## Résultat de cette session

L'application existante a été retrouvée : `1d1c3807-73a6-49c5-a59e-ec097d8caddf`, intitulée **TCG Deseur**. Floot la déclare publiée, publique, sur le forfait gratuit.

URL active : https://budget-illimite-tcg.floot.app  
Connexion : https://budget-illimite-tcg.floot.app/login

**Aucune modification de l'application Floot, de sa base ou de son déploiement n'a été réalisée pendant cette reprise.** Le travail disponible a porté sur les contrôles publics et sur la documentation GitHub.

| Statut | Résultat de cette reprise |
| --- | --- |
| Développé | Script de contrôle HTTP et documentation de reprise dans GitHub |
| Testé | Six contrôles HTTP réussis sur l'application publiée |
| Publié | Application déjà publiée, statut confirmé par Floot ; aucun nouveau déploiement |
| Opérationnel | Disponibilité HTTP et refus des accès anonymes vérifiés ; parcours connecté non validé |

## Blocage constaté

La tentative `list_files` a été refusée le 9 octobre à 12:31 UTC : **100 actions de développement quotidiennes utilisées sur 100**.

La réponse Floot annonçait une réinitialisation le **10 octobre 2026 à 09:00 UTC**, soit **11:00 à Paris**. L'inventaire des projets, le statut de publication et le lien de prévisualisation restaient accessibles. La lecture du code, les contrôles de base, les modifications et les tests Floot étaient suspendus.

Cette information est datée. Lors de la prochaine reprise, réessayer une lecture ; ne pas déduire d'une ancienne réponse que le quota est encore actif. Aucun achat, changement de forfait, nouvel hébergement ou contournement de cette limite n'a été effectué.

## Vérifications observées

Contrôle reproductible exécuté le **9 octobre 2026 à 12:37:47 UTC** avec Python 3 :

```bash
python3 scripts/check_floot_public.py
```

**Résultat : 6 réussites sur 6, code de sortie 0.**

| Requête sans authentification | Résultat attendu et obtenu |
| --- | --- |
| GET / | HTTP 200, page HTML identifiée TCG Deseur |
| GET /login | HTTP 200, page HTML identifiée TCG Deseur |
| GET /_api/auth/session | HTTP 401, refus JSON sans données joueur |
| GET /_api/collection | HTTP 401, refus JSON sans données joueur |
| POST /_api/booster | HTTP 401, refus JSON sans données joueur |
| POST /_api/profile | HTTP 401, refus JSON sans données joueur |

Aucune authentification, création de compte, modification de collection ou récupération de mot de passe n'a été effectuée. Les appels POST ci-dessus étaient anonymes et ont été refusés.

Les ressources JavaScript et CSS publiques référencées par les pages étaient également accessibles avec HTTP 200. Leur contenu a permis une inspection limitée du frontend publié.

## Points relevés dans le frontend public

Les constats ci-dessous proviennent de la lecture des bundles publics `/_assets/index-B7kyVzs9.js` et `/_assets/_index-IIhpxVvV.js`. Ils ne remplacent pas la lecture des sources Floot et **les conséquences en parcours connecté restent à reproduire**.

### P1 — Confirmation réelle de la déconnexion

Le client de déconnexion parse le résultat de `/_api/auth/logout` sans vérifier le statut HTTP. Le cache de session est placé à `null` avant la réponse serveur. Une réponse d'erreur JSON pourrait donc être traitée comme une déconnexion réussie côté interface.

Reprendre `helpers/useAuth.tsx` et le client de déconnexion après réouverture de l'accès. Contrôler le statut, confirmer la révocation côté serveur, conserver un état cohérent lors d'une erreur réseau et montrer un message permettant de réessayer.

Validation attendue : déconnexion réussie puis API privées refusées ; échec HTTP/réseau signalé sans faux succès ; rechargement de page cohérent avec la session serveur.

### P1 — Réponses arrivant après un changement de session

Les mutations du booster et du pseudonyme ne présentent pas de réinitialisation liée au joueur dans le composant publié. Le succès du booster ouvre la révélation, et celui du profil remet un utilisateur dans le cache d'authentification. Vérifier le scénario où ces réponses arrivent après une déconnexion ou un changement de compte.

Une correction devra empêcher un résultat ancien de rétablir une identité ou une modale dans une nouvelle session. Les cartes déjà enregistrées doivent rester dans le bon inventaire.

Validation attendue : réponses volontairement retardées, déconnexion pendant l'attente, puis connexion d'un deuxième joueur ; aucune donnée ni interface du premier joueur ne doit être appliquée au second.

### P1 — Expiration et récupération de session

La requête de session est configurée avec une durée de fraîcheur infinie. Contrôler la mise à jour de l'identité lorsqu'une session expire ou est révoquée, ainsi que le traitement d'un HTTP 401 sur les API du classeur, du booster et du profil.

Validation attendue : expiration simulée dans un environnement isolé, message compréhensible, retour à la connexion et reprise du classeur après reconnexion. Distinguer une panne réseau d'une absence de session.

### P2 — Langue de la page

Le HTML publié de l'accueil et de la connexion ne contient pas d'attribut `lang` sur `html`. Vérifier la configuration document dans Floot et renseigner le français pour les technologies d'assistance.

La lecture du HTML ne constitue pas un test d'accessibilité complet.

## Vérifications encore nécessaires

- Relire les sources actuelles et les métadonnées Floot.
- Contrôler les tables et contraintes sans modifier les données existantes.
- Tester l'inscription, la connexion, le pseudonyme et la déconnexion avec des comptes de test isolés.
- Tester réellement la séparation de deux collections et les réponses retardées.
- Tester deux ouvertures authentifiées simultanées, le quota de 24 h et l'atomicité des cinq cartes.
- Tester la persistance après rechargement et après une réponse réseau perdue.
- Vérifier la configuration et la délivrabilité de la récupération du mot de passe.
- Tester la révélation, les filtres, le clavier et les affichages téléphone/tablette.
- Exécuter la compilation TypeScript et les tests du projet Floot après correction.
- Vérifier l'export de données et préparer la suppression de compte sans supprimer de compte réel.

**Les statistiques de base transmises dans le document de reprise n'ont pas été actualisées.** Ne pas annoncer leurs valeurs comme un résultat de cette session.

## Consignes conservées pour la reprise

Le développement actif reste sur Floot, avec React, TypeScript, PostgreSQL et l'authentification native d'après le document transmis. Ne pas recréer l'application, revenir à Supabase ou utiliser le prototype GitHub comme remplacement.

Le périmètre reste : comptes, boosters et collection. Conserver cinq cartes par booster, la règle provisoire d'un booster gratuit toutes les 24 h, les probabilités existantes et les identifiants du catalogue. Ne pas ajouter combat, PvP, monnaie, paiement ou illustrations.

Les checkpoints transmis sont :

- `f77054b1-6146-4bb5-be51-459f2e078178` — boosters et comptes améliorés.
- `a918f096-11de-401b-91c9-4f0695639b6d` — contrôles complémentaires.

**Leur état n'a pas pu être vérifié pendant cette session.** Un checkpoint de code ne garantit ni une restauration PostgreSQL ni un retour arrière du déploiement public.

## Prochaine séquence technique

1. Vérifier à nouveau l'accès à l'application existante et relire `list_files`, les endpoints, les helpers d'authentification et les pages.
2. Reproduire les points P1 dans un scénario isolé ; ne pas utiliser les comptes réels ni leurs sessions.
3. Corriger la déconnexion, les réponses tardives et les erreurs/expirations de session.
4. Éprouver l'isolation, les transactions et les ouvertures simultanées.
5. Contrôler TypeScript, les tests pertinents et les parcours navigateur accessibles.
6. Créer un checkpoint cohérent, publier seulement une version suffisamment vérifiée, puis vérifier la fin du déploiement.
7. Exporter séparément le code Floot vers GitHub sans écraser les prototypes historiques ; documenter la version et les limites de sauvegarde.

Ne pas promettre une reprise en arrière-plan : aucune automation de développement n'a été configurée par cette session.
