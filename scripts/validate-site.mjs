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
const titleOwners = new Map();
const descriptionOwners = new Map();
const alternateSets = new Map();
const canonicalLanguages = new Map();
const inboundAnchors = new Map();

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

  const title = html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || "";
  const description = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]?.trim() || "";
  const pageLanguage = html.match(/<html\s+lang="([^"]+)"/i)?.[1]?.slice(0, 2) || "";

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
  if (/fonts\.(?:googleapis|gstatic)\.com/i.test(html)) errors.push(`${relative}: external Google font request`);
  if (title && titleOwners.has(title)) errors.push(`${relative}: duplicate title also used by ${titleOwners.get(title)}`);
  if (description && descriptionOwners.has(description)) errors.push(`${relative}: duplicate description also used by ${descriptionOwners.get(description)}`);
  if (title.length > 70) errors.push(`${relative}: title is not concise (${title.length} characters)`);
  if (description.length > 180) errors.push(`${relative}: description is not concise (${description.length} characters)`);
  if (title) titleOwners.set(title, relative);
  if (description) descriptionOwners.set(description, relative);

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

  for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)) {
    const reference = match[1];
    if (!reference.startsWith("/") && !reference.startsWith(siteUrl)) continue;
    try {
      const url = new URL(reference, siteUrl);
      const target = `${siteUrl}${url.pathname}`;
      inboundAnchors.set(target, (inboundAnchors.get(target) || 0) + 1);
    } catch {
      errors.push(`${relative}: invalid internal anchor ${reference}`);
    }
  }

  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
  if (canonical) {
    if (canonicalOwners.has(canonical)) errors.push(`${relative}: duplicate canonical also used by ${canonicalOwners.get(canonical)}`);
    canonicalOwners.set(canonical, relative);
    indexableCanonicals.add(canonical);
    canonicalLanguages.set(canonical, pageLanguage);
    const expectedRoute = relative === "index.html" ? "/" : `/${relative.replace(/index\.html$/, "")}`;
    const expectedCanonical = `${siteUrl}${expectedRoute}`;
    if (canonical !== expectedCanonical) errors.push(`${relative}: canonical ${canonical} does not match ${expectedCanonical}`);

    const alternates = new Map(
      [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/gi)]
        .map((match) => [match[1], match[2]])
    );
    if (alternates.size) alternateSets.set(canonical, alternates);
    if (!canonical.includes("/updates/")) {
      const alternateCount = (html.match(/<link rel="alternate" hreflang=/g) || []).length;
      if (alternateCount !== 5) errors.push(`${relative}: expected five hreflang links, found ${alternateCount}`);
      for (const language of ["it", "en", "fr", "pt", "x-default"]) {
        if (!alternates.has(language)) errors.push(`${relative}: missing hreflang ${language}`);
      }
    }

    const mainHtml = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
    const mainText = mainHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (!mainText.includes("Armel Tenkiang")) errors.push(`${relative}: main content does not identify Armel Tenkiang`);
    if (canonical !== `${siteUrl}/` && canonical !== `${siteUrl}/en/` && canonical !== `${siteUrl}/fr/` && canonical !== `${siteUrl}/pt/` && !/class="breadcrumbs"/i.test(html)) {
      errors.push(`${relative}: missing visible breadcrumbs`);
    }
    const isProjectDetail = /(?:^|\/)projects\/[^/]+\/index\.html$/.test(relative);
    if (isProjectDetail && !/class="page-byline"[^>]*>[\s\S]*?rel="author"[^>]*>Armel Tenkiang/i.test(html)) {
      errors.push(`${relative}: missing linked visible project authorship`);
    }
    if (/^updates\/[^/]+\/index\.html$/.test(relative) && !/class="page-byline"[^>]*>[\s\S]*?rel="author"[^>]*>Armel Tenkiang/i.test(html)) {
      errors.push(`${relative}: missing linked visible programming-note authorship`);
    }
  }

  const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];
  const schemaTypes = new Set();
  for (const schema of schemas) {
    try {
      const parsed = JSON.parse(schema[1]);
      const nodes = parsed["@graph"] || [parsed];
      for (const node of nodes) {
        const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
        for (const type of types.filter(Boolean)) schemaTypes.add(type);
      }
    } catch (error) {
      errors.push(`${relative}: invalid JSON-LD (${error.message})`);
    }
  }
  if (/(?:^|\/)projects\/[^/]+\/index\.html$/.test(relative)) {
    for (const type of ["WebPage", "SoftwareApplication", "Person", "BreadcrumbList"]) {
      if (!schemaTypes.has(type)) errors.push(`${relative}: missing ${type} structured data`);
    }
  }
  if (/(?:^|\/)about\/index\.html$/.test(relative)) {
    for (const type of ["ProfilePage", "Person", "BreadcrumbList"]) {
      if (!schemaTypes.has(type)) errors.push(`${relative}: missing ${type} structured data`);
    }
    if (!/"hasPart"/.test(html) || !/"headline"/.test(html) || !/"author"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/armeltenkiang\.com\/#person"/s.test(html)) {
      errors.push(`${relative}: profile activity is not linked to the author entity`);
    }
  }
  if (/(?:^|\/)research\/index\.html$/.test(relative)) {
    for (const type of ["WebPage", "Person", "BreadcrumbList"]) {
      if (!schemaTypes.has(type)) errors.push(`${relative}: missing ${type} structured data`);
    }
  }
  if (/^updates\/[^/]+\/index\.html$/.test(relative)) {
    for (const type of ["TechArticle", "WebPage", "BreadcrumbList"]) {
      if (!schemaTypes.has(type)) errors.push(`${relative}: missing ${type} structured data`);
    }
    if (!/"name": "Armel Tenkiang"/.test(html) || !/"url": "https:\/\/armeltenkiang\.com\/en\/about\/"/.test(html)) {
      errors.push(`${relative}: incomplete programming-note author entity`);
    }
  }
}

