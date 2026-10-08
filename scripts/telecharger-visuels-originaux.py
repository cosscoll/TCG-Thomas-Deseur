#!/usr/bin/env python3
"""Create an archive from real images listed in research/visual-references.json."""
from pathlib import Path
from urllib import request, parse, error
from concurrent.futures import ThreadPoolExecutor
from zipfile import ZipFile, ZIP_DEFLATED
from io import StringIO
import csv
import json
import time

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "research/visual-references.json"
OUT = ROOT / "dist/177-visuels-originaux-thomas-deseur.zip"
LILLE_URL = "https://woody.cloudly.space/app/uploads/lille-attractivite/2026/07/thumbs/26881/ratio_free_medium/affiche-braderie-de-lille-2026-640x413.webp"
LILLE_PAGE = "https://www.lille.fr/Braderie-de-Lille/Actualites/Braderie-achetez-l-affiche-officielle"
ALLOWED = {"tiermaker.com", "www.tiermaker.com", "woody.cloudly.space"}

def detect_extension(data):
    if data.startswith(b"\x89PNG\r\n\x1a\n"): return ".png"
    if data.startswith(b"\xff\xd8\xff"): return ".jpg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP": return ".webp"
    if data[:6] in (b"GIF87a", b"GIF89a"): return ".gif"
    if data[4:12] in (b"ftypavif", b"ftypavis"): return ".avif"
    return None

def obtain(record):
    url=record["url"]
    u=parse.urlsplit(url)
    if u.scheme!="https" or (u.hostname or "").lower() not in ALLOWED:
        return record,None,"unapproved URL"
    last_error=""
    for attempt in range(4):
        try:
            req=request.Request(url,headers={
                "User-Agent":"Mozilla/5.0 (compatible; TCG-VisualArchive/1.0)",
                "Accept":"image/webp,image/png,image/jpeg,image/*;q=0.8",
                "Referer":record["page"],
            })
            with request.urlopen(req,timeout=28) as result:
                redirected=parse.urlsplit(result.url)
                if redirected.scheme!="https" or redirected.hostname not in ALLOWED:
                    raise ValueError("Unapproved redirect")
                data=result.read(20000001)
            if len(data)>20000000: raise ValueError("Image larger than 20 MB")
            ext=detect_extension(data)
            if ext is None: raise ValueError("URL did not return an image")
            return record,(data,ext),""
        except (error.URLError, TimeoutError, OSError, ValueError) as exc:
            last_error=type(exc).__name__+": "+str(exc)[:240]
            time.sleep(1+attempt*2)
    return record,None,last_error

def main():
    data=json.loads(INDEX.read_text(encoding="utf-8"))
    records=[{
        "id":im["id"],"collection":im["collection"],
        "url":im["imageUrl"],"page":im["sourcePage"]
    } for im in data["images"]]
    records.append({"id":"REF-177-LILLE","collection":"Braderie-de-Lille-2026",
                    "url":LILLE_URL,"page":LILLE_PAGE})
    assert len(records)==177 and len({r["id"] for r in records})==177

    with ThreadPoolExecutor(max_workers=6) as pool:
        results=list(pool.map(obtain,records))
    OUT.parent.mkdir(parents=True,exist_ok=True)
    rows=[]
    ok=0
    with ZipFile(OUT,"w",ZIP_DEFLATED,compresslevel=3) as z:
        for record,image,problem in results:
            path=""
            if image is not None:
                content,ext=image
                path="images/"+record["collection"]+"/"+record["id"]+ext
                z.writestr(path,content)
                ok+=1
            rows.append({"id":record["id"],"file":path,
                         "status":"OK" if image is not None else "ECHEC",
                         "url":record["url"],"page_source":record["page"],
                         "erreur":problem})
        buf=StringIO()
        writer=csv.DictWriter(buf,fieldnames=["id","file","status","url","page_source","erreur"])
        writer.writeheader()
        writer.writerows(rows)
        z.writestr("MANIFESTE.csv",buf.getvalue().encode("utf-8-sig"))
        z.writestr("LISEZ-MOI.txt",(
            "Images de reference originales du TCG Thomas Deseur.\n"
            "Ces images proviennent de TierMaker et d'une campagne de Lille.\n"
            "Aucun portrait cree par IA, aucune retouche.\n"
            "Consultez MANIFESTE.csv pour les sources et les fichiers non accessibles.\n"
            "L'utilisation dans un jeu public necessite de verifier les droits.\n"
            "Images telechargees : "+str(ok)+" / 177.\n"
        ).encode("utf-8"))
    summary={"total":len(records),"downloaded":ok,"failed":len(records)-ok,
             "archive":OUT.name,"bytes":OUT.stat().st_size}
    (OUT.parent/"resultat-telechargement.json").write_text(
        json.dumps(summary,ensure_ascii=False,indent=2),encoding="utf-8")
    print("ARCHIVE_RESULT="+json.dumps(summary,ensure_ascii=False),flush=True)
    if not ok:
        raise SystemExit("Aucune image telechargee.")

if __name__=="__main__":main()
