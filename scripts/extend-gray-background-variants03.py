#!/usr/bin/env python3
"""Produce approved alternative artworks 21-30 without touching source pixels."""
from pathlib import Path

base = Path(__file__).with_name("extend-gray-background-variants01.py")
source = base.read_text(encoding="utf-8")
substitutions = {
    "gray-extended-variants01": "gray-extended-variants03",
    "gray-thumbs-variants01": "gray-thumbs-variants03",
    "gray-background-variants01": "gray-background-variants03",
    "onlyFirstTenAlternativeImages": "onlyThirdTenAlternativeImages",
    "pairs[:10]": "pairs[20:30]",
    "enumerate(originals,1)": "enumerate(originals,21)",
    'str(index+1)+". "': 'str(index+21)+". "',
    "10 VARIANTES | FOND SEUL AGRANDI": "VARIANTES 21-30 | FOND SEUL AGRANDI",
}
for old,new in substitutions.items():
    if old not in source:
        raise ValueError("Original image processing script changed unexpectedly: " + old)
    source = source.replace(old,new)
first=source.index("EXPECTED = [")
last=source.index("\n\ndef digest(",first)
source=source[:first]+("EXPECTED = "+repr([
    "td_3_039","td_1_030","td_2_025","td_2_044","td_2_027",
    "td_3_029","td_3_009","td_3_041","td_1_043","td_3_025"
]))+source[last:]
exec(compile(source,str(base),"exec"),{
    "__file__":str(Path(__file__).resolve()),"__name__":"__main__"
})
