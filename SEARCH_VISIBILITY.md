# Search visibility operations

This file records the non-content steps required after a substantive release. It is intentionally separate from the public page copy.

## Priority URLs

The canonical list lives in `data/site.json`. After a substantial release:

1. Run the complete build and `node scripts/validate-site.mjs`.
2. Confirm `https://armeltenkiang.com/sitemap.xml` succeeds in Google Search Console.
3. Inspect the homepage, English homepage, English profile, research index, Galidima note, and four priority project pages.
4. Request indexing only when the inspected page has changed substantially.
5. Record Google-selected canonical, indexing state, and exact-name impressions before requesting another recrawl.

## Entity consistency

The public name should be `Armel Tenkiang` on GitHub, project websites, repository READMEs, SoundCloud, and any verified professional or research profile. Each maintained profile should link directly to `https://armeltenkiang.com/`.

GitHub still requires account-level configuration outside this repository:

- display name: `Armel Tenkiang`
- website: `https://armeltenkiang.com/`
- a factual one-line technical biography
- a profile README in a repository named `Fuzzyslippers412`
- pinned repositories with useful descriptions rather than placeholders

Project websites should use a visible creator or colophon link to the matching project page on `armeltenkiang.com`. Structured data may reference `https://armeltenkiang.com/#person` as the creator, but visible authorship must remain present.

## Scheduled activity data

The GitHub Action runs after source changes and hourly at minute 17. It preserves the last verified snapshot if GitHub or a project feed is unavailable, and fails visibly if the profile snapshot becomes more than three days old. Configure these repository secrets before relying on the figures:

- `GH_STATS_TOKEN`: a fine-grained token owned by `Fuzzyslippers412`, with account contribution access and read access to every repository that should count toward the public totals.
- `PROJECTS_READ_TOKEN`: read access to private project repositories. Private activity is published only when a commit subject begins with the configured `PUBLIC_UPDATE:` marker.

Without `GH_STATS_TOKEN`, GitHub's default workflow token can read this repository but cannot produce an account-wide total that includes private contributions. The page always displays an `as of` date so a retained snapshot cannot be mistaken for a live value.

## Prohibited shortcuts

Do not manufacture profiles, buy links, publish repetitive name pages, change dates without substantive edits, or expose private repository activity. These tactics weaken the evidence that the site is intended to establish.
