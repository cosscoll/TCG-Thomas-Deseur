#!/usr/bin/env python3
"""Read-only scan of all available Git commit diffs.
Only file paths and pattern categories are reported; never secret values.
Run on a full checkout (fetch-depth: 0) for accurate coverage.
"""
from collections import Counter
import os
from pathlib import Path
import re
import subprocess
import sys

PATTERNS = {
    "GitHub token": re.compile(rb"\b(?:ghp_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b"),
    "OpenAI key": re.compile(rb"\bsk-(?:proj|svcacct)-[A-Za-z0-9_-]{20,}\b"),
    "Anthropic key": re.compile(rb"\bsk-ant-api\d+-[A-Za-z0-9_-]{25,}\b"),
    "Supabase secret": re.compile(rb"\bsb_secret_[A-Za-z0-9_-]{16,}\b"),
    "Google API key": re.compile(rb"\bAIza[A-Za-z0-9_-]{32,}\b"),
    "AWS access key": re.compile(rb"\bAKIA[0-9A-Z]{16}\b"),
    "Stripe live key": re.compile(rb"\b(?:sk_live|rk_live)_[A-Za-z0-9]{24,}\b"),
    "PEM private key": re.compile(rb"-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----"),
    "Credentialed PostgreSQL URL": re.compile(rb"postgres(?:ql)?://[^\s:/@]+:[^\s@]+@[A-Za-z0-9.-]+(?::\d+)?/", re.I),
}

def run_scan(root):
    proc = subprocess.Popen([
        "git", "log", "--all", "--no-ext-diff", "--no-textconv",
        "--format=TCG_HISTORY_COMMIT:%H", "-p", "--unified=0"
    ], cwd=root, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    file = "unknown"
    commits = 0
    findings = Counter()
    assert proc.stdout is not None
    for line in proc.stdout:
        if line.startswith(b"TCG_HISTORY_COMMIT:"):
            commits += 1
        elif line.startswith(b"diff --git a/"):
            file = line.rsplit(b" b/", 1)[-1].strip().decode("utf-8", errors="replace")
            if re.search(r"(^|/)\.env($|\.)", file) and not file.endswith(".env.example"):
                findings[("Historical environment file", file)] += 1
            if re.search(r"\.(?:pem|p12|pfx|key)$", file, re.I):
                findings[("Historical private key filename", file)] += 1
        elif line.startswith(b"+") and not line.startswith(b"+++"):
            for label, pattern in PATTERNS.items():
                if pattern.search(line):
                    findings[(label, file)] += 1
                    break
    stderr = proc.stderr.read() if proc.stderr else b""
    result = proc.wait()
    if result:
        raise RuntimeError("git log failed; details suppressed (exit "+str(result)+")")
    return commits, findings

if __name__ == "__main__":
    base = Path(os.environ.get("TCG_GIT_ROOT", Path(__file__).resolve().parents[1]))
    commits, findings = run_scan(base)
    print(f"Historical secrets: {commits} commits scanned; {sum(findings.values())} possible sensitive changes")
    for (label, file), qty in findings.most_common(40):
        print(f"REVIEW REQUIRED: {label} in {file}, occurrences={qty}; contents withheld")
    if findings:
        print("If real credentials were exposed, revoke and rotate them. Rewriting Git history is not enough.")
    if os.environ.get("TCG_HISTORY_STRICT") == "1" and findings:
        sys.exit(1)
