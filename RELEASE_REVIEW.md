# Mobile river visibility - local preview, 12 October 2026

- Increased mobile ink contrast and the celadon wash without changing the reading column. Widened the decorative drawing from 26px to 30px (24px to 26px on narrow phones); it remains inside the margin.
- Lengthened the moving highlight from 96px to 144px and shortened its cycle from 26s to 22s on mobile only. Preserved the 556px dash period and section alignment. Denser mobile curve sampling softens bends; desktop geometry and styling are unchanged.
- Full build: 54 passing tests, including mobile curve clearance across seven section types, two gutter widths and three section heights. Reduced-motion, offscreen pausing, hidden tabs and saved preferences remain covered.
- Browser: all 100 canonical pages at 320px and 430px, plus 64 representative checks at 390px, 900px, 901px and 1440px. No horizontal overflow, broken joins or clipped content. Conservative curve-control bounds keep the wash at least 3.47px clear of the text column in the phone matrix.
- Inspected all four mobile homepages; verified disclosure remeasurement and pause/resume in each language. No content, search metadata, activity data or layout changes. Evidence is in ignored `reports/mobile-river-polish/`.
- Local only, awaiting visual approval. No push. Browser checks use simulated viewports, not physical devices or a cross-engine certification. Backups and the four differing files remain untouched.

# Connected river - local preview, 12 October 2026

## Built

- Replaced the repeated reveal-only line with layered ink contours, a celadon wash, and continuously travelling highlights. Section-specific curves connect across measured gaps; cumulative path lengths align the current at joins. The homepage has a more pronounced opening and Listening curve, while reading pages stay quieter.
- Added an inset phone gutter and reduced strand count rather than shrinking the desktop drawing. Geometry follows translated copy, font loading, viewport changes, and disclosure expansion. Intermediate-width reading-page overflow found during QA was fixed.
- Moved the localized motion toggle to the header. Preserved the saved preference and OS reduced-motion override; offscreen and hidden-tab currents pause. Text no longer shifts on section entry. Script-free HTML retains static ink drawings and complete content.
- No new animation dependency, font, raster asset, canvas, WebGL, or permanent JavaScript frame loop. Only event-driven geometry measurements use requestAnimationFrame.

## Verified

- Full build validates 103 HTML files and 100 canonical sitemap URLs with zero search-audit errors; all 53 tests pass. Regression tests cover geometry, gap joining, ResizeObserver, coalesced measurements, visibility, motion preferences, and language consistency.
- In-app browser: all 100 canonical pages at 320px and 1440px, plus 224 checks across 28 representative pages at 320, 390, 640, 768, 900, 901, 1050, and 1440px. After waiting for measured geometry, no horizontal overflow, out-of-viewport content/river, missing header control, invalid path, or broken river join.
- Actual language clicks across IT/EN/FR/PT retained the MyCasaPro article and the paused preference. Verified mobile menu dismissal/focus return and live remeasurement after expanding the homepage project disclosure. The current advanced while scroll position and heading position stayed unchanged; offscreen currents were paused.
- Compared 180-frame idle samples before/after at 390px and 1440px in the in-app browser: median interval 16.7ms for both versions; after-change 95th percentile 18.5ms at both sizes, with no sampled interval over 34ms. This is a short local comparison, not a physical-device performance guarantee.
- Compared all 103 HTML files against the pre-change snapshot: visible content (excluding the motion control) and search metadata unchanged. Source data, activity counts, feeds, sitemap, robots file, and the four differing copies are unchanged. Reports and screenshots are kept in ignored `reports/river-current/`, outside the preview allowlist.

## Limits

- Not yet pushed or deployed. Physical iOS/Android hardware, other browser engines, and OS-level reduced-motion emulation have not been tested here. OS preference changes are covered by the runtime regression harness; the script-free presentation was also inspected in the browser.

# Article translations - approved release, 12 October 2026

## Built

- Translated all 11 English programming articles in full into Italian, French and Portuguese: 33 new pages, 44 article pages total. Headings, body paragraphs, provenance, historical warnings, dates, navigation and metadata are localized.
- Language links retain the article. Italian articles use `/it/updates/`, French `/fr/updates/`, Portuguese `/pt/updates/`; existing English `/updates/` addresses remain unchanged. Archives, project pages, profiles and static/browser-refreshed activity link to the selected language.
- A single translation catalog drives article copy and incoming link titles. The build rejects missing, incomplete or stale translations and evidence-field overrides. Translation dates are identified separately from the original published/modified and commit dates.
- Added reciprocal language annotations, self-canonicals, translation relationships in structured data and sitemap entries. Original English text, public source citations, commit hashes, project facts, GitHub counts, activity timestamps, Atom feed and river styling are unchanged.

