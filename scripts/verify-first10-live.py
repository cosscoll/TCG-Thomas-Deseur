#!/usr/bin/env python3
"""After GitHub Pages publication, independently verify the public ten corrected cards.
Read-only: HTTP GET, compare decoded original subject pixel-for-pixel.
"""
from urllib.request import urlopen,Request
from pathlib import Path
from PIL import Image,ImageChops
from io import BytesIO
import json,time
BASE="https://cosscoll.github.io/TCG-Thomas-Deseur/"
def fetch(path):
    request=Request(BASE+path,headers={"User-Agent":"TCG-Deseur-Gray-BG-Audit/1.0","Cache-Control":"no-cache"})
    with urlopen(request,timeout=30) as response:
        if response.status!=200:raise AssertionError(f"HTTP {response.status} {path}")
        return response.read()
def read(p):
    return Image.open(BytesIO(fetch(p))).convert("RGB")
def validate():
    meta=json.loads(fetch("data/gray-background-first10.json"))
    if meta["schema"]!="tcg-deseur-gray-background-10-v1" or len(meta["items"])!=10:
        raise AssertionError("The gray-background manifest is not published")
    js=fetch("collection-validee/app.js").decode("utf-8")
    html=fetch("collection-validee/").decode("utf-8")
    if "GRAY_FIRST10" not in js or "gray-extended-first10" not in js or "20261014-gray10" not in html:
        raise AssertionError("Public gallery has not deployed the 10 corrected cards yet")
    for i in meta["items"]:
        source=read(i["source"])
        corrected=read(i["image"])
        thumbnail=read(i["thumbnail"])
        if corrected.size!=(1200,1600) or thumbnail.size!=(384,512):raise AssertionError(i["artworkId"]+" has wrong size")
        x,y,w,h=i["originalPixelPosition"]
        if source.size!=(w,h):raise AssertionError("Source size discrepancy "+i["artworkId"])
        if ImageChops.difference(corrected.crop((x,y,x+w,y+h)),source).getbbox():
            raise AssertionError("Original subject altered on the public site "+i["artworkId"])
        print("OK",i["characterId"],i["name"],source.size,"in",corrected.size)
    sheet=fetch("audit-visuels/assets/gray-background-first10-before-after.jpg")
    if len(sheet)<10000:raise AssertionError("Public comparison sheet unavailable")
    print("PASS : 10 live artworks pixel-identical to original + 10 miniatures + new gallery bundle + sheet")
if __name__=="__main__":
    for attempt in range(1,9):
        try:validate();break
        except Exception as e:
            if attempt==8:raise
            print(f"Waiting for Pages propagation ({attempt}/8): {e}",flush=True)
            time.sleep(12)
