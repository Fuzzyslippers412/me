# Search visibility operations

This is the operating plan for making `armeltenkiang.com` the canonical source for Armel Tenkiang. It does not promise exclusive control of a results page; Google independently ranks lawful public pages. The practical objective is a strong cluster of useful pages on the personal domain, corroborated by real profiles and project websites.

## Observed baseline — September 1, 2026

- Exact-name searches surface `armeltenkiang.com`, with the English research page currently stronger than the homepage.
- Google still shows an older MyCasaPro description. The corrected local release has not reached the live site and been recrawled yet.
- SoundCloud is indexed under the full name and provides useful independent identity corroboration.
- Exact-name searches did not surface useful results from the GitHub profile or any of the eight linked project domains. A `site:` search snapshot also returned no project-domain pages. This is not a definitive index verdict; URL Inspection in each domain's Search Console property is authoritative.
- Some third-party and public-record results remain outside this repository's control.

Treat this as a point-in-time observation. Search Console is the source of truth for impressions, clicks, selected canonicals, and indexed-page state.

## Local implementation status

The repository now includes the following enforcement and deployment assets:

- `scripts/audit-search-surface.mjs` rejects sitemap drift, unreachable canonicals, broken internal authority paths, and thin project evidence in strict mode.
- the activity workflow requires an explicit account-level GitHub token, a fresh GraphQL contribution snapshot, complete numeric fields, and a non-force push after rebasing.
- GhostProtocol's mismatched external domain has been removed from the public link and `sameAs` graph until the domain represents the project again.
- GhostProtocol, Soundcheck.AI, and Theo.farm now have localized constraint, boundary, and verification/recovery frames.
- `authority/` contains a GitHub profile README, public repository metadata, seven reciprocal project-site patches, and research-release templates.
- `.github/workflows/search-console-report.yml` produces private weekly Search Console artifacts after its service-account secret is configured.

These changes are local until a successful non-force push and GitHub Pages deployment. External profile fields, project-site patches, GitHub secrets, Search Console access, DOI issuance, ORCID records, and manual recrawl requests cannot be completed from the personal-site repository alone.

## Search-result coverage map

The public search snapshot shows that the domain can rank for the name, but Google has not yet chosen the homepage as the dominant entity result in every context.

| Query intent | Surface observed | Interpretation | Next action |
| --- | --- | --- | --- |
| `Armel Tenkiang` | The English Research page from this domain surfaced prominently | The domain has name relevance; internal authority is landing on a deeper page | Publish the pending release, inspect the homepage and Research page in Search Console, and compare exact-name impressions by page |
| `Armel Tenkiang MyCasaPro` | The personal MyCasaPro page surfaced | The name-to-project relationship is understandable for this project | Reinforce it from MyCasaPro's own website and GitHub repository |
| `Armel Tenkiang Au Jour Le Jour` | No owned project result appeared in the snapshot | The relationship is asserted on the personal site but not yet externally corroborated or selected | Add reciprocal creator links, inspect both canonical pages, and publish a verifiable release note |
| `Armel Tenkiang ChattyPatty` | No owned project result appeared in the snapshot | The project name is ambiguous and the public authority chain is weak | Use one stable compound descriptor everywhere and establish a crawlable project homepage |
| `Armel Tenkiang Galidima` | No owned research result appeared in the snapshot | A site article alone has not created a durable external research identity | Turn the work into a substantive technical report or release before pursuing research profiles |
| project-name searches | Several project domains did not surface; some names overlap unrelated products | This is a brand-disambiguation problem as well as an indexing problem | Align title, H1, description, repository summary, creator line, and canonical project URL across every controlled surface |

The snapshot is directional, not a substitute for Google Search Console. `site:` queries and third-party search snapshots can omit indexed URLs or show stale copies.

## Forensic crawl result

The local release was crawled as a graph, not sampled page by page:

