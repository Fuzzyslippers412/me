import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const property = process.env.SEARCH_CONSOLE_SITE_URL || "sc-domain:armeltenkiang.com";
const exactQuery = process.env.SEARCH_CONSOLE_QUERY || "Armel Tenkiang";
const outputPath = process.env.SEARCH_CONSOLE_REPORT_PATH || "/tmp/search-console-report.json";
const credentialsValue = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";

if (!credentialsValue) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is required.");

const readCredentials = async (value) => {
  if (value.trim().startsWith("{")) return JSON.parse(value);
  try {
    const decoded = Buffer.from(value, "base64").toString("utf8");
    if (decoded.trim().startsWith("{")) return JSON.parse(decoded);
  } catch {
    // Try a filesystem path next.
  }
  return JSON.parse(await fs.readFile(path.resolve(value), "utf8"));
};

const base64Url = (value) => Buffer.from(value)
  .toString("base64")
  .replaceAll("+", "-")
  .replaceAll("/", "_")
  .replace(/=+$/g, "");

const credentials = await readCredentials(credentialsValue);
if (!credentials.client_email || !credentials.private_key) {
  throw new Error("Service-account credentials need client_email and private_key.");
}

const nowSeconds = Math.floor(Date.now() / 1000);
const tokenUri = credentials.token_uri || "https://oauth2.googleapis.com/token";
const jwtHeader = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
const jwtPayload = base64Url(JSON.stringify({
  iss: credentials.client_email,
  scope: "https://www.googleapis.com/auth/webmasters.readonly",
  aud: tokenUri,
  iat: nowSeconds,
  exp: nowSeconds + 3600
}));
const unsignedJwt = `${jwtHeader}.${jwtPayload}`;
const signature = crypto.sign("RSA-SHA256", Buffer.from(unsignedJwt), credentials.private_key);
const assertion = `${unsignedJwt}.${base64Url(signature)}`;

const tokenResponse = await fetch(tokenUri, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  })
});
if (!tokenResponse.ok) {
  throw new Error(`Google OAuth token request failed with HTTP ${tokenResponse.status}: ${await tokenResponse.text()}`);
}
const accessToken = (await tokenResponse.json()).access_token;
if (!accessToken) throw new Error("Google OAuth response did not include an access token.");

const api = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!response.ok) {
    const message = body?.error?.message || text || `HTTP ${response.status}`;
    throw new Error(`${url} failed: ${message}`);
  }
  return body;
};

const isoDate = (date) => date.toISOString().slice(0, 10);
const endDate = new Date();
endDate.setUTCDate(endDate.getUTCDate() - 3);
const start28 = new Date(endDate);
start28.setUTCDate(start28.getUTCDate() - 27);
const start90 = new Date(endDate);
start90.setUTCDate(start90.getUTCDate() - 89);

const searchAnalytics = async (startDate) => api(
  `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
  {
    method: "POST",
    body: JSON.stringify({
      startDate: isoDate(startDate),
      endDate: isoDate(endDate),
      dimensions: ["query", "page", "country", "device"],
      dimensionFilterGroups: [{
        filters: [{ dimension: "query", operator: "equals", expression: exactQuery }]
      }],
      rowLimit: 25000,
      dataState: "final"
    })
  }
);

const siteData = JSON.parse(await fs.readFile(path.join(rootDir, "data/site.json"), "utf8"));
const inspections = [];
for (const inspectionUrl of siteData.priority_urls || []) {
  try {
    const result = await api("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
      method: "POST",
      body: JSON.stringify({ inspectionUrl, siteUrl: property, languageCode: "en-US" })
    });
    const index = result?.inspectionResult?.indexStatusResult || {};
    inspections.push({
      url: inspectionUrl,
      verdict: index.verdict || null,
      coverage_state: index.coverageState || null,
      indexing_state: index.indexingState || null,
      robots_txt_state: index.robotsTxtState || null,
      page_fetch_state: index.pageFetchState || null,
      last_crawl_time: index.lastCrawlTime || null,
      user_canonical: index.userCanonical || null,
      google_canonical: index.googleCanonical || null,
      referring_urls: index.referringUrls || [],
      sitemap: index.sitemap || []
    });
  } catch (error) {
    inspections.push({ url: inspectionUrl, error: error.message });
  }
}

const [analytics28, analytics90, sitemaps] = await Promise.all([
  searchAnalytics(start28),
  searchAnalytics(start90),
  api(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/sitemaps`)
]);

const summarizeRows = (rows = []) => rows.reduce((summary, row) => ({
  clicks: summary.clicks + (row.clicks || 0),
  impressions: summary.impressions + (row.impressions || 0)
}), { clicks: 0, impressions: 0 });

const report = {
  generated_at: new Date().toISOString(),
  property,
  exact_query: exactQuery,
  periods: {
    last_28_days: {
      start_date: isoDate(start28),
      end_date: isoDate(endDate),
      totals: summarizeRows(analytics28.rows),
      rows: analytics28.rows || []
    },
    last_90_days: {
      start_date: isoDate(start90),
      end_date: isoDate(endDate),
      totals: summarizeRows(analytics90.rows),
      rows: analytics90.rows || []
    }
  },
  sitemap: (sitemaps.sitemap || []).map((item) => ({
    path: item.path,
    last_submitted: item.lastSubmitted || null,
    last_downloaded: item.lastDownloaded || null,
    pending: item.isPending ?? null,
    warnings: item.warnings ?? null,
    errors: item.errors ?? null,
    contents: item.contents || []
  })),
  url_inspection: inspections
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await writeFileAtomically(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

const valid = inspections.filter((item) => item.verdict === "PASS").length;
const failed = inspections.filter((item) => item.error).length;
const summary = [
  "## Search Console report",
  "",
  `- Property: ${property}`,
  `- Exact query: ${exactQuery}`,
  `- 28-day impressions: ${report.periods.last_28_days.totals.impressions}`,
  `- 28-day clicks: ${report.periods.last_28_days.totals.clicks}`,
  `- Priority URLs passing inspection: ${valid}/${inspections.length}`,
  `- Inspection errors: ${failed}`,
  `- Sitemaps returned: ${report.sitemap.length}`
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, "utf8");
console.log(summary.replace(/^## /, ""));
