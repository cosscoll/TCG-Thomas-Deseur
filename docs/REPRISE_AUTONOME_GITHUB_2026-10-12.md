# Reprise autonome — lots GitHub du 12 octobre 2026

## Périmètre et priorité

Le jeu de comptes et boosters actifs est **Floot**, pas GitHub Pages : https://budget-illimite-tcg.floot.app/. Le catalogue public et la page d'invitation sont sur GitHub Pages. La collection approuvée comporte **67 cartes principales et 38 variantes graphiques**. Les raretés définitives restent à choisir par le créateur ; aucune n'a été inventée ou affectée ici.

## Blocage réel sur Floot

Une nouvelle tentative d'accès au code et aux tests le **12/10/2026 à 10:23 UTC** a renvoyé « quota quotidien de 100 actions épuisé » ; reprise annoncée pour le **13/10/2026 à 09:00 UTC (11 h à Paris)**. Ce refus concerne les **actions de développement Floot**, pas les boosters des joueurs. L'application demeure déclarée publiée. On ne peut ni modifier son code ni valider de tirage réel depuis Floot pendant ce blocage.

Une tâche autonome existante, « Reprise automatique TCG Deseur », est active et doit tenter à nouveau l'accès. Elle conserve les priorités : comptes, première ouverture authentifiée, délai 24 h, persistance, confidentialité, puis adaptation de l'édition approuvée. Les refus anciens ne valent pas refus futurs.

## Livrables GitHub réellement réalisés

### Rapport de test pour les amis
- `beta/index.html`, `beta/app.js`, `beta/style.css` : choix du navigateur (Chrome, Safari, Firefox, Edge, autre), aide en cas de blocage, téléchargement local d'un rapport `.txt`, partage mobile **déclenché par le testeur** si disponible.
- Aucune collecte de mot de passe, e-mail, cookie, code de connexion ou identifiant de session. Les réponses restent sur le navigateur ; elles ne sont jamais envoyées automatiquement.
- Les boutons de partage/export sont désactivés après toute modification du formulaire jusqu'à nouvelle préparation du texte.
- `e2e/beta.spec.mjs` vérifie le navigateur, le téléchargement, l'invalidation après changement, le partage volontaire et l'occultation de données sensibles.
- Le lien de création de compte redirige directement vers la route d'inscription du jeu Floot.

### Parcours des boosters simulé, sans action réelle
- `floot-e2e/mock-booster.spec.mjs` intercepte localement toutes les API de l'application publiée pour une session de **joueur fictif**.
- Vérifie la disponibilité du booster, son clic, la présentation progressive des 5 cartes, le bilan, l'apparition des cartes dans le classeur, l'interdiction de réouverture immédiate et la gestion d'une erreur HTTP 500.
- Tests desktop/mobile automatisés via GitHub Actions. **Aucun compte, cookie réel, carte ou historique en base n'est créé ni modifié**.
- Le premier échec venait d'un sélecteur de test qui confondait le bouton de booster quotidien avec celui du booster final. Le sélecteur a été corrigé, et la suite a réussi : [exécution 38236626473](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38236626473).
- Les tests anonymes de sécurité rejettent désormais également l'endpoint de booster de collection (HTTP 401 attendu) : [exécution 38236769044](https://github.com/cosscoll/TCG-Thomas-Deseur/actions/runs/38236769044).

### Préparation des décisions de rareté
- Nouveau validateur **sans écriture** : `scripts/validate-rarity-decisions.mjs`.
- Accepte exactement le JSON `tcg-deseur-rarities-v1` exporté par l'atelier visuel ; compare les **67 IDs et leurs noms exacts** au `data/catalogue-valide-67.json` approuvé.
- Refuse les cartes manquantes/supplémentaires, les noms modifiés, les catégories inconnues et les notes invalides. Récapitule les cartes définies/restantes, sans attribuer de carte ou modifier Floot.
- Pour rendre la liste complète obligatoire, utiliser l'option `--require-complete`. Tant que le créateur n'a pas choisi les raretés, les cartes restent « À définir ».
- Tests de référence : `tests/rarity-decisions.test.mjs`.

### Exemple d'utilisation future

```bash
node scripts/validate-rarity-decisions.mjs TCG_Deseur_Choix_Raretes_67.json
node scripts/validate-rarity-decisions.mjs TCG_Deseur_Choix_Raretes_67.json --require-complete
```

**Important :** ce validateur ne modifie pas le jeu. Le choix définitif des raretés et les règles d'obtention des variantes restent des décisions du créateur.

## À ne pas confondre avec une bêta validée

Les tests navigateur avec APIs simulées ne prouvent **pas** que l'inscription réelle, l'envoi de codes e-mail, la transaction d'ouverture du booster et la persistance en base fonctionnent en production. La recette authentifiée réelle reste le blocage prioritaire à la prochaine disponibilité de Floot.

Ne pas envoyer d'invitations à grande échelle en annonçant une fiabilité garantie. Privilégier un premier groupe réduit et des messages honnêtes, avec retours structurés.

## Vérification et publication

GitHub Pages publie à chaque changement sur `main`. Les liens de livrables sont :

- Guide bêta : https://cosscoll.github.io/TCG-Thomas-Deseur/beta/
- Catalogue approuvé : https://cosscoll.github.io/TCG-Thomas-Deseur/collection-validee/
- Contrôles GitHub du projet : https://github.com/cosscoll/TCG-Thomas-Deseur/actions

Après toute modification, vérifier que le workflow de publication ET les tests spécifiques ont abouti ; ne pas inférer « en ligne » du seul commit GitHub. Le résultat du dernier workflow doit être contrôlé au moment du compte rendu.

## Règle de confidentialité éditoriale

La seule promesse publique de fin de collection reste l'accès à un booster spécial. La nature précise des contenus de ce booster demeure non annoncée : ne pas l'exposer dans les pages, le catalogue, les médias, les formulaires ni les réponses d'API non autorisées.
