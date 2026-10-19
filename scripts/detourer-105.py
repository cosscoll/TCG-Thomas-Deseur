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

def produce_primary(session, original):
    """Retire seulement le fond connecté aux bords, sans effacer les costumes.

    Les anciens fonds de ces illustrations sont presque unis (gris/bleutés).
    La segmentation chromatique est préférable au modèle généraliste qui
    confond parfois des costumes avec le décor et détruit des parties entières.
    """
    import cv2
    import numpy as np
    rgb = np.asarray(original.convert("RGB"), dtype=np.uint8)
    h, w = rgb.shape[:2]
    # Bordure large : les sources peuvent toucher plusieurs bords, mais
    # le fond des illustrations 3D est mat et chromatiquement neutre.
    rim = max(4, min(h, w) // 24)
    border = np.zeros((h, w), bool)
    border[:rim] = True
    border[-rim:] = True
    border[:, :rim] = True
    border[:, -rim:] = True
    intensity = rgb.astype(np.int16)
    saturation = intensity.max(2) - intensity.min(2)
    brightness = intensity.mean(2)
    eligible = border & (saturation < 66) & (brightness > 58) & (brightness < 253)
    samples = rgb[eligible]
    if len(samples) < 128:
        raise ValueError("Fond neutre insuffisant, détourage manuel requis.")
    samples = samples[::max(1, len(samples) // 12000)].astype(np.float32)
    K = min(4, max(1, len(samples) // 150))
    cv2.setRNGSeed(2110)
    _, labels, centers = cv2.kmeans(samples, K, None,
        (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 24, 0.3),
        2, cv2.KMEANS_PP_CENTERS)
    counts = np.bincount(labels[:, 0], minlength=K)
    neutral_centers = sorted(zip(counts, centers), key=lambda x: -x[0])
    # Un ou deux tons de fond proches afin de respecter les légers dégradés.
    base = neutral_centers[0][1]
    bg_centers = [base]
    for count, center in neutral_centers[1:]:
        if count > 0.12 * len(samples) and np.linalg.norm(center - base) < 65:
            bg_centers.append(center)
    px = rgb.astype(np.float32)
    distances = np.minimum.reduce([np.sqrt(np.sum((px - center) ** 2, axis=2))
                                    for center in bg_centers])
    bg_color = distances < 66
    # Conserver les zones grises enclavées dans les contours du personnage.
    labels_count, comps, stats, _ = cv2.connectedComponentsWithStats(
        bg_color.astype(np.uint8), connectivity=8)
    bg_connected = np.zeros((h, w), dtype=np.uint8)
    for k in range(1, labels_count):
        x, y, cw, ch, area = stats[k]
        touches_edge = x == 0 or y == 0 or x + cw >= w or y + ch >= h
        if touches_edge and area > max(100, (h * w) // 8000):
            bg_connected[comps == k] = 255
    if np.mean(bg_connected > 0) < 0.025:
        raise ValueError("Fond non détecté avec assez de confiance.")
    foreground = (bg_connected == 0).astype(np.uint8) * 255
    # Retirer exclusivement le bruit isolé très fin ; conserver tout accessoire
    # visible, y compris ceux séparés du personnage.
    n, cc, sizes, _ = cv2.connectedComponentsWithStats(foreground, 8)
    for k in range(1, n):
        if sizes[k, cv2.CC_STAT_AREA] < max(15, h*w//70000):
            foreground[cc == k] = 0
    fraction = float(np.mean(foreground > 127))
    if not 0.045 <= fraction <= 0.95:
        raise ValueError(f"Masque incohérent ({fraction:.1%})")
    points = cv2.findNonZero(foreground)
    if points is None:
        raise ValueError("Masque vide")
    bx, by, bw, bh = cv2.boundingRect(points)
    bounds = (bx, by, bx + bw, by + bh)
    feather = cv2.GaussianBlur(foreground, (3, 3), 0.75)
    rgba = original.convert("RGBA")
    rgba.putalpha(Image.fromarray(feather))
    subject = rgba.crop(bounds)
    fitted = ImageOps.contain(subject, (int(SIZE[0] * 0.91), int(SIZE[1] * 0.91)),
                              method=Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", SIZE, (*BG, 255))
    canvas.alpha_composite(fitted, ((SIZE[0]-fitted.width)//2,
                                     (SIZE[1]-fitted.height)//2))
    return canvas.convert("RGB"), [int(v) for v in bounds], round(fraction, 4)

def produce(session, original, artwork_id=None):
    """Never abort 105 assets on a single uncertain cutout.

    A failure produces a conservative REVIEW-ONLY placeholder which keeps
    the entire original intact. It is NOT eligible for production publication.
    """
    import cv2
    try:
        image, bounds, fraction = produce_primary(session, original)
        return image, bounds, fraction, "edge-bg", None
    except (ValueError, cv2.error) as exc:
        w,h=original.size
        rgb=original.convert("RGB")
        foreground=ImageOps.contain(rgb,(int(SIZE[0]*.91),int(SIZE[1]*.91)),
                                  method=Image.Resampling.LANCZOS)
        canvas=Image.new("RGB", SIZE, BG)
        canvas.paste(foreground,((SIZE[0]-foreground.width)//2,
                                  (SIZE[1]-foreground.height)//2))
        return canvas,[0,0,w,h],1.0,"fallback-contain-needs-review",str(exc)

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
    session = None
    DEST.mkdir(parents=True, exist_ok=True)
    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    contact = Image.new("RGB", (8 * 152, 14 * 198), (235, 235, 235))
    pen = ImageDraw.Draw(contact)
    report = []
    review_required = []
    for i, (artwork_id, kind, source, dest) in enumerate(entries):
        with Image.open(source) as im:
            image, bounds, mask_fraction, method, problem = produce(session, im, artwork_id)
        if problem:
            review_required.append({'artworkId': artwork_id, 'reason': problem})
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
                       "maskBounds": bounds, "maskCoverage": mask_fraction,
                       "method": method, "reviewRequired": bool(problem)})
        print(f"{i + 1:03d}/{EXPECTED} {artwork_id} {kind}", flush=True)
    if len(report) != EXPECTED:
        raise ValueError("Lot incomplet")
    contact.save(PREVIEW, "JPEG", quality=88)
    REPORT.write_text(json.dumps({"schema": "tcg-deseur-cutout-105-v1",
        "status": "REVIEW_REQUIRED_NOT_LIVE", "reviewRequiredCount": len(review_required),
        "reviewRequired": review_required,
        "background": "#808080", "size": list(SIZE),
        "model": "opencv-neutral-background-reconstruction-v2", "originalsUntouched": True,
        "artworks": report}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    main(check=True)
    print(f"Sorties: {len(report)}; images à corriger/revoir: {len(review_required)}",flush=True)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    main(check=args.check)
