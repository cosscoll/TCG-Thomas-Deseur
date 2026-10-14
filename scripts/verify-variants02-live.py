#!/usr/bin/env python3
"""Independently verify next 10 alternative images from publicly deployed GitHub Pages assets."""
from urllib.request import Request, urlopen
from io import BytesIO
from PIL import Image, ImageChops
import json
import time

BASE = "https://cosscoll.github.io/TCG-Thomas-Deseur/"

def fetch(path):
    request = Request(BASE + path, headers={
        "User-Agent": "TCG-Deseur-Gray-BG-Variants02/1.0",
        "Cache-Control": "no-cache",
    })
    with urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise AssertionError(f"Unexpected HTTP {response.status} for {path}")
        return response.read()

def image(path):
    return Image.open(BytesIO(fetch(path))).convert("RGB")

def validate():
    info = json.loads(fetch("data/gray-background-variants02.json"))
    assert info["schema"] == "tcg-deseur-gray-background-variants02-v1"
    assert len(info["items"]) == 10
    expected = tuple(info["size"])
    assert expected[0] * 4 == expected[1] * 3, expected
    assert expected[0] >= 1200
    gallery = fetch("collection-validee/app.js").decode("utf-8")
    html = fetch("collection-validee/").decode("utf-8")
    assert "GRAY_VARIANTS02" in gallery and "gray-extended-variants02" in gallery
    assert "gray-thumbs-variants02" in gallery and "20261014-gray67-v20" in html
    for i, card in zip([12,15,21,22,23,24,25,27,28,29], info["items"]):
        assert card["characterId"] == f"COST-{i:03d}"
        orig, picture, thumb = map(image, (card["source"],card["image"],card["thumbnail"]))
        assert picture.size == expected and thumb.size == (384,512)
        x,y,w,h = card["originalPixelPosition"]
        assert orig.size == (w,h)
        assert ImageChops.difference(orig,picture.crop((x,y,x+w,y+h))).getbbox() is None, card["characterId"]
        assert card["artworkId"] in gallery, card["artworkId"]
        print("PASS",card["characterId"],card["artworkId"],orig.size,"->",picture.size,flush=True)
    assert len(fetch("audit-visuels/assets/gray-background-variants02-before-after.jpg")) > 10000
    print("PASS: next 10 alternative images online, correctly linked, originals pixel-identical",flush=True)

if __name__ == "__main__":
    for attempt in range(1,9):
        try:
            validate()
            break
        except Exception as error:
            if attempt == 8:
                raise
            print(f"Site publication propagation {attempt}/8: {error}", flush=True)
            time.sleep(12)