- 67 canonical indexable URLs were found and all 67 appear in `sitemap.xml`.
- 794 internal link edges were checked.
- no broken internal links, unreachable canonical pages, or sitemap omissions were found.
- every canonical page is within two clicks of its language homepage.
- canonical titles are unique.
- language coverage is complete across Italian, English, French, and Portuguese for the core profile, project, and research surfaces.
- schema coverage includes Person, ProfilePage, WebSite, CollectionPage, TechArticle, SoftwareApplication, BreadcrumbList, and ItemList where appropriate.

This rules out the common technical causes of weak discovery. More navigation, duplicate landing pages, or additional schema types would add complexity without addressing the actual constraint.

The content audit did find an evidence-depth imbalance. The English MyCasaPro, Au Jour Le Jour, Respometer, ChattyPatty, and Liga do Povo pages include system boundaries or implementation evidence. GhostProtocol, Soundcheck.AI, and Theo.farm are still close to catalogue entries, at roughly 87–101 words of main English content. Their translated versions inherit the same limitation.

Do not pad these pages. Add one concrete, first-hand technical unit to each:

| Page | Evidence needed |
| --- | --- |
| GhostProtocol | threat model, supported-chain boundary, proof/linkage record format, and one failure mode |
| Soundcheck.AI | filing ingestion path, source provenance, extraction validation, and correction/review path |
| Theo.farm | offline data boundary, conflict policy, delayed-sync behaviour, and recovery/export path |

A concise engineering frame of constraint, boundary, and verification is more valuable than another promotional paragraph.

## Live-release discrepancy

The live MyCasaPro result still exposes older architecture language, including the previous Next.js/FastAPI and LTI-agent description. The local canonical page now documents a Next.js 16/React 19 interface, Go HTTP API, PostgreSQL persistence, private attachments, and revocable contractor access.

The local release branch is ahead of the locally known `origin/main`, so the corrected search surface is not yet safely assumed to be deployed. This is the immediate blocker. Content cannot be recrawled until it exists on the live origin.

After the non-force release, verify all three layers separately:

1. the new commit exists on GitHub `main`
2. GitHub Pages serves the new identifying sentence and canonical metadata
3. URL Inspection's live test sees the same rendered content

Only then request recrawling. If the live page is correct but the indexed copy is old, waiting and measurement are appropriate; another rewrite is not.

## Research conclusion

The personal site is no longer limited by missing metadata. It already has crawlable HTML, unique titles and descriptions, canonical URLs, reciprocal `hreflang`, a complete sitemap, internal navigation, a Person/ProfilePage graph, project entities, article authorship, a feed, and live-deployment checks.

The limiting factor is now corroboration outside `armeltenkiang.com`:

- Google can use structured data to understand a page, but valid markup does not guarantee a rich result or ranking.
- Repeated recrawl requests do not make crawling faster and do not guarantee indexing.
- Google preserves result diversity. A strong navigational query may show several pages from one domain, but one domain should not be expected to occupy the whole results page.
- Knowledge Graph facts are assembled from multiple public sources. The personal site can be the canonical source, but it needs real external sources that repeat the same name-to-work relationship.

The next gains therefore come from a small, accurate network: the GitHub profile, maintained project domains, SoundCloud, and any genuine professional or publication profile that is kept current. More pages or more schema on the personal domain would have lower value.

## Evidence ladder

Each claim about the work should have the strongest public evidence that can be disclosed safely:

1. **Description** — what the system does. This is necessary but entirely self-published.
2. **Engineering frame** — constraint, ownership boundary, invariant, and recovery path.
3. **Dated provenance** — release, commit, changelog, public issue, benchmark, or technical note tied to the claim.
4. **Independent archive or citation** — a DOI-backed software release, maintained professional profile, talk, publication, or third-party technical reference.

The site is strong at levels 1 and 2 and has selected level-3 update notes. It is weak at level 4. That is why adding more adjectives to the biography will not materially strengthen the result set.

Private repositories do not need to be exposed. A public release note can document the design decision, date, public interface, and non-sensitive verification method without publishing secrets, customer data, infrastructure addresses, or internal prompts.

## External surface audit

The public-search snapshot and the locally available project sources were checked on September 1, 2026. No project code was changed during this audit.

