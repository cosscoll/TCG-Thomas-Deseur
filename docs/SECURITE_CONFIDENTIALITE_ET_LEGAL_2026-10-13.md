# TCG Deseur — confidentialité, sécurité et conformité avant publication

Document préparatoire du 13 octobre 2026, non validé juridiquement. Ce qui suit décrit les contrôles à faire ; cela ne prouve pas la conformité du jeu.

## Données et traitements à confirmer dans Floot

Les comptes et collections impliquent vraisemblablement adresses e-mail, pseudonymes, identifiants de session, inventaires de cartes, historiques de tirages et traces techniques. Cette liste doit être vérifiée dans la configuration Floot, sans supposer que les données sont exactement celles-ci.

Pour chaque donnée, documenter : finalité, base légale, caractère obligatoire, durée de conservation, destinataires, prestataires, pays de stockage, mesure de sécurité, exercice des droits, suppression de compte et sauvegardes. Prévoir une réponse aux demandes de consultation ou suppression, sans promettre une fonction qui n'existe pas.

## Droits d'images et d'identité — point de validation indispensable

Les photographies sources, la ressemblance avec une personne et les images dérivées peuvent faire l'objet de droits. Leur présence sur un site ou dans une galerie TierMaker n'est pas une autorisation de reproduction, de transformation ou de diffusion commerciale. Vérifier les titulaires des droits photographiques, les autorisations relatives à l'image et aux œuvres utilisées, les marques et les conditions de publication.

La référence photographique et le lien de galerie documentent une provenance ; ils ne prouvent ni l'origine d'une scène exacte ni le droit d'exploiter l'image. Prévoir un point de contact et une procédure de retrait en cas de réclamation. Ne pas publier une campagne payante avant validation.

## Authentification et protections serveur

Vérifications à réaliser réellement dans Floot : HTTPS, cookies de session Secure/HttpOnly/SameSite, expiration ou révocation de session, déconnexion, limitation des tentatives de connexion, procédure de récupération de mot de passe, protection contre la consultation du classeur d'autrui.

Les API privées doivent répondre 401 sans connexion, avec Cache-Control privé et sans stockage. Les deux ouvertures simultanées d'un même compte ne doivent ni perdre ni doubler les exemplaires par incident de concurrence.

Un booster ordinaire représente une transaction atomique de cinq cartes, un historique et un état de disponibilité. Aucune récompense partielle en cas d'erreur SQL. Le mode bêta illimité doit supprimer le seul délai de jeu, pas l'authentification, le verrouillage ni les garanties de persistance.

La Carte mystère ne doit pas apparaître avant acquisition dans le bundle JavaScript, les métadonnées, la galerie publique, l'API de collection, les erreurs serveur ou les rapports de bugs.

## Contenu à réunir pour les pages légales

Mentions légales : éditeur réel, coordonnées de contact, statut juridique s'il y a lieu, hébergeur, moyens de réclamation.
Politique de confidentialité : responsable, finalités et bases, catégories de données, destinataires, conservation, cookies, transferts, droits des personnes, moyen de contact et autorité de contrôle.
Conditions d'utilisation : collection virtuelle, gratuité bêta, âge et accès, droits de reproduction, sécurité des comptes, usage abusif, disponibilité non garantie en bêta, absence de valeur financière garantie, modifications de règles officiellement annoncées, signalement de contenus.

Ces rubriques ne doivent pas être remplies avec des éléments supposés ; un professionnel qualifié devrait les vérifier avant un lancement ouvert au public.

## Tests et signalement

Ne jamais publier mots de passe, cookies, jetons, adresses personnelles ou codes de connexion dans GitHub. Le formulaire de bêta sur GitHub n'envoie pas automatiquement les retours ; le testeur les copie ou les partage volontairement. Flouter tout identifiant et tout contenu privé dans les captures.

S'assurer qu'une restauration est possible avant une migration des données en base ; préparer un export sécurisé et un point de reprise. Ne pas effacer les anciennes cartes ou historiques sans autorisation explicite.

## Obligations ouvertes à arbitrage

Qui est légalement l'éditeur et le contact support ? Quels droits photographiques et de représentation sont acquis ? Quelles données précises Floot conserve-t-il ? Quelle est l'âge minimum prévu ? Quels services d'analyse/cookies sont actifs ? Quelle est la procédure d'effacement ? Existe-t-il un échange ou une valeur monétaire prévue à terme ?

**Statut : documents et contrôles préparés. Les validations de droits, données personnelles et infrastructure de production restent non effectuées.**
