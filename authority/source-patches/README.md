# Source-specific authority patches

These patches were generated from read-only inspections of the local project repositories. They have not been applied to those repositories.

- mycasapro-authority.patch targets the deployed docs homepage and root README. It adds a canonical host matching the repository CNAME, factual application metadata, a visible creator link, robots policy, and a one-URL sitemap.
- au-jour-le-jour-authority.patch targets the authoritative public assets and the existing sync:web pipeline. After applying it, run npm run sync:web so docs receives the generated homepage, stylesheet, robots file, and sitemap.
- chattypatty-readme-authority.patch updates only the public repository README because no crawlable static website source was present in the checked repository.

Apply from the root of the matching repository with git apply --check PATCH_PATH, inspect the diff, then use git apply PATCH_PATH. Do not apply a patch if its check fails; regenerate it from the current source instead.
