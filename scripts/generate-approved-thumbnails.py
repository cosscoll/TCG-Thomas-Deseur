#!/usr/bin/env python3
"""Generate mobile-sized WebP thumbnails from 105 approved 3:4 artworks.
Non-destructive: never edits source files, mystery art or Floot.
"""
from pathlib import Path
import json,hashlib,argparse
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
META=ROOT/"data/approved-artwork-uniform-105.json"
DEST=ROOT/"collection-validee/assets/thumbs"
OUTPUT=ROOT/"data/thumbs-approved-105.json"
SIZE=(384,512)
def hash_file(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()
def run(check=False):
    source=json.loads(META.read_text(encoding="utf-8"))
    assert source["schema"]=="tcg-deseur-uniform-approved-artworks-v1"
    assert len(source["artworks"])==105 and source["size"]==[768,1024]
    old=json.loads(OUTPUT.read_text(encoding="utf-8")) if check else {}
    results=[]
    for art in source["artworks"]:
        original=ROOT/art["normalized"]
        target=DEST/Path(art["normalized"]).name
        if not original.is_file():raise FileNotFoundError(original)
        with Image.open(original) as im:
            assert im.format=="WEBP" and im.size==(768,1024)
            thumb=im.convert("RGB").resize(SIZE,Image.Resampling.LANCZOS)
        if not check:
            target.parent.mkdir(parents=True,exist_ok=True)
            thumb.save(target,format="WEBP",quality=80,method=6)
        with Image.open(target) as im:
            im.load()
            if im.format!="WEBP" or im.size!=SIZE:raise ValueError("Unexpected thumb "+str(target))
        results.append({"artworkId":art["artworkId"],"base":art["normalized"],
                        "thumb":target.relative_to(ROOT).as_posix(),"width":384,"height":512,
                        "baseSha256":hash_file(original),"thumbSha256":hash_file(target)})
    data={"schema":"tcg-deseur-approved-thumbs-v1","size":[384,512],
          "source":"data/approved-artwork-uniform-105.json","images":results}
    if check:
        if data!=old:raise ValueError("Thumbnail manifest differs from on-disk content")
    else:
        OUTPUT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("Verified" if check else "Rendered",len(results),"public WebP thumbnails at 384x512")
if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--check",action="store_true")
    args=parser.parse_args()
    run(check=args.check)
