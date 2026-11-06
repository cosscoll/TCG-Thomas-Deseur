#!/usr/bin/env python3
"""Check least privilege for the source repository's GitHub workflows.
Read-only. Fails on automated workflows that can write to the repository.
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS = ROOT / ".github" / "workflows"
MUTATING_EVENTS = {
    "push", "pull_request", "pull_request_target", "schedule", "workflow_run",
    "repository_dispatch", "release", "create", "delete", "issue_comment",
    "issues", "pull_request_review", "workflow_call",
}
failures = []
count = 0
write_workflows = 0
for path in sorted(WORKFLOWS.glob("*.yml")):
    content = path.read_text(encoding="utf-8")
    count += 1
    write = bool(re.search(r"(?m)^\s*(?:contents|actions|issues|pull-requests|packages|pages|deployments):\s*write\s*$", content))
    if not write:
        continue
    write_workflows += 1
    match = re.search(r"(?m)^on:\s*$", content)
    if not match:
        failures.append(f"{path.name}: expected an explicit event map")
        continue
    following = content[match.end():]
    block = re.split(r"(?m)^[A-Za-z][\w-]*:\s*", following, maxsplit=1)[0]
    triggers = set(re.findall(r"(?m)^  ([A-Za-z][\w-]*):\s*$", block))
    prohibited = triggers & MUTATING_EVENTS
    if prohibited:
        failures.append(f"{path.name}: write permission with automatic triggers {sorted(prohibited)}")
    if "workflow_dispatch" not in triggers:
        failures.append(f"{path.name}: write permission without a manual-only trigger")
for name in ("floot-app", "supabase", "security", "scripts", "tests", "tri-177", "collection-161", "data"):
    config = (ROOT / "_config.yml").read_text(encoding="utf-8")
    if not re.search(r"(?m)^\s*-\s*" + re.escape(name) + r"\s*$", config):
        failures.append(f"GitHub Pages missing exclusion for {name}")
# Default-deny checks on every tracked file: any new asset/script that is not
# in the static allowlist MUST be excluded from GitHub Pages before merging.
# Unlike a fixed set of sensitive filenames, this also catches new folders.
import subprocess

public_pages = {
    "index.html", "legal/index.html", "collection-validee/index.html",
    "robots.txt", "sitemap.xml",
}
config_lines = (ROOT / "_config.yml").read_text(encoding="utf-8")
excluded = set(re.findall(r"(?m)^  - (.+?)\s*$", config_lines))
tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode("utf-8").split("\0")
public_artworks = 0
for rel in tracked:
    if not rel:
        continue
    if rel in public_pages or rel == "_config.yml":
        continue
    if rel.startswith("collection-validee/assets/detourees/") and rel.endswith(".webp"):
        public_artworks += 1
        continue
    if any(rel == denied or rel.startswith(denied + "/") for denied in excluded):
        continue
    failures.append(f"UNEXCLUDED TRACKED FILE: {rel}")
if public_artworks != 105:
    failures.append(f"Expected exactly 105 approved WebP artworks; found {public_artworks}")

# Detect accidental credential commits without printing any credential value.
# A known-pattern scanner is only a guardrail, not a complete secret audit.
SECRET_PATTERNS = [
    ("GitHub token", re.compile(r"\b(?:ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b")),
    ("OpenAI API key", re.compile(r"\bsk-(?:proj|svcacct)-[A-Za-z0-9_-]{20,}\b")),
    ("Anthropic API key", re.compile(r"\bsk-ant-api\d+-[A-Za-z0-9_-]{25,}\b")),
    ("Supabase secret", re.compile(r"\bsb_secret_[A-Za-z0-9_-]{16,}\b")),
    ("Stripe live key", re.compile(r"\b(?:sk_live|rk_live)_[A-Za-z0-9]{24,}\b")),
    ("Google API key", re.compile(r"\bAIza[0-9A-Za-z_-]{32,}\b")),
    ("AWS access key ID", re.compile(r"\bAKIA[0-9A-Z]{16}\b")),
    ("Private key header", re.compile(r"-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----")),
    ("PostgreSQL password URL", re.compile(r"postgres(?:ql)?://[^\s:/@]+:[^\s@]+@[A-Za-z0-9.-]+(?::\d+)?/", re.I)),
]
TEXT_SUFFIXES = {
    ".js", ".mjs", ".ts", ".tsx", ".json", ".md", ".html", ".css",
    ".yml", ".yaml", ".py", ".sql", ".txt", ".sh", ".toml", ".env",
}
checked_text_files = 0
for rel in tracked:
    if not rel:
        continue
    name = Path(rel).name
    forbidden_suffixes = (".pem",".key",".p12",".pfx",".jks",".keystore",".sqlite",".sqlite3",".db")
    forbidden_names = {".npmrc",".pypirc","id_rsa","id_ed25519"}
    if name.lower().endswith(forbidden_suffixes) or name in forbidden_names or rel.startswith((".aws/",".config/gcloud/")):
        failures.append(f"Tracked sensitive binary/configuration file is forbidden: {rel}")
        continue
    if name.startswith(".env") and name != ".env.example":
        failures.append(f"Tracked environment file is forbidden: {rel}")
        continue
    if Path(rel).suffix.lower() not in TEXT_SUFFIXES:
        continue
    source = ROOT / rel
    if not source.is_file() or source.stat().st_size > 2_000_000:
        continue
    contents = source.read_text(encoding="utf-8", errors="replace")
    checked_text_files += 1
    for label, expression in SECRET_PATTERNS:
        if expression.search(contents):
            failures.append(f"Potential {label} detected in {rel}; value withheld")
            break
for path in WORKFLOWS.glob("*.yml"):
    contents = path.read_text(encoding="utf-8")
    if re.search(r"(?m)^\s*permissions:\s*write-all\s*$", contents):
        failures.append(f"{path.name}: unrestricted permissions: write-all")

print(f"Security policy: {count} workflows checked, {write_workflows} manual write workflows, {len(failures)} violation(s)")
print(f"Secret patterns checked in {checked_text_files} tracked source files without logging values")
for failure in failures:
    print(f"SECURITY POLICY ERROR: {failure}")
if failures:
    raise SystemExit(1)
