#!/usr/bin/env python3
"""Import the 161-image archive into GitHub Pages after one GitHub UI upload.

Upload one exact ZIP to uploads/TCG_Deseur_161_Visuels_WEBP_GitHub.zip;
the guarded GitHub Actions workflow unpacks it and publishes real images.
Never trust arbitrary ZIP paths, duplicate names or partial manifests.
"""
from pathlib import Path
from zipfile import ZipFile
import json
import sys

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/"collection-161"
ARCHIVE=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/"uploads/TCG_Deseur_161_Visuels_WEBP_GitHub.zip"

def validate_and_unpack():
    if not ARCHIVE.is_file() or ARCHIVE.stat().st_size>25_000_000:
        raise ValueError("Archive 161 absente ou supérieure à 25 MB")
    with ZipFile(ARCHIVE) as file:
        names=file.namelist()
        if len(names)!=len(set(names)):
            raise ValueError("Entrées ZIP en doublon")
        allowed_prefix="collection-161/assets/"
        allowed_names={"collection-161/README.txt","collection-161/manifest.json"}
        for name in names:
            parts=Path(name).parts
            if Path(name).is_absolute() or ".." in parts or not (
              name.startswith(allowed_prefix) or name in allowed_names):
                raise ValueError("Chemin non autorisé dans l'archive: "+name)
        image_names={name for name in names if name.startswith(
          "collection-161/assets/cards/") and name.endswith(".webp")}
        if len(image_names)!=161:
            raise ValueError("L'archive doit avoir exactement 161 fichiers WebP")
        manifest_file="collection-161/assets/available.json"
        if manifest_file not in names:
            raise ValueError("Le manifeste d'images est absent")
        manifest=json.loads(file.read(manifest_file))
        expected={"collection-161/assets/cards/"+name for name in manifest.get("images",[])}
        if manifest.get("count")!=161 or expected!=image_names:
            raise ValueError("Le manifeste ne correspond pas aux 161 images")
        if file.testzip() is not None:
            raise ValueError("Archive CRC corrompue")
        for name in image_names:
            data=file.read(name)
            if not (data.startswith(b"RIFF") and data[8:12]==b"WEBP"):
                raise ValueError("Le visuel n'est pas un WebP: "+name)
        # Only copy after the entire package has been validated.
        for name in sorted(image_names | {manifest_file}):
            target=ROOT/name
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(file.read(name))
        print(f"IMAGES_IMPORTED={len(image_names)}")
        print("Chevelu=td-chevelu.webp, Lille=td-lille.webp")
        return len(image_names)

if __name__=="__main__":
    print(validate_and_unpack())
