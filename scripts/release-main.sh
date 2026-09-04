#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ "$(git branch --show-current)" != "main" ]]; then
  echo "Release aborted: checkout main first." >&2
  exit 1
fi

if [[ -d "$(git rev-parse --git-path rebase-merge)" || -d "$(git rev-parse --git-path rebase-apply)" || -f "$(git rev-parse --git-path MERGE_HEAD)" ]]; then
  echo "Release aborted: resolve or abort the existing merge or rebase first." >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release aborted: commit or intentionally remove all worktree changes first." >&2
  git status --short
  exit 1
fi

node scripts/build-site.mjs

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Release aborted: generated files differ from the committed release." >&2
  git status --short
  exit 1
fi

for attempt in 1 2 3; do
  git fetch origin main
  git rebase origin/main
  # Rebuild against remote source changes; validating old generated HTML alone
  # would miss content drift introduced by an otherwise clean rebase.
  node scripts/build-site.mjs
  node scripts/reconcile-generated.mjs
  if git push origin HEAD:main; then
    break
  fi
  if [[ "$attempt" == "3" ]]; then
    echo "Release could not push after three non-force attempts." >&2
    exit 1
  fi
  echo "Push failed; refreshing upstream before retry ${attempt}."
done

if [[ "${SKIP_LIVE_CHECK:-0}" != "1" ]]; then
  LIVE_CHECK_ATTEMPTS="${LIVE_CHECK_ATTEMPTS:-8}" node scripts/check-live-site.mjs
fi
