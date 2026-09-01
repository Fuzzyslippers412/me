# Search Console reporting setup

The weekly workflow reads Search Console data; it does not request indexing and does not publish query data on the website.

1. Enable the Google Search Console API and URL Inspection API in a Google Cloud project.
2. Create a service account dedicated to read-only reporting.
3. Grant that service-account identity access to the `sc-domain:armeltenkiang.com` Search Console property at the level required for Search Analytics, sitemap, and URL Inspection reads.
4. Store the complete service-account JSON as the GitHub repository secret `GOOGLE_SERVICE_ACCOUNT_JSON`.
5. Optionally set the repository variable `SEARCH_CONSOLE_SITE_URL` to `sc-domain:armeltenkiang.com`; that is already the workflow default.
6. Run the `Search Console report` workflow manually once and inspect its private artifact.

The report contains 28-day and 90-day exact-name query rows, sitemap state, and URL Inspection results for the priority URLs in `data/site.json`. GitHub retains the private workflow artifact for 90 days.

Do not commit service-account credentials or downloaded reports. Do not use Google's Indexing API for these pages; ordinary profile and project URLs are outside that API's permitted scope.
