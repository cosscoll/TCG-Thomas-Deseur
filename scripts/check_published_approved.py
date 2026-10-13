#!/usr/bin/env python3
"""Vérifie uniquement le contenu PUBLIC de GitHub Pages.
Pas de compte, cookie, token, API booster ou base de données.
"""
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import os
import sys
import time
import urllib.error
import urllib.request

BASE = "https://cosscoll.github.io/TCG-Thomas-Deseur/"
TRIES = int(os.environ.get("TCG_PUBLIC_CHECK_TRIES", "24"))
DELAY = float(os.environ.get("TCG_PUBLIC_CHECK_DELAY", "15"))


def fetch(path):
    url = BASE + path
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "TCG-Deseur-Public-Integrity-Check/1.0", "Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status != 200:
            raise AssertionError(f"{path}: HTTP {response.status}")
        return response.read()


def check_image_head(path):
    req = urllib.request.Request(
        BASE + path,
        method="HEAD",
        headers={"User-Agent": "TCG-Deseur-Images/1.0", "Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status != 200:
            raise AssertionError(f"{path}: image HTTP {response.status}")
        media_type = response.headers.get("Content-Type", "").split(";")[0].lower().strip()
        if media_type != "image/webp":
            raise AssertionError(f"{path}: Type inattendu {media_type}")
        length = int(response.headers.get("Content-Length", "0"))
        if length < 1000:
            raise AssertionError(f"{path}: image vide ou incomplète ({length} octets)")
        return path


def check_all_published_artworks(cards):
    assets = [image["asset"] for card in cards
              for image in [card["main"], *card["variants"]]]
    assert len(assets) == len(set(assets)) == 105, "105 images distinctes attendues."
    failures = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        pending = {pool.submit(check_image_head, asset): asset for asset in assets}
        for future in as_completed(pending):
            try:
                future.result()
            except (AssertionError, ValueError, urllib.error.URLError, TimeoutError, OSError) as exc:
                failures.append(str(exc))
    if failures:
        raise AssertionError(
            f"{len(failures)} illustration(s) indisponibles : " +
            " | ".join(failures[:12])
        )
    return len(assets)


def verify_once():
    home = fetch("").decode("utf-8")
    assert "collection-validee/" in home, "L'accueil n'annonce pas le nouveau catalogue."

    html = fetch("collection-validee/").decode("utf-8")
    assert 'id="cards"' in html and './app.js' in html, "La galerie approuvée est absente."

    js = fetch("collection-validee/app.js").decode("utf-8")
    assert 'choix-cartes-2026-10-11.json' in js, "Le code public n'utilise pas les choix approuvés."

    raw = json.loads(fetch("data/catalogue-valide-67.json"))
    assert raw["schema"] == "tcg-deseur-approved-catalogue-v1"
    assert raw["summary"] == {
        "cards": 67, "existingVariants": 38, "excludedGroups": 3, "usedArtworks": 105
    }, "Le manifeste public n'est pas à jour."
    assert len(raw["cards"]) == 67
    picasso = next(card for card in raw["cards"] if card["id"] == "COST-003")
    assert picasso["name"] == "Picasso Deseur"
    assert picasso["main"]["artworkId"] == "td_1_002"
    assert [art["artworkId"] for art in picasso["variants"]] == ["td_2_042", "td_3_042"]
    assert "68 cartes" in home, "L'accueil ne montre pas les 68 cartes."
    assert "68 cartes" in html, "La galerie ne montre pas les 68 cartes."
    assert "Carte mystère" in html, "La carte mystère n'est pas présentée."
    assert "mysteryCardView" in js, "Le rendu de la Carte mystère est absent."
    all_live_images = check_all_published_artworks(raw["cards"])

    # Invitation aux testeurs : la page doit pointer vers le VRAI jeu
    # et ne doit pas proposer un formulaire recueillant des identifiants.
    invitation = fetch("beta/").decode("utf-8")
    assert "Test entre amis" in invitation
    assert "https://budget-illimite-tcg.floot.app/login" in invitation
    assert "https://budget-illimite-tcg.floot.app/" in invitation
    assert '<meta name="robots" content="noindex,nofollow">' in invitation
    assert 'name="password"' not in invitation and 'type="email"' not in invitation
    assert 'id="feedback-form"' in invitation
    js = fetch("beta/app.js").decode("utf-8")
    assert "FormData(form)" in js and "navigator.clipboard" in js
    assert "fetch(" not in js and "XMLHttpRequest" not in js
    css = fetch("beta/style.css")
    assert len(css) > 1000

    original = fetch("collection-161/assets/cards/td-1-002.webp")
    assert original[:4] == b"RIFF" and original[8:12] == b"WEBP", "Visuel stylisé inaccessible."
    return f"Accueil et galerie 68 cartes, 67 connues, 38 variantes ; {all_live_images} images WebP publiques accessibles, et bêta accessible."


def main():
    last_error = None
    for attempt in range(1, TRIES + 1):
        try:
            print(f"[{attempt}/{TRIES}] Contrôle GitHub Pages :", verify_once(), flush=True)
            return 0
        except (AssertionError, KeyError, ValueError, urllib.error.URLError, TimeoutError) as error:
            last_error = error
            print(f"[{attempt}/{TRIES}] Pas encore prêt : {error}", flush=True)
            if attempt < TRIES:
                time.sleep(DELAY)
    print(f"ÉCHEC après {TRIES} essais. Dernier problème : {last_error}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
