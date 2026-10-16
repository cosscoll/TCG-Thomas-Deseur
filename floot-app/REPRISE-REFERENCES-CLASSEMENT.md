# Reprise Floot : références et classement (17 octobre 2026)
**État au 16 octobre 2026, 10h04 UTC : quota de 100 actions épuisé.**
Réouverture officielle : **17 octobre à 09:00 UTC (11h00 Paris)**. Ne pas annoncer le classement comme publié dans Floot avant déploiement confirmé.

## Déjà fait sur la base Floot
- Table `tcg_artwork_refs` créée : 106 références distinctes de huit chiffres ; 105 publiques (67 bases + 38 alternatives), 1 privée strictement exclue des exports.
- 4 fichiers modifiés dans l'éditeur Floot : `endpoints/collection_GET.ts`, `.schema.ts`, `helpers/tcgCollection.tsx`, `components/TcgBinder.tsx` pour exposer et afficher les références.
- 3 fichiers modifiés dans l'éditeur Floot : `helpers/tcgGiftCodes.tsx`, `endpoints/gift_create_POST.ts`, `helpers/tcgGiftCodes.spec.tsx` pour résoudre un numéro à 8 chiffres en ID d'illustration sans modifier l'inventaire.
- 2 fichiers du classement **écrits dans Floot** : `endpoints/leaderboard_GET.ts`, `.schema.ts` ; leur publication **n'est pas confirmée**.

## Déjà public sur GitHub Pages
- `data/references-8-chiffres-105.json`, `.csv` : la liste officielle des 105 numéros publics, calculée exactement avec la même formule que PostgreSQL : `10000000 + (bigint(hex(md5('TCG-ORIGINE-REF-V1:' + artwork_id)[0:12])) % 90000000)`.
- `collection-validee/app.js` affiche désormais la référence à huit chiffres sur chaque carte, avec une vérification de l'unicité à l'exécution. Aucun numéro privé.

## À intégrer dès le retour de quota
1. Comparer l'éditeur Floot avec le contenu de cette branche, en ne remplaçant PAS les fichiers déjà modifiés et en préservant la base.
2. Créer `components/TcgLeaderboard.tsx` et `.module.css` depuis cette branche, puis importer et placer `<TcgLeaderboard />` dans `pages/_index.tsx` après le classeur et avant le profil. **Bouton `Classement` du header : il est déjà préparé dans cette branche comme lien `href="#classement"`, situé entre `Classeur` et `Compte`. Conserver ce lien et vérifier son défilement sur desktop et mobile.**
3. Adapter `components/TcgGiftCodes.tsx` : afficher les numéros `numericReference` dans la liste des cartes pour l'admin et accepter 5 références numériques dans les boosters personnalisés (ancien ID interne reste utilisable côté serveur pour rétrocompatibilité).
4. Invalider `["tcg-leaderboard"]` dans React Query après ouverture de booster, attribution d'un code et modification du pseudonyme.
5. Contrôler typecheck, Jasmine (surtout `tcgGiftCodes.spec.tsx`) puis HTTP `/_api/leaderboard`, vérification que les réponses **ne contiennent ni email, ni identifiants de connexion, ni contenu de carte privée**, et confirmer cohérence des booster counts avec `tcg_pack_history_origin`.
6. Checkpoint, publier Floot, attendre le succès, et synchroniser les sources de Floot sur GitHub `main` ; mettre à jour le README et l'avancement.
7. La version publique Floot du 16 octobre **ne contient pas encore le classement intégré** ; ne pas afficher une fausse réussite.

## Règles du classement
Tous les comptes sont affichés uniquement sous leur pseudonyme. Tri : **illustrations distinctes publiques décroissant**, puis **boosters réellement ouverts croissant** ; en dernière égalité, ancienneté des comptes. Les boosters sont comptés à partir de l'historique sans le booster exceptionnel ; les cartes reçues par code contribuent au nombre de cartes mais pas aux ouvertures. Le total n'est PAS le nombre historique exact de boosters nécessaires au moment où la dernière carte a été acquise, cette donnée n'est pas reconstruite sans historique daté approprié.

## Nouveau chantier légal — 16 octobre 2026
La page de mentions légales, règlement, propriété intellectuelle et confidentialité est **déjà publiée sur GitHub Pages** à `https://cosscoll.github.io/TCG-Thomas-Deseur/legal/`. Elle nomme Cosme Collomb comme éditeur, réserve les droits sur les créations originales et reconnaît les droits tiers (dont image de Thomas). L’accueil et la galerie GitHub Pages y renvoient déjà. **Floot n’a pas encore intégré de liens vers cette page** en raison du quota quotidien. Le footer est préparé sur cette branche dans `pages/_index.tsx`; le déployer au prochain quota avec un lien visible sur les écrans de **connexion/inscription**, après vérification de leurs sources, afin que les joueurs puissent lire la politique avant de s’inscrire. Ne pas prétendre que cela rend le service parfaitement conforme RGPD : vérifier les conditions d’hébergement Floot aux États-Unis, l’information à l’inscription, les délais réels de rétention, les cookies et les coordonnées légales obligatoires suivant le statut de l’éditeur. Ne pas copier d’images de tiers en revendiquant leur propriété.