| Surface | Observed state | Highest-value correction |
| --- | --- | --- |
| GitHub profile | Search snapshot title is `Fuzzyslippers412 · GitHub`; no full display name, biography, website, or profile README was visible | Publish the full name, canonical website, factual biography, profile README, and deliberate repository pins |
| MyCasaPro website source | `docs/index.html` has a useful title, description, and visible page copy; no canonical, sitemap, robots file, visible creator link, or application graph was found | Add the search-discovery files and a visible project-specific creator link |
| Au Jour Le Jour website source | `docs/index.html` has a title, short description, and visible page copy; no canonical, sitemap, robots file, visible creator link, or application graph was found | Add the search-discovery files and a visible project-specific creator link |
| ChattyPatty repository | No static public website surface was found in the checked repository | Establish a crawlable project homepage before treating the domain as an authority node |
| Respometer, Liga do Povo, Theo.farm, Soundcheck.AI, GhostProtocol | Local deployment sources were not available in the checked workspace and search snapshots returned no indexed pages | Inspect the live canonical homepage in its own Search Console property before making changes |
| SoundCloud | The full-name profile is indexed and is currently the clearest external corroborating profile | Set its website field to the canonical personal homepage and keep the full name stable |

The missing project-site elements do not by themselves explain non-indexing. They are a discovery and corroboration gap. For each live domain, URL Inspection must still establish whether Google encountered a crawl block, duplicate canonical, soft 404, rendering problem, or simply has not selected the page.

## Project-name disambiguation

Several project names compete with unrelated products or generic concepts. The personal site already uses useful descriptive titles; the external sites and repositories must use the same language. A stable compound name gives search engines a repeatable entity label without keyword stuffing.

| Project | Stable search-facing label |
| --- | --- |
| MyCasaPro | `MyCasaPro — Private Home-Repair Operations` |
| Au Jour Le Jour | `Au Jour Le Jour — Private Household Ledger` |
| ChattyPatty | `ChattyPatty — Distributed Inference` |
| Respometer | `Respometer — Current-Event Analysis` |
| Liga do Povo | `Liga do Povo — Pickup Football Directory` |
| Theo.farm | `Theo.farm — Offline Farm Operations` |
| Soundcheck.AI | `Soundcheck.AI — Public-Filing Analysis` |
| GhostProtocol | `GhostProtocol — Private Transaction Research` |

Use the label in the page title and repository summary, while keeping the visible H1 as the project name. Every external domain must be checked before it remains in the authority graph: the live page should actually represent the project, resolve to one canonical HTTPS host, and visibly identify Armel Tenkiang as creator. An expired, parked, mismatched, or repurposed domain is a negative signal and should be removed from the personal site until corrected.

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

GitHub is the first external correction because it is already crawlable, relevant to the work, and capable of ranking for a developer's name. GitHub's own documentation supports a public profile README and pinned repositories. The current search snapshot instead presents only the handle and weak repository summaries.

Set the account fields to:

- display name: `Armel Tenkiang`
- website: `https://armeltenkiang.com/`
- biography: `Computer scientist and researcher working on distributed systems, local-first software, and verification.`
- a public profile README in a repository named exactly `Fuzzyslippers412`
- pinned repositories: MyCasaPro, Au Jour Le Jour, ChattyPatty, and the personal site
- a visible author link from each public project README to the corresponding page on `armeltenkiang.com`

Replace the repository summaries visible in the snapshot:

| Repository | Current search-facing summary | Recommended factual summary |
| --- | --- | --- |
| `Mycasapro` | `home AI` | `Private home-repair operations for requests, estimates, appointments, invoices, and durable contractor access.` |
| `me` | `=)` | `Multilingual personal site and technical notes for Armel Tenkiang.` |
| `AuJourLeJour` | none visible | `Private household ledger for recurring essentials, monthly planning, sharing, and recoverable backups.` |
| `ChattyPatty` | none visible | `Distributed inference system with lease scheduling, deterministic usage receipts, and provider attestations.` |

Set each repository's website field to its live project domain. The profile README should link the full name to `https://armeltenkiang.com/` and each project name to the matching canonical project page. Keep it concise; it should orient a reader, not duplicate the personal site.

