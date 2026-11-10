#!/usr/bin/env python3
"""Create a review archive, never a cloud-synchronized Git working tree."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parent.parent
PROTECTED = {"RELEASE_REVIEW 2.md", "apple-touch-icon 2.png", "scripts/lib/presentation 2.mjs", "tests/site.test 2.mjs"}
DIRECTORIES = {".github", "authority", "data", "scripts", "tests", "fonts", "about", "projects", "research", "updates", "en", "fr", "pt", "it"}
ROOT_FILES = {".gitignore", ".nojekyll", "CNAME", "index.html", "404.html", "style.css", "robots.txt", "sitemap.xml", "feed.xml", "site.webmanifest", "README.md", "EDITORIAL_HANDOFF.md", "ACTIVITY_AUTOMATION_SETUP.md", "SEARCH_CONSOLE_SETUP.md", "favicon.svg", "favicon.ico", "favicon-48.png", "favicon.png", "apple-touch-icon.png", "og-image.png", "og-image.svg"}


def package(output):
    output = output.resolve()
    if output == ROOT or ROOT in output.parents:
        raise ValueError("The handoff must be stored outside the website.")
    if output.suffix != ".zip":
        raise ValueError("Use a new .zip destination.")
    names = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT).decode().split("\0")
    files = []
    for name in sorted(set(filter(None, names))):
        relative = Path(name)
        if name in PROTECTED or (name not in ROOT_FILES and relative.parts[0] not in DIRECTORIES):
            continue
        file = ROOT / relative
        if file.is_symlink() or not file.is_file() or ROOT not in file.resolve().parents:
            raise ValueError(f"Non-regular source file: {name}")
        if any(part in {".git", "node_modules", "__pycache__", "reports", "backups"} or part.startswith(".env") for part in relative.parts):
            raise ValueError(f"Excluded private or generated directory: {name}")
        if file.suffix.lower() in {".pem", ".key", ".p12", ".pfx", ".keystore"}:
            raise ValueError(f"Credential file is not a handoff source: {name}")
        files.append((name, file.read_bytes()))
    manifest = {name: hashlib.sha256(data).hexdigest() for name, data in files}
    output.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(descriptor, "wb") as stream:
        with zipfile.ZipFile(stream, "w", zipfile.ZIP_DEFLATED) as archive:
            for name, data in files:
                archive.writestr(name, data)
            archive.writestr("HANDOFF-SHA256.json", json.dumps(manifest, indent=2) + "\n")
    with zipfile.ZipFile(output) as archive:
        assert not (set(archive.namelist()) & PROTECTED)
        for name, digest in manifest.items():
            assert hashlib.sha256(archive.read(name)).hexdigest() == digest
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    with output.with_suffix(".zip.sha256").open("x") as checksum:
        checksum.write(f"{digest}  {output.name}\n")
    print(f"Verified {len(files)} files. Archive SHA-256: {digest}")
    print(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True)
    package(parser.parse_args().output)
