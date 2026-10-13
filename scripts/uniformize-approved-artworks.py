#!/usr/bin/env python3
"""Non-destructive 3:4 canvas normalization of all 105 approved public TCG Deseur artworks.

65? No: exactly 67 main + 38 variants. Originals remain untouched.
Subject, pose, costume and accessories remain visible, never cropped.
Fill only the missing sides with softly blurred extension of the same artwork.
Run from repo root after installing Pillow: python scripts/uniformize-approved-artworks.py
To validate output integrity: python scripts/uniformize-approved-artworks.py --check
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from typing import Any
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

TARGET_SIZE = (768, 1024)
SOURCE_DIR = "collection-161/assets/cards"
OUTPUT_DIR = "collection-validee/assets/uniform"
META_FILE = "data/approved-artwork-uniform-105.json"
MANIFEST_FILE = "data/edition-staging-67.json"
SCHEMA = "tcg-deseur-uniform-approved-artworks-v1"

def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def approved_assets(manifest: dict[str, Any]) -> list[dict[str, str]]:
    if manifest["schema"] != "tcg-deseur-edition-staging-v1":
        raise ValueError("Wrong approved edition")
    if len(manifest["cards"]) != 67:
        raise ValueError("Exactly 67 public characters required")
    entries: list[dict[str, str]] = []
    seen: set[str] = set()
    for card in manifest["cards"]:
        if not card.get("characterId") or not card.get("title") or not card.get("rarity"):
            raise ValueError("Incomplete approved card")
        artworks = [("main",card["main"])] + [("variant",a) for a in card["variants"]]
        for kind,art in artworks:
            path=Path(art["assetPath"])
            if path.parent.as_posix() != SOURCE_DIR:
                raise ValueError("Artwork lies outside the approved source gallery")
            if path.name in seen or not path.name.endswith(".webp"):
                raise ValueError("Duplicate or invalid source illustration")
            seen.add(path.name)
            entries.append({
                "characterId":card["characterId"],
                "artworkId":art["artworkId"],
                "kind":kind,
                "source":art["assetPath"],
                "normalized":f"{OUTPUT_DIR}/{path.name}"
            })
    if len(entries) != 105 or sum(x["kind"] == "main" for x in entries) != 67:
        raise ValueError("Expected 67 base artworks and 38 approved variants")
    return entries

def normalized_canvas(source:Image.Image,target:tuple[int,int]=TARGET_SIZE):
    if source.width<=0 or source.height<=0:
        raise ValueError("Empty image")
    source=ImageOps.exif_transpose(source).convert("RGBA")
    opaque=Image.new("RGBA",source.size,(38,31,49,255))
    opaque.alpha_composite(source)
    rgb=opaque.convert("RGB")
    background=ImageOps.fit(rgb,target,method=Image.Resampling.LANCZOS)
    background=ImageEnhance.Brightness(background.filter(ImageFilter.GaussianBlur(42))).enhance(.70)
    foreground=ImageOps.contain(rgb,target,method=Image.Resampling.LANCZOS)
    left=(target[0]-foreground.width)//2
    top=(target[1]-foreground.height)//2
    background.paste(foreground,(left,top))
    return background,[left,top,foreground.width,foreground.height]

def execute(root:Path,check:bool) -> dict[str,Any]:
    manifest=json.loads((root/MANIFEST_FILE).read_text(encoding="utf-8"))
    entries=approved_assets(manifest)
    stored={}
    if check:
        data=json.loads((root/META_FILE).read_text(encoding="utf-8"))
        if data.get("schema")!=SCHEMA or data.get("size")!=list(TARGET_SIZE) or len(data.get("artworks",[]))!=105:
            raise ValueError("Invalid published normalized artwork manifest")
        stored={item["source"]:item for item in data["artworks"]}
    results=[]
    for item in entries:
        original=root/item["source"]
        target=root/item["normalized"]
        if not original.is_file():
            raise FileNotFoundError(f"Missing approved source artwork: {original}")
        with Image.open(original) as im:
            if im.format!="WEBP":raise ValueError(f"Invalid source format: {original}")
            source_size=[im.width,im.height]
            canvas,bounds=normalized_canvas(im)
        if check:
            if not target.is_file():raise FileNotFoundError(f"Missing normalized image: {target}")
            with Image.open(target) as output:
                output.load()
                if output.format!="WEBP" or output.size!=TARGET_SIZE:
                    raise ValueError(f"Invalid output format/dimensions: {target}")
            old=stored.get(item["source"])
            if not old or old["normalized"]!=item["normalized"] or old["sourceSha256"]!=sha256(original) or old["sha256"]!=sha256(target) or old["sourceSize"]!=source_size or old["foregroundBounds"]!=bounds:
                raise ValueError(f"Unexpected source or artwork mutation: {item['normalized']}")
        else:
            target.parent.mkdir(parents=True,exist_ok=True)
            canvas.save(target,format="WEBP",quality=88,method=6)
        results.append({**item,"sourceSize":source_size,"foregroundBounds":bounds,
                        "sourceSha256":sha256(original),"sha256":sha256(target)})
    output={
        "schema":SCHEMA,"status":"PUBLISHED_VISUALS_PUBLIC_ONLY",
        "size":list(TARGET_SIZE),"aspectRatio":"3:4",
        "technique":"entire original artwork contained; blurred artwork background extension; no cropping of foreground",
        "originalsUnchanged":True,"artworks":results
    }
    if not check:
        target=root/META_FILE
        target.parent.mkdir(parents=True,exist_ok=True)
        target.write_text(json.dumps(output,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    return output

if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check",action="store_true")
    parser.add_argument("--root",type=Path,default=Path(__file__).resolve().parents[1])
    args=parser.parse_args()
    result=execute(args.root,args.check)
    print(f"{'Verified' if args.check else 'Generated'}: {len(result['artworks'])} public artworks (67 main, 38 variants) at 768×1024 WebP")