Do not expose private repositories to create activity signals. Contribution figures on the personal site must retain their `as of` date.

### Activity automation finding

The checked snapshot in `data/profile.json` is dated August 17, 2026 and reports 223 contributions in the preceding contribution year. The repository history shows successful daily `github-actions[bot]` refreshes through August 17 and none afterward. That is an operational failure, not a search-engine delay.

The local workflow is materially safer than the currently known remote version: it adds a push trigger, concurrency control, an explicit account-token requirement, a three-day freshness failure, GraphQL source verification, the complete render chain, and non-force fetch/rebase/push retries. Publish it first, then run it manually and inspect the first failed step if the snapshot does not advance. The likely categories are token access, GraphQL visibility, workflow write permissions, branch protection, or a push race; the action log must identify which one.

Do not present a stale contribution number as live. Until the action succeeds, the UI should keep the explicit `as of` date. A failed API request must never replace the last verified count with zero.

## Education and biography claims

The biography currently uses `School of Computer Science (SCS)` without naming an institution. Search did not reveal an independent institutional result connecting the exact name with that phrase.

The site should be precise, not suggestive:

- if the institution and study status are public and verifiable, name them exactly and link the actual institutional or alumni source where one exists;
- if the statement cannot be publicly corroborated, keep it as a plain first-person biographical statement and do not add `alumniOf`, a degree, dates, or an institutional logo to structured data;
- do not phrase attendance as graduation unless that is factually correct.

Ambiguous prestige signalling is weaker than a modest, exact statement. The strongest senior signal on this site is the quality of the engineering evidence.

## Citable technical work

For a researcher identity, self-description should eventually resolve to durable outputs. The cleanest path for software work is a real public release rather than a manufactured biography page.

1. Choose one public repository with a useful, stable release.
2. Add an explicit licence, release notes, citation metadata, and a concise architecture document.
3. Connect the repository to Zenodo and archive a tagged release to receive a DOI.
4. Cite that DOI on the corresponding project page and in the repository README.
5. Create or use an ORCID record only when there are genuine outputs to maintain there, then add the DOI-backed software release.

Google Scholar should be reserved for actual scholarly papers or technical reports. A Galidima report would need a separate crawlable page or PDF with title, author, date, abstract, method, evaluation, limitations, and references. Relabelling a short website note as a paper would reduce credibility.

## SoundCloud and other profiles

SoundCloud already resolves under the full name. Its website field should point to `https://armeltenkiang.com/`. Add additional profiles to `sameAs` only after they are real, public, use the same full name, and link back to this domain. Do not create empty profiles merely to occupy results.

## Search Console measurement

Create or confirm one Domain property for each owned domain. A sitemap submitted in the personal site's property cannot report indexing for a separate project domain.

For each project property, inspect this sequence:

1. the canonical homepage URL
2. the exact URL reached after redirects
3. crawl permission and page fetch
4. user-declared and Google-selected canonical
5. referring page and sitemap discovery
6. last crawl and index verdict

If the homepage is eligible, submit that domain's sitemap once and request indexing for the homepage once. Fix the stated reason before asking again when it is not eligible.

Review the Search results Performance report weekly, using an exact query filter for `Armel Tenkiang` and a page filter for `armeltenkiang.com`.

Record:

- impressions and clicks for the exact-name query
- the page Google selected for the query
- click-through rate for the homepage, About, Projects, and Research
- Google-selected canonical in URL Inspection
- indexed/not-indexed state for new technical notes
- changes in the first page of an incognito exact-name search in the relevant country and language

Judge progress over 28-day comparisons, not daily position checks. Improve a low-click result by making its title and description more accurate, not by repeating the name inside the body.

### Result-set ledger

Keep one monthly record of the first twenty exact-name results in the primary country/language contexts. For each result record the domain, URL, title, result type, position band, whether it is controlled, and whether the snippet is accurate. Do not obsess over single-position movement; record changes in four bands: 1–3, 4–10, 11–20, and absent.

Pair that manual ledger with Search Console data:

