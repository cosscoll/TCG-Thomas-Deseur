"""Unit tests for the anonymous production smoke checker. No network calls."""

import importlib.util
import json
import unittest
from pathlib import Path
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "check_floot_public.py"
spec = importlib.util.spec_from_file_location("check_floot_public", SCRIPT)
checker = importlib.util.module_from_spec(spec)
spec.loader.exec_module(checker)


class FakeResponse:
    def __init__(self, status=401, content_type="application/json", body=None, url=None):
        self.code = status
        self.headers = {"Content-Type": content_type}
        self.body = (body if body is not None else json.dumps({"error": "Connexion requise"})).encode("utf-8")
        self.url = url

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, size):
        return self.body[:size]

    def geturl(self):
        return self.url or checker.BASE_URL + "/_api/collection"


class FakeOpener:
    def __init__(self, response=None, exc=None):
        self.response = response
        self.exc = exc
        self.request = None

    def open(self, request, timeout):
        self.request = request
        if self.exc:
            raise self.exc
        return self.response


class PublicSmokeTests(unittest.TestCase):
    def call(self, response=None, exc=None, method="GET", path="/_api/collection", payload=None):
        fake = FakeOpener(response, exc)
        expected = 200 if not path.startswith("/_api/") else 401
        with patch.object(checker, "build_opener", return_value=fake):
            result = checker.check((method, path, payload, expected))
        return result, fake.request

    def test_valid_anonymous_access_denial_passes(self):
        result, request = self.call(FakeResponse())
        self.assertTrue(result["passed"])
        self.assertEqual(request.get_method(), "GET")
        self.assertNotIn("cookie", {key.lower() for key in request.headers})

    def test_unexpected_success_status_fails(self):
        result, _ = self.call(FakeResponse(status=200))
        self.assertFalse(result["passed"])
        self.assertIn("Expected HTTP 401", result["error"])

    def test_user_data_in_error_fails(self):
        response = FakeResponse(body=json.dumps({"error": "Connexion requise", "email": "hidden@example.invalid"}))
        result, _ = self.call(response)
        self.assertFalse(result["passed"])
        self.assertIn("Player data", result["error"])

    def test_wrapped_user_data_fails(self):
        response = FakeResponse(body=json.dumps({"json": {"error": "Non connecté", "cards": []}}))
        result, _ = self.call(response)
        self.assertFalse(result["passed"])
        self.assertIn("Player data", result["error"])

    def test_missing_error_message_fails(self):
        result, _ = self.call(FakeResponse(body='{}'))
        self.assertFalse(result["passed"])
        self.assertIn("Missing access denial message", result["error"])

    def test_non_json_denial_fails(self):
        result, _ = self.call(FakeResponse(content_type="text/html"))
        self.assertFalse(result["passed"])
        self.assertIn("not JSON", result["error"])

    def test_redirect_to_other_origin_fails(self):
        result, _ = self.call(FakeResponse(url="https://example.invalid/welcome"))
        self.assertFalse(result["passed"])
        self.assertIn("redirect", result["error"])

    def test_network_failure_returns_failing_result(self):
        result, _ = self.call(exc=TimeoutError("Timed out"))
        self.assertFalse(result["passed"])
        self.assertIn("Timed out", result["error"])

    def test_anonymous_post_has_json_body_but_no_credentials(self):
        response = FakeResponse(url=checker.BASE_URL + "/_api/profile")
        result, request = self.call(response, method="POST", path="/_api/profile", payload={"json": {"displayName": "Audit technique"}})
        self.assertTrue(result["passed"])
        self.assertEqual(request.get_method(), "POST")
        self.assertEqual(request.get_header("Content-type"), "application/json")
        self.assertNotIn("cookie", {key.lower() for key in request.headers})

    def test_page_without_expected_brand_fails(self):
        response = FakeResponse(status=200, content_type="text/html", body='<html><head><title>Autre site</title></head><body><div id="root"></div></body></html>', url=checker.BASE_URL + "/")
        result, _ = self.call(response, path="/")
        self.assertFalse(result["passed"])
        self.assertIn("TCG Deseur", result["error"])

    def test_valid_public_page_passes(self):
        response = FakeResponse(status=200, content_type="text/html", body='<html><head><title>TCG Deseur</title></head><body><div id="root"></div></body></html>', url=checker.BASE_URL + "/")
        result, _ = self.call(response, path="/")
        self.assertTrue(result["passed"])


if __name__ == "__main__":
    unittest.main()
