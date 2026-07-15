import fs from "fs/promises";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const languages = ["it", "en", "fr", "pt"];
const localizedPath = (lang, route) => lang === "it" ? route : `/${lang}${route}`;

const projects = [
  "mycasapro",
  "theo-farm",
  "au-jour-le-jour",
  "respometer",
  "ghostprotocol",
  "chattypatty",
  "soundcheck-ai"
];

const groups = [
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/")])),
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/about/")])),
  Object.fromEntries(languages.map((lang) => [lang, localizedPath(lang, "/projects/")])),
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

const generatedDate = async () => {
  try {
    const updates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));
    const profile = JSON.parse(await fs.readFile(path.join(rootDir, "data/profile.json"), "utf8"));
    return [updates.generated_at, profile.generated_at]
      .filter(Boolean)
      .sort()
      .at(-1)
      ?.slice(0, 10) || "";
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

const activityDate = await generatedDate();
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
    const lastmod = ["/", "/en/", "/fr/", "/pt/"].includes(route)
      ? [activityDate, fileDate].filter(Boolean).sort().at(-1)
      : fileDate;
    const alternates = languages.map((alternateLang) =>
      `    <xhtml:link rel="alternate" hreflang="${alternateLang}" href="${siteUrl}${group[alternateLang]}" />`
    );
    alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${siteUrl}${group.it}" />`);

    entries.push([
      "  <url>",
      `    <loc>${escapeXml(`${siteUrl}${route}`)}</loc>`,
      lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
      ...alternates,
      "  </url>"
    ].filter(Boolean).join("\n"));
  }
}

const updatesFile = "updates/index.html";
entries.push([
  "  <url>",
  `    <loc>${siteUrl}/updates/</loc>`,
  `    <lastmod>${[activityDate, gitDate(updatesFile)].filter(Boolean).sort().at(-1)}</lastmod>`,
  "  </url>"
].join("\n"));

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
