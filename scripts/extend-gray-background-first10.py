#!/usr/bin/env python3
"""Restore the first 10 approved card artworks with GRAY BACKGROUND EXTENSION ONLY.

No cropping, zooming, upscaling, stretching or re-generating the figure:
every pixel of the decoded approved original is preserved in its entirety, 1:1.
Only a sampled gray solid background is added OUTSIDE the original rectangle.
An exact lossless WEBP roundtrip and pixel equality are mandatory before publish.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import statistics
from pathlib import Path
from PIL import Image, ImageOps, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "data/edition-staging-67.json"
OUT = ROOT / "collection-validee/assets/gray-extended-first10"
THUMBS = ROOT / "collection-validee/assets/gray-thumbs-first10"
META = ROOT / "data/gray-background-first10.json"
CONTACT = ROOT / "audit-visuels/assets/gray-background-first10-before-after.jpg"
SIZE = (1200, 1600)
SMALL = (384, 512)

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def bg_gray(original: Image.Image) -> tuple[int, int, int]:
    """Derive the real gray-background shade from neutral corner pixels only."""
    rgb = original.convert("RGB")
    w,h = rgb.size
    corner = max(12, min(64, w//14, h//14))
    neutral = []
    corners = ((0,0),(w-corner,0),(0,h-corner),(w-corner,h-corner))
    for left,top in corners:
        patch=rgb.crop((left,top,left+corner,top+corner)).resize((16,16))
        for r,g,b in patch.getdata():
            if max(r,g,b)-min(r,g,b) <= 32:
                neutral.append((r,g,b))
    if len(neutral)<30:
        # Sample perimeter pixels (still without ever copying a subject pixel).
        for x in range(0,w,max(1,w//60)):
            for y in (0,h-1):
                r,g,b=rgb.getpixel((x,y))
                if max(r,g,b)-min(r,g,b)<=32:neutral.append((r,g,b))
    if len(neutral)<30:
        raise ValueError("Cannot confidently identify a gray backdrop from the original corners")
    return tuple(round(statistics.median(p[i] for p in neutral)) for i in range(3))

def first_ten():
    catalog=json.loads(MANIFEST.read_text(encoding="utf-8"))
    if len(catalog["cards"])!=67:raise ValueError("Wrong collection edition")
    cards=catalog["cards"][:10]
    if [c["characterId"] for c in cards]!=[f"COST-{i:03}" for i in range(1,11)]:
        raise ValueError("First ten official card IDs have changed")
    return cards

def produce(check: bool):
    cards=first_ten()
    items=[]
    thumbs_for_sheet=[]
    for no,c in enumerate(cards,1):
        item=c["main"]
        src=ROOT/item["assetPath"]
        if not src.is_file() or src.suffix!=".webp":raise FileNotFoundError(src)
        with Image.open(src) as image:
            source=ImageOps.exif_transpose(image).convert("RGB")
        w,h=source.size
        if w>SIZE[0] or h>SIZE[1]:
            raise ValueError(f"Would require changing original pixels or clipping: {c['characterId']} {source.size}")
        color=bg_gray(source)
        canvas=Image.new("RGB",SIZE,color)
        xy=((SIZE[0]-w)//2,(SIZE[1]-h)//2)
        canvas.paste(source,xy)
        # This equality is central: not one original pixel was altered.
        assert ImageChops.difference(canvas.crop((*xy,xy[0]+w,xy[1]+h)),source).getbbox() is None
        target=OUT/src.name
        thumb=THUMBS/src.name
        if not check:
            target.parent.mkdir(parents=True,exist_ok=True)
            thumb.parent.mkdir(parents=True,exist_ok=True)
            canvas.save(target,format="WEBP",lossless=True,method=6,exact=True)
            canvas.resize(SMALL,Image.Resampling.LANCZOS).save(thumb,format="WEBP",quality=87,method=6)
        if not target.is_file() or not thumb.is_file():
            raise FileNotFoundError("Edited WebP or thumbnail missing")
        with Image.open(target) as rendered:
            if rendered.size!=SIZE or rendered.format!="WEBP":raise ValueError("Incorrect target")
            rendered=rendered.convert("RGB")
            # A lossless output must be pixel-identical to the original in its rectangle
            if ImageChops.difference(rendered,canvas).getbbox() is not None:
                raise ValueError(f"Output changed original art or gray background: {target}")
        with Image.open(thumb) as t:
            if t.format!="WEBP" or t.size!=SMALL:raise ValueError("Wrong thumbnail dimensions")
        items.append({
            "ordinal":no,"characterId":c["characterId"],"name":c["title"],
            "artworkId":item["artworkId"],"source":item["assetPath"],
            "image":target.relative_to(ROOT).as_posix(),
            "thumbnail":thumb.relative_to(ROOT).as_posix(),
            "sourceSize":[w,h],"outputSize":list(SIZE),"thumbnailSize":list(SMALL),
            "originalPixelPosition":[xy[0],xy[1],w,h],
            "grayRGB":list(color),"sourceSha256":digest(src),
            "imageSha256":digest(target),"thumbnailSha256":digest(thumb),
            "originalPixelsUntouched":True
        })
        before=ImageOps.contain(source,(210,240))
        after=ImageOps.contain(canvas,(210,240))
        thumbs_for_sheet.append((c["title"],before,after))
    data={
        "schema":"tcg-deseur-gray-background-10-v1",
        "method":"Flat gray background extended around each unscaled original; no subject cropping or resizing; lossless pixel identity",
        "size":list(SIZE),"thumbnailSize":list(SMALL),
        "sourceEdition":"data/edition-staging-67.json",
        "onlyFirstTenMainImages":True,"originalsUnchanged":True,
        "items":items
    }
    if check:
        if json.loads(META.read_text(encoding="utf-8"))!=data:
            raise ValueError("Published metadata or source files have changed")
        with Image.open(CONTACT) as sheet:
            if sheet.size!=(900,2740):raise ValueError("Comparison contact sheet missing")
    else:
        META.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
        sheet=Image.new("RGB",(900,2740),(249,249,249))
        pen=ImageDraw.Draw(sheet)
        pen.text((10,10),"TCG DESEUR | 10 ORIGINALS -> GRAY BACKGROUND EXTENDED (1200 x 1600)",fill=(24,24,24))
        for index,(title,before,after) in enumerate(thumbs_for_sheet):
            row=42+index*269
            pen.text((20,row),str(index+1)+". "+title,fill=(10,10,10))
            pen.text((220,row),"AVANT",fill=(70,70,70))
            pen.text((600,row),"APRES (AUCUN RECADRAGE)",fill=(70,70,70))
            sheet.paste(before,(210+(210-before.width)//2,row+22+(240-before.height)//2))
            sheet.paste(after,(590+(210-after.width)//2,row+22+(240-after.height)//2))
        CONTACT.parent.mkdir(parents=True,exist_ok=True)
        sheet.save(CONTACT,"JPEG",quality=90,optimize=True)
    return data

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    a=produce(args.check)
    print("Verified" if args.check else "Generated",
          len(a["items"]),"lossless 1200x1600 official main images, original pixels intact")
