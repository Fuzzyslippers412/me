# Editorial release: November 2026

## Scope

This release presents Home, Door Notes and MUDECA alongside the existing work.
It adds four authored technical notes, each in Italian, English, French and
Portuguese. Italian remains the default. Existing project and article URLs are
unchanged. Home and MUDECA have no external Visit link because no public
destination has been verified for this release.

Home is described as private development, using a reviewed 27 October 2026
source snapshot and existing test/build evidence. No Home code, running service,
build-worker configuration, admission pin or job was changed or executed.
Physical-TV acceptance, public release, automatic OCR and later unreviewed
integrations are not claimed. The existing Galidima and older project accounts
retain their own source scope; they have not been represented as a new review of
the primary Mac's latest application code.

## Content map

- `data/projects.json`: shared summaries, status, SEO identity, evidence and new case-study bodies.
- `data/editorial.json`: homepage selection/order, first-person biography and localized interface copy.
- `data/research-notes.json`: four original explanations, not fabricated commits or release events.
- `data/content-review.json`: English-source digests acknowledged for each translation. Do not auto-refresh digests during an ordinary build.
- `data/activity-titles.json`: reviewed display translations; original commit title, date, hash and destination remain intact.
- `scripts/build-project-pages.mjs`: generates records with `pageContent`, while the enhancer synchronizes the opening summary on every project page.
- `scripts/build-editorial-notes.mjs`: localized article bodies, author graph, source limits and reciprocal language alternatives.
- `scripts/lib/personal-home.mjs`: selected-work composition, with a configurable evidence disclosure and optional verified external link.
- `scripts/lib/research-notes.mjs`: article routes and fail-closed translation validation.

New routes, with the usual `/en`, `/fr` and `/pt` equivalents:

```text
/projects/home/
/projects/door-notes/
/projects/mudeca/
/research/retry-identity/
/research/receipts-and-inventory/
/research/television-state-boundary/
/research/research-leads-and-evidence/
```

## Design specification

Paper, ink, restrained indigo and clay. Self-hosted Newsreader and Hanken Grotesk.
Compact headings, a single featured system with a conceptual architecture
diagram, then contrasting smaller studies. No fabricated product screenshots.
The shared river retains cumulative path phases, visibility pausing, reduced
motion, static fallbacks and the existing original textile-inspired accents.
The homepage places the desktop stream in its outside margin. Phone and tablet
layouts retain the dedicated gutter. No new browser dependency or animation
runtime was added.

## Activity and privacy

Door Notes is collected from its verified public repository. Home and MUDECA are
not collector sources. Their private commit messages cannot enter this feed.
Public-facing descriptions were written deliberately; raw application bundles,
household records, member records, private endpoints and review logs are not in
this repository. The detailed evidence ledger remains outside the site.

`checked_at` describes polling. Entry dates describe the underlying source.
New authored notes live under Research and do not pretend to be new commits.
When account-wide GitHub verification is unavailable, the collector preserves
the entire last verified profile and its date instead of mixing it with partial
repository counters. CI still requires a fresh authenticated profile snapshot.

## Build and acceptance

Run `node scripts/build-site.mjs`. It generates all four editions, validates
metadata and links, runs the strict search-surface audit and executes regression
tests. Run it a second time and compare output hashes: no content should drift.

Review home, About, project index, case studies, research and updates at 320,
390, 768, 1024 and 1440 pixels. Check native language links on the same article,
keyboard disclosure/menu operation, the motion toggle and decorative gutters.
All content remains present in the static HTML. CSS retains the existing 8 KB
gzip budget; the river runtime retains its 3 KB budget.

The private review report records browser checks and their limits. Do not claim
physical-device testing, a throttled Lighthouse score, field Core Web Vitals or
200% browser-zoom testing without collecting that evidence separately.

## Search and release

The sitemap includes all new canonical pages and their reciprocal alternatives.
Authored dates are editorial dates, not hourly collector timestamps. Stable
Person identifiers and visible author links connect projects, notes and profile.
External author snippets are prepared, not applied to other applications.

After approval and deployment, inspect the new priority URLs in Search Console.
Keep exports private and compare name-query impressions and clicks over matched
28-day periods. Indexing, ranking and sitelinks are not guaranteed.

No push is part of this preview. Do not use `git add -A`: four unrelated preserved
files remain untracked. Keep all backups outside the release. An engineer should
extract the sanitized handoff archive into a non-synced local directory, not use
iCloud to synchronize a Git working tree. No credentials, `.git`, private logs,
backups or preserved differing files belong in that archive.

Prepare a new local archive with `python3 scripts/package-handoff.py --output /path/outside-the-site/review.zip`. The command refuses overwrites, excludes protected files and private report directories, and verifies every archived file against a checksum manifest. Transfer only the reviewed archive to iCloud; do not transfer this checkout.
