#!/usr/bin/env python3
"""Check public availability and unauthenticated access to the published game.

No credentials, cookies, account creation, password reset or authenticated
booster claims are used. This does not test player journeys or DB isolation.
"""

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from urllib.error import HTTPError
from urllib.request import Request, build_opener


BASE_URL = "https://budget-illimite-tcg.floot.app"
CHECKS = (
    ("GET", "/", None, 200),
    ("GET", "/login", None, 200),
    ("GET", "/_api/auth/session", None, 401),
    ("GET", "/_api/collection", None, 401),
    ("POST", "/_api/booster", {"json": {}}, 401),
    ("POST", "/_api/profile", {"json": {"displayName": "Audit technique"}}, 401),
)


def check(case):
    method, path, payload, expected = case
    result = {"method": method, "path": path, "expectedStatus": expected}
    headers = {"User-Agent": "TCG-Deseur-public-check/1.0"}
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = Request(BASE_URL + path, data=data, headers=headers, method=method)
    try:
        # A fresh default opener has no CookieProcessor and no session jar.
        opener = build_opener()
        try:
            response = opener.open(request, timeout=25)
        except HTTPError as error:
            response = error
        with response:
            status = response.code
            content_type = response.headers.get("Content-Type", "")
            body = response.read(1024 * 1024).decode("utf-8")
            final_url = response.geturl()
        if final_url != BASE_URL + path:
            raise ValueError("Unexpected redirect")
        result["status"] = status
        if status != expected:
            raise ValueError(f"Expected HTTP {expected}, received {status}")
        if path.startswith("/_api/"):
            if "application/json" not in content_type:
                raise ValueError("API denial is not JSON")
            payload = json.loads(body)
            if not isinstance(payload, dict):
                raise ValueError("Unexpected API response")
            denial = payload.get("json", payload)
            if not isinstance(denial, dict):
                raise ValueError("Unexpected API response envelope")
            if not isinstance(denial.get("error"), str) or not denial["error"]:
                raise ValueError("Missing access denial message")
            forbidden = {"user", "cards", "owned", "drawn", "email", "displayName"}
            if forbidden.intersection(denial) or forbidden.intersection(payload):
                raise ValueError("Player data included in an anonymous denial")
        else:
            if "text/html" not in content_type:
                raise ValueError("Page is not HTML")
            title = re.search(r"<title[^>]*>(.*?)</title>", body, re.DOTALL)
            if not title or "TCG Deseur" not in title.group(1):
                raise ValueError("Missing TCG Deseur page identity")
            if 'id="root"' not in body:
                raise ValueError("Missing application mount")
        result["passed"] = True
    except Exception as error:
        result["passed"] = False
        result["error"] = str(error)
    return result


def main():
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(check, CHECKS))
    passed = sum(result["passed"] for result in results)
    print(json.dumps({
        "checkedAt": datetime.now(timezone.utc).isoformat(),
        "baseUrl": BASE_URL,
        "scope": "Public HTTP pages and anonymous API access only",
        "passed": passed,
        "total": len(results),
        "results": results,
    }, ensure_ascii=False, indent=2))
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
