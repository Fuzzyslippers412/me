# Release review - 6 September 2026

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
