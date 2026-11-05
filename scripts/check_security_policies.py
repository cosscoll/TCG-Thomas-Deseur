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
print(f"Security policy: {count} workflows checked, {write_workflows} manual write workflows, {len(failures)} violation(s)")
for failure in failures:
    print(f"SECURITY POLICY ERROR: {failure}")
if failures:
    raise SystemExit(1)
