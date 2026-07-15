import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const errors = [];

const walkHtml = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
};

const files = await walkHtml(rootDir);
const canonicalOwners = new Map();
const indexableCanonicals = new Set();
const localTargetCache = new Map();

const localTargetExists = async (reference) => {
  const clean = reference.split("#")[0].split("?")[0];
  if (!clean || !clean.startsWith("/")) return true;
  if (localTargetCache.has(clean)) return localTargetCache.get(clean);
  const relative = clean === "/"
    ? "index.html"
    : clean.endsWith("/")
      ? `${clean.replace(/^\//, "")}index.html`
      : clean.replace(/^\//, "");
  try {
    await fs.access(path.join(rootDir, relative));
    localTargetCache.set(clean, true);
    return true;
  } catch {
    localTargetCache.set(clean, false);
    return false;
  }
};

for (const file of files) {
  const relative = path.relative(rootDir, file).split(path.sep).join("/");
  const html = await fs.readFile(file, "utf8");
  const isRedirect = /http-equiv="refresh"/i.test(html);
  const isNoindex = /<meta name="robots" content="[^"]*noindex/i.test(html);
  if (isRedirect || isNoindex) continue;

  const checks = [
    [/<title>[^<]+<\/title>/i, "missing title"],
    [/<meta\s+name="description"\s+content="[^"]+"/i, "missing description"],
    [/<meta name="author" content="Armel Tenkiang"/i, "missing author meta"],
    [/<meta property="og:site_name" content="Armel Tenkiang"/i, "missing site name meta"],
    [/<link rel="icon" href="\/favicon\.svg"/i, "missing SVG favicon"],
    [/<link rel="manifest" href="\/site\.webmanifest"/i, "missing web manifest"],
    [/<link rel="canonical" href="[^"]+"/i, "missing canonical"],
    [/<main[^>]+id="main-content"/i, "missing main landmark id"]
  ];
  for (const [pattern, message] of checks) {
    if (!pattern.test(html)) errors.push(`${relative}: ${message}`);
  }

  const h1Count = (html.match(/<h1(?:\s[^>]*)?>/gi) || []).length;
  if (h1Count !== 1) errors.push(`${relative}: expected one h1, found ${h1Count}`);

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length) errors.push(`${relative}: duplicate ids (${[...new Set(duplicateIds)].join(", ")})`);

  const localReferences = [...html.matchAll(/(?:href|src)="([^"]+)"/g)]
    .map((match) => match[1])
    .filter((reference) => reference.startsWith("/"));
  for (const reference of localReferences) {
    if (!await localTargetExists(reference)) errors.push(`${relative}: broken local reference ${reference}`);
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (canonical) {
    if (canonicalOwners.has(canonical)) errors.push(`${relative}: duplicate canonical also used by ${canonicalOwners.get(canonical)}`);
    canonicalOwners.set(canonical, relative);
    indexableCanonicals.add(canonical);
    if (!canonical.includes("/updates/")) {
      const alternateCount = (html.match(/<link rel="alternate" hreflang=/g) || []).length;
      if (alternateCount !== 5) errors.push(`${relative}: expected five hreflang links, found ${alternateCount}`);
    }
  }

  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  for (const schema of schemas) {
    try {
      JSON.parse(schema[1]);
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }
}

const sitemap = await fs.readFile(path.join(rootDir, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const uniqueSitemapUrls = new Set(sitemapUrls);
if (uniqueSitemapUrls.size !== sitemapUrls.length) errors.push("sitemap.xml: duplicate URLs");

for (const canonical of indexableCanonicals) {
  if (!canonical.startsWith(siteUrl)) continue;
  const owner = canonicalOwners.get(canonical);
  if (owner === "404.html" || owner.startsWith("updates/2026-")) continue;
  if (!uniqueSitemapUrls.has(canonical)) errors.push(`${owner}: canonical missing from sitemap`);
}

for (const url of uniqueSitemapUrls) {
  const route = url.replace(siteUrl, "");
  const file = route === "/" ? "index.html" : `${route.replace(/^\//, "")}index.html`;
  try {
    await fs.access(path.join(rootDir, file));
  } catch {
    errors.push(`sitemap.xml: missing file for ${url}`);
  }
}

const projectData = JSON.parse(await fs.readFile(path.join(rootDir, "data/projects.json"), "utf8"));
const myCasa = projectData.projects?.find((project) => project.name === "MyCasaPro");
if (myCasa?.status !== "In the lab") errors.push("data/projects.json: MyCasaPro must remain In the lab");

const normalizeText = (value) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const extractProjectCards = (html) => new Map(
  [...html.matchAll(/<article class="card">([\s\S]*?)<\/article>/g)].map((match) => {
    const block = match[1];
    const name = normalizeText(block.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] || "");
    const description = normalizeText(block.match(/<p>([\s\S]*?)<\/p>/)?.[1] || "");
    return [name, description];
  })
);

for (const [homeFile, projectsFile] of [
  ["index.html", "projects/index.html"],
  ["en/index.html", "en/projects/index.html"],
  ["fr/index.html", "fr/projects/index.html"],
  ["pt/index.html", "pt/projects/index.html"]
]) {
  const homeCards = extractProjectCards(await fs.readFile(path.join(rootDir, homeFile), "utf8"));
  const projectCards = extractProjectCards(await fs.readFile(path.join(rootDir, projectsFile), "utf8"));
  for (const [name, description] of homeCards) {
    if (!projectCards.has(name)) errors.push(`${projectsFile}: missing ${name} from homepage`);
    if (projectCards.get(name) !== description) errors.push(`${projectsFile}: ${name} description differs from homepage`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} HTML files and ${sitemapUrls.length} sitemap URLs.`);
}
