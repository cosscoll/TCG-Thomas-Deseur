"""Contract tests for source-export integrity (no network, no Floot mutation)."""

import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "verify_floot_export.py"
spec = importlib.util.spec_from_file_location("verify_floot_export", SCRIPT)
verify = importlib.util.module_from_spec(spec)
spec.loader.exec_module(verify)


class ExportTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source = "helpers/useAuth.tsx"
        (self.root / "helpers").mkdir()
        (self.root / self.source).write_text("export const ok = true;", encoding="utf-8")
        self.manifest = {
            "projectId": verify.PROJECT_ID,
            "version": 42,
            "files": {
                self.source: hashlib.sha256((self.root / self.source).read_bytes()).hexdigest()
            },
        }
        self.save()

    def save(self):
        (self.root / "manifest.json").write_text(json.dumps(self.manifest))

    def test_valid_export(self):
        self.assertEqual(verify.verify_export(self.root)["filesVerified"], 1)

    def test_mismatch(self):
        (self.root / self.source).write_text("changed")
        with self.assertRaisesRegex(ValueError, "SHA-256 mismatch"):
            verify.verify_export(self.root)

    def test_missing_source(self):
        (self.root / self.source).unlink()
        with self.assertRaisesRegex(ValueError, "Missing or external"):
            verify.verify_export(self.root)

    def test_wrong_project(self):
        self.manifest["projectId"] = "another-project"
        self.save()
        with self.assertRaisesRegex(ValueError, "projectId"):
            verify.verify_export(self.root)

    def test_missing_version(self):
        self.manifest.pop("version")
        self.save()
        with self.assertRaisesRegex(ValueError, "version"):
            verify.verify_export(self.root)

    def test_absolute_path(self):
        with self.assertRaises(ValueError):
            verify.validate_path("/etc/passwd")

    def test_parent_traversal(self):
        with self.assertRaises(ValueError):
            verify.validate_path("pages/../secrets.txt")

    def test_dot_env(self):
        with self.assertRaises(ValueError):
            verify.validate_path(".env")

    def test_windows_backslash(self):
        with self.assertRaises(ValueError):
            verify.validate_path("pages\\_index.tsx")

    def test_unlisted_file(self):
        (self.root / "extra.txt").write_text("unexpected")
        with self.assertRaisesRegex(ValueError, "Unlisted source"):
            verify.verify_export(self.root)

    def test_symlink(self):
        (self.root / self.source).unlink()
        other = self.root / "elsewhere"
        other.write_text("export const ok = true;")
        (self.root / self.source).symlink_to(other)
        with self.assertRaisesRegex(ValueError, "symlink"):
            verify.verify_export(self.root)

    def test_invalid_digest(self):
        self.manifest["files"][self.source] = "not-a-sha"
        self.save()
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            verify.verify_export(self.root)

    def test_bad_json(self):
        (self.root / "manifest.json").write_text("{")
        with self.assertRaises(json.JSONDecodeError):
            verify.verify_export(self.root)


if __name__ == "__main__":
    unittest.main()
