# Search visibility operations

This is the operating plan for making `armeltenkiang.com` the canonical source for Armel Tenkiang. It does not promise exclusive control of a results page; Google independently ranks lawful public pages. The practical objective is a strong cluster of useful pages on the personal domain, corroborated by real profiles and project websites.

## Observed baseline — September 1, 2026

- Exact-name searches surface `armeltenkiang.com`, with the English research page currently stronger than the homepage.
- Google still shows an older MyCasaPro description. The corrected local release has not reached the live site and been recrawled yet.
- SoundCloud is indexed under the full name and provides useful independent identity corroboration.
- Exact-name searches did not surface useful results from the GitHub profile or the MyCasaPro, Au Jour Le Jour, Respometer, and Liga do Povo domains.
- Some third-party and public-record results remain outside this repository's control.

Treat this as a point-in-time observation. Search Console is the source of truth for impressions, clicks, selected canonicals, and indexed-page state.

## Release gate

1. Run the complete build and `node scripts/validate-site.mjs`.
2. Push only through a non-force update of `main`.
3. Wait for GitHub Pages to publish.
4. Run `node scripts/check-live-site.mjs`; it compares the live priority surface with the files on `main`.
5. Confirm `https://armeltenkiang.com/sitemap.xml` succeeds in Google Search Console.
6. Inspect the priority URLs from `data/site.json` and request indexing only for pages that changed substantially.

The `Check live search surface` workflow performs step 4 after relevant pushes and once a day. A green repository with a red live-surface check means deployment or DNS is stale; it is not a reason to rewrite the pages again.

## First recrawl set

Request these after the pending release is live:

1. `https://armeltenkiang.com/`
2. `https://armeltenkiang.com/en/`
3. `https://armeltenkiang.com/en/about/`
4. `https://armeltenkiang.com/en/projects/`
5. `https://armeltenkiang.com/en/projects/mycasapro/`
6. `https://armeltenkiang.com/en/projects/au-jour-le-jour/`
7. `https://armeltenkiang.com/en/projects/chattypatty/`
8. `https://armeltenkiang.com/en/research/`
9. `https://armeltenkiang.com/en/research/galidima/`
10. `https://armeltenkiang.com/updates/`

Do not repeatedly request the same unchanged URL. A sitemap supports discovery but does not guarantee indexing or ranking.

## Authority network

The personal site already supplies the canonical name, Person entity, ProfilePage, project authorship, project domains, technical notes, reciprocal language annotations, and internal links. The largest remaining gap is evidence from outside this domain.

Every maintained project website should include one quiet, visible creator link in its footer or colophon:

```html
Created by <a href="https://armeltenkiang.com/en/" rel="author">Armel Tenkiang</a>.
```

Its application structured data should point to the same person identifier:

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "PROJECT NAME",
  "url": "PROJECT URL",
  "creator": {
    "@type": "Person",
    "@id": "https://armeltenkiang.com/#person",
    "name": "Armel Tenkiang",
    "url": "https://armeltenkiang.com/"
  }
}
```

Use the actual project name and URL. The visible link matters; structured data must not claim authorship that the page does not show.

Priority external domains:

| Domain | Link target |
| --- | --- |
| `mycasapro.com` | `https://armeltenkiang.com/en/projects/mycasapro/` |
| `aujourlejour.xyz` | `https://armeltenkiang.com/en/projects/au-jour-le-jour/` |
| `chattpattyxyz.com` | `https://armeltenkiang.com/en/projects/chattypatty/` |
| `respometer.com` | `https://armeltenkiang.com/en/projects/respometer/` |
| `ligadopovo.com` | `https://armeltenkiang.com/en/projects/liga-do-povo/` |
| `theo.farm` | `https://armeltenkiang.com/en/projects/theo-farm/` |
| `sound-check.ai` | `https://armeltenkiang.com/en/projects/soundcheck-ai/` |
| `ghostprotocol.io` | `https://armeltenkiang.com/en/projects/ghostprotocol/` |

The project-specific target is better than sending every link to the homepage because it gives users and crawlers direct corroborating context. Each project page already links back to its external domain.

## GitHub identity

GitHub still requires account-level work outside this repository:

- display name: `Armel Tenkiang`
- website: `https://armeltenkiang.com/`
- a factual one-line technical biography
- a public profile README in a repository named `Fuzzyslippers412`
- pinned repositories with complete descriptions and project-site links
- a visible author link from each public project README to the corresponding page on `armeltenkiang.com`

Do not expose private repositories to create activity signals. Contribution figures on the personal site must retain their `as of` date.

## SoundCloud and other profiles

SoundCloud already resolves under the full name. Its website field should point to `https://armeltenkiang.com/`. Add additional profiles to `sameAs` only after they are real, public, use the same full name, and link back to this domain. Do not create empty profiles merely to occupy results.

## Search Console measurement

Review the Search results Performance report weekly, using an exact query filter for `Armel Tenkiang` and a page filter for `armeltenkiang.com`.

Record:

- impressions and clicks for the exact-name query
- the page Google selected for the query
- click-through rate for the homepage, About, Projects, and Research
- Google-selected canonical in URL Inspection
- indexed/not-indexed state for new technical notes
- changes in the first page of an incognito exact-name search in the relevant country and language

Judge progress over 28-day comparisons, not daily position checks. Improve a low-click result by making its title and description more accurate, not by repeating the name inside the body.

## Publishing standard

New pages must contain original technical evidence: an architecture decision, invariant, failure mode, measurement, or verified release change. A useful note should stand on its own even if it received no search traffic.

Do not manufacture profiles, buy links, publish repetitive name pages, generate translated doorway pages, change dates without substantive edits, or scrape project feeds into thin pages. These shortcuts weaken the entity and may violate Google spam policies.

## Removal routes

SEO cannot delete third-party results. If a result exposes qualifying private information, use Google's `Results about you` or personal-information removal process. If a source page has changed but Google shows an old snippet, use the outdated-content refresh process. A legal delisting request is separate and depends on the applicable law and facts; obtain legal advice before relying on it.

## Google reference basis

- Search Essentials: `https://developers.google.com/search/docs/essentials`
- Helpful, reliable, people-first content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Recrawl requests: `https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl`
- Site names: `https://developers.google.com/search/docs/appearance/site-names`
- Sitelinks: `https://developers.google.com/search/docs/appearance/sitelinks`
- Search favicons: `https://developers.google.com/search/docs/appearance/favicon-in-search`
- Localized versions: `https://developers.google.com/search/docs/advanced/crawling/localized-versions`
- Spam policies: `https://developers.google.com/search/docs/essentials/spam-policies`
- Search Console performance analysis: `https://support.google.com/webmasters/answer/17010961`
- Personal-information removals: `https://support.google.com/websearch/answer/9673730`
