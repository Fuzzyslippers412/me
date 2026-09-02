import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const errors = [];
const expertiseData = JSON.parse(await fs.readFile(path.join(rootDir, "data/expertise.json"), "utf8"));
const siteData = JSON.parse(await fs.readFile(path.join(rootDir, "data/site.json"), "utf8"));
const robots = await fs.readFile(path.join(rootDir, "robots.txt"), "utf8");
for (const blockedPath of ["/.github/", "/authority/", "/scripts/*.mjs$", "/*.md$"]) {
  if (!robots.includes(`Disallow: ${blockedPath}`)) errors.push(`robots.txt: operational path is crawlable (${blockedPath})`);
}
if (!robots.includes("Sitemap: https://armeltenkiang.com/sitemap.xml")) {
  errors.push("robots.txt: missing canonical sitemap declaration");
}
const escapedExpertiseSlug = expertiseData.slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const expertisePagePattern = new RegExp(`(?:^|/)research/${escapedExpertiseSlug}/index\\.html$`);
const updateArchiveUrls = new Set([
  `${siteUrl}/it/updates/`,
  `${siteUrl}/updates/`,
  `${siteUrl}/fr/updates/`,
  `${siteUrl}/pt/updates/`
]);
const isProgrammingNoteUrl = (url) => url.startsWith(`${siteUrl}/updates/`) && !updateArchiveUrls.has(url);