for (const [canonical, alternates] of alternateSets) {
  const sourceLanguage = canonicalLanguages.get(canonical);
  for (const language of ["it", "en", "fr", "pt"]) {
    const target = alternates.get(language);
    if (!target || !canonicalOwners.has(target)) {
      errors.push(`${canonical}: hreflang ${language} target is not an indexable local canonical`);
      continue;
    }
    const targetAlternates = alternateSets.get(target);
    if (sourceLanguage && targetAlternates?.get(sourceLanguage) !== canonical) {
      errors.push(`${canonical}: hreflang ${language} target does not return ${sourceLanguage}`);
    }
  }
}

const sitemap = await fs.readFile(path.join(rootDir, "sitemap.xml"), "utf8");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
const uniqueSitemapUrls = new Set(sitemapUrls);
if (uniqueSitemapUrls.size !== sitemapUrls.length) errors.push("sitemap.xml: duplicate URLs");

for (const blockMatch of sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const block = blockMatch[1];
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1] || "";
  if (!loc || loc.includes("/updates/")) continue;
  const xmlAlternates = new Map(
    [...block.matchAll(/<xhtml:link rel="alternate" hreflang="([^"]+)" href="([^"]+)" \/>/g)]
      .map((match) => [match[1], match[2]])
  );
  for (const language of ["it", "en", "fr", "pt", "x-default"]) {
    if (!xmlAlternates.has(language)) errors.push(`sitemap.xml: ${loc} missing hreflang ${language}`);
    const htmlAlternate = alternateSets.get(loc)?.get(language);
    if (htmlAlternate && xmlAlternates.get(language) !== htmlAlternate) {
      errors.push(`sitemap.xml: ${loc} hreflang ${language} differs from HTML`);
    }
  }
}

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
  if (!inboundAnchors.get(url)) errors.push(`sitemap.xml: ${url} has no crawlable internal anchor`);
}


