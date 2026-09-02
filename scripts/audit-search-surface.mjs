import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteOrigin = "https://armeltenkiang.com";
const strict = process.argv.includes("--strict");
const jsonIndex = process.argv.indexOf("--json");
const jsonPath = jsonIndex >= 0 ? process.argv[jsonIndex + 1] : "";

if (jsonIndex >= 0 && !jsonPath) throw new Error("--json requires an output path.");

const walk = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "authority"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
};

const decodeEntities = (value) => value
  .replaceAll("&nbsp;", " ")
  .replaceAll("&amp;", "&")
  .replaceAll("&lt;", "<")
  .replaceAll("&gt;", ">")
  .replaceAll("&quot;", '"')
  .replaceAll("&#39;", "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));

const visibleText = (html) => decodeEntities(
  html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);

const canonicalUrl = (reference) => {
  try {
    const url = new URL(reference, siteOrigin);
    if (url.origin !== siteOrigin) return null;
    url.hash = "";
    url.search = "";
    return url.href;
  } catch {
    return null;
  }
};

const htmlFiles = await walk(rootDir);
const pages = [];
const errors = [];
const warnings = [];

for (const file of htmlFiles) {
  const relative = path.relative(rootDir, file).split(path.sep).join("/");
  const html = await fs.readFile(file, "utf8");
  if (/http-equiv=["']refresh/i.test(html) || /<meta\s+name=["']robots["'][^>]+noindex/i.test(html)) continue;

  const canonical = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1] || "";
  const title = visibleText(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i)?.[1]?.trim() || "";
  const language = html.match(/<html\s+lang=["']([^"']+)/i)?.[1]?.slice(0, 2) || "unknown";
  const mainHtml = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
  const mainText = visibleText(mainHtml);
  const words = mainText ? mainText.split(/\s+/).filter(Boolean).length : 0;
  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"']+)/gi)].map((match) => match[1]);
  const schemaTypes = [];

  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const nodes = parsed["@graph"] || [parsed];
      for (const node of nodes) {
        const types = Array.isArray(node?.["@type"]) ? node["@type"] : [node?.["@type"]];
        schemaTypes.push(...types.filter(Boolean));
      }
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }

  if (!canonical) errors.push(`${relative}: missing canonical`);
  pages.push({ relative, canonical, title, description, language, words, links, schemaTypes });
}

const byCanonical = new Map();
const titleOwners = new Map();
for (const page of pages) {
  if (byCanonical.has(page.canonical)) errors.push(`${page.relative}: canonical also owned by ${byCanonical.get(page.canonical).relative}`);
  byCanonical.set(page.canonical, page);
  if (titleOwners.has(page.title)) errors.push(`${page.relative}: title also used by ${titleOwners.get(page.title)}`);
  titleOwners.set(page.title, page.relative);
}

const edges = new Map(pages.map((page) => [page.canonical, new Set()]));
const externalDomains = new Map();
let edgeCount = 0;

for (const page of pages) {
  for (const reference of page.links) {
    let url;
    try {
      url = new URL(reference, page.canonical || siteOrigin);
    } catch {
      errors.push(`${page.relative}: invalid anchor ${reference}`);
      continue;
    }
    if (!["http:", "https:"].includes(url.protocol)) continue;
    if (url.origin !== siteOrigin) {
      externalDomains.set(url.hostname, (externalDomains.get(url.hostname) || 0) + 1);
      continue;
    }
    const target = canonicalUrl(url.href);
    if (!target) continue;
    if (!byCanonical.has(target)) {
      errors.push(`${page.relative}: internal link has no canonical target ${target}`);
      continue;
    }
    if (!edges.get(page.canonical).has(target)) {
      edges.get(page.canonical).add(target);
      edgeCount += 1;
    }
  }
}

const roots = [`${siteOrigin}/`, `${siteOrigin}/en/`, `${siteOrigin}/fr/`, `${siteOrigin}/pt/`]
  .filter((url) => byCanonical.has(url));
const depths = new Map(roots.map((url) => [url, 0]));
const queue = [...roots];
while (queue.length) {
  const current = queue.shift();
  for (const target of edges.get(current) || []) {
    if (depths.has(target)) continue;
    depths.set(target, depths.get(current) + 1);
    queue.push(target);
  }
}

const unreachable = pages.filter((page) => !depths.has(page.canonical));
for (const page of unreachable) errors.push(`${page.relative}: unreachable from a language homepage`);

const sitemap = await fs.readFile(path.join(rootDir, "sitemap.xml"), "utf8");
const sitemapUrls = new Set([...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeEntities(match[1].trim())));
const canonicalUrls = new Set(pages.map((page) => page.canonical));
const missingFromSitemap = [...canonicalUrls].filter((url) => !sitemapUrls.has(url));
const missingFromFiles = [...sitemapUrls].filter((url) => !canonicalUrls.has(url));
for (const url of missingFromSitemap) errors.push(`sitemap missing canonical ${url}`);
for (const url of missingFromFiles) errors.push(`sitemap URL has no indexable file ${url}`);

const thinPages = [];
for (const page of pages) {
  const pathname = new URL(page.canonical).pathname;
  const isProject = /\/(?:en|fr|pt)?\/?projects\/[^/]+\/$/.test(pathname);
  const isUpdateNote = /^\/updates\/[^/]+\/$/.test(pathname);
  const isResearchNote = /\/(?:en|fr|pt)?\/?research\/[^/]+\/$/.test(pathname);
  const minimum = isProject ? 140 : isUpdateNote ? 150 : isResearchNote ? 180 : 0;
  if (minimum && page.words < minimum) {
    const item = `${page.relative}: ${page.words} words; expected at least ${minimum} for this page type`;
    thinPages.push({ file: page.relative, words: page.words, minimum });
    warnings.push(item);
    if (strict) errors.push(item);
  }
}

const languageCounts = Object.fromEntries(
  [...new Set(pages.map((page) => page.language))]
    .sort()
    .map((language) => [language, pages.filter((page) => page.language === language).length])
);
const schemaCounts = {};
for (const page of pages) {
  for (const type of new Set(page.schemaTypes)) schemaCounts[type] = (schemaCounts[type] || 0) + 1;
}

const report = {
  generated_at: new Date().toISOString(),
  canonical_pages: pages.length,
  sitemap_urls: sitemapUrls.size,
  internal_edges: edgeCount,
  maximum_depth: Math.max(...depths.values()),
  unreachable_pages: unreachable.map((page) => page.relative),
  thin_pages: thinPages,
  language_counts: languageCounts,
  schema_page_counts: Object.fromEntries(Object.entries(schemaCounts).sort()),
  external_link_domains: Object.fromEntries([...externalDomains.entries()].sort((a, b) => b[1] - a[1])),
  errors,
  warnings
};

if (jsonPath) {
  const absolute = path.resolve(rootDir, jsonPath);
  await fs.mkdir(path.dirname(absolute), { recursive: true });
  await writeFileAtomically(absolute, `${JSON.stringify(report, null, 2)}\n`, "utf8");
}

const summary = [
  "## Search-surface audit",
  "",
  `- Canonical pages: ${report.canonical_pages}`,
  `- Sitemap URLs: ${report.sitemap_urls}`,
  `- Internal edges: ${report.internal_edges}`,
  `- Maximum crawl depth: ${report.maximum_depth}`,
  `- Unreachable pages: ${report.unreachable_pages.length}`,
  `- Thin evidence pages: ${report.thin_pages.length}`,
  `- Errors: ${report.errors.length}`,
  `- Languages: ${Object.entries(languageCounts).map(([language, count]) => `${language} ${count}`).join(", ")}`
].join("\n");

console.log(summary.replace(/^## /, ""));
for (const warning of warnings) console.warn(`[audit] ${warning}`);
for (const error of errors) console.error(`[audit] ${error}`);
if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, "utf8");
if (errors.length) process.exitCode = 1;
