#!/usr/bin/env python3
"""Read-only inventory of outdated product names vs the required live technical hostname."""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
old_name=re.compile(r"budget[ _-]*(?:illimit(?:é|e|és|es)|illimite)",re.I)
domain="tcg-thomas-deseur.floot.app"
skip={".git","node_modules",".venv","dist","build","__pycache__"}
text_suffixes={".html",".css",".js",".mjs",".jsx",".ts",".tsx",".md",".txt",".json",".yaml",".yml",".py",".sql",".xml",".sh",".svg",".toml"}
violations=[]
technical=[]
visited=0
for file in root.rglob("*"):
    if not file.is_file() or skip.intersection(file.parts) or (file.suffix.lower() not in text_suffixes):
        continue
    try:
        content=file.read_text("utf-8")
    except UnicodeDecodeError:
        continue
    visited+=1
    for i,line in enumerate(content.splitlines(),1):
        if not old_name.search(line):
            continue
        entry=f"{file.relative_to(root)}:{i}: {line[:240]}"
        if domain in line.lower() and not old_name.search(line.lower().replace(domain,"")):
            technical.append(entry)
        else:
            violations.append(entry)
print(f"AUDIT: {visited} fichiers texte.")
allowed_historical_files={
    "game/legacy-storage.js",  # lecture des anciennes sauvegardes, pas un titre
    "tests/storage-migration.test.mjs",  # teste cette rétrocompatibilité
    "docs/AUDIT_ET_FEUILLE_DE_ROUTE.md",  # chemin réellement utilisé avant migration
}
unexpected=[e for e in violations if e.split(":",1)[0] not in allowed_historical_files]
print(f"ANCIENNE MARQUE hors adresse technique : {len(violations)} (historiques autorisées : {len(violations)-len(unexpected)})")
for e in violations:print(("TRACE_HISTORIQUE: " if e not in unexpected else "RENOMMER: ")+e)
if unexpected:
    print(f"ECHEC: {len(unexpected)} référence(s) non justifiées à l'ancienne dénomination.")
    raise SystemExit(1)
print("OK : aucune ancienne marque dans les interfaces et sources actives.")
print(f"SOUS-DOMAINE FLOOT ACTIF: {len(technical)}")
for e in technical:print("DOMAINE_TECHNIQUE: "+e)
print("RAPPEL : le changement de sous-domaine Floot exige une interruption et confirmation préalable ; ne pas supprimer les liens actifs.")