const walkHtml = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules", "authority"].includes(entry.name)) continue;
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
    [/<link rel="author" href="[^"]+"/i, "missing author relationship"],
    [/<meta property="og:site_name" content="Armel Tenkiang"/i, "missing site name meta"],
    [/<link rel="icon" href="\/favicon\.svg"/i, "missing SVG favicon"],
    [/<link rel="icon" href="\/favicon-48\.png"[^>]+sizes="48x48"/i, "missing 48px search favicon"],
    [/<link rel="manifest" href="\/site\.webmanifest"/i, "missing web manifest"],
    [/type="application\/atom\+xml"[^>]+href="\/feed\.xml"/i, "missing technical-notes feed discovery"],
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
  if (["index.html", "en/index.html", "fr/index.html", "pt/index.html"].includes(relative) && !/<h1>Armel Tenkiang<\/h1>/i.test(html)) {
    errors.push(`${relative}: homepage h1 must be exactly Armel Tenkiang`);
  }
  if (["index.html", "en/index.html", "fr/index.html", "pt/index.html"].includes(relative)) {
    if (!/class="profile-links"[\s\S]*?github\.com\/Fuzzyslippers412[\s\S]*?soundcloud\.com\/armel-tenkiang/i.test(html)) {
      errors.push(`${relative}: homepage does not visibly connect the verified profiles`);
    }
    if ((html.match(/rel="me noopener"/g) || []).length < 2) {
      errors.push(`${relative}: visible profile links need rel=me identity relationships`);
    }
  }

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
    if (!isProgrammingNoteUrl(canonical)) {
      const alternateCount = (html.match(/<link rel="alternate" hreflang=/g) || []).length;
      if (alternateCount !== 5) errors.push(`${relative}: expected five hreflang links, found ${alternateCount}`);
      for (const language of ["it", "en", "fr", "pt", "x-default"]) {
        if (!alternates.has(language)) errors.push(`${relative}: missing hreflang ${language}`);
      }
    }

    const expectedUpdateRoute = {
      it: "/it/updates/",
      en: "/updates/",
      fr: "/fr/updates/",
      pt: "/pt/updates/"
    }[pageLanguage];
    const primaryNav = html.match(/<nav class="nav"[\s\S]*?<\/nav>/i)?.[0] || "";
    if (expectedUpdateRoute && !primaryNav.includes(`href="${expectedUpdateRoute}"`)) {
      errors.push(`${relative}: primary navigation leaves the ${pageLanguage} update route`);
    }

    const mainHtml = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
    const mainText = mainHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    if (!mainText.includes("Armel Tenkiang")) errors.push(`${relative}: main content does not identify Armel Tenkiang`);
    if (canonical !== `${siteUrl}/` && canonical !== `${siteUrl}/en/` && canonical !== `${siteUrl}/fr/` && canonical !== `${siteUrl}/pt/` && !/class="breadcrumbs"/i.test(html)) {
      errors.push(`${relative}: missing visible breadcrumbs`);
    }
    const isProjectDetail = /(?:^|\/)projects\/[^/]+\/index\.html$/.test(relative);
    const isExpertiseNote = expertisePagePattern.test(relative);
    if (isProjectDetail && !/class="page-byline"[^>]*>[\s\S]*?rel="author"[^>]*>Armel Tenkiang/i.test(html)) {
      errors.push(`${relative}: missing linked visible project authorship`);
    }
    if (isExpertiseNote && !/class="page-byline"[^>]*>[\s\S]*?rel="author"[^>]*>Armel Tenkiang/i.test(html)) {
      errors.push(`${relative}: missing linked visible technical-note authorship`);
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
    if (!html.includes(`"dateModified": "${siteData.profile_modified}"`)) {
      errors.push(`${relative}: profile modification date differs from site data`);
    }
    if (!html.includes(`"dateCreated": "${siteData.profile_created}"`)) {
      errors.push(`${relative}: profile creation date differs from site data`);
    }
    if (!/"givenName": "Armel"/.test(html) || !/"familyName": "Tenkiang"/.test(html)) {
      errors.push(`${relative}: person identity is incomplete`);
    }
    if (!html.includes("selected-technical-notes:start")) errors.push(`${relative}: missing visible technical-note links`);
    const expertisePrefix = pageLanguage === "it" ? "" : `/${pageLanguage}`;
    const localizedExpertiseUrl = `${siteUrl}${expertisePrefix}/research/${expertiseData.slug}/`;
    if (!html.includes(`"url": "${localizedExpertiseUrl}"`)) {
      errors.push(`${relative}: profile schema does not reference the localized expertise note`);
    }
  }
  if (/(?:^|\/)research\/index\.html$/.test(relative)) {
    for (const type of ["WebPage", "Person", "BreadcrumbList"]) {
      if (!schemaTypes.has(type)) errors.push(`${relative}: missing ${type} structured data`);
    }
    if (!/"hasPart"/.test(html) || !html.includes(`/research/${expertiseData.slug}/#article`)) {
      errors.push(`${relative}: research index does not identify its technical note`);
    }
  }
  if (expertisePagePattern.test(relative)) {
    for (const type of ["TechArticle", "WebPage", "Person", "BreadcrumbList"]) {
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
  if (!loc || isProgrammingNoteUrl(loc)) continue;
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
const researchOutputData = JSON.parse(await fs.readFile(path.join(rootDir, "data/research-outputs.json"), "utf8"));
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const renderedUpdates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));
const myCasa = projectData.projects?.find((project) => project.name === "MyCasaPro");
if (myCasa?.status !== "In the lab") errors.push("data/projects.json: MyCasaPro must remain In the lab");

const manifest = JSON.parse(await fs.readFile(path.join(rootDir, "site.webmanifest"), "utf8"));
if (!(manifest.icons || []).some((icon) => icon.src === "/favicon-48.png" && icon.sizes === "48x48")) {
  errors.push("site.webmanifest: missing 48px search favicon");
}

for (const priorityUrl of siteData.priority_urls || []) {
  if (!indexableCanonicals.has(priorityUrl)) errors.push(`data/site.json: priority URL is not an indexable canonical: ${priorityUrl}`);
  if (!uniqueSitemapUrls.has(priorityUrl)) errors.push(`data/site.json: priority URL is missing from sitemap: ${priorityUrl}`);
  if (!inboundAnchors.get(priorityUrl)) errors.push(`data/site.json: priority URL has no crawlable internal anchor: ${priorityUrl}`);
}

