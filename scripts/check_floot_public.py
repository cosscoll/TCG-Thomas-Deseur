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


# An anonymous 401 must not contain player-specific information, even inside
# error metadata or arrays. Keep this independent of the server's JSON envelope.
PRIVATE_RESPONSE_KEYS = {
    "user", "users", "userid", "email", "displayname", "password",
    "passwordhash", "token", "accesstoken", "refreshtoken", "jwt",
    "cookie", "cookies", "cards", "owned", "drawn", "inventory",
    "collection", "sessionid", "authsession", "profile",
}


def find_private_field(value, prefix=""):
    """Return the first sensitive JSON field path, or None if none exists."""
    if isinstance(value, dict):
        for raw_key, child in value.items():
            key = str(raw_key)
            field = f"{prefix}.{key}" if prefix else key
            normalized = re.sub(r"[^a-z0-9]", "", key.lower())
            if normalized in PRIVATE_RESPONSE_KEYS:
                return field
            nested = find_private_field(child, field)
            if nested:
                return nested
    elif isinstance(value, list):
        for index, child in enumerate(value):
            nested = find_private_field(child, f"{prefix}[{index}]")
            if nested:
                return nested
    return None


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
            private_field = find_private_field(payload)
            if private_field:
                # The field path is sufficient to debug without logging its value.
                raise ValueError(f"Player data included in an anonymous denial: {private_field}")
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
