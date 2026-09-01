import fs from "fs/promises";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const languages = ["it", "en", "fr", "pt"];
const localizedPath = (lang, route) => lang === "it" ? route : `/${lang}${route}`;

const projectData = JSON.parse(await fs.readFile(path.join(rootDir, "data/projects.json"), "utf8"));
const expertiseData = JSON.parse(await fs.readFile(path.join(rootDir, "data/expertise.json"), "utf8"));
const siteData = JSON.parse(await fs.readFile(path.join(rootDir, "data/site.json"), "utf8"));
const projects = (projectData.projects || []).map((project) => project.slug);

const groups = [
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/")])),
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/about/")])),
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/projects/")])),
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/research/")])),
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, `/research/${expertiseData.slug}/`)])),
  {
    it: "/it/updates/",
    en: "/updates/",
    fr: "/fr/updates/",
    pt: "/pt/updates/"
  },
  ...projects.map((slug) => Object.fromEntries(
    languages.map((lang) => [lang, localizedPath(lang, `/projects/${slug}/`)])
  ))
];

const routeToFile = (route) => route === "/"
  ? "index.html"
  : `${route.replace(/^\//, "")}index.html`;

const gitDate = (file) => {
  try {
    const dirty = execFileSync("git", ["status", "--porcelain", "--", file], {
      cwd: rootDir,
      encoding: "utf8"
    }).trim();
    if (dirty) return new Date().toISOString().slice(0, 10);
    return execFileSync("git", ["log", "-1", "--format=%cs", "--", file], {
      cwd: rootDir,
      encoding: "utf8"
    }).trim();
  } catch {
    return "";
  }
};

const latestPublishedActivityDate = async () => {
  try {
    const updates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));
    return updates.latest_item_at?.slice(0, 10) || "";
  } catch {
    return "";
  }
};

const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

// Sitemap freshness follows visible source activity, not the hourly time at
// which GitHub Actions happened to regenerate statistics.
const activityDate = await latestPublishedActivityDate();
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const entries = [];

for (const group of groups) {
  for (const lang of languages) {
    const route = group[lang];
    const file = routeToFile(route);
    try {
      await fs.access(path.join(rootDir, file));
    } catch {
      throw new Error(`Cannot add missing page to sitemap: ${file}`);
    }

    const fileDate = gitDate(file);
    const isUpdateArchive = ["/it/updates/", "/updates/", "/fr/updates/", "/pt/updates/"].includes(route);
    const lastmod = ["/", "/en/", "/fr/", "/pt/"].includes(route)
      ? [activityDate, siteData.content_modified].filter(Boolean).sort().at(-1)
      : ["/about/", "/en/about/", "/fr/about/", "/pt/about/"].includes(route)
        ? siteData.profile_modified
        : isUpdateArchive
          ? [activityDate, fileDate].filter(Boolean).sort().at(-1)
          : fileDate;
    const alternates = languages.map((alternateLang) =>
      `    <xhtml:link rel="alternate" hreflang="${alternateLang}" href="${siteUrl}${group[alternateLang]}" />`
    );
    const defaultRoute = isUpdateArchive ? group.en : group.it;
    alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${defaultRoute}" />`);

    entries.push([
      "  <url>",
      `    <loc>${escapeXml(`${siteUrl}${route}`)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
      ...alternates,
      "  </url>"
    ].filter(Boolean).join("\n"));
  }
}

for (const note of updateNotes.items || []) {
  const updateFile = `updates/${note.slug}/index.html`;
  try {
    await fs.access(path.join(rootDir, updateFile));
  } catch {
    throw new Error(`Cannot add missing programming update to sitemap: ${updateFile}`);
  }
  entries.push([
    "  <url>",
    `    <loc>${siteUrl}/updates/${escapeXml(note.slug)}/</loc>`,
    `    <lastmod>${String(note.modified || note.date).slice(0, 10)}</lastmod>`,
    "  </url>"
  ].join("\n"));
}

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
  "",
  entries.join("\n\n"),
  "",
  "</urlset>",
  ""
].join("\n");

await fs.writeFile(path.join(rootDir, "sitemap.xml"), sitemap, "utf8");
console.log(`Wrote ${entries.length} URLs to sitemap.xml.`);
