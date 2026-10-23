# Armel Tenkiang

Source for [armeltenkiang.com](https://armeltenkiang.com), the personal site of computer scientist and researcher Armel Tenkiang.

The site documents work on distributed systems, local-first software, private settlement, bounded model context, and verification-heavy tools. It is a static, multilingual GitHub Pages site with Italian as the default language and English, French, and Portuguese editions.

## Build

The rendered HTML is committed so pages remain complete without client-side JavaScript.

```sh
node scripts/build-site.mjs
```

This runs the content generators, static activity renderer, sitemap builder, validators, search-surface audit, and regression tests. It does not fetch new activity or publish the site.

Project activity and GitHub statistics are refreshed after source changes and at minute 17 of every hour by `.github/workflows/update-updates.yml`. Programming notes are sourced from explicit records in `data/update-notes.json`; private repositories require deliberately marked public updates. Token and freshness requirements are documented in `ACTIVITY_AUTOMATION_SETUP.md`.

## Working Folder

Keep the Git working copy outside cloud-synced Desktop and Documents folders, for example under `~/Developer/`. Use Git to exchange changes between computers; do not use iCloud Drive to synchronize the working tree or `.git` database. No site tooling changes system sync settings.

The build and standalone HTML enhancer check for duplicate page canonicals before writing. They stop for inspection rather than choosing or deleting a copy. Numbered files such as `index 2.html` must be compared with the original; a different copy may contain work worth keeping. Store reviewed backups outside this repository so they cannot be processed or published. Do not hide these files with a broad Git ignore rule.

Atomic writes leave byte-identical files untouched. Changed output is still replaced atomically. These safeguards reduce unnecessary file churn and protect against processing copied pages, but cannot stop an external sync service from creating files inside a synced working folder.

## Presentation

The homepage follows one reading sequence: an introduction; MyCasaPro, Au Jour Le Jour, and Liga do Povo; a Galidima research question; five source-linked programming updates; Listening; and a short personal closing. Every project remains in its localized project index. Italian is the default; all four editions use the same composition.

- `data/projects.json` owns localized project summaries, status, evidence, and substantive modification dates. The homepage and project index render the same summary records.
- `scripts/lib/personal-home.mjs` owns the homepage selection, localized introduction, Listening links, and first-person About introduction. The invitation annotation references a named evidence item, not a copied paragraph. Its detailed diagram stays on the project page; the homepage uses a native disclosure.
- `scripts/lib/system-figures.mjs` contains localized architecture figures. Their text must remain consistent with the source-backed project notes; diagrams are not inferred capabilities.
- `scripts/lib/presentation.mjs` integrates page composition, the complete project index, and native section navigation.
- `scripts/lib/river-presentation.mjs` adds shared mobile navigation, layered decorative ink curves, French punctuation spacing, and a localized motion control in the header. Section-specific static drawings remain available without JavaScript. Enhancement resets its own decorations before regenerating them, so repeated builds remain stable.
- `style.css` owns the shared light palette, typography, page layouts, responsive rules, print styles, and accessibility fallbacks. No UI framework, animation library, tracking, or music embed is required.
- Newsreader and Hanken Grotesk are self-hosted, with their licenses in `fonts/`. Each section owns a non-interactive river segment: three ink contours in the desktop margin and two in a dedicated phone gutter. Text is never hidden or moved by animation.
- At 900px and below, the river uses a 30px gutter drawing (26px on narrow phones). Its main current and broader translucent sheen flow on an 18-second cycle; desktop uses 22 seconds. A finer secondary current runs on a 27-second cycle at all widths. The two phase periods remain 556px and 660px, keeping highlights continuous between sections without moving text.
- Original indigo lattice and clay-coloured band accents refer to the geometric construction of Bamileke ndop and Fulani khasa textiles. They are contemporary decorative interpretations, not named traditional symbols or claims of ritual meaning. Research references: [UMMA, Bamileke tunic](https://umma.umich.edu/objects/tunic-2014-2-78-2/) and [UMMA, Fulani blanket](https://umma.umich.edu/objects/blanket-khasa-1984-1-267-2/). No museum images are reproduced. The accents remain static without JavaScript; animated tracing shares the river's pause, visibility, and reduced-motion controls. They are hidden from assistive technology, print and forced-colour modes.
- `scripts/river.js` measures section gaps and builds connected curves in pixel coordinates. ResizeObserver and font readiness trigger coalesced measurements; there is no continuous JavaScript animation loop or scroll interception. Continuous CSS highlights use cumulative path lengths and a shared time origin across joins. IntersectionObserver pauses offscreen currents; hidden tabs disconnect observation and pause motion. Scroll timelines, where supported, only adjust the faint wash, never the direction of flow.
- The header motion toggle remembers `armel-motion` in local storage; OS reduced-motion always takes precedence. Motion stays static without IntersectionObserver, while missing ResizeObserver falls back to resize/disclosure events. All content and native navigation remain usable without JavaScript. The current runtime stays below 3 KB gzip and uses no third-party animation package, canvas, or WebGL.
- `data/update-notes.json` contains the English originals; `data/update-translations/{it,fr,pt}.json` contains complete article translations, including headings, body copy, source labels and search metadata. `scripts/lib/update-locales.mjs` owns article routes and translation validation. `scripts/lib/update-ui.mjs` owns localized article navigation, dates and provenance labels.
- Each translation records a `source_sha256` of the English copy and historical status. Changes to that source require deliberate translation review and a new digest; incomplete or stale translations fail the build rather than silently showing English. `translated_on` dates translation work separately from the original publication and verified-commit dates.
- English article addresses remain `/updates/<slug>/`. Italian uses `/it/updates/<slug>/`, French `/fr/updates/<slug>/`, and Portuguese `/pt/updates/<slug>/`. Native language links retain the article; self-canonicals, reciprocal language annotations and sitemap alternates share these routes. Translated structured data references the English original with `translationOfWork`. The Atom feed retains one English entry per original article, not four duplicates.
- `scripts/lib/activity-copy.mjs` derives note display titles and `display_urls` from those same translations, used both in static HTML and after browser refresh. `data/activity-titles.json` only supplies reviewed display titles for external commits. Original titles, commit identifiers, source URLs, counts and activity dates are not rewritten; unknown future entries retain their source title and URL.

## Preview

```sh
node scripts/preview-site.mjs
```

Open [the local preview](http://127.0.0.1:4173/). Set `PORT` to choose a different port. The preview serves only an explicit public page/asset allowlist, never repository internals. Same-site anchor URLs are made local for language-switching checks; canonical metadata remains unchanged. This is a development preview, not a deployment server.

Before release, inspect all four languages, navigation, diagrams, disclosure controls, and long pages at phone, tablet, and desktop widths. Code-level regression tests do not replace that visual check. See `RELEASE_REVIEW.md` for what has and has not been verified.

## Indexing

Canonical URLs, reciprocal language annotations, author and project structured data, the Atom feed, and sitemap entries are generated from the same content records. Each project keeps an explicit editorial `modified` date in `data/projects.json`; the visible date, structured data, and sitemap must agree. `scripts/validate-site.mjs` rejects missing pages, broken internal links, duplicate metadata, incomplete author relationships, and sitemap drift.

### Programming activity checks

MyCasaPro activity comes directly from its public `Fuzzyslippers412/Mycasapro`
GitHub repository. Its website does not publish `updates.json`; do not restore
that URL without verifying a working feed. The project website link remains
`https://mycasapro.com`.

The hourly collector writes `checked_at` after polling the configured sources,
including checks that find no new entries. "Last checked" uses that timestamp,
with a localized date and 24-hour UTC time on homepages and update archives.
Older snapshots fall back to `generated_at`, never an article date or the browser
clock. Offline page views retain the last recorded check. `latest_item_at` and
each entry's date continue to describe the source material, not polling time.
A completed check does not imply every provider responded: failures are logged
and verified cached entries are retained. Refresh timestamps do not redate
articles or change their sitemap modification dates.

`node scripts/audit-search-surface.mjs --strict` measures the complete canonical graph, sitemap parity, crawl depth, localized evidence depth, and structured-data coverage. `node scripts/check-live-site.mjs` compares the live priority URLs, sitemap, robots file, and search favicon with the files on `main`. `.github/workflows/search-surface-health.yml` runs both checks after relevant pushes and daily.

External profile and project-site patches are generated into `authority/`. Source-specific patches for the inspected MyCasaPro, Au Jour Le Jour, and ChattyPatty repositories live in `authority/source-patches/`; they are validated but are not applied by the personal-site build. The Search Console operating plan is in `SEARCH_VISIBILITY.md`; read-only reporting setup is in `SEARCH_CONSOLE_SETUP.md`.

Preview the prepared GitHub profile and public-repository metadata changes with `node scripts/apply-github-authority.mjs`. The command is read-only unless `--apply` is supplied; repository pins remain a deliberate GitHub UI step because GitHub does not expose a supported mutation for them here.

## Release

Run `node scripts/build-site.mjs` to regenerate the site, validate routes and metadata, and run the presentation regression tests.

After committing a clean build, run `bash scripts/release-main.sh`. It refuses dirty worktrees and in-progress merges or rebases, rebuilds and audits the complete site, and rebases onto `origin/main`. Every retry rebuilds against the new upstream inputs before pushing without force. Only tracked generated HTML, feeds, and authority assets can be automatically reconciled; source edits or conflicts stop the release. The live check waits for Pages and compares priority pages, the stylesheet, and favicons. Set `SKIP_LIVE_CHECK=1` only when the post-deployment check will run separately.

Sitemap dates follow authored content dates in `data/site.json`, project records, research records, and programming notes. CSS changes and hourly refresh timestamps do not advance article dates. Update the relevant content date only after a substantive content or link change.
