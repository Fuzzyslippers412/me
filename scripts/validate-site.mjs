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
  if (owner === "404.html") continue;
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
const sourceData = JSON.parse(await fs.readFile(path.join(rootDir, "data/sources.json"), "utf8"));
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const renderedUpdates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));
const myCasa = projectData.projects?.find((project) => project.name === "MyCasaPro");
if (myCasa?.status !== "In the lab") errors.push("data/projects.json: MyCasaPro must remain In the lab");

const projectNames = new Set();
const projectSlugs = new Set();
for (const project of projectData.projects || []) {
  if (!project.name || !project.slug || !project.site || !project.status) errors.push(`data/projects.json: incomplete project record for ${project.name || "unknown project"}`);
  if (projectNames.has(project.name)) errors.push(`data/projects.json: duplicate project name ${project.name}`);
  if (projectSlugs.has(project.slug)) errors.push(`data/projects.json: duplicate project slug ${project.slug}`);
  if (!/^https:\/\//.test(project.site || "")) errors.push(`data/projects.json: ${project.name} needs an HTTPS site URL`);
  projectNames.add(project.name);
  projectSlugs.add(project.slug);
}

const privateSources = new Set();
for (const source of sourceData.sources || []) {
  if (source.visibility !== "private") continue;
  privateSources.add(source.name);
  if (source.publish_mode !== "marked" || !source.public_commit_prefix) {
    errors.push(`data/sources.json: private source ${source.name} must require marked public commits`);
  }
}

const noteSlugs = new Set();
for (const note of updateNotes.items || []) {
  if (noteSlugs.has(note.slug)) errors.push(`data/update-notes.json: duplicate slug ${note.slug}`);
  noteSlugs.add(note.slug);
  if (!projectSlugs.has(note.project_slug)) errors.push(`data/update-notes.json: unknown project slug ${note.project_slug}`);
  if (!note.verified_commit || !/^[a-f0-9]{7,40}$/i.test(note.verified_commit)) errors.push(`data/update-notes.json: invalid commit for ${note.slug}`);
  if (!Array.isArray(note.details) || note.details.length < 2) errors.push(`data/update-notes.json: ${note.slug} needs substantive details`);
  if (privateSources.has(note.source) && /github\.com/i.test(note.source_url || "")) {
    errors.push(`data/update-notes.json: ${note.slug} exposes a private repository URL`);
  }
  const updateFile = path.join(rootDir, "updates", note.slug, "index.html");
  try {
    const html = await fs.readFile(updateFile, "utf8");
    if (!/"@type": "TechArticle"/.test(html)) errors.push(`updates/${note.slug}/index.html: missing TechArticle schema`);
    if (!html.includes(note.summary)) errors.push(`updates/${note.slug}/index.html: summary differs from source data`);
  } catch {
    errors.push(`data/update-notes.json: missing generated page for ${note.slug}`);
  }
}

for (const item of renderedUpdates.items || []) {
  if (privateSources.has(item.source) && /github\.com/i.test(item.url || "")) {
    errors.push(`data/updates.json: ${item.source} exposes a private repository URL`);
  }
}

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
  for (const project of projectData.projects || []) {
    if (!homeCards.has(project.name)) errors.push(`${homeFile}: missing project ${project.name}`);
    if (!projectCards.has(project.name)) errors.push(`${projectsFile}: missing project ${project.name}`);
  }
  for (const [name, description] of homeCards) {
    if (!projectCards.has(name)) errors.push(`${projectsFile}: missing ${name} from homepage`);
    if (projectCards.get(name) !== description) errors.push(`${projectsFile}: ${name} description differs from homepage`);
  }
}

const localePrefixes = ["", "en", "fr", "pt"];
for (const project of projectData.projects || []) {
  for (const prefix of localePrefixes) {
    const relative = [prefix, "projects", project.slug, "index.html"].filter(Boolean).join("/");
    try {
      await fs.access(path.join(rootDir, relative));
    } catch {
      errors.push(`data/projects.json: missing localized project page ${relative}`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${files.length} HTML files and ${sitemapUrls.length} sitemap URLs.`);
}
