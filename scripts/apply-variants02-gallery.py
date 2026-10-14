#!/usr/bin/env python3
"""Use the next ten approved alternative artwork thumbnails in the public gallery."""
from pathlib import Path
js_path=Path("collection-validee/app.js")
html_path=Path("collection-validee/index.html")
js=js_path.read_text(encoding="utf-8")
edits=[
 ("The first 10 of 38 alternative illustrations now also use pixel-preserved gray canvases; 28 remain untouched.",
  "The first 20 of 38 alternative illustrations use pixel-preserved gray canvases; 18 remain untouched."),
 ("const GRAY_VARIANTS01=new Set(['td_2_043','td_3_005','td_2_042','td_3_042','td_2_003','td_3_011','td_2_005','td_3_023','td_3_024','td_2_001']);",
  "const GRAY_VARIANTS01=new Set(['td_2_043','td_3_005','td_2_042','td_3_042','td_2_003','td_3_011','td_2_005','td_3_023','td_3_024','td_2_001']);\nconst GRAY_VARIANTS02=new Set(['td_3_010','td_3_033','td_3_016','td_3_015','td_3_022','td_3_037','td_3_032','td_2_024','td_3_035','td_3_040']);"),
 ("GRAY_VARIANTS01.has(id)?'gray-extended-variants01':'uniform';",
  "GRAY_VARIANTS01.has(id)?'gray-extended-variants01':GRAY_VARIANTS02.has(id)?'gray-extended-variants02':'uniform';"),
 ("||GRAY_VARIANTS01.has(id);","||GRAY_VARIANTS01.has(id)||GRAY_VARIANTS02.has(id);"),
 ("        :GRAY_VARIANTS01.has(id)\n         ?src.replace('/assets/gray-extended-variants01/','/assets/gray-thumbs-variants01/')\n         :src.replace('/assets/uniform/','/assets/thumbs/');",
  "        :GRAY_VARIANTS01.has(id)\n         ?src.replace('/assets/gray-extended-variants01/','/assets/gray-thumbs-variants01/')\n         :GRAY_VARIANTS02.has(id)\n          ?src.replace('/assets/gray-extended-variants02/','/assets/gray-thumbs-variants02/')\n          :src.replace('/assets/uniform/','/assets/thumbs/');"),
 ("const srcSet=thumb+' 384w, '+src+' '+(GRAY_VARIANTS01.has(id)?'1317':",
  "const srcSet=thumb+' 384w, '+src+' '+(GRAY_VARIANTS02.has(id)?'1353':GRAY_VARIANTS01.has(id)?'1317':")
]
for old,new in edits:
    if js.count(old)!=1:
        raise ValueError("Gallery change cannot be applied safely: "+old[:80])
    js=js.replace(old,new)
html=html_path.read_text(encoding="utf-8")
if html.count("20261014-gray67-v10")!=2:
    raise ValueError("Unexpected gallery HTML version tag")
html=html.replace("20261014-gray67-v10","20261014-gray67-v20")
js_path.write_text(js,encoding="utf-8")
html_path.write_text(html,encoding="utf-8")
print("Updated gallery for first 20 alternative artworks and refreshed browser cache")
