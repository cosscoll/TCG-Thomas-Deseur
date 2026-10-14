#!/usr/bin/env python3
"""Reuse the pixel-preserving method of the first ten on official cards 11-20.

Neither the source artworks nor the first ten corrected files are modified.
"""
from pathlib import Path

original_script = Path(__file__).with_name("extend-gray-background-first10.py")
source = original_script.read_text(encoding="utf-8")
changes = {
    "gray-extended-first10": "gray-extended-next10",
    "gray-thumbs-first10": "gray-thumbs-next10",
    "gray-background-first10.json": "gray-background-next10.json",
    "gray-background-first10-before-after.jpg": "gray-background-next10-before-after.jpg",
    "cards=catalog[\"cards\"][:10]": "cards=catalog[\"cards\"][10:20]",
    "range(1,11)": "range(11,21)",
    "enumerate(cards,1)": "enumerate(cards,11)",
    "onlyFirstTenMainImages": "onlyNextTenMainImages",
    "tcg-deseur-gray-background-10-v1": "tcg-deseur-gray-background-next10-v1",
    "10 ORIGINALS": "CARDS 11-20",
    "str(index+1)+\". \"": "str(index+11)+\". \"",
    "First ten official card IDs have changed": "Next ten official card IDs have changed",
}
for before, after in changes.items():
    if before not in source:
        raise ValueError(f"Base image script has changed; missing token: {before}")
    source = source.replace(before, after)
# Running with __name__='__main__' keeps --check and write behavior identical.
exec(compile(source, str(original_script), "exec"), {
    "__name__": "__main__",
    "__file__": str(Path(__file__).resolve()),
})
