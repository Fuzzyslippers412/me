# Armel Tenkiang

Source for [armeltenkiang.com](https://armeltenkiang.com), the personal site of computer scientist and researcher Armel Tenkiang.

The site documents work on distributed systems, local-first software, private settlement, bounded model context, and verification-heavy tools. It is a static, multilingual GitHub Pages site with Italian as the default language and English, French, and Portuguese editions.

## Build

The rendered HTML is committed so pages remain complete without client-side JavaScript.

```sh
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
```

Project activity and GitHub statistics are refreshed after source changes and at minute 17 of every hour by `.github/workflows/update-updates.yml`. Programming notes are sourced from explicit records in `data/update-notes.json`; private repositories require deliberately marked public updates. Token and freshness requirements are documented in `ACTIVITY_AUTOMATION_SETUP.md`.

## Indexing

Canonical URLs, reciprocal language annotations, author and project structured data, the Atom feed, and sitemap entries are generated from the same content records. Each project keeps an explicit editorial `modified` date in `data/projects.json`; the visible date, structured data, and sitemap must agree. `scripts/validate-site.mjs` rejects missing pages, broken internal links, duplicate metadata, incomplete author relationships, and sitemap drift.

`node scripts/audit-search-surface.mjs --strict` measures the complete canonical graph, sitemap parity, crawl depth, localized evidence depth, and structured-data coverage. `node scripts/check-live-site.mjs` compares the live priority URLs, sitemap, robots file, and search favicon with the files on `main`. `.github/workflows/search-surface-health.yml` runs both checks after relevant pushes and daily.

External profile and project-site patches are generated into `authority/`. Source-specific patches for the inspected MyCasaPro, Au Jour Le Jour, and ChattyPatty repositories live in `authority/source-patches/`; they are validated but are not applied by the personal-site build. The Search Console operating plan is in `SEARCH_VISIBILITY.md`; read-only reporting setup is in `SEARCH_CONSOLE_SETUP.md`.

Preview the prepared GitHub profile and public-repository metadata changes with `node scripts/apply-github-authority.mjs`. The command is read-only unless `--apply` is supplied; repository pins remain a deliberate GitHub UI step because GitHub does not expose a supported mutation for them here.

## Release

After committing a clean build, run `scripts/release-main.sh`. It refuses dirty worktrees and in-progress rebases, rebuilds and audits the complete site, rebases onto `origin/main`, pushes without force, and checks the live GitHub Pages surface. Set `SKIP_LIVE_CHECK=1` only when the post-deployment check will run separately.
