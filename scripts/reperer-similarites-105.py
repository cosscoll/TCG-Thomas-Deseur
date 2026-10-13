#!/usr/bin/env python3
"""Candidate-only visual duplicates among 105 approved public artwork originals.
Never modifies names, rarities, images, users, or private assets.
"""
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
import json,argparse
ROOT=Path(__file__).resolve().parents[1]
META=ROOT/"data/approved-artwork-uniform-105.json"
RESULT=ROOT/"data/similarites-visuelles-105.json"
REPORT=ROOT/"docs/REVUE_SIMILARITES_105_2026-10-13.md"
SHEET=ROOT/"audit-visuels/assets/similarites-candidates.jpg"

def fingerprint(im,center=False):
    im=ImageOps.exif_transpose(im).convert("L")
    if center:
        w,h=im.size
        im=im.crop((int(w*.16),int(h*.12),int(w*.84),int(h*.88)))
    pixels=list(im.resize((9,8),Image.Resampling.LANCZOS).getdata())
    n=0
    for y in range(8):
        for x in range(8):
            n=(n<<1)|int(pixels[y*9+x]>pixels[y*9+x+1])
    return n

def analyze():
    meta=json.loads(META.read_text(encoding="utf8"))
    arts=meta["artworks"]
    if meta["schema"]!="tcg-deseur-uniform-approved-artworks-v1" or len(arts)!=105:
        raise ValueError("Only the 105 approved public artworks may be analyzed")
    hs=[]
    for art in arts:
        file=ROOT/art["source"]
        if not file.is_file(): raise FileNotFoundError(file)
        with Image.open(file) as im:hs.append((fingerprint(im),fingerprint(im,True)))
    cand=[]
    for i in range(len(arts)):
        for j in range(i+1,len(arts)):
            full=(hs[i][0]^hs[j][0]).bit_count()
            middle=(hs[i][1]^hs[j][1]).bit_count()
            if full<=10 or middle<=9:
                a,b=arts[i],arts[j]
                cand.append({"a":a["artworkId"],"b":b["artworkId"],
                             "characterA":a["characterId"],"characterB":b["characterId"],
                             "sourceA":a["source"],"sourceB":b["source"],
                             "distanceFull":full,"distanceCenter":middle,
                             "sameCharacter":a["characterId"]==b["characterId"],
                             "review":"candidate-needs-human-confirmation"})
    cand.sort(key=lambda x:(min(x["distanceFull"],x["distanceCenter"]),
                            x["distanceFull"]+x["distanceCenter"],x["a"],x["b"]))
    return {"schema":"tcg-deseur-similarities-candidates-v1","approvedPublicImages":105,
            "comparedPairs":5460,"algorithm":"grayscale dHash 9x8 (whole/central 68x76%)",
            "warning":"No similarity is proof of same costume, scene or situation",
            "candidatePairs":cand}
def report(data):
    pairs=data["candidatePairs"]
    lines=[
    "# TCG Deseur — repérage des ressemblances visuelles parmi 105 illustrations",
    "",
    "**Ces éléments sont des paires candidates, pas des doublons confirmés.**",
    "",
    "Analyse des 5 460 paires possibles parmi les 105 visuels publics approuvés. Les empreintes dHash comparent la disposition générale des nuances de gris dans l'image complète et son centre. Aucune photo originale, carte ou rareté n'est modifiée.",
    "",
    "Paires candidates : "+str(len(pairs))+" ; entre personnages différents : "+str(sum(not p["sameCharacter"] for p in pairs))+" ; entre versions d'un même personnage : "+str(sum(p["sameCharacter"] for p in pairs))+".",
    "",
    "Planche comparative des 30 premières paires : [consulter les images](../audit-visuels/assets/similarites-candidates.jpg).",
    "",
    "| Illustration A | Illustration B | Distance totale | Distance centrale | Même groupe officiel | Résultat |",
    "| --- | --- | ---: | ---: | --- | --- |"
    ]
    for p in pairs[:160]:
        lines.append("| "+p["a"]+" | "+p["b"]+" | "+str(p["distanceFull"])+" | "+str(p["distanceCenter"])+" | "+("Oui" if p["sameCharacter"] else "Non")+" | Revue nécessaire |")
    lines.extend(["","## Interprétation et limites","",
       "Une image recadrée différemment peut être un vrai doublon non détecté. Deux scènes ou personnages distincts avec des formes similaires peuvent être signalés à tort. Il faut vérifier la même tenue, le même costume ou la même situation à l'oeil avant toute fusion.",
       "",
       "Ne jamais supprimer une carte sur la seule base de ces scores ; documenter les arbitrages dans l'atelier de revue et faire valider les décisions.",
       "",
       "Commande reproductible : python scripts/reperer-similarites-105.py (Pillow requis).",
       ""])
    return "\n".join(lines)
def contact_sheet(data):
    items=data["candidatePairs"][:30]
    sheet=Image.new("RGB",(840,max(90,len(items)*194)),(248,248,248))
    drawer=ImageDraw.Draw(sheet)
    if not items:drawer.text((12,20),"Aucune paire candidate dHash",fill=(0,0,0))
    for row,p in enumerate(items):
        label=str(row+1)+". "+p["a"]+" / "+p["b"]+" ; distance "+str(p["distanceFull"])+"/"+str(p["distanceCenter"])
        drawer.text((12,row*194+3),label,fill=(0,0,0))
        for k,source in enumerate([p["sourceA"],p["sourceB"]]):
            with Image.open(ROOT/source) as im:
                thumb=ImageOps.contain(im.convert("RGB"),(405,165),Image.Resampling.LANCZOS)
            sheet.paste(thumb,(10+k*420+(405-thumb.width)//2,row*194+22))
    SHEET.parent.mkdir(parents=True,exist_ok=True)
    sheet.save(SHEET,format="JPEG",quality=82,optimize=True)
if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--check",action="store_true")
    args=parser.parse_args();data=analyze()
    if args.check:
        if json.loads(RESULT.read_text(encoding="utf8"))!=data or REPORT.read_text(encoding="utf8")!=report(data):
            raise ValueError("Report and results differ from original artworks")
        with Image.open(SHEET) as im:
            if im.format!="JPEG" or im.width!=840:raise ValueError("Invalid visual contact sheet")
    else:
        RESULT.write_text(json.dumps(data,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
        REPORT.write_text(report(data),encoding="utf8")
        contact_sheet(data)
    print(str(len(data["candidatePairs"]))+" candidate pairs among 5460 checked; originals unchanged")
