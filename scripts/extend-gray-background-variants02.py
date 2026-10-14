#!/usr/bin/env python3
"""Process official alternative artworks 11-20, leaving all source pixels intact.

Uses the exact lossless canvas and thumbnail procedure from variants01.
"""
from pathlib import Path
BASE = Path(__file__).with_name("extend-gray-background-variants01.py")
source = BASE.read_text(encoding="utf-8")
replacements = {
    "gray-extended-variants01": "gray-extended-variants02",
    "gray-thumbs-variants01": "gray-thumbs-variants02",
    "gray-background-variants01": "gray-background-variants02",
    "tcg-deseur-gray-background-variants01-v1": "tcg-deseur-gray-background-variants02-v1",
    "onlyFirstTenAlternativeImages": "onlySecondTenAlternativeImages",
    'pairs[:10]': 'pairs[10:20]',
    'enumerate(originals,1)': 'enumerate(originals,11)',
    'str(index+1)+". "': 'str(index+11)+". "',
    '10 VARIANTES | FOND SEUL AGRANDI': 'VARIANTES 11-20 | FOND SEUL AGRANDI',
}
expected_before = 'EXPECTED = ["td_2_043","td_3_005","td_2_042","td_3_042","td_2_003",\\n            "td_3_011","td_2_005","td_3_023","td_3_024","td_2_001"]'
expected_after = 'EXPECTED = ["td_3_010","td_3_033","td_3_016","td_3_015","td_3_022",\\n            "td_3_037","td_3_032","td_2_024","td_3_035","td_3_040"]'
replacements[expected_before] = expected_after
for before,after in replacements.items():
    if before not in source:
        raise ValueError("Base processor changed, missing: "+before)
    source = source.replace(before,after)
exec(compile(source,str(BASE),"exec"),{
    "__file__":str(Path(__file__).resolve()), "__name__":"__main__"
})
