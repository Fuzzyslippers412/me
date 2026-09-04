# Release review — 4 September 2026

## Implemented

- Replaced the accumulated stylesheet with a shared, light editorial system: paper, carbon, blue, and restrained oxide accents. Smaller type, a serif nameplate, margin headings, compact project rows, and separate treatments for reading pages and activity lists.
- Put projects ahead of the biography. MyCasaPro remains first and labelled in the lab; live projects keep explicit status labels. Project names link to the corresponding localized technical pages.
- Kept Italian as the default, with coordinated English, French, and Portuguese navigation and presentation. English-only programming notes remain disclosed as English rather than falsely labelled translated.
- Added section navigation to longer technical pages and contextual project-to-research links. Existing research hubs link back to the projects.
- Preserved the first-person profile and supplied SCS wording. No new degree, employer, affiliation, performance result, or product-completion claim was invented.
- Preserved source-grounded implementation descriptions and the distinction between current MyCasaPro and its archived proof/settlement experiment. No application source files were edited.
- Preserved the stable Person identifier, ProfilePage and author relationships, language-specific canonicals, reciprocal hreflang, readable HTML, and real public-source update links.
- Removed Git dirty-state dates from sitemap generation. Modification dates now come from explicit content records. Corrected the research-output publication date to match Galidima's article record.
- Updated the A favicon in SVG, 16/32/48px ICO, 48px PNG, and 512px PNG. Replaced the social preview with the same visual language.
- Added one build command and regression tests. Release retries rebuild after each rebase and reconcile only tracked generated artifacts; merges, conflicts, and source edits stop the release. Live checks now include the stylesheet and both PNG favicon sizes.
- Fixed UTC date formatting in both client activity scripts. Missing GitHub measurement provenance is explicitly disclosed, without inventing a fresh count or source field.

## Verification

- All 70 HTML files pass validation; 67 canonical pages match the sitemap.
- The search-surface audit reports zero unreachable pages and a maximum crawl depth of two. Its content checks are heuristics, not a Google quality score.
- Tests cover four-language project ordering and copy parity, single featured-project rendering, repeated presentation passes, section anchors, semantic sitemap dates, asset budgets, accessibility fallbacks, and UTC activity rendering.
- Two complete builds produce identical repository output. `git diff --check` and shell syntax validation pass.
- The generated social-preview PNG was visually inspected. Full-page browser screenshots, responsive browser interaction, Lighthouse, and field Core Web Vitals have not been measured in this session: local browser preview was blocked by the environment.

## External gates

- GitHub fetch/push is blocked in this session by DNS resolution. This work is not confirmed deployed.
- The committed GitHub snapshot is dated 2 September and lacks the measurement-source marker required by the current GraphQL verifier. The strict freshness check rejects it. The UI now marks it as a cached snapshot awaiting verification. A successful authorized activity workflow must replace it; adding the marker manually would not verify the numbers.
- GitHub and Search Console credentials are unavailable in this session. No account settings, property inspections, sitemap submissions, or external profile changes were performed.
- Reciprocal creator snippets and repository-profile material are prepared under `authority/`. They remain unapplied to external applications, in line with the read-only application scope.
- Source-backed copy, crawlability, and internal links improve the site's foundations; they cannot guarantee first position, sitelinks, or exclusion of third-party results.

## Search references

- [Google: sitelinks](https://developers.google.com/search/docs/appearance/sitelinks) — logical organization and concise internal link text; selection remains automated.
- [Google: sitemap dates](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) — accurate significant-modification dates, not rebuild timestamps.
- [Google: ProfilePage](https://developers.google.com/search/docs/appearance/structured-data/profile-page) and [Article](https://developers.google.com/search/docs/appearance/structured-data/article) — identity and authorship relationships, without a guaranteed search appearance.
- [Google: Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals) — measure deployed user experience before claiming results.

## Release

From a clean committed checkout, run `bash scripts/release-main.sh`. It rebuilds, tests, rebases, pushes without force, and waits for the live files to match. Search Console and external-profile work remain separate account-authorized steps.
