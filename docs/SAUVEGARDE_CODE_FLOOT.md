# Sauvegarde vérifiable du code TCG Deseur — préparation

**État au 9 octobre 2026 : outil de vérification créé ; aucun export complet Floot ni sauvegarde PostgreSQL effectué.**

## Application source

- Projet : `1d1c3807-73a6-49c5-a59e-ec097d8caddf`
- Application active : https://budget-illimite-tcg.floot.app
- Dépôt : `cosscoll/TCG-Thomas-Deseur` (archives, documents, outils de test, **pas** code courant du jeu)

### Procédure à exécuter à la prochaine session où Floot est disponible

1. Lire la **version courante** de `list_files`, dépendances et métadonnées via les outils Floot. Ne pas exporter aveuglément les anciens fichiers GitHub.
2. Lire les sources de Floot par lots (par exemple `pages/`, `components/`, `helpers/`, `endpoints/`, feuilles de style et fichiers de configuration de projet utiles).
3. Effectuer une **revue de confidentialité avant toute écriture dans ce dépôt public** : aucune donnée joueur, aucun cookie, mot de passe, jeton d'accès, variable d'environnement, fichier `.env`, configuration privée ou clé serveur. Ne pas déduire qu'un fichier est sûr de son extension.
4. Placer uniquement les fichiers source approuvés dans **un dossier séparé**, par exemple `floot-export/version-<version>/`, sans écraser les archives historiques. Ne pas oublier les fichiers d'import et les dépendances de la version considérée.
5. Construire un `manifest.json` comprenant l'identifiant exact du projet, une version identifiée depuis Floot et la somme **SHA-256 de chaque fichier exporté**.
6. Contrôler le dossier avec `python scripts/verify_floot_export.py <dossier_export>` avant de qualifier l'export de complet ou intègre.
7. Enregistrer la version, le commit GitHub et le résultat de la vérification dans `docs/FLOOT_SUIVI_AUTONOME.md`.
8. Envisager séparément une sauvegarde **PostgreSQL** avec la plateforme autorisée. L'inventaire réel ne doit jamais être publié sur GitHub.

## Format du manifeste

Exemple schématique (**pas un manifeste réel** ; la somme ci-dessous est à recalculer sur le contenu exact du fichier et les champs à adapter à la vraie version Floot) :

```json
{
  "projectId": "1d1c3807-73a6-49c5-a59e-ec097d8caddf",
  "version": "VERSION_SOURCE_FLOOT_VERIFIEE",
  "files": {
    "pages/_index.tsx": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
  }
}
```

Chaque chemin est **relatif à la racine de l'export** (et non à la racine GitHub).

## Utilisation du vérificateur

```bash
python scripts/verify_floot_export.py floot-export/version-VERIFIEE
```

Le programme effectue une vérification **en lecture seule** :
- Identifiant du projet et présence d'une version.
- Liste non vide des fichiers et empreintes SHA-256 valides.
- Chemins relatifs et sûrs ; rejet notamment des parcours `../`, `.env`, fichiers de credentials nommés, liens symboliques et chemins externes.
- Présence de chaque fichier, taille raisonnable et empreinte correspondante.
- Refus des fichiers non listés dans le manifeste.

**Limites importantes :** la comparaison des empreintes protège contre des modifications *par rapport au manifeste*. Elle ne prouve pas, à elle seule, que le manifeste a été généré depuis le bon état Floot, ni que les fichiers publiés sont identiques. La concordance doit être contrôlée via la version du projet et la lecture des sources. L'outil ne détecte pas tous les secrets intégrés aux sources : une revue humaine/automatisée préalable reste obligatoire. Il ne touche jamais à la base de données.

## Tests du vérificateur

```bash
python -m unittest discover -s floot-e2e -p 'test_export_integrity.py' -v
```

Suite préparée et testée localement le 9 octobre : **13 scénarios réussis**. Le workflow GitHub de contrôle public exécute les suites Python du dossier `floot-e2e/`, mais il n'est lancé que manuellement.

## Références

- [Plan de reprise Floot](PLAN_REPRISE_2026-10-10.md)
- [Matrice de recette](MATRICE_RECETTE_FLOOT.md)
- [Journal des sessions](FLOOT_SUIVI_AUTONOME.md)