## Verified

- Full build: 103 HTML files, 100 canonical sitemap URLs, 25 pages per language, zero search-surface audit errors or unreachable pages, maximum crawl depth two; all 45 regression tests pass.
- 44 actual mobile language-link clicks across all 11 articles retained the article slug, selected language and active indicator. 176 layout checks across all 44 articles at 320, 430, 768 and 1440 CSS pixels found no horizontal overflow, off-screen text/controls, broken displayed images or missing/duplicate H1.
- Tested refreshed homepage activity links, article menus and Escape dismissal, contents anchors, project return links, archive entry links and visible historical warnings in all four languages. Inspected Italian, French, Portuguese and English phone views, French technical sections, and the Italian desktop preview. Browser inspection reported no warnings or errors.
- Regression tests cover complete article bodies, citation/date preservation, missing/stale translation rejection, reciprocal language switches, localized incoming links across all canonical pages, safe browser activity URLs, private preview exclusions and repeatable markup enhancement.
- A repeated full build was byte-for-byte stable across the 202 then-present tracked/untracked files. Syntax checks and `git diff --check` passed. Browser evidence is in ignored `reports/article-translations/`; preview screenshots are outside the repository.

## Publication gate

- The user approved the local preview and requested publication. Run the final build, integrate upstream changes without force-pushing, and verify the deployed files after pushing. The existing untracked files with ` 2` suffixes remain untouched and must not be staged.
- Browser testing used simulated viewports, not physical phones. No live deployment, indexing/ranking, Lighthouse or Core Web Vitals claim is made. This revision changes translations and their routing, not animation behaviour or source activity freshness.

---

# Previous review - mobile river refinement, approved release

## Built

- Preserved the approved palette, fonts, project copy, and editorial sequence. Replaced wrapped mobile navigation with a native disclosure menu and a separate four-language row.
- Added per-section decorative curves sized by their content, a short intro current, scroll-linked current where CSS view timelines are supported, one-time heading entrances, and a brief Listening wash. No scroll hijacking, hidden text, autoplay, animation framework, or continuous JavaScript loop.
- Added localized motion controls with a saved preference and mandatory reduced-motion override. Without JavaScript, the curves are static and the native menu/content remain available.
- Refined mobile spacing, project metadata, full-width activity titles, and Listening strips. Project introductions now come before diagrams in document order. French punctuation remains attached to the preceding word in static HTML and after activity refresh.
- Final polish aligns all six homepage curves at tablet widths, tapers their endings, and prevents decorative SVGs from adding paragraph/heading margins. Restored reading-page lead typography, enlarged breadcrumb targets, added full language names for assistive technology, and matched keyboard-focus feedback to hover on activity and Listening links. Italian uses “Menù”.

## Verified

- Complete build: 70 HTML files validated, 67 canonical sitemap URLs, strict search-surface audit, and 37 passing regression tests.
- 670 browser layout checks across all 67 canonical pages at 320, 360, 390, 430, 640, 641, 768, 900, 901, and 1440 CSS pixels: no horizontal overflow, off-screen content, missing/duplicate H1, or broken displayed images. Homepage river alignment also passed at each width in all four editions.
- Visually inspected Italian mobile, French 320px full-page, English desktop, and Portuguese mobile project views. Checked mobile menu opening and Escape dismissal with focus return. Twenty language-switch checks across Home, About, Projects, MyCasaPro, and Galidima retained the corresponding page and active-language marker.
- Browser interaction verified the motion toggle, its persistence across language navigation, and scroll-linked current progression. Regression tests cover OS preference changes, denied storage, missing IntersectionObserver, one-time entrances, menu Escape handling, and repeated markup enhancement.
- Stylesheet: 6,486 bytes gzip. New motion controller: 802 bytes gzip. No added font or third-party request. Evidence is in the ignored `reports/mobile-river/` directory and is excluded from the preview allowlist. Final-polish layout and language-switch results have separate `polish-` files there.
- No changes to source activity data, contribution counts, sitemap, Atom feed, project descriptions, or substantive content dates. This is a presentation revision, not a data refresh.
- A repeated full build produced no file-content drift. JavaScript syntax checks and `git diff --check` passed. The final desktop browser inspection reported no console warnings or errors.