- exact query: `Armel Tenkiang`
- close query variants and misspellings
- pages receiving those impressions
- country and device differences
- 28-day and 90-day comparisons

Search Console hides some low-volume or anonymized queries, so the performance report and manual result-set ledger answer different questions.

## Sitemap date integrity

The current sitemap has 62 URLs dated September 1 because the release changed the shared search surface broadly. That is defensible only when those page changes are real. Google says it uses `<lastmod>` when the value is consistently and verifiably accurate and reflects the last significant page update.

The build currently derives most page dates from each file's Git history, which is the right direction. Preserve that behaviour. Do not bump every URL for a statistics-only refresh, formatting pass, or build timestamp. Home and update-archive dates may follow visible activity; project and research dates should move only when their own visible content, links, or structured facts materially change.

## 30/60/90-day programme

### Days 0–7 — make the current work real

1. Publish the two pending commits without force-pushing and confirm the GitHub Pages deployment.
2. Run the live-surface check and compare the live MyCasaPro sentence, canonical URL, schema, sitemap, and favicon with `main`.
3. Manually run the project-feed workflow; require a fresh `data/profile.json` and a successful non-force bot push.
4. Inspect the ten priority URLs in Search Console and record Google-selected canonicals and index reasons.
5. Correct the GitHub display name, biography, website, profile README, repository summaries, website fields, and pins.
6. Verify every linked project domain is controlled, canonical, crawlable, and still represents the named project.
7. Submit each owned domain's own sitemap in its own Domain property.

Success criterion: the live origin matches the repository, the activity snapshot is no more than three days old, and every priority URL has a recorded Search Console state.

### Days 8–30 — close the corroboration gap

1. Add a visible creator link and matching SoftwareApplication creator graph to every controlled project homepage.
2. Give each project one stable compound descriptor across its domain, repository, personal project page, and social preview.
3. Add substantive engineering frames to GhostProtocol, Soundcheck.AI, and Theo.farm; do not publish filler.
4. Publish two first-hand technical notes tied to real releases or commits, with explicit limitations and provenance.
5. Point the SoundCloud website field and any maintained professional profile to the canonical homepage.
6. Establish the exact-name Search Console baseline and monthly result-set ledger.

Success criterion: every active public project forms a reciprocal three-node chain — personal project page, project domain, and repository — using the same name, descriptor, creator, and canonical URLs.

### Days 31–60 — create durable independent artifacts

1. Prepare one public repository for a clean tagged release with licence, citation metadata, architecture notes, and reproducible instructions.
2. Archive the release through Zenodo and add the resulting DOI to the project page and README.
3. Create or complete an ORCID record only if it will contain that genuine output and be maintained.
4. Expand Galidima into a technical report only if there is enough real method, evaluation, and limitation evidence.
5. Seek legitimate technical references: project documentation, conference or community talk pages, package registries, or collaborator acknowledgements that independently describe the work.

Success criterion: at least one claim on the personal site resolves to a durable third-party archive or publication record, not merely another self-authored profile.

### Days 61–90 — consolidate what Google selected

1. Compare 28-day and 90-day exact-name performance by landing page, country, and device.
2. Improve titles only where Search Console shows impressions but the snippet is inaccurate or click-through is weak.
3. Update pages with actual release evidence, not artificial freshness.
4. Remove or correct project domains that remain parked, mismatched, uncrawlable, or unmaintained.
5. Use the Search Console API for reporting if desired; keep indexing requests manual and evidence-driven.
6. Review qualifying inaccurate, outdated, or private third-party results through publisher correction or Google's legitimate removal routes.

Success criterion: the homepage is a stable exact-name landing page, owned project and profile surfaces are represented in the first twenty results, and every published identity claim has a traceable source.

## What will not work

- adding dozens of near-duplicate biography pages
- repeating `Armel Tenkiang` unnaturally in headings or metadata
- changing timestamps without substantive edits
- buying guest posts or placing third-party pages on high-authority sites solely to exploit their ranking signals
- creating empty social, academic, or business profiles
- using the Indexing API for ordinary profile and project pages
- presenting private work as independently verified
- promising that lawful government, legal, or public-record pages can be removed through SEO

