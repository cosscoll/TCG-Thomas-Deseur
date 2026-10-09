#!/usr/bin/env python3
"""Read-only verification of a versioned source export from the existing Floot app.

This script does not connect to Floot, export source code, or verify a database backup.
Run only on a manually assembled, reviewed, non-sensitive source directory.
"""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath

PROJECT_ID = '1d1c3807-73a6-49c5-a59e-ec097d8caddf'
MAX_FILE_SIZE = 10 * 1024 * 1024
SKIP_NAMES = {'.env', '.env.local', '.env.production', '.env.development', 'credentials.json', 'service-account.json'}


def validate_path(relative):
    if not isinstance(relative, str) or not relative or '\\' in relative:
        raise ValueError('Invalid relative path')
    path = PurePosixPath(relative)
    if (path.is_absolute() or str(path) != relative or
            any(part in ('', '.', '..') for part in relative.split('/')) or
            any(part.startswith('.') for part in path.parts) or
            path.name.lower() in SKIP_NAMES):
        raise ValueError(f'Unsafe source path: {relative}')
    return path


def validate_manifest(manifest):
    if not isinstance(manifest, dict) or manifest.get('projectId') != PROJECT_ID:
        raise ValueError('Manifest projectId does not match the existing Floot project')
    version = manifest.get('version')
    if (not isinstance(version, (str, int)) or isinstance(version, bool) or
            not str(version).strip()):
        raise ValueError('Missing export version')
    files = manifest.get('files')
    if not isinstance(files, dict) or not files:
        raise ValueError('No source files listed')
    for relative, digest in files.items():
        validate_path(relative)
        if not isinstance(digest, str) or len(digest) != 64 or any(ch not in '0123456789abcdef' for ch in digest):
            raise ValueError(f'Invalid SHA-256 for: {relative}')
    return files


def verify_export(root):
    root = Path(root)
    manifest_path = root / 'manifest.json'
    if not manifest_path.is_file() or manifest_path.is_symlink():
        raise ValueError('Missing regular manifest.json')
    manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
    files = validate_manifest(manifest)
    base = root.resolve(strict=True)
    for relative, expected in files.items():
        filename = root / relative
        # Disallow symlinks at any component; source exports must be self-contained.
        current = root
        for component in PurePosixPath(relative).parts:
            current = current / component
            if current.is_symlink():
                raise ValueError(f'Export contains a symlink: {relative}')
        if not filename.is_file() or not filename.resolve().is_relative_to(base):
            raise ValueError(f'Missing or external source: {relative}')
        if filename.stat().st_size > MAX_FILE_SIZE:
            raise ValueError(f'Unexpectedly large source: {relative}')
        actual = hashlib.sha256(filename.read_bytes()).hexdigest()
        if actual != expected:
            raise ValueError(f'SHA-256 mismatch: {relative}')
    extras = sorted(p.relative_to(root).as_posix() for p in root.rglob('*')
                    if p.is_file() and p != manifest_path and p.relative_to(root).as_posix() not in files)
    if extras:
        raise ValueError(f'Unlisted source files (first): {extras[0]}')
    return {'projectId': PROJECT_ID, 'version': str(manifest['version']), 'filesVerified': len(files)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('export_root', help='Path containing manifest.json and source files')
    args = parser.parse_args()
    try:
        print(json.dumps({'ok': True, **verify_export(args.export_root)}, ensure_ascii=False))
    except (ValueError, OSError, json.JSONDecodeError) as error:
        print(json.dumps({'ok': False, 'error': str(error)}, ensure_ascii=False))
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