## Release gate and limits

- The user approved publication after the final local polish. The release build passed all 37 tests; the remote main branch matched the local baseline before committing. Verify the deployed files after pushing. Existing untracked files with ` 2` suffixes remain untouched and are excluded from the release.
- Browser checks use simulated viewports, not physical iOS/Android devices. OS reduced-motion changes were simulated in regression tests, not changed on the user's computer. Print, forced-colour mode, and 200% text zoom have not been visually exercised in this revision. No Lighthouse or live Core Web Vitals measurements were taken.
- Existing long-form programming notes remain English where no translation is authored; localized navigation and link labels do not imply translated article bodies.

---

# Previous release review - 11 October 2026

## Approved local preview

- Implemented the porcelain, stone, ink, and river-green presentation; shared self-hosted Newsreader headings; the refined A identity in browser/touch icons and social preview; and a restrained decorative margin line.
- Reordered the homepage to introduction, selected work, research, programming updates, Listening, and personal closing. The MyCasaPro invitation diagram remains on its project page. Project status and substantive project descriptions are unchanged.
- All four editions share the same composition, navigation, reading styles, and mobile rules. Existing translated programming-note titles now also appear in project/profile lists and live/static activity; original evidence is preserved.
- Local and live presentations differed before this work. Local baseline: `9875e09`; remote main lookup returned `58a6877b7f95c39fe2044549404db1129f37d485`. The user approved the local preview and requested publication. Preserve upstream activity snapshots when integrating this presentation; verify the deployment separately after pushing.

## Verified in this revision

- Complete build: 70 HTML files validated, 67 canonical sitemap URLs, strict search-surface audit, and 26 passing regression tests.
- 335 browser layout checks: all 67 canonical pages at 320, 390, 768, 1024, and 1440 CSS pixels. No horizontal overflow, off-screen content, missing H1, duplicate H1, or broken displayed images were found.
- Visually inspected the full Italian desktop/mobile homepage, French narrow-phone homepage, English desktop homepage, Portuguese desktop homepage, and Portuguese mobile MyCasaPro diagram and article. Screenshots and browser-check results are under the ignored `reports/river-preview/` directory, outside the preview allowlist.
- Switched through all four languages on Home, About, Projects, MyCasaPro, and Galidima. The corresponding page and active-language marker were retained. Tested visible keyboard focus and keyboard opening of both homepage disclosures and the project contents menu.
- All tested palette pairs exceed 4.5:1 normal-text contrast. Reduced-motion, forced-colour, and print fallbacks remain explicit stylesheet rules. This is not a complete accessibility certification.
- Stylesheet: 5,398 bytes gzip; additional Newsreader font: 28,800 bytes. No new client-side dependency, third-party font request, autoplay, scroll interception, or animation library.
- Two consecutive full builds produced identical tracked file contents. Syntax checks and `git diff --check` passed. Sitemap, profile counts, project records, and expertise records have no diff. Activity records match the baseline exactly after excluding the new display-translation field.

## Remaining release gates

- The requested visual approval is complete. Remote integration, release build, and deployed-file verification are the remaining publication checks.
- Browser checks used simulated viewport sizes, not physical iOS/Android devices. Actual OS reduced-motion/high-contrast settings, print preview, and 200% browser zoom were not exercised; CSS fallbacks and static HTML were checked instead.
- No Lighthouse, live Core Web Vitals, Search Console, or ranking measurements were performed. Authored long-form update articles remain in their original English; localized navigation and translated link labels do not claim translated article bodies.
- This is a presentation change, not an activity refresh. Existing source timestamps and GitHub counts were preserved, not advanced to the current date.
- Existing untracked files with ` 2` suffixes were left untouched and must not be blindly staged.

---

# Previous review - 6 September 2026

## Built in this revision

