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

The homepage is a selection, not the full inventory: MyCasaPro, Au Jour Le Jour, and Liga do Povo; a Galidima research aside; Listening; and five source-linked programming updates. Every project remains in its localized project index. Italian is the default; all four editions use the same composition.

- `data/projects.json` owns localized project summaries, status, evidence, and substantive modification dates. The homepage and project index render the same summary records.
- `scripts/lib/personal-home.mjs` owns the homepage selection, localized introduction, Listening links, and first-person About introduction. The invitation annotation references a named evidence item, not a copied paragraph.
- `scripts/lib/system-figures.mjs` contains localized architecture figures. Their text must remain consistent with the source-backed project notes; diagrams are not inferred capabilities.
- `scripts/lib/presentation.mjs` integrates page composition, the complete project index, and native section navigation.
- `style.css` owns the shared light palette, typography, page layouts, responsive rules, print styles, and accessibility fallbacks. No UI framework, animation library, tracking, or music embed is required.

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
