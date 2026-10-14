#!/usr/bin/env python3
"""Produce approved alternative artworks 31-38 without touching source pixels."""
from pathlib import Path

base = Path(__file__).with_name("extend-gray-background-variants01.py")
source = base.read_text(encoding="utf-8")
substitutions = {
    "gray-extended-variants01": "gray-extended-variants04",
    "gray-thumbs-variants01": "gray-thumbs-variants04",
    "gray-background-variants01": "gray-background-variants04",
    "onlyFirstTenAlternativeImages": "onlyFinalEightAlternativeImages",
    "pairs[:10]": "pairs[30:38]",
    "enumerate(originals,1)": "enumerate(originals,31)",
    'str(index+1)+". "': 'str(index+31)+". "',
    "10 VARIANTES | FOND SEUL AGRANDI": "VARIANTES 31-38 | FOND SEUL AGRANDI",
}
for old,new in substitutions.items():
    if old not in source:
        raise ValueError("Original image processing script changed unexpectedly: " + old)
    source = source.replace(old,new)
first=source.index("EXPECTED = [")
last=source.index("\n\ndef digest(",first)
source=source[:first]+("EXPECTED = "+repr([
    "td_3_014","td_2_065","td_2_058","td_2_057",
    "td_2_052","td_2_050","td_2_056","td_2_053"
]))+source[last:]
source=source.replace("(900,2740)","(900,2202)")
exec(compile(source,str(base),"exec"),{
    "__file__":str(Path(__file__).resolve()),"__name__":"__main__"
})
