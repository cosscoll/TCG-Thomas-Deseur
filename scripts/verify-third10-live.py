#!/usr/bin/env python3
"""Independently verify cards 21-30 from publicly deployed GitHub Pages assets."""
from urllib.request import Request, urlopen
from io import BytesIO
from PIL import Image, ImageChops
import json
import time

BASE = "https://cosscoll.github.io/TCG-Thomas-Deseur/"

def fetch(path):
    request = Request(BASE + path, headers={
        "User-Agent": "TCG-Deseur-Gray-BG-Third10/1.0",
        "Cache-Control": "no-cache",
    })
    with urlopen(request, timeout=30) as response:
        if response.status != 200:
            raise AssertionError(f"Unexpected HTTP {response.status} for {path}")
        return response.read()

def image(path):
    return Image.open(BytesIO(fetch(path))).convert("RGB")

def validate():
    info = json.loads(fetch("data/gray-background-third10.json"))
    assert info["schema"] == "tcg-deseur-gray-background-third10-v1"
    assert len(info["items"]) == 10
    expected = tuple(info["size"])
    assert expected[0] * 4 == expected[1] * 3, expected
    assert expected[0] >= 1200
    gallery = fetch("collection-validee/app.js").decode("utf-8")
    html = fetch("collection-validee/").decode("utf-8")
    assert "GRAY_THIRD10" in gallery and "gray-extended-third10" in gallery
    assert "gray-thumbs-third10" in gallery and "20261014-gray30" in html
    for i, card in enumerate(info["items"], start=21):
        assert card["characterId"] == f"COST-{i:03d}"
        orig, picture, thumb = map(image, (card["source"],card["image"],card["thumbnail"]))
        assert picture.size == expected and thumb.size == (384,512)
        x,y,w,h = card["originalPixelPosition"]
        assert orig.size == (w,h)
        assert ImageChops.difference(orig,picture.crop((x,y,x+w,y+h))).getbbox() is None, card["characterId"]
        assert card["artworkId"] in gallery, card["artworkId"]
        print("PASS",card["characterId"],card["artworkId"],orig.size,"->",picture.size,flush=True)
    assert len(fetch("audit-visuels/assets/gray-background-third10-before-after.jpg")) > 10000
    print("PASS: cards 21-30 online, correctly linked, originals pixel-identical",flush=True)

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
