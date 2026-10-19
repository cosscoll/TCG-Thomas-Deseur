#!/usr/bin/env python3
"""Détourage non destructif des 105 artworks PUBLICS approuvés.

Le modèle retire les fonds originaux, puis les silhouettes sont recomposées
sur une toile GRIS UNI identique. Les images sources ne sont jamais modifiées.
Les résultats sont publiés sous un NOUVEAU chemin, pas utilisés dans Floot
tant que la revue visuelle n'a pas été validée.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/edition-staging-67.json"
DEST = ROOT / "collection-validee/assets/detourees"
REPORT = ROOT / "data/detourage-105.json"
PREVIEW = ROOT / "audit-visuels/assets/detourage-105-contact-sheet.jpg"
SIZE = (768, 1024)
BG = (128, 128, 128)
EXPECTED = 105

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def sources():
    data = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if data.get("schema") != "tcg-deseur-edition-staging-v1" or len(data["cards"]) != 67:
        raise ValueError("Catalogue approuvé inattendu ; traitement abandonné.")
    entries = []
    for card in data["cards"]:
        for kind, art in [("main", card["main"]), *[("alternative", a) for a in card["variants"]]]:
            source = ROOT / art["assetPath"]
            if not source.is_file() or source.parent != ROOT / "collection-161/assets/cards":
                raise ValueError(f"Original manquant / non approuvé: {source}")
            entries.append((str(art["artworkId"]), kind, source, DEST / source.name))
    if len(entries) != EXPECTED or len(set(x[0] for x in entries)) != EXPECTED:
        raise ValueError("Le lot ne contient pas 105 illustrations distinctes.")
    return entries

def produce(session, original):
    from rembg import remove
    rgba = remove(original.convert("RGB"), session=session, post_process_mask=True).convert("RGBA")
    alpha = rgba.getchannel("A")
    # Ignorer les traces imperceptibles, mais ne jamais recadrer une partie visible.
    bounds = alpha.point(lambda x: 255 if x > 8 else 0).getbbox()
    if not bounds:
        raise ValueError("Masque vide")
    visible_pixels = sum(1 for v in alpha.resize((128, 128)).getdata() if v > 70)
    fraction = visible_pixels / (128 * 128)
    if not 0.045 <= fraction <= 0.88:
        raise ValueError(f"Masque incohérent ({fraction:.1%}): revue requise")
    # Conserver absolument tous les pixels du personnage; taille sans découpe.
    subject = rgba.crop(bounds)
    fitted = ImageOps.contain(subject, (int(SIZE[0] * 0.91), int(SIZE[1] * 0.91)),
                              method=Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", SIZE, (*BG, 255))
    x = (SIZE[0] - fitted.width) // 2
    y = (SIZE[1] - fitted.height) // 2
    canvas.alpha_composite(fitted, (x, y))
    return canvas.convert("RGB"), [int(v) for v in bounds], round(fraction, 4)

def main(check=False):
    entries = sources()
    if check:
        saved = json.loads(REPORT.read_text(encoding="utf-8"))
        if saved.get("schema") != "tcg-deseur-cutout-105-v1" or len(saved.get("artworks", [])) != EXPECTED:
            raise ValueError("Rapport incomplet")
        by_id = {x["artworkId"]: x for x in saved["artworks"]}
        for artwork_id, kind, source, dest in entries:
            row = by_id[artwork_id]
            if row["kind"] != kind or row["sourceSha"] != digest(source) or row["outputSha"] != digest(dest):
                raise ValueError(f"Empreinte incorrecte: {artwork_id}")
            with Image.open(dest) as im:
                if im.size != SIZE or im.format != "WEBP":
                    raise ValueError(f"Format incorrect: {artwork_id}")
        print(f"Vérifié: {EXPECTED} détourages, images originales intactes.")
        return
    from rembg import new_session
    session = new_session("u2net")
    DEST.mkdir(parents=True, exist_ok=True)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    contact = Image.new("RGB", (8 * 152, 14 * 198), (235, 235, 235))
    pen = ImageDraw.Draw(contact)
    report = []
    for i, (artwork_id, kind, source, dest) in enumerate(entries):
        with Image.open(source) as im:
            image, bounds, mask_fraction = produce(session, im)
        image.save(dest, "WEBP", quality=91, method=6)
        # Extérieurs grisés identiques. Vérifier qu'aucun fond de photo n'y subsiste.
        for xy in ((0, 0), (SIZE[0] - 1, 0), (0, SIZE[1] - 1), (SIZE[0] - 1, SIZE[1] - 1)):
            px = Image.open(dest).convert("RGB").getpixel(xy)
            if max(abs(px[j] - BG[j]) for j in range(3)) > 3:
                raise ValueError(f"Bord contaminé: {artwork_id} {xy} {px}")
        thumb = image.resize((136, 181), Image.Resampling.LANCZOS)
        xx, yy = (i % 8) * 152 + 8, (i // 8) * 198 + 4
        contact.paste(thumb, (xx, yy))
        pen.text((xx + 2, yy + 182), artwork_id, fill=(20, 20, 20))
        report.append({"artworkId": artwork_id, "kind": kind,
                       "source": source.relative_to(ROOT).as_posix(),
                       "output": dest.relative_to(ROOT).as_posix(),
                       "sourceSha": digest(source), "outputSha": digest(dest),
                       "maskBounds": bounds, "maskCoverage": mask_fraction})
        print(f"{i + 1:03d}/{EXPECTED} {artwork_id} {kind}", flush=True)
    if len(report) != EXPECTED:
        raise ValueError("Lot incomplet")
    contact.save(PREVIEW, "JPEG", quality=88)
    REPORT.write_text(json.dumps({"schema": "tcg-deseur-cutout-105-v1",
        "status": "ASSETS_GENERATED_NOT_YET_LIVE",
        "background": "#808080", "size": list(SIZE),
        "model": "u2net", "originalsUntouched": True,
        "artworks": report}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    main(check=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    main(check=args.check)