- Replaced the homepage inventory with three selected projects: MyCasaPro, Au Jour Le Jour, and Liga do Povo. All eight projects remain in the complete localized project index. MyCasaPro remains in the lab.
- Introduced a light chalk, celadon, charcoal, and restrained red-brown palette; a smaller serif name; an unboxed A; and a static header. Removed the repeated panel layout and credential blocks.
- Put the lead project beside a Galidima research question. Supporting projects have their own spacing and proportions. MIDI, Daytime, and Nighttime have a distinct Listening section, with direct SoundCloud links and no player or autoplay.
- Kept five source-linked programming updates and the existing GitHub snapshot, with its date and pending-verification warning. This design build did not fetch or invent new activity.
- Replaced repeated five-stage graphics with diagrams appropriate to the documented project: scoped invitations, browser/local storage, distributed inference services, editorial revisions, and model verification. These are summaries of the existing source-backed notes, not new capability claims.
- Simplified About to a first-person introduction while retaining heritage, the supplied School of Computer Science wording, research areas, systems practice, and personal links. No degree, affiliation, or performance result was invented.
- Rebuilt the homepage in Italian, English, French, and Portuguese. Italian remains the default. English-only programming notes keep the existing language disclosure.
- Centralized localized project summaries in `data/projects.json`. The homepage and full index render the same records. The invitation annotation references a named case-study item, so reordering evidence cannot silently change its answer.
- Replaced the social preview and regenerated the A favicon in SVG, ICO, PNG, and Apple touch sizes. Kept native links, disclosure controls, focus indicators, reduced-motion and forced-colour fallbacks, and print styles.
- Added an allowlisted local preview command and tests for its public-only file access. No application repository was modified.

## Verified

- All 70 HTML files pass the site validator. The sitemap matches 67 canonical pages.
- The internal-link audit reports zero unreachable pages and maximum crawl depth two. Its evidence-depth checks are heuristics, not Google quality scores.
- All 23 regression tests pass, covering the four homepages, source-copy parity, complete project indexes, stable first-person About pages, project-specific figures, unique fragment IDs, repeated presentation passes, semantic dates, icon sizes, and cached activity behaviour.
- The text palette meets a 4.5:1 normal-text contrast threshold against the tested chalk, paper, celadon, and Listening surfaces. This is a colour calculation, not a complete accessibility audit.
- The shared stylesheet is approximately 5 KB compressed and remains below its 8 KB test budget. No framework or animation dependency was added.
- Two complete builds produce identical tracked and new repository-file contents. JavaScript syntax checks, release-script shell syntax, and `git diff --check` pass.
- The generated social-preview PNG was visually inspected. It is not a screenshot of the homepage.

## Not yet verified

- Full-page browser rendering, keyboard interaction, zoom, and mobile behaviour have not been visually tested in this environment. Loopback server binding is denied and file-URL browser access is blocked. These restrictions were not bypassed.
- No Lighthouse, deployed Core Web Vitals, Search Console inspection, or ranking measurements were performed in this revision.
- No fetch, push, or deployment was performed in this revision. The redesign remains a local worktree change pending visual review. GitHub DNS resolution was also blocked during the preceding release attempt.
- The GitHub snapshot remains dated 2 September and lacks the source marker required by the GraphQL freshness verifier. A successful authorized activity workflow must replace it. No marker, count, or refresh date was fabricated to make the check pass.
- Prepared external profile and project-site material under `authority/` remains unapplied. Public search results, sitelinks, and ranking positions are not controlled by this build.

## Visual release gate

Run `node scripts/preview-site.mjs` and open [the local preview](http://127.0.0.1:4173/).

1. Inspect the homepage at 320, 390, 768, 1024, and 1440 CSS pixels. Check line wrapping, figure labels, project spacing, Listening panels, and update titles.
2. Switch between all four languages from the homepage, About, the project index, MyCasaPro, and Galidima. Confirm the same page is retained where a translation exists.
3. Check a long project note, a research page, and the updates archive. Open the section menu, email-delivery annotation, and GitHub disclosure with the keyboard.
4. Check 200% zoom, visible focus, reduced-motion, and a print preview. Confirm that the pages remain useful with JavaScript disabled.
5. Only after this review, commit the build and run `bash scripts/release-main.sh`. It rebuilds, rebases, pushes without force, and checks the deployed files. Stop on any source conflict rather than discarding either side.

Canonical URLs, reciprocal language annotations, authorship relationships, and explicit substantive content dates are preserved. These help maintain crawlable, coherent pages; they cannot guarantee first position or remove third-party search results.
