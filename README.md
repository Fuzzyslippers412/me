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

## Presentation

The homepage follows one reading sequence: an introduction; MyCasaPro, Au Jour Le Jour, and Liga do Povo; a Galidima research question; five source-linked programming updates; Listening; and a short personal closing. Every project remains in its localized project index. Italian is the default; all four editions use the same composition.

- `data/projects.json` owns localized project summaries, status, evidence, and substantive modification dates. The homepage and project index render the same summary records.
- `scripts/lib/personal-home.mjs` owns the homepage selection, localized introduction, Listening links, and first-person About introduction. The invitation annotation references a named evidence item, not a copied paragraph. Its detailed diagram stays on the project page; the homepage uses a native disclosure.
- `scripts/lib/system-figures.mjs` contains localized architecture figures. Their text must remain consistent with the source-backed project notes; diagrams are not inferred capabilities.
- `scripts/lib/presentation.mjs` integrates page composition, the complete project index, and native section navigation.
- `scripts/lib/river-presentation.mjs` adds shared mobile navigation, per-section decorative curves, French punctuation spacing, and localized motion controls. Project introductions precede their diagrams. Enhancement resets its own decorations before regenerating them, so repeated builds remain stable.
- `style.css` owns the shared light palette, typography, page layouts, responsive rules, print styles, and accessibility fallbacks. No UI framework, animation library, tracking, or music embed is required.
- Newsreader and Hanken Grotesk are self-hosted, with their licenses in `fonts/`. Each section owns a non-interactive river curve: in the desktop margin, then beside the single reading column on phones. Text is never hidden pending animation or JavaScript.
- `scripts/river.js` progressively enables a brief entrance, scroll-linked current, and restrained section motion. CSS view timelines are used when supported, with one-time intersection entrances as a fallback. The localized motion toggle remembers `armel-motion` in local storage; OS reduced-motion always takes precedence. There is no scroll interception or continuous JavaScript animation loop. Content and the native mobile menu remain usable without JavaScript.
- `data/activity-titles.json` owns reviewed display translations. `scripts/lib/activity-copy.mjs` shares them across archives, project notes, profiles, and static activity rendering. The data renderer also includes `display_titles` in the existing feed so browser refreshes keep the selected language. Original titles, commit identifiers, source URLs, counts, and dates are not rewritten; unknown future entries fall back to their source titles.

## Preview

```sh
node scripts/preview-site.mjs
```

Open [the local preview](http://127.0.0.1:4173/). Set `PORT` to choose a different port. The preview serves only an explicit public page/asset allowlist, never repository internals. Same-site anchor URLs are made local for language-switching checks; canonical metadata remains unchanged. This is a development preview, not a deployment server.

Before release, inspect all four languages, navigation, diagrams, disclosure controls, and long pages at phone, tablet, and desktop widths. Code-level regression tests do not replace that visual check. See `RELEASE_REVIEW.md` for what has and has not been verified.

## Indexing

Canonical URLs, reciprocal language annotations, author and project structured data, the Atom feed, and sitemap entries are generated from the same content records. Each project keeps an explicit editorial `modified` date in `data/projects.json`; the visible date, structured data, and sitemap must agree. `scripts/validate-site.mjs` rejects missing pages, broken internal links, duplicate metadata, incomplete author relationships, and sitemap drift.

`node scripts/audit-search-surface.mjs --strict` measures the complete canonical graph, sitemap parity, crawl depth, localized evidence depth, and structured-data coverage. `node scripts/check-live-site.mjs` compares the live priority URLs, sitemap, robots file, and search favicon with the files on `main`. `.github/workflows/search-surface-health.yml` runs both checks after relevant pushes and daily.

External profile and project-site patches are generated into `authority/`. Source-specific patches for the inspected MyCasaPro, Au Jour Le Jour, and ChattyPatty repositories live in `authority/source-patches/`; they are validated but are not applied by the personal-site build. The Search Console operating plan is in `SEARCH_VISIBILITY.md`; read-only reporting setup is in `SEARCH_CONSOLE_SETUP.md`.

Preview the prepared GitHub profile and public-repository metadata changes with `node scripts/apply-github-authority.mjs`. The command is read-only unless `--apply` is supplied; repository pins remain a deliberate GitHub UI step because GitHub does not expose a supported mutation for them here.

## Release

Run `node scripts/build-site.mjs` to regenerate the site, validate routes and metadata, and run the presentation regression tests.

After committing a clean build, run `bash scripts/release-main.sh`. It refuses dirty worktrees and in-progress merges or rebases, rebuilds and audits the complete site, and rebases onto `origin/main`. Every retry rebuilds against the new upstream inputs before pushing without force. Only tracked generated HTML, feeds, and authority assets can be automatically reconciled; source edits or conflicts stop the release. The live check waits for Pages and compares priority pages, the stylesheet, and favicons. Set `SKIP_LIVE_CHECK=1` only when the post-deployment check will run separately.

Sitemap dates follow authored content dates in `data/site.json`, project records, research records, and programming notes. CSS changes and hourly refresh timestamps do not advance article dates. Update the relevant content date only after a substantive content or link change.
