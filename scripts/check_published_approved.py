#!/usr/bin/env python3
"""Check that only approved TCG content is publicly served by GitHub Pages.
Never exercise logged-in APIs or emit private credentials.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import time
import urllib.error
import urllib.request

BASE = "https://cosscoll.github.io/TCG-Thomas-Deseur/"
TRIES = int(os.environ.get("TCG_PUBLIC_CHECK_TRIES", "16"))
DELAY = float(os.environ.get("TCG_PUBLIC_CHECK_DELAY", "10"))
AGENT = "TCG-Deseur-Public-Surface-Check/2.0"

PUBLIC_IMAGES = ["td-1-004.webp","td-2-043.webp","td-1-001.webp","td-3-005.webp","td-1-002.webp","td-2-042.webp","td-3-042.webp","td-1-003.webp","td-1-005.webp","td-2-003.webp","td-1-007.webp","td-3-011.webp","td-1-008.webp","td-2-005.webp","td-1-006.webp","td-3-023.webp","td-1-012.webp","td-3-024.webp","td-1-011.webp","td-2-001.webp","td-2-007.webp","td-1-010.webp","td-3-010.webp","td-2-008.webp","td-3-001.webp","td-1-014.webp","td-3-033.webp","td-3-031.webp","td-3-043.webp","td-1-020.webp","td-1-019.webp","td-1-018.webp","td-1-021.webp","td-3-016.webp","td-1-023.webp","td-3-015.webp","td-1-022.webp","td-3-022.webp","td-1-024.webp","td-3-037.webp","td-1-026.webp","td-3-032.webp","td-1-028.webp","td-1-025.webp","td-2-024.webp","td-1-027.webp","td-3-035.webp","td-2-019.webp","td-3-040.webp","td-2-023.webp","td-3-039.webp","td-3-036.webp","td-1-030.webp","td-1-032.webp","td-2-025.webp","td-2-031.webp","td-1-035.webp","td-2-044.webp","td-3-038.webp","td-1-036.webp","td-2-027.webp","td-2-030.webp","td-3-029.webp","td-1-040.webp","td-2-035.webp","td-3-009.webp","td-2-034.webp","td-3-041.webp","td-3-028.webp","td-3-002.webp","td-1-043.webp","td-2-039.webp","td-2-037.webp","td-3-025.webp","td-3-003.webp","td-2-045.webp","td-2-048.webp","td-3-014.webp","td-1-049.webp","td-1-045.webp","td-1-051.webp","td-1-055.webp","td-1-052.webp","td-1-054.webp","td-2-065.webp","td-2-066.webp","td-1-059.webp","td-2-058.webp","td-1-058.webp","td-2-057.webp","td-1-056.webp","td-1-057.webp","td-1-062.webp","td-1-060.webp","td-2-052.webp","td-1-063.webp","td-2-050.webp","td-1-065.webp","td-2-056.webp","td-1-066.webp","td-1-064.webp","td-2-053.webp","td-2-059.webp","td-2-049.webp","td-lille.webp"]

BLOCKED = [
    "floot-app/endpoints/gift_create_POST.ts",
    "floot-app/helpers/db.tsx",
    "supabase/VERIFIER_INSTALLATION.sql",
    "security/tcg-gift-attempt-windows.sql",
    "scripts/check_published_approved.py",
    "tests/tri-177-editor.test.mjs",
    "tri-177/index.html",
    "tri-177/images_nommes/REF-1-001.webp",
    "collection-161/index.html",
    "data/choix-cartes-2026-10-11.json",
    "data/photo-origins-177.js",
    "collection-validee/app.js",
    "collection-validee/assets/uniform/",
    "README.md",
]

def get(path, method="GET"):
    req = urllib.request.Request(BASE + path, method=method, headers={"User-Agent": AGENT, "Cache-Control": "no-cache"})
    try:
        with urllib.request.urlopen(req, timeout=13) as response:
            return response.status, response.headers.get("Content-Type", ""), response.read() if method == "GET" else b""
    except urllib.error.HTTPError as error:
        return error.code, error.headers.get("Content-Type", ""), b""

def verify_once():
    for public in ("", "legal/", "collection-validee/"):
        status, _, body = get(public)
        assert status == 200, f"Public page {public}: {status}"
        assert b"TCG" in body, f"Public page {public}: content missing"
    _, _, gallery = get("collection-validee/")
    assert gallery.count(b'<article class="tile">') == 105, "Expected 105 public illustrations"
    assert b"floot-app" not in gallery and b"photo-origins" not in gallery, "Unexpected private code references"
    with ThreadPoolExecutor(max_workers=12) as pool:
        requests = {pool.submit(get, f"collection-validee/assets/detourees/{name}", "HEAD"): name for name in PUBLIC_IMAGES}
        failures = []
        for future in as_completed(requests):
            code, media, _ = future.result()
            if code != 200 or not media.lower().startswith("image/webp"):
                failures.append((requests[future], code, media))
    assert not failures, f"{len(failures)} artworks unavailable; samples: {failures[:5]}"
    for private in BLOCKED:
        status, _, _ = get(private)
        assert status == 404, f"BLOCKED file exposed publicly: {private}: HTTP {status}"
    return f"PUBLIC PASS: 3 site pages, 105 artworks; {len(BLOCKED)} internal paths blocked"

if __name__ == "__main__":
    for i in range(1, TRIES + 1):
        try:
            print(f"[{i}/{TRIES}] {verify_once()}", flush=True)
            break
        except (AssertionError, OSError, TimeoutError, urllib.error.URLError) as error:
            print(f"[{i}/{TRIES}] WAIT: {error}", flush=True)
            if i == TRIES: raise SystemExit(1)
            time.sleep(DELAY)
