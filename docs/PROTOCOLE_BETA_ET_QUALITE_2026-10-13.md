# TCG Deseur — protocole de bêta, retours et critères de recette

**Version 13 octobre 2026.** Préparation autonome, tests réels connectés à exécuter avec des utilisateurs volontaires. Ne pas utiliser le compte personnel du propriétaire à son insu.

## Environnement

- Jeu vivant : https://budget-illimite-tcg.floot.app/
- Page d'invitation et retour : https://cosscoll.github.io/TCG-Thomas-Deseur/beta/
- Catalogue de référence : https://cosscoll.github.io/TCG-Thomas-Deseur/collection-validee/
- Atelier de revue visuelle : https://cosscoll.github.io/TCG-Thomas-Deseur/audit-visuels/
- Bugs vérifiables : https://github.com/cosscoll/TCG-Thomas-Deseur/issues

Le formulaire de retour de la page bêta conserve les réponses **sur le terminal du testeur** avant export. Il **n'envoie aucun rapport au serveur**. Le joueur choisit explicitement de copier, télécharger ou partager son compte rendu.

## Profils pilotes, sans identités nominatives

Tester volontairement avec : un joueur habitué aux TCG sur ordinateur ; une personne découvrant les jeux de collection sur téléphone ; une personne utilisant un écran étroit et/ou la navigation clavier. Un quatrième testeur facultatif peut valider la tablette. Ne pas collecter d'informations personnelles inutiles.

## Parcours à faire tester

| Étape | Attendu / preuve à conserver (sans données sensibles) |
| --- | --- |
| Chargement et compréhension | L'utilisateur comprend le principe des 67 cartes connues et de la Carte mystère |
| Inscription | Formulaire accessible, validation compréhensible ; tester avec un compte dédié |
| Connexion/déconnexion | Pas de session fantôme, aucune donnée d'un autre compte |
| Vue classeur | 68 emplacements ; 67 noms et raretés connus ; Carte mystère non révélée |
| Booster, rangs 1–3 | 3 Communes garanties |
| Booster, rang 4 | Rare ou Alternative, jamais une sixième carte |
| Booster, rang 5 | Rare, Épique, Légendaire ou Hors-série |
| Révélation des 5 cartes | Nom complet, illustration visible, rareté exacte, retour en arrière cohérent |
| Persistance | Cinq exemplaires sauvegardés ; après rechargement puis reconnexion ils restent |
| Doublons | ×2/×3 exacts ; compteurs de personnages distincts inchangés à duplication |
| Bêta illimitée **après publication uniquement** | Deux boosters ordinaires successifs, 10 cartes ajoutées, deux historiques |
| Support erreur | Code/texte public noté, pas de données secrètes ni de mot de passe |
| Téléphone 320–430 px | Pas de défilement horizontal ; boutons de révélation accessibles |
| Tablette 820–1024 px | Grille stable ; pas de texte masqué ou modal hors écran |
| Clavier | Navigation tabulée ; retour de focus après fermeture de modale |
| Images | 105 illustrations disponibles ; principaux et alternatives non confondus |
| Reward | Une seule attribution après complétion des 67 cartes ; contenu jamais décrit publiquement |
| Vie privée | Accès anonyme API=401 ; pas d'inventaire A visible depuis B |

## Registre de bug, modèle

Pour chaque incident, enregistrer un ID, date UTC, environnement (navigateur/appareil/largeur), préconditions, étapes pour reproduire, résultat attendu, résultat observé, lien vers capture **expurgée**, gravité (P0 bloquant, P1 majeur, P2 cosmétique), responsable, statut, référence du correctif, résultat de retest. Ne jamais coller de JWT, cookie, e-mail réel, mot de passe, code de récupération, journal personnel, ni dévoiler la récompense.

**Gestion prioritaire :** P0 : attribution de mauvaises cartes, pertes de progression, plantage de booster, fuite privée, identité de la Carte mystère divulguée. P1 : compteur erroné, image principale manquante, interface inutilisable sur un téléphone supporté. P2 : polices ou espacements imparfaits.

## Scénarios d'échec à simuler hors production

- Réponse POST valide avec zéro, quatre ou six cartes : ne pas afficher une animation de cinq récompenses inventées.
- Erreur réseau après commit serveur : relecture de la collection avant réessai, absence de duplication.
- Un faux cookie ou une session expirée : 401 et réauthentification.
- Deux réponses en retard de comptes différents : l'interface du nouveau compte n'affiche aucune carte de l'ancien.
- Fichier image indisponible : repli vers image d'origine sans masquer l'identité.
- Dix tirages successifs : vérifier quantités et historique fictifs sans écrire sur les vrais comptes.
- Passage de la bêta illimitée au mode officiel : test de réactivation du délai, sans réinitialiser l'inventaire ni les dates arbitrairement.

## Procédure d'exécution et d'arrêt

Avant chaque test réel : compte isolé autorisé, date, version déployée, scénario précis, méthode de nettoyage convenue si création de données. Vérifier que le mode illimité est **réellement actif côté serveur** avant de lancer des tests consécutifs. Si une erreur P0 se produit, interrompre les invitations et documenter le blocage ; **ne pas multiplier les ouvertures** dans un état incertain.

## Conditions avant élargissement de la bêta

Aucun P0 ouvert ; compte et session fonctionnels ; deux boosters authentifiés consécutifs pendant la bêta ; cinq cartes par ouverture et probabilités à la bonne position ; 68 emplacements et sauvegarde persistante ; image/photo de la récompense absente des fichiers publics ; vérifications mobile/tablette ; procédure de signalement claire ; droit d'utiliser les images et l'identité vérifié hors de ce protocole.

Les résultats des tests fictifs automatisés sont des **preuves de simulation**, pas des preuves de compte réel. Toute réussite doit être reliée à une version publiée et à un test exécuté.
