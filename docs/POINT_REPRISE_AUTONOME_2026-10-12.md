# Point de reprise autonome — TCG Deseur
**12 octobre 2026 — édition de test pour les amis**

Ce document reflète les vérifications réellement effectuées sur le dépôt et le projet Floot. Il ne transforme ni les noms approuvés, ni les raretés, ni les règles des variantes.

## Travail livré dans Floot
- Les illustrations des cartes non obtenues ne s'affichent plus dans les vignettes et leurs fiches ; seuls les visuels gagnés se révèlent dans le classeur.
- Les exports JSON de la collection excluent désormais **l'adresse e-mail et l'identifiant interne du compte**. Ils conservent le pseudo, les cartes, les quantités et l'historique.
- La page d'accueil indique clairement qu'il s'agit d'une **édition de test avec une collection provisoire**, distincte du catalogue artistique approuvé.
- Les comptes nouvellement inscrits ne voient plus d'archive de l'ancienne édition lorsque leur inventaire historique est vide. L'API d'archive n'envoie aux anciens joueurs que les références de cartes effectivement acquises.
- Le formulaire « mot de passe oublié » annonce loyalement que la livraison de codes peut être limitée pendant la bêta tant que l'e-mail d'expédition n'est pas configuré.
- La sécurité ajoutée précédemment aux boosters refuse une réponse partielle, corrompue ou incohérente même si le serveur a retourné HTTP 200 ; aucune récompense locale n'est inventée.

**Validation interne Floot :** `typecheck: clean`, **14 fichiers de tests Jasmine réussis, aucun échec**. Checkpoints : « Classeur confidentiel et comptes bêta » (`28c3c163-7e98-4d6b-9c9b-e0153eff0a7c`) et « Archive privée des anciennes cartes » (`19928f76-0c9c-452d-9aac-95e4f5e167d5`).

**Publication :** deuxième déploiement de ce lot confirmé réussi par Floot sur https://budget-illimite-tcg.floot.app/ (job `a20a4d5d-a2a9-4cee-b2ed-863d5d5e4e72`).

## Vérifications sans modification de comptes
- Le backend contient **161 entrées techniques historiques**, dont **160 cartes autorisées dans les boosters ordinaires** ; chaque carte ordinaire renvoie vers un fichier d'illustration qui existe dans le dépôt GitHub (160/160 correspondances de noms de fichiers).
- Les clés d'inventaire sont structurées par utilisateur et carte, le système conserve ses historiques : aucun compte joueur ni stock réel modifié durant cette phase.
- Les règles de sélection des cinq cartes restent contrôlées exclusivement par le serveur.
- Les vérifications publiques automatiques sur les pages invitées, l'inscription, le mobile et les API anonymes sont exécutées dans `.github/workflows/floot-public-smoke.yml`. La dernière suite doit confirmer la nouvelle bannière « édition de test ». Les premiers contrôles publics du jour ont déjà réussi.
- L'URL de la page d'invitation https://cosscoll.github.io/TCG-Thomas-Deseur/beta/ conduit directement à `/login?mode=register`. Elle offre un compte rendu local à copier sans saisir de mot de passe.

## Blocages toujours ouverts

**Ouverture authentifiée non vérifiée :** aucun test reproductible et réussi avec un vrai compte test, depuis inscription → ouverture de cinq cartes → persistance → deuxième tentative refusée → reconnexion n'a pu être réalisé dans cet environnement. Ne pas confondre succès des tests unitaires avec validation des boosters en production. Les essais d'automatisation de création de compte temporaire ont été bloqués par les contrôles de sécurité des outils ; **aucune donnée de compte n'a été créée**. Le compte du propriétaire dispose d'un délai de 24 h échu, mais cela ne prouve pas que l'ouverture réussira.

**Récupération de mots de passe des amis :** le code emploie `@floot/email`, mais une adresse d'expédition de domaine vérifié n'est pas encore établie dans le contexte. Selon les règles de Floot, sans domaine vérifié, les messages sont envoyés uniquement au propriétaire de l'espace. Pour rendre la réinitialisation réellement utilisable à tous, le propriétaire devra configurer un domaine d'envoi dans l'onglet **Email** de Floot. Il est déconseillé d'annoncer aux invités que la récupération fonctionne avant un test de livraison.

**Catalogue définitif :** 67 cartes, 38 variantes visuelles validées, raretés non affectées. Les 160 anciens IDs de Floot ne doivent pas être remplacés naïvement. La récompense finale doit rester non annoncée dans toutes les pages publiques. L'implémentation définitive attend les choix des raretés et des règles des variantes.

## Critère de « bêta prête »
Des amis peuvent créer un compte, ouvrir un booster de cinq cartes, retrouver leurs cartes après reconnexion et ne voir que leurs propres données, sur le **site publié**. Un vrai test authentifié de toutes ces étapes et une validation des défauts bloquants restent nécessaires avant une affirmation définitive.

Références :
- [Parcours et critères de recette](./BETA_AMIS_2026-10-12.md)
- [Audit avant migration](./AUDIT_AVANT_MIGRATION_2026-10-12.md)
- [Catalogue validé](../data/catalogue-valide-67.json)
