#!/usr/bin/env python3
"""GitHub Action: import the 177 original named visuals into a separate read-only review gallery.

The official TCG / collection and player database must never be edited by this tool.
"""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile
from urllib.request import urlopen, Request
from hashlib import sha256
import json
import re
import os

ROOT=Path(__file__).resolve().parents[1]
URL="https://tcg-thomas-deseur.floot.app/_cdn/static/546c639b-e78b-4afe-9dbb-5a5e801a45cf-TCG_Deseur_Galerie_GitHub_177.zip"
EXPECTED_SHA256="ce449ecfd54c5ba4a2350633b68c99b68bd996317dfbcab9dda2dfa90b9627d3"
EXPECTED_IMAGE_COUNT=177
EXPECTED_GROUP_COUNT=70
MAX_ZIP_BYTES=20_000_000
MAX_UNCOMPRESSED_BYTES=35_000_000

def download_verified_zip():
    response=urlopen(Request(URL,headers={"User-Agent":"TCG-Deseur-GitHub-Importer/1.0"}),timeout=100)
    with response:
        payload=response.read(MAX_ZIP_BYTES+1)
    if len(payload)>MAX_ZIP_BYTES:
        raise RuntimeError("ZIP trop volumineux")
    if sha256(payload).hexdigest()!=EXPECTED_SHA256:
        raise RuntimeError("Empreinte ZIP différente de celle vérifiée par l'équipe")
    return payload

def publish(payload):
    from io import BytesIO
    with ZipFile(BytesIO(payload)) as z:
        members=z.infolist()
        files=[m.filename for m in members if not m.is_dir()]
        if len(files)!=len(set(files)):
            raise RuntimeError("Chemins ZIP en double")
        if sum(m.file_size for m in members)>MAX_UNCOMPRESSED_BYTES:
            raise RuntimeError("Volume des fichiers extraits excessif")
        for m in members:
            name=m.filename
            path=PurePosixPath(name)
            if path.is_absolute() or ".." in path.parts or path.parts[0]!="tri-177":
                raise RuntimeError("Chemin non autorisé : "+name)
            if m.is_dir():continue
            if name.startswith("tri-177/images_nommes/"):
                if not name.endswith(".webp"):
                    raise RuntimeError("Illustration non WebP : "+name)
            elif name.startswith("tri-177/planches/"):
                if not name.endswith(".jpg"):
                    raise RuntimeError("Planche inattendue : "+name)
            elif name not in (
                "tri-177/index.html",
                "tri-177/Catalogue_177_images.csv",
                "tri-177/Groupes_70_costumes.csv",
                "tri-177/manifest.json",
            ):
                raise RuntimeError("Fichier inattendu : "+name)
        images=[f for f in files if f.startswith("tri-177/images_nommes/")]
        if len(images)!=EXPECTED_IMAGE_COUNT:
            raise RuntimeError(f"177 images attendues, obtenu {len(images)}")
        index=z.read("tri-177/index.html").decode("utf-8")
        ids=set(re.findall(r'<section class="group" id="(COST-\d{3})"',index))
        if len(ids)!=EXPECTED_GROUP_COUNT:
            raise RuntimeError(f"70 groupes attendus : {len(ids)}")
        if len(re.findall(r'<div class="photo"',index))!=177:
            raise RuntimeError("177 photos attendues dans la galerie")
        for image in images:
            relative=image.split("/",1)[1]
            if relative not in index:
                raise RuntimeError("Photo sans référence dans HTML : "+relative)
            data=z.read(image)
            if not(data[:4]==b"RIFF" and data[8:12]==b"WEBP"):
                raise RuntimeError("Signature WebP invalide : "+image)
        manifest=json.loads(z.read("tri-177/manifest.json"))
        if manifest.get("images")!=177 or manifest.get("groups")!=70:
            raise RuntimeError("Manifeste de catalogue invalide")
        if z.testzip() is not None:
            raise RuntimeError("ZIP corrompu")
        for entry in files:
            target=ROOT/entry
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(z.read(entry))
        print(f"IMPORTED={len(images)} WEBP, GROUPS={len(ids)}, TOTAL_FILES={len(files)}")

if __name__=="__main__":
    publish(download_verified_zip())
