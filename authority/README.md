# External authority assets

These files are deployment patches for profiles and project sites outside the personal-site repository. They contain no credentials or private repository URLs.

- `github-profile/README.md` is the content for the public `Fuzzyslippers412/Fuzzyslippers412` profile repository.
- `github-profile/profile-metadata.json` records the exact GitHub profile and repository fields to apply.
- `../scripts/apply-github-authority.mjs` previews these GitHub changes by default and performs them only with `--apply`.
- `project-sites/*.snippet.txt` contains the visible reciprocal creator link and matching application graph for each verified project domain.
- `source-patches/` contains source-specific, non-applied patches prepared from the inspected MyCasaPro, Au Jour Le Jour, and ChattyPatty trees.
- Re-run `node scripts/build-authority-assets.mjs` whenever project identity data changes.

## Domain readiness

| Project | State | Action |
| --- | --- | --- |
| Home | blocked | No verified public destination; no external authorship patch is generated. |
| Door Notes | ready | Install the visible creator line and matching JSON-LD on https://doornotes.org/. |
| MUDECA | blocked | No verified public destination; no external authorship patch is generated. |
| MyCasaPro | ready | Install the visible creator line and matching JSON-LD on https://mycasapro.com. |
| Liga do Povo | ready | Install the visible creator line and matching JSON-LD on https://ligadopovo.com. |
| Theo.farm | ready | Install the visible creator line and matching JSON-LD on https://theo.farm. |
| Au Jour Le Jour | ready | Install the visible creator line and matching JSON-LD on https://aujourlejour.xyz. |
| Respometer | ready | Install the visible creator line and matching JSON-LD on https://www.respometer.com. |
| GhostProtocol | blocked | No verified public destination; no external authorship patch is generated. |
| ChattyPatty | ready | Install the visible creator line and matching JSON-LD on https://chattpattyxyz.com. |
| Soundcheck.AI | ready | Install the visible creator line and matching JSON-LD on https://sound-check.ai. |

Do not deploy a snippet onto a parked, repurposed, or mismatched domain. Verify the canonical HTTPS page first.
