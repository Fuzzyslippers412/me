#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Release aborted: checkout main first." >&2
  exit 1
fi

if [[ -d "$(git rev-parse --git-path rebase-merge)" || -d "$(git rev-parse --git-path rebase-apply)" ]]; then
  echo "Release aborted: resolve or abort the existing rebase first." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release aborted: commit or intentionally remove all worktree changes first." >&2
  git status --short
  exit 1
fi

node scripts/build-expertise.mjs
node scripts/build-research-pages.mjs
node scripts/build-update-pages.mjs
node scripts/build-update-indexes.mjs
node scripts/build-feed.mjs
node scripts/build-authority-assets.mjs
node scripts/build-research-assets.mjs
node scripts/enhance-html.mjs
node scripts/render-static-data.mjs
node scripts/build-sitemap.mjs
node scripts/validate-site.mjs
node scripts/audit-search-surface.mjs --strict

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release aborted: generated files differ from the committed release." >&2
  git status --short
  exit 1
fi

git fetch origin main
git rebase origin/main

# Remote changes can alter generated inputs, so validate the rebased tree again.
node scripts/validate-site.mjs
node scripts/audit-search-surface.mjs --strict
git push origin HEAD:main

if [[ "${SKIP_LIVE_CHECK:-0}" != "1" ]]; then
  node scripts/check-live-site.mjs
fi