for (const match of sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(match[1]) || Number.isNaN(Date.parse(`${match[1]}T00:00:00Z`))) {
    errors.push(`sitemap.xml: invalid lastmod ${match[1]}`);
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
  for (const language of ["it", "en", "fr", "pt"]) {
    const seo = project.seo?.[language];
    if (!seo?.title || !seo?.description) errors.push(`data/projects.json: ${project.name} needs ${language} SEO metadata`);
    if (seo?.title && (!seo.title.includes(project.name) || !seo.title.includes("Armel Tenkiang"))) {
      errors.push(`data/projects.json: ${project.name} ${language} title must identify the project and author`);
    }
    if (seo?.description && !seo.description.includes("Armel Tenkiang")) {
      errors.push(`data/projects.json: ${project.name} ${language} description must identify the author`);
    }
    if ((seo?.title || "").length > 70) errors.push(`data/projects.json: ${project.name} ${language} title is too long`);
    if ((seo?.description || "").length > 180) errors.push(`data/projects.json: ${project.name} ${language} description is too long`);
  }
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

const localePrefixes = ["", "en", "fr", "pt"];
const noteSlugs = new Set();
const noteSeoTitles = new Set();
for (const note of updateNotes.items || []) {
  if (noteSlugs.has(note.slug)) errors.push(`data/update-notes.json: duplicate slug ${note.slug}`);
  noteSlugs.add(note.slug);
  if (!projectSlugs.has(note.project_slug)) errors.push(`data/update-notes.json: unknown project slug ${note.project_slug}`);
  if (!note.verified_commit || !/^[a-f0-9]{7,40}$/i.test(note.verified_commit)) errors.push(`data/update-notes.json: invalid commit for ${note.slug}`);
  if (!Array.isArray(note.details) || note.details.length < 2) errors.push(`data/update-notes.json: ${note.slug} needs substantive details`);
  if (!note.engineering_note || note.engineering_note.length < 80) errors.push(`data/update-notes.json: ${note.slug} needs an engineering note`);
  if (!note.seo_title || !note.seo_title.includes("Armel Tenkiang")) errors.push(`data/update-notes.json: ${note.slug} needs an author-specific SEO title`);
  if ((note.seo_title || "").length > 70) errors.push(`data/update-notes.json: ${note.slug} SEO title is unnecessarily long`);
  if (noteSeoTitles.has(note.seo_title)) errors.push(`data/update-notes.json: duplicate SEO title ${note.seo_title}`);
  noteSeoTitles.add(note.seo_title);
  if (privateSources.has(note.source) && /github\.com/i.test(note.source_url || "")) {
    errors.push(`data/update-notes.json: ${note.slug} exposes a private repository URL`);
  }
  if (/github\.com/i.test(note.source_url || "") && !note.source_url.includes(`/commit/${note.verified_commit}`)) {
    errors.push(`data/update-notes.json: ${note.slug} source URL does not match its verified commit`);
  }
  const updateFile = path.join(rootDir, "updates", note.slug, "index.html");
  try {
    const html = await fs.readFile(updateFile, "utf8");
    if (!/"@type": "TechArticle"/.test(html)) errors.push(`updates/${note.slug}/index.html: missing TechArticle schema`);
    if (!html.includes(note.summary)) errors.push(`updates/${note.slug}/index.html: summary differs from source data`);
    if (!html.includes(note.engineering_note)) errors.push(`updates/${note.slug}/index.html: engineering note differs from source data`);
    if (!html.includes(`<title>${note.seo_title}</title>`)) errors.push(`updates/${note.slug}/index.html: SEO title differs from source data`);
  } catch {
    errors.push(`data/update-notes.json: missing generated page for ${note.slug}`);
  }
}

const updateIndexHtml = await fs.readFile(path.join(rootDir, "updates/index.html"), "utf8");
for (const note of updateNotes.items || []) {
  if (!updateIndexHtml.includes(`href="/updates/${note.slug}/"`)) errors.push(`updates/index.html: archive missing ${note.slug}`);
  for (const prefix of localePrefixes) {
    const projectFile = [prefix, "projects", note.project_slug, "index.html"].filter(Boolean).join("/");
    const projectHtml = await fs.readFile(path.join(rootDir, projectFile), "utf8");
    if (!projectHtml.includes(`href="/updates/${note.slug}/"`)) errors.push(`${projectFile}: missing related note ${note.slug}`);
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

for (const project of projectData.projects || []) {
  for (const prefix of localePrefixes) {
    const language = prefix || "it";
    const relative = [prefix, "projects", project.slug, "index.html"].filter(Boolean).join("/");
    try {
      await fs.access(path.join(rootDir, relative));
      const html = await fs.readFile(path.join(rootDir, relative), "utf8");
      const seo = project.seo?.[language];
      if (seo && !html.includes(`<title>${seo.title}</title>`)) errors.push(`${relative}: title differs from project data`);
      if (seo && !html.includes(`<meta name="description" content="${seo.description}"`)) errors.push(`${relative}: description differs from project data`);
      const relatedNotes = (updateNotes.items || []).filter((note) => note.project_slug === project.slug);
      const archiveCount = (html.match(/class="page-section project-programming-notes"/g) || []).length;
      const expectedArchiveCount = relatedNotes.length ? 1 : 0;
      if (archiveCount !== expectedArchiveCount) {
        errors.push(`${relative}: expected ${expectedArchiveCount} related-note section, found ${archiveCount}`);
      }
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
