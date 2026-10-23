# Private Search Console reporting

Search Console reports are local-only. This public repository no longer has a
scheduled reporting workflow, artifact upload, or analytics in Actions summaries.
The separate hourly GitHub activity workflow is unchanged.

## One-time setup

1. Enable the Google Search Console API in your Google Cloud project.
2. Create a dedicated reporting service account and grant it read access to the
   `sc-domain:armeltenkiang.com` property, including the URL Inspection reads you need.
3. Keep its JSON credentials outside this repository, in an owner-only directory.
   Use directory permissions `0700` and credential-file permissions `0600`.
4. If you previously configured `GOOGLE_SERVICE_ACCOUNT_JSON` in this public
   repository's Actions secrets, remove that unused secret in GitHub Settings.
   This code change does not remove remote secrets or historical artifacts.

Do not paste credentials into a terminal command or commit them. Pass the path to
your private credential file instead:

```sh
cd /Users/chefmbororo/Developer/armeltenkiang.com
GOOGLE_SERVICE_ACCOUNT_JSON="$HOME/.config/armeltenkiang/service-account.json" \
  node scripts/search-console-report.mjs
```

The example path must contain your existing credentials; the script does not
create a service account or configure access for you.

## Where reports go

The default output is:

```text
~/.local/share/armeltenkiang/search-console/report.json
```

The report directory is created with permissions `0700`; report and temporary
files use `0600`. Existing shared directories, shared files, hard-linked files,
and report-file symlinks are rejected rather than silently changing permissions.
Writes are atomic, so a failed refresh leaves the previous report intact.

`SEARCH_CONSOLE_REPORT_PATH` can select another file in a dedicated owner-only
directory outside the website folder. Paths that resolve into the website,
including through a symlink, are rejected. Keep the destination outside cloud
sync and shared folders. These permissions protect against other ordinary local
accounts; they are not encryption or protection against administrators or software
running as your account.

The script refuses CI/Actions execution, prints only the output location on
success, and never prints analytics or provider error bodies. It queries 28-day
and 90-day exact-name results, sitemap state, and URL Inspection results for
`data/site.json` priority URLs. It does not request indexing. The property and
exact query can be changed with `SEARCH_CONSOLE_SITE_URL` and `SEARCH_CONSOLE_QUERY`.

## Automation and previous outputs

There is no weekly reporting job after this change is deployed. Local scheduling
can be configured separately, under your own account; do not re-enable reporting
in this public repository. Public-repository Actions artifacts are not private
to the owner: signed-in users with repository read access can download them.

If reports were ever uploaded before this change, delete the affected artifacts
and any workflow runs containing report summaries. Removing the workflow does
not erase past output. No Search Console report artifacts were found during the
October 23, 2026 audit; that observation is not a guarantee about later runs.

Do not use Google's Indexing API for ordinary profile or project pages.
