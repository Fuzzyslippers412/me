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
node scripts/enhance-html.mjs
node scripts/render-static-data.mjs
node scripts/build-sitemap.mjs
node scripts/validate-site.mjs
```

Project activity and GitHub statistics are refreshed after source changes and at minute 17 of every hour by `.github/workflows/update-updates.yml`. Programming notes are sourced from explicit records in `data/update-notes.json`; private repositories require deliberately marked public updates.

## Indexing

Canonical URLs, reciprocal language annotations, author and project structured data, the Atom feed, and sitemap entries are generated from the same content records. `scripts/validate-site.mjs` rejects missing pages, broken internal links, duplicate metadata, incomplete author relationships, and sitemap drift.
