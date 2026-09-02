# Activity automation setup

The hourly activity workflow fails closed when it cannot obtain an account-level GitHub contribution snapshot. It retains the previous public values but does not silently mark them fresh.

## Required repository secret

`GH_STATS_TOKEN` must be a token for `Fuzzyslippers412` with the minimum access needed to read the account contribution graph. The workflow deliberately does not treat the repository-scoped automatic `GITHUB_TOKEN` as an exact account-profile source.

## Optional private-project secret

`PROJECTS_READ_TOKEN` is required only for repositories marked `"visibility": "private"` in `data/sources.json`. Use a fine-grained, read-only token limited to the named repositories. Public updates from a private repository must still use the configured `PUBLIC_UPDATE:` marker; the website never publishes the private repository URL.

## Verification

1. Add or replace the secrets in GitHub repository settings.
2. Run the `Update project feeds` workflow manually.
3. Confirm the `Verify GitHub snapshot freshness` step records `github_graphql_contributions_collection` as its source.
4. Confirm the bot creates a non-force `Refresh verified project activity` commit when the snapshot changes.
5. Confirm `data/profile.json` has the current `as_of` date and the website renders that date beside the count.

The workflow fails when the account snapshot is over three days old, a required number is absent, the GraphQL source is missing, or the bot cannot rebase and push after three races. After every rebase it regenerates and revalidates the complete static surface, so a concurrent source change cannot leave stale HTML attached to newer source data.
