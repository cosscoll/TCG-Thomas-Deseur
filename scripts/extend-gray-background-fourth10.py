#!/usr/bin/env python3
"""Reuse the pixel-preserving method of the first ten on official cards 31-40.

Neither the source artworks nor the first ten corrected files are modified.
"""
from pathlib import Path

original_script = Path(__file__).with_name("extend-gray-background-first10.py")
source = original_script.read_text(encoding="utf-8")
changes = {
    "gray-extended-first10": "gray-extended-fourth10",
    "gray-thumbs-first10": "gray-thumbs-fourth10",
    "gray-background-first10.json": "gray-background-fourth10.json",
    "gray-background-first10-before-after.jpg": "gray-background-fourth10-before-after.jpg",
    "cards=catalog[\"cards\"][:10]": "cards=catalog[\"cards\"][30:40]",
    "range(1,11)": "range(31,41)",
    "enumerate(cards,1)": "enumerate(cards,31)",
    "onlyFirstTenMainImages": "onlyFourthTenMainImages",
    "tcg-deseur-gray-background-10-v1": "tcg-deseur-gray-background-fourth10-v1",
    "10 ORIGINALS": "CARDS 31-40",
    "str(index+1)+\". \"": "str(index+31)+\". \"",
    "First ten official card IDs have changed": "Fourth ten official card IDs have changed",
}
for before, after in changes.items():
    if before not in source:
        raise ValueError(f"Base image script has changed; missing token: {before}")
    source = source.replace(before, after)
# The original artwork of card 11 is wider than 1200px. Compute the smallest
# common 3:4 canvas that holds every source at 1:1 resolution, with no clipping.
canvas_calculation = """
def next_ten_canvas_size():
    catalog = json.loads(MANIFEST.read_text(encoding="utf-8"))
    originals = [
        Image.open(ROOT / card["main"]["assetPath"]).size
        for card in catalog["cards"][30:40]
    ]
    required_width = max(1200, *(max(w, (h*3+3)//4) for w,h in originals))
    width = ((required_width+2)//3)*3
    return (width, width*4//3)
SIZE = next_ten_canvas_size()
"""
if "SIZE = (1200, 1600)" not in source:
    raise ValueError("Base image canvas setting was changed unexpectedly")
source = source.replace("SIZE = (1200, 1600)", canvas_calculation)
source = source.replace("1200 x 1600", "portrait 3:4")
# Some later illustrations have no neutral gray corner at all. In that case,
# use the perimeter's median luminosity as a neutral gray; never retouch pixels.
source = source.replace(
    'raise ValueError("Cannot confidently identify a gray backdrop from the original corners")',
    'edge = [rgb.getpixel(p) for p in ((0,0), (w-1,0), (0,h-1), (w-1,h-1))]\n'
    '        tone = round(statistics.median(sum(pixel)/3 for pixel in edge))\n'
    '        return (tone, tone, tone)',
)

# Running with __name__='__main__' keeps --check and write behavior identical.
exec(compile(source, str(original_script), "exec"), {
    "__name__": "__main__",
    "__file__": str(Path(__file__).resolve()),
})