const projectNames = new Set();
const projectSlugs = new Set();
const evidenceStatuses = new Set(["source_reviewed", "project_defined", "requirements_only"]);
const designFrameHeadings = {
  it: "Quadro di progetto",
  en: "Design frame",
  fr: "Cadre de conception",
  pt: "Quadro de conceção"
};
for (const project of projectData.projects || []) {
  if (!project.name || !project.slug || !project.site || !project.status) errors.push(`data/projects.json: incomplete project record for ${project.name || "unknown project"}`);
  if (!project.identity?.descriptor || !project.identity?.repositoryDescription) {
    errors.push(`data/projects.json: ${project.name || "unknown project"} needs a stable identity descriptor and repository description`);
  }
  if (!evidenceStatuses.has(project.identity?.evidenceStatus)) {
    errors.push(`data/projects.json: ${project.name || "unknown project"} needs a valid evidence status`);
  }
  if (project.identity?.descriptor && !project.seo?.en?.title?.includes(project.identity.descriptor)) {
    errors.push(`data/projects.json: ${project.name} English title must use its stable identity descriptor`);
  }
  if (projectNames.has(project.name)) errors.push(`data/projects.json: duplicate project name ${project.name}`);
  if (projectSlugs.has(project.slug)) errors.push(`data/projects.json: duplicate project slug ${project.slug}`);
  if (!/^https:\/\//.test(project.site || "")) errors.push(`data/projects.json: ${project.name} needs an HTTPS site URL`);
  for (const language of ["it", "en", "fr", "pt"]) {
    const seo = project.seo?.[language];
    const caseStudy = project.caseStudy?.[language];
    if (!seo?.title || !seo?.description) errors.push(`data/projects.json: ${project.name} needs ${language} SEO metadata`);
    if (seo?.title && (!seo.title.includes(project.name) || !seo.title.includes("Armel Tenkiang"))) {
      errors.push(`data/projects.json: ${project.name} ${language} title must identify the project and author`);
    }
    if (seo?.description && !seo.description.includes("Armel Tenkiang")) {
      errors.push(`data/projects.json: ${project.name} ${language} description must identify the author`);
    }
    if ((seo?.title || "").length > 70) errors.push(`data/projects.json: ${project.name} ${language} title is too long`);
    if ((seo?.description || "").length > 180) errors.push(`data/projects.json: ${project.name} ${language} description is too long`);
    if (project.caseStudy && (!caseStudy?.heading || caseStudy.items?.length !== 3 || !caseStudy.noteLabel)) {
      errors.push(`data/projects.json: ${project.name} needs a complete ${language} evidence frame`);
    }
    if (project.identity?.evidenceStatus === "requirements_only" && caseStudy?.heading !== designFrameHeadings[language]) {
      errors.push(`data/projects.json: ${project.name} must label its ${language} requirements-only evidence as a design frame`);
    }
  }
  projectNames.add(project.name);
  projectSlugs.add(project.slug);
}

const researchOutputIds = new Set();
for (const output of researchOutputData.items || []) {
  if (!output.id || !output.type || !output.status || !output.title || !output.author || !output.datePublished || !output.url) {
    errors.push(`data/research-outputs.json: incomplete output ${output.id || "unknown"}`);
    continue;
  }
  if (researchOutputIds.has(output.id)) errors.push(`data/research-outputs.json: duplicate id ${output.id}`);
  if (output.author !== "Armel Tenkiang") errors.push(`data/research-outputs.json: ${output.id} has the wrong author identity`);
  if (!indexableCanonicals.has(output.url)) errors.push(`data/research-outputs.json: ${output.id} URL is not an indexable canonical`);
  if (output.doi && !/^10\.\d{4,9}\/.+/.test(output.doi)) errors.push(`data/research-outputs.json: ${output.id} has an invalid DOI`);
  if (output.status === "web_note" && output.type !== "TechArticle") {
    errors.push(`data/research-outputs.json: ${output.id} cannot present a web note as ${output.type}`);
  }
  researchOutputIds.add(output.id);
}

const privateSourceNames = new Set(
  (sourceData.sources || []).filter((source) => source.visibility === "private").map((source) => source.name)
);
const profileReadme = await fs.readFile(path.join(rootDir, "authority/github-profile/README.md"), "utf8");
const profileMetadata = JSON.parse(await fs.readFile(path.join(rootDir, "authority/github-profile/profile-metadata.json"), "utf8"));
if (!profileReadme.startsWith("# Armel Tenkiang") || !profileReadme.includes("https://armeltenkiang.com/")) {
  errors.push("authority/github-profile/README.md: missing canonical identity");
}
for (const repository of profileMetadata.repositories || []) {
  const project = (projectData.projects || []).find((item) => item.identity?.repository === repository.repository);
  if (!project) errors.push(`authority/github-profile/profile-metadata.json: unknown repository ${repository.repository}`);
  if (project && privateSourceNames.has(project.name)) {
    errors.push(`authority/github-profile/profile-metadata.json: exposes private repository ${repository.repository}`);
  }
}
for (const project of projectData.projects || []) {
  const authorityPatch = path.join(rootDir, "authority/project-sites", `${project.slug}.snippet.txt`);
  if (project.siteVerified === false) {
    try {
      await fs.access(authorityPatch);
      errors.push(`authority/project-sites/${project.slug}.snippet.txt: unverified domain must not receive an authority patch`);
    } catch {
      // Expected until the live domain is verified.
    }
    for (const prefix of ["", "en", "fr", "pt"]) {
      const relative = [prefix, "projects", project.slug, "index.html"].filter(Boolean).join("/");
      const html = await fs.readFile(path.join(rootDir, relative), "utf8");
      if (html.includes(`href="${project.site}"`) || html.includes(`"sameAs": "${project.site}"`)) {
        errors.push(`${relative}: unverified external domain remains in the public authority graph`);
      }
    }
    continue;
  }
  try {
    const html = await fs.readFile(authorityPatch, "utf8");
    if (!html.includes(`href="${siteUrl}/en/projects/${project.slug}/" rel="author"`)) {
      errors.push(`authority/project-sites/${project.slug}.snippet.txt: missing reciprocal creator link`);
    }
    if (!html.includes(`"@id": "${siteUrl}/#person"`)) {
      errors.push(`authority/project-sites/${project.slug}.snippet.txt: missing canonical person identifier`);
    }
  } catch {
    errors.push(`authority/project-sites/${project.slug}.snippet.txt: missing generated patch`);
  }
}

const sourcePatchRequirements = [
  {
    file: "mycasapro-authority.patch",
    required: [
      "--- a/docs/index.html",
      "+++ b/docs/index.html",
      "https://www.mycasapro.com/",
      "https://armeltenkiang.com/en/projects/mycasapro/",
      "+++ b/docs/robots.txt",
      "+++ b/docs/sitemap.xml"
    ],
    allowedTargets: new Set(["docs/index.html", "README.md", "docs/robots.txt", "docs/sitemap.xml"])
  },
  {
    file: "au-jour-le-jour-authority.patch",
    required: [
      "--- a/public/index.html",
      "+++ b/public/index.html",
      "https://aujourlejour.xyz/",
      "https://armeltenkiang.com/en/projects/au-jour-le-jour/",
      "scripts/sync_web_assets.js",
      "+++ b/public/robots.txt",
      "+++ b/public/sitemap.xml"
    ],
    allowedTargets: new Set(["public/index.html", "public/styles.css", "scripts/sync_web_assets.js", "README.md", "public/robots.txt", "public/sitemap.xml"])
  },
  {
    file: "chattypatty-readme-authority.patch",
    required: [
      "--- a/README.md",
      "+++ b/README.md",
      "https://armeltenkiang.com/en/projects/chattypatty/",
      "https://armeltenkiang.com/"
    ],
    allowedTargets: new Set(["README.md"])
  }
];

const sourcePatchReadme = await fs.readFile(path.join(rootDir, "authority/source-patches/README.md"), "utf8");
if (!sourcePatchReadme.includes("They have not been applied to those repositories.")) {
  errors.push("authority/source-patches/README.md: must state that source patches are not deployed");
}
for (const requirement of sourcePatchRequirements) {
  const relative = `authority/source-patches/${requirement.file}`;
  try {
    const patch = await fs.readFile(path.join(rootDir, relative), "utf8");
    for (const marker of requirement.required) {
      if (!patch.includes(marker)) errors.push(`${relative}: missing required marker ${marker}`);
    }
    if (/\/Users\/|github_pat_|ghp_|-----BEGIN [A-Z ]*PRIVATE KEY-----|Authorization:\s*Bearer/i.test(patch)) {
      errors.push(`${relative}: contains a local path or credential-like material`);
    }
    const targets = [...patch.matchAll(/^\+\+\+ b\/(.+)$/gm)].map((match) => match[1]);
    for (const target of targets) {
      if (!requirement.allowedTargets.has(target)) errors.push(`${relative}: unexpected write target ${target}`);
    }
  } catch {
    errors.push(`${relative}: missing source-specific authority patch`);
  }
}

for (const relative of ["projects/index.html", "en/projects/index.html", "fr/projects/index.html", "pt/projects/index.html"]) {
  const html = await fs.readFile(path.join(rootDir, relative), "utf8");
  for (const project of projectData.projects || []) {
    if (!html.includes(`"@id": "${siteUrl}/#project-${project.slug}"`)) {
      errors.push(`${relative}: project graph is missing ${project.name}`);
    }
    const expectedProjectUrl = project.siteVerified === false
      ? `${siteUrl}/${relative.replace(/projects\/index\.html$/, `projects/${project.slug}/`)}`.replace(`${siteUrl}//`, `${siteUrl}/`)
      : project.site;
    if (!html.includes(`"url": "${expectedProjectUrl}"`)) {
      errors.push(`${relative}: project graph has the wrong canonical application URL for ${project.name}`);
    }
  }
  if (!/"creator"\s*:\s*\{\s*"@id"\s*:\s*"https:\/\/armeltenkiang\.com\/#person"/s.test(html)) {
    errors.push(`${relative}: project graph does not connect applications to the creator entity`);
  }
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
const expertiseLocales = ["it", "en", "fr", "pt"];
const sensitiveExpertisePatterns = [
  [/\/Users\//i, "local filesystem path"],
  [/\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0)\b/i, "local host address"],
  [/\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/, "private network address"],
  [/mcp_tenkiang_|X-APC-Tenant|CF-Access|Bearer\s/i, "credential or tenant detail"],
  [/TenkiangEstate|Synology/i, "private storage detail"],
  [/@gmail\.com|atenkiang2019/i, "private contact detail"]
];

if (!expertiseData.slug || !expertiseData.published || Number.isNaN(Date.parse(`${expertiseData.published}T00:00:00Z`))) {
  errors.push("data/expertise.json: incomplete expertise identity or publication date");
}

for (const language of expertiseLocales) {
  const locale = expertiseData.locales?.[language];
  const prefix = language === "it" ? "" : `${language}/`;
  if (!locale?.home || !locale?.about || !locale?.article) {
    errors.push(`data/expertise.json: incomplete ${language} expertise content`);
    continue;
  }
  if ((locale.home.capabilities || []).length !== 4 || (locale.article.sections || []).length < 5) {
    errors.push(`data/expertise.json: ${language} expertise content lacks architectural substance`);
  }

  const articleRoute = `/${prefix}research/${expertiseData.slug}/`;
  const articleFile = `${prefix}research/${expertiseData.slug}/index.html`;
  const homeFile = `${prefix}index.html`;
  const aboutFile = `${prefix}about/index.html`;
  const researchFile = `${prefix}research/index.html`;
  const rendered = {
    article: await fs.readFile(path.join(rootDir, articleFile), "utf8"),
    home: await fs.readFile(path.join(rootDir, homeFile), "utf8"),
    about: await fs.readFile(path.join(rootDir, aboutFile), "utf8"),
    research: await fs.readFile(path.join(rootDir, researchFile), "utf8")
  };

  if (!rendered.home.includes(`expertise:${expertiseData.slug}:home:start`) || !rendered.home.includes(locale.home.statement)) {
    errors.push(`${homeFile}: missing generated ${language} expertise section`);
  }
  if (!rendered.about.includes(`expertise:${expertiseData.slug}:about:start`) || !rendered.about.includes(locale.about.paragraphs[0])) {
    errors.push(`${aboutFile}: missing generated ${language} systems-practice section`);
  }
  if (!rendered.research.includes(`href="${articleRoute}"`)) {
    errors.push(`${researchFile}: missing Galidima research link`);
  }
  if (!rendered.article.includes(`<title>${locale.article.title}</title>`) || !rendered.article.includes(locale.article.description)) {
    errors.push(`${articleFile}: generated metadata differs from expertise source`);
  }
  if (!rendered.article.includes(`"datePublished": "${expertiseData.published}"`)) {
    errors.push(`${articleFile}: publication date differs from expertise source`);
  }
  for (const section of locale.article.sections) {
    for (const paragraph of section.paragraphs) {
      if (!rendered.article.includes(paragraph)) errors.push(`${articleFile}: article body differs from expertise source`);
    }
  }
  if (!rendered.article.includes('"Local language model inference"')) {
    errors.push(`${articleFile}: structured expertise is incomplete`);
  }
  for (const section of locale.article.sections) {
    for (const [href] of section.links || []) {
      if (!rendered.article.includes(`href="${href}"`)) errors.push(`${articleFile}: missing domain link ${href}`);
    }
  }
  for (const [pattern, label] of sensitiveExpertisePatterns) {
    if (pattern.test(rendered.article)) errors.push(`${articleFile}: exposes ${label}`);
    if (pattern.test(JSON.stringify(locale.project_notes || {}))) errors.push(`data/expertise.json: ${language} project notes expose ${label}`);
  }
  for (const [slug, note] of Object.entries(locale.project_notes || {})) {
    const projectFile = `${prefix}projects/${slug}/index.html`;
    const projectHtml = await fs.readFile(path.join(rootDir, projectFile), "utf8");
    if (!projectHtml.includes(`expertise:${expertiseData.slug}:project-${slug}:start`) || !projectHtml.includes(note.paragraph)) {
      errors.push(`${projectFile}: missing generated Galidima integration note`);
    }
    if (!projectHtml.includes(`href="${articleRoute}"`)) errors.push(`${projectFile}: missing Galidima technical-note link`);
  }
}

const noteSlugs = new Set();
const noteSeoTitles = new Set();
for (const note of updateNotes.items || []) {
  if (noteSlugs.has(note.slug)) errors.push(`data/update-notes.json: duplicate slug ${note.slug}`);
  noteSlugs.add(note.slug);
  if (!projectSlugs.has(note.project_slug)) errors.push(`data/update-notes.json: unknown project slug ${note.project_slug}`);
  if (!note.verified_commit || !/^[a-f0-9]{7,40}$/i.test(note.verified_commit)) errors.push(`data/update-notes.json: invalid commit for ${note.slug}`);
  if (note.modified && (Number.isNaN(Date.parse(note.modified)) || Date.parse(note.modified) < Date.parse(note.date))) {
    errors.push(`data/update-notes.json: invalid modification date for ${note.slug}`);
  }
  if (!Array.isArray(note.details) || note.details.length < 2) errors.push(`data/update-notes.json: ${note.slug} needs substantive details`);
  for (const section of note.technical_sections || []) {
    if (!section.heading || !Array.isArray(section.paragraphs) || section.paragraphs.length < 2) {
      errors.push(`data/update-notes.json: ${note.slug} has an incomplete technical section`);
    }
  }
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
    if (!html.includes(`"dateModified": "${note.modified || note.date}"`)) errors.push(`updates/${note.slug}/index.html: modified date differs from source data`);
    for (const section of note.technical_sections || []) {
      if (!html.includes(`<h2>${section.heading}</h2>`)) errors.push(`updates/${note.slug}/index.html: missing technical section ${section.heading}`);
      for (const paragraph of section.paragraphs || []) {
        if (!html.includes(paragraph)) errors.push(`updates/${note.slug}/index.html: technical content differs from source data`);
      }
    }
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

for (const [language, relative] of [
  ["it", "it/updates/index.html"],
  ["en", "updates/index.html"],
  ["fr", "fr/updates/index.html"],
  ["pt", "pt/updates/index.html"]
]) {
  const html = await fs.readFile(path.join(rootDir, relative), "utf8");
  for (const note of updateNotes.items || []) {
    if (!html.includes(`href="/updates/${note.slug}/"`)) {
      errors.push(`${relative}: archive missing ${note.slug}`);
    }
    if (!html.includes(`"@id": "${siteUrl}/updates/${note.slug}/#article"`)) {
      errors.push(`${relative}: archive schema missing ${note.slug}`);
    }
    if (note.historical && !new RegExp(`href="/updates/${note.slug}/"[\\s\\S]*?class="update-status"`).test(html)) {
      errors.push(`${relative}: archived note ${note.slug} lacks a visible historical label`);
    }
  }
  if (html.includes(`/research/${expertiseData.slug}/#article`)) {
    errors.push(`${relative}: programming archive schema includes a research-only note`);
  }
  if (!html.includes(`hreflang="${language}"`)) errors.push(`${relative}: language self-reference is missing`);
  if (!html.includes(`hreflang="x-default" href="${siteUrl}/updates/"`)) {
    errors.push(`${relative}: update archive x-default must be the English archive`);
  }
}

const feed = await fs.readFile(path.join(rootDir, "feed.xml"), "utf8");
if (!feed.includes("<name>Armel Tenkiang</name>")) errors.push("feed.xml: missing author identity");
for (const note of (updateNotes.items || []).filter((item) => !item.historical)) {
  const url = `${siteUrl}/updates/${note.slug}/`;
  if (!feed.includes(`<id>${url}</id>`)) errors.push(`feed.xml: missing ${note.slug}`);
}

for (const item of renderedUpdates.items || []) {
  if (privateSources.has(item.source) && /github\.com/i.test(item.url || "")) {
    errors.push(`data/updates.json: ${item.source} exposes a private repository URL`);
  }
  const historicalMatch = (updateNotes.items || []).find(
    (note) => note.historical && note.verified_commit === item.verified_commit
  );
  if (historicalMatch) errors.push(`data/updates.json: historical note ${historicalMatch.slug} appears in recent activity`);
}

const normalizeText = (value) => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const extractProjectCards = (html) => new Map(
  [...html.matchAll(/<article class="card(?: [^"]*)?"[^>]*>([\s\S]*?)<\/article>/g)].map((match) => {
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
      if (!html.includes(`"disambiguatingDescription": "${project.identity.descriptor}"`)) {
        errors.push(`${relative}: project schema is missing the stable identity descriptor`);
      }
      const caseStudy = project.caseStudy?.[language];
      if (caseStudy) {
        if (!html.includes(`project-evidence:${project.slug}:start`) || !html.includes(`<h2>${caseStudy.heading}</h2>`)) {
          errors.push(`${relative}: missing generated engineering frame`);
        }
        for (const item of caseStudy.items || []) {
          if (!html.includes(item.description)) errors.push(`${relative}: engineering frame differs from project data`);
        }
      }
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
