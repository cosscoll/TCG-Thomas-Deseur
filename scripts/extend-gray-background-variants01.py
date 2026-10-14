#!/usr/bin/env python3
"""Extend only the background of the first 10 official alternative card artworks.

The decoded source pixels are preserved at native 1:1 size, without cropping,
resizing, stretching, regenerating, or changing the costume/person. The newly
added canvas is neutral-gray, sampled from the source artwork where possible.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import statistics
from pathlib import Path
from PIL import Image, ImageOps, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "data/edition-staging-67.json"
OUT = ROOT / "collection-validee/assets/gray-extended-variants01"
THUMBS = ROOT / "collection-validee/assets/gray-thumbs-variants01"
META = ROOT / "data/gray-background-variants01.json"
CONTACT = ROOT / "audit-visuels/assets/gray-background-variants01-before-after.jpg"
SMALL = (384, 512)
EXPECTED = ["td_2_043","td_3_005","td_2_042","td_3_042","td_2_003",
            "td_3_011","td_2_005","td_3_023","td_3_024","td_2_001"]

def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def variants():
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    if len(catalog["cards"]) != 67:
        raise ValueError("Unexpected size of official card edition")
    pairs = [(c, v) for c in catalog["cards"] for v in c["variants"]]
    if len(pairs) != 38 or [v["artworkId"] for _,v in pairs[:10]] != EXPECTED:
        raise ValueError("Official alternative card assignments changed: abort")
    if len({v["artworkId"] for _,v in pairs}) != 38:
        raise ValueError("Duplicate alternative artwork identifier")
    return pairs[:10]

def background(source):
    rgb = source.convert("RGB")
    w,h = rgb.size
    n = max(12, min(64, w//14, h//14))
    samples = []
    for x,y in ((0,0),(w-n,0),(0,h-n),(w-n,h-n)):
        for r,g,b in rgb.crop((x,y,x+n,y+n)).resize((16,16)).getdata():
            if max(r,g,b)-min(r,g,b) <= 32:
                samples.append((r,g,b))
    if len(samples) < 30:
        for x in range(0,w,max(1,w//60)):
            for y in (0,h-1):
                p = rgb.getpixel((x,y))
                if max(p)-min(p) <= 32:
                    samples.append(p)
    if samples:
        return tuple(round(statistics.median(p[i] for p in samples)) for i in range(3))
    # No neutral gray exists on the image perimeter: use a neutral gray based
    # on its corner luminosity, changing zero pixels of the original artwork.
    corners = [rgb.getpixel(p) for p in ((0,0),(w-1,0),(0,h-1),(w-1,h-1))]
    tone = round(statistics.median(sum(p)/3 for p in corners))
    return (tone,tone,tone)

def run(check=False):
    pairs = variants()
    originals = []
    for character,variant in pairs:
        path = ROOT / variant["assetPath"]
        if path.suffix.lower() != ".webp" or not path.is_file():
            raise FileNotFoundError(path)
        with Image.open(path) as im:
            pic = ImageOps.exif_transpose(im).convert("RGB")
        originals.append((character,variant,path,pic))
    required_width = max(1200, *(max(im.width, (im.height*3+3)//4) for _,_,_,im in originals))
    width = ((required_width+2)//3)*3
    size = (width,width*4//3)
    records = []
    comparison = []
    for ordinal,(character, variant, path, pic) in enumerate(originals,1):
        w,h = pic.size
        color = background(pic)
        canvas = Image.new("RGB",size,color)
        x,y = (size[0]-w)//2,(size[1]-h)//2
        canvas.paste(pic,(x,y))
        if ImageChops.difference(canvas.crop((x,y,x+w,y+h)),pic).getbbox():
            raise AssertionError("Source pixel changed: "+variant["artworkId"])
        out = OUT / path.name
        thumb = THUMBS / path.name
        if not check:
            out.parent.mkdir(parents=True,exist_ok=True)
            thumb.parent.mkdir(parents=True,exist_ok=True)
            canvas.save(out,format="WEBP",lossless=True,method=6,exact=True)
            canvas.resize(SMALL,Image.Resampling.LANCZOS).save(thumb,format="WEBP",quality=87,method=6)
        if not out.is_file() or not thumb.is_file():
            raise FileNotFoundError("Missing extended image or miniature: "+path.name)
        with Image.open(out) as saved:
            if saved.format!="WEBP" or saved.size!=size or ImageChops.difference(saved.convert("RGB"),canvas).getbbox():
                raise AssertionError("Saved image changed source pixels: "+path.name)
        with Image.open(thumb) as saved:
            if saved.format!="WEBP" or saved.size!=SMALL:
                raise AssertionError("Incorrect miniature: "+path.name)
        records.append({
            "ordinal":ordinal,"characterId":character["characterId"],"name":character["title"],
            "artworkId":variant["artworkId"],"source":variant["assetPath"],
            "image":out.relative_to(ROOT).as_posix(),
            "thumbnail":thumb.relative_to(ROOT).as_posix(),
            "sourceSize":[w,h],"outputSize":list(size),"thumbnailSize":list(SMALL),
            "originalPixelPosition":[x,y,w,h],"grayRGB":list(color),
            "sourceSha256":digest(path),"imageSha256":digest(out),
            "thumbnailSha256":digest(thumb),"originalPixelsUntouched":True
        })
        comparison.append((character["title"]+" — variante "+str(ordinal),
                           ImageOps.contain(pic,(210,240)),
                           ImageOps.contain(canvas,(210,240))))
    manifest = {
        "schema":"tcg-deseur-gray-background-variants01-v1",
        "method":"Extend neutral-gray canvas; preserve every original source pixel at native 1:1 resolution",
        "size":list(size),"thumbnailSize":list(SMALL),"sourceEdition":"data/edition-staging-67.json",
        "onlyFirstTenAlternativeImages":True,"originalsUnchanged":True,"items":records
    }
    if check:
        if json.loads(META.read_text(encoding="utf-8")) != manifest:
            raise AssertionError("Generated metadata differs from existing source")
        with Image.open(CONTACT) as sheet:
            if sheet.size != (900,2740):
                raise AssertionError("Missing or wrong comparison sheet")
    else:
        META.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        sheet = Image.new("RGB",(900,2740),(249,249,249))
        pen = ImageDraw.Draw(sheet)
        pen.text((10,10),"TCG DESEUR | 10 VARIANTES | FOND SEUL AGRANDI",fill=(24,24,24))
        for index,(name,before,after) in enumerate(comparison):
            row = 42+index*269
            pen.text((20,row),str(index+1)+". "+name[:48],fill=(10,10,10))
            pen.text((220,row),"AVANT",fill=(70,70,70))
            pen.text((600,row),"APRES (AUCUN RECADRAGE)",fill=(70,70,70))
            sheet.paste(before,(210+(210-before.width)//2,row+22+(240-before.height)//2))
            sheet.paste(after,(590+(210-after.width)//2,row+22+(240-after.height)//2))
        CONTACT.parent.mkdir(parents=True,exist_ok=True)
        sheet.save(CONTACT,"JPEG",quality=90,optimize=True)
    print(("VERIFIED" if check else "CREATED")+" first 10 variants at "+str(size)+"; every original source pixel intact",flush=True)

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    run(parser.parse_args().check)
