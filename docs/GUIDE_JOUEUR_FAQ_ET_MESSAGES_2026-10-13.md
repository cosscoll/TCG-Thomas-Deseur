# TCG Deseur — guide joueur, FAQ et messages d'interface

**Version éditoriale de la bêta, 13 octobre 2026.** Ce guide ne modifie pas Floot. Il distingue la règle existante des changements planifiés. Aucun détail de la Carte mystère n'est divulgué.

## Bienvenue dans TCG Deseur

TCG Deseur est un jeu de collection de cartes virtuelles. Le but est de réunir les **67 personnages connus** du classeur « Origine ». Un **68ᵉ emplacement**, simplement appelé « Carte mystère », est visible sans en révéler l'identité ni le visuel. Chaque personnage possède une illustration principale et certains ont des versions alternatives.

**Pour commencer :** va sur https://budget-illimite-tcg.floot.app/, crée ton compte avec ton e-mail, ton pseudo et ton mot de passe, puis connecte-toi. Le catalogue visuel public est consultable sans compte sur https://cosscoll.github.io/TCG-Thomas-Deseur/collection-validee/.

## Comment fonctionne un booster ?

Chaque booster ordinaire contient **exactement cinq cartes** dans cet ordre :

| Rang | Résultats possibles |
| --- | --- |
| 1 | Commune à 100 % |
| 2 | Commune à 100 % |
| 3 | Commune à 100 % |
| 4 | Rare à 90 % **ou** illustration alternative à 10 % |
| 5 | Rare à 80 % ; Épique à 17 % ; Légendaire à 2 % ; Hors-série à 1 % |

Les pourcentages définissent les chances **à chaque ouverture**, pas une garantie après 10, 50 ou 100 boosters. Le tirage est effectué par le serveur ; recharger la page ne change pas un tirage enregistré.

**Délai durant la transition :** le site en ligne impose encore la règle précédente de 24 h entre boosters, jusqu'à publication de son correctif bêta. La décision du créateur est de rendre les boosters ordinaires illimités **durant les tests uniquement**. Ne présente pas ce changement comme actif avant une vérification de production.

## Ton classeur

Une carte obtenue une première fois est marquée comme possédée. Si tu obtiens la même carte de nouveau, sa quantité augmente : **×2, ×3, ×4**, etc. Trois exemplaires d'un seul personnage comptent pour **un personnage distinct**, pas trois. Ton inventaire doit rester visible après rechargement ou reconnexion.

Les quatre cartes reconnues de l'ancien classeur ont été transférées avec un historique traçable ; les anciennes cinq cartes ont été conservées dans une archive. L'ancien prototype à 160 cartes **n'est pas** le classeur officiel.

**Alternatives :** une alternative est actuellement enregistrée sous l'identité de son personnage de base dans le moteur Floot, et son illustration précise est conservée dans l'historique. Le statut définitif des versions alternatives dans la collection reste **à confirmer** ; ne pas présenter les 38 versions comme 38 personnages supplémentaires.

## FAQ

**Est-ce payant ?** Non : cette bêta concerne une collection virtuelle gratuite. Aucun achat de booster n'est proposé dans ce parcours.

**Faut-il jouer aux combats ?** Non. Le développement actuel concerne la collection et l'ouverture des boosters, pas les mécaniques de combat.

**Que signifie Commune, Rare, Épique, Légendaire et Hors-série ?** Il s'agit des cinq raretés reconnues de la collection ordinaire. Une alternative est une version graphique spéciale d'un personnage, **pas une sixième rareté**.

**Pourquoi ai-je des doublons ?** Chaque tirage est aléatoire ; les cartes déjà possédées peuvent retomber. Leur quantité augmente, sans réduire ton inventaire.

**Pourquoi une carte apparaît-elle comme « manquante » ?** Tu n'as pas encore obtenu cet emplacement avec ton compte connecté. Le catalogue public de référence montre les cartes connues, pas ce que possède ton compte.

**Pourquoi certaines cartes de mon ancien classeur sont-elles dans une archive ?** Le prototype comptait 160 illustrations. Le classeur officiel a été défini ensuite. L'archive préserve l'historique sans inventer de correspondances.

**Quand pourrai-je ouvrir un nouveau booster ?** Pendant la transition, l'interface peut encore afficher le délai de 24 h. Le mode de bêta illimité est programmé, mais doit être déployé et vérifié avant d'être annoncé comme actif.

**Que se passe-t-il quand j'ai toutes les cartes connues ?** La collection donne accès à un **booster de collection** ; son contenu reste une surprise.

**Pourquoi ne voit-on pas la 68ᵉ carte ?** Cet emplacement est présenté volontairement comme « Carte mystère ». Aucun autre détail n'est fourni.

**Le jeu fonctionne-t-il sur téléphone ?** La navigation mobile fait partie de la recette. Signale les textes tronqués, images absentes ou débordements si tu en rencontres.

**Mon booster affiche une erreur : que faire ?** Recharge le classeur pour vérifier si les cinq cartes ont été enregistrées. Ne répète pas immédiatement le clic si l'attribution est déjà visible. Transmets seulement le message public de l'erreur, l'appareil et l'heure approximative, sans e-mail ni mot de passe.

**J'ai oublié mon mot de passe.** Utilise uniquement la procédure de récupération officielle si elle est disponible dans l'application. Son fonctionnement réel doit être vérifié pendant la recette ; ne partage aucun code reçu.

## Messages courts prêts pour l'interface (à intégrer après tests)

| Situation | Texte proposé |
| --- | --- |
| Booster prêt, pendant bêta illimitée **une fois publiée** | « Boosters illimités pendant la bêta. Ouvre un booster de cinq cartes ! » |
| Ouverture en cours | « Ton booster s'ouvre… » |
| Carte déjà possédée | « Déjà dans ton classeur · ×{quantity} exemplaires » |
| Nouvelle carte | « Nouvelle découverte ! Cette carte rejoint ton classeur. » |
| Réseau coupé | « Connexion interrompue. Vérifie d'abord ton classeur : ton tirage a peut-être été enregistré. » |
| Retour HTTP 401 | « Ta session a expiré. Connecte-toi à nouveau pour retrouver ta collection. » |
| Erreur 500 serveur | « Le booster ne s'ouvre pas pour le moment. Réessaie après avoir vérifié ton classeur. » |
| Collection complète | « Tu as réuni toutes les cartes connues. Un booster de collection t'attend. » |
| Emplacement inconnu | « Carte mystère — à découvrir » |
| Alternative tirée | « Version alternative · {nom du personnage} » |
| Bêta non déployée | « La disponibilité de ton prochain booster est indiquée ci-dessous. » |

## Aperçu du futur parcours de révélation

Un [prototype fictif de cinq révélations](https://cosscoll.github.io/TCG-Thomas-Deseur/prototype-booster/) permet de prévisualiser les titres, raretés et animations sur téléphone, sans ouvrir de vrai booster ni toucher aux comptes. Il ne constitue pas la version finale du jeu.

## Conditions éditoriales

Ne jamais suggérer qu'une probabilité implique un tirage garanti. Ne pas révéler le contenu du booster de collection. Ne pas annoncer la suppression des 24 h avant la vérification Floot. Ne jamais demander les identifiants de connexion dans un retour de test. Les textes de cet état de préparation ne changent pas automatiquement l'application Floot.