The realistic objective is to make the personal domain the clearest canonical source and surround it with enough accurate, useful, independent corroboration that searchers see a fuller body of work. Search ranking cannot guarantee exclusive control of a name query.

### Safe automation boundary

The Search Console API can submit sitemaps, query Search Analytics, and inspect URL index state after one-time OAuth or service-account setup. A later GitHub Action can record:

- sitemap submission state
- Google-selected canonical
- last crawl date
- index verdict for the priority URLs
- exact-name impressions, clicks, and selected landing pages

The URL Inspection API does not request indexing. Google's Indexing API is restricted to `JobPosting` and livestream `BroadcastEvent` pages and must not be used for this site. Individual indexing requests remain a manual Search Console action and should be reserved for substantial changes.

## Identity image decision

A real, public portrait on the About page would create a second discoverable surface in Google Images and give ProfilePage markup a representative image. This is optional, not a technical requirement.

If a portrait is added, use an actual high-resolution photograph in a normal `<img src>` element near the biography, with a descriptive filename and alt text. Do not use the logo, favicon, generated face, or placeholder as the Person image. Google explicitly recommends omitting the ProfilePage image property when there is no real profile image.

## Publishing standard

New pages must contain original technical evidence: an architecture decision, invariant, failure mode, measurement, or verified release change. A useful note should stand on its own even if it received no search traffic.

Do not manufacture profiles, buy links, publish repetitive name pages, generate translated doorway pages, change dates without substantive edits, or scrape project feeds into thin pages. These shortcuts weaken the entity and may violate Google spam policies.

## Removal routes

SEO cannot delete third-party results. If a result exposes qualifying private information, use Google's `Results about you` or personal-information removal process. If a source page has changed but Google shows an old snippet, use the outdated-content refresh process. A legal delisting request is separate and depends on the applicable law and facts; obtain legal advice before relying on it.

## Google reference basis

- Search Essentials: `https://developers.google.com/search/docs/essentials`
- Helpful, reliable, people-first content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google ranking systems: `https://developers.google.com/search/docs/appearance/ranking-systems-guide`
- Page experience: `https://developers.google.com/search/docs/appearance/page-experience`
- Title links: `https://developers.google.com/search/docs/appearance/title-link`
- Sitemap construction and accurate `lastmod`: `https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap`
- JavaScript search basics: `https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics`
- Recrawl requests: `https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl`
- Site names: `https://developers.google.com/search/docs/appearance/site-names`
- Sitelinks: `https://developers.google.com/search/docs/appearance/sitelinks`
- Search favicons: `https://developers.google.com/search/docs/appearance/favicon-in-search`
- Image SEO: `https://developers.google.com/search/docs/appearance/google-images`
- ProfilePage structured data: `https://developers.google.com/search/docs/appearance/structured-data/profile-page`
- Structured data policies: `https://developers.google.com/search/docs/appearance/structured-data/sd-policies`
- Localized versions: `https://developers.google.com/search/docs/advanced/crawling/localized-versions`
- Spam policies: `https://developers.google.com/search/docs/essentials/spam-policies`
- Generative-content guidance: `https://developers.google.com/search/docs/fundamentals/using-gen-ai-content`
- Site reputation policy update: `https://developers.google.com/search/blog/2026/08/update-site-reputation-policy`
- Search Console performance analysis: `https://support.google.com/webmasters/answer/17010961`
- Search Console API reference: `https://developers.google.com/webmaster-tools/v1/api_reference_index`
- Search Console authorization: `https://developers.google.com/webmaster-tools/v1/how-tos/authorizing`
- Indexing API scope: `https://developers.google.com/search/apis/indexing-api/v3/using-api`
- GitHub profile customization: `https://docs.github.com/en/account-and-profile/how-tos/profile-customization`
- GitHub content citation and Zenodo: `https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content`
- Zenodo GitHub integration: `https://help.zenodo.org/docs/github/`
- Google Scholar inclusion: `https://scholar.google.com/intl/en-us/scholar/inclusion.html`
- Personal-information removals: `https://support.google.com/websearch/answer/9673730`
