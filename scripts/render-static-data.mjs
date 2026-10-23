import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";
import { withActivityTitles } from "./lib/activity-copy.mjs";
import { frenchTypography } from "./lib/river-presentation.mjs";
import { activityCheckLabels, formatActivityCheck } from "./lib/activity-time.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const updates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));
const profile = JSON.parse(await fs.readFile(path.join(rootDir, "data/profile.json"), "utf8"));
updates.items = (updates.items || []).map(withActivityTitles);
await writeFileAtomically(path.join(rootDir, "data/updates.json"), `${JSON.stringify(updates, null, 2)}\n`, "utf8");

const pages = [
  ["index.html", "it-IT"],
  ["en/index.html", "en-US"],
  ["fr/index.html", "fr-FR"],
  ["pt/index.html", "pt-PT"],
  ["about/index.html", "it-IT"],
  ["en/about/index.html", "en-US"],
  ["fr/about/index.html", "fr-FR"],
  ["pt/about/index.html", "pt-PT"],
  ["updates/index.html", "en-US"]
];

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const safeUrl = (value) => {
  if (/^\/(?!\/)/.test(String(value || ""))) return String(value);
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "/";
  } catch {
    return "/";
  }
};

const formatDate = (value, locale, options) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";
  return new Intl.DateTimeFormat(locale, { timeZone: "UTC", ...options }).format(date);
};

const renderUpdates = (locale) => (updates.items || []).slice(0, 5).map((item) => {
  const date = formatDate(item.date, locale, { month: "long", year: "numeric" });
  const source = escapeHtml(item.source || "Project");
  return `          <li><a href="${escapeHtml(safeUrl(item.display_urls?.[locale.slice(0, 2)] || item.url))}"><time class="update-date" datetime="${escapeHtml(item.date || "")}">${escapeHtml(date)}</time><span class="update-project">${source}</span><span class="update-title">${escapeHtml(item.display_titles?.[locale.slice(0, 2)] || item.title || "Update")}</span></a></li>`;
}).join("\n");

const replaceDataText = (html, attribute, value) => html.replace(
  new RegExp(`(<[^>]+${attribute}[^>]*>)[\\s\\S]*?(<\\/[^>]+>)`, "g"),
  (_match, open, close) => `${open}${escapeHtml(value)}${close}`
);

for (const [relative, locale] of pages) {
  const file = path.join(rootDir, relative);
  let html = await fs.readFile(file, "utf8");
  const original = html;

  if (/data-updates/.test(html) && updates.items?.length) {
    html = html.replace(
      /(<ul class="updates-list" data-updates>)[\s\S]*?(<\/ul>)/,
      (_match, open, close) => `${open}\n${renderUpdates(locale)}\n        ${close}`
    );
  }

  if (/data-updated-at/.test(html)) {
    const prefix = activityCheckLabels[locale.slice(0, 2)];
    html = html.replace(/(<p\b[^>]*\bdata-updated-at\b[^>]*\bdata-prefix=")[^"]*(")/g,
      (_match, open, close) => `${open}${escapeHtml(prefix)}${close}`);
    html = replaceDataText(html, "data-updated-at", `${prefix} ${formatActivityCheck(updates, locale)}`);
  }

  const github = profile.github || {};
  const snapshotWarning = {
    "en-US": "Cached snapshot; source verification pending.",
    "it-IT": "Snapshot in cache; verifica della fonte in attesa.",
    "fr-FR": "Instantané en cache ; vérification de la source en attente.",
    "pt-PT": "Snapshot em cache; verificação da fonte pendente."
  };
  html = html.replace(/<p class="section-note"[^>]*>[\s\S]*?<\/p>/g, (paragraph) => {
    if (!paragraph.includes("data-github-contribs")) return paragraph;
    paragraph = paragraph.replace(/\s*<span data-github-quality>[\s\S]*?<\/span>/g, "");
    const warning = github.measurement_source === "github_graphql_contributions_collection" ? "" : snapshotWarning[locale];
    return paragraph.replace("</p>", `<span data-github-quality>${warning || ""}</span></p>`);
  });
  const replacements = [
    ["data-github-contribs", github.contributions_last_year],
    ["data-github-year", github.year],
    ["data-github-total-year", github.total_contributions_this_year],
    ["data-github-year-commits", github.commit_contributions_this_year],
    ["data-tracked-year-commits", github.tracked_project_commit_contributions_this_year]
  ];
  for (const [attribute, value] of replacements) {
    if (typeof value === "number") html = replaceDataText(html, attribute, value);
  }
  if (github.as_of) {
    html = html.replace(
      /<(?:span|time) data-github-asof(?:\s+datetime="[^"]*")?>([\s\S]*?)<\/(?:span|time)>/g,
      (_match, content) => `<time data-github-asof datetime="${escapeHtml(github.as_of)}">${content}</time>`
    );
    const asOf = formatDate(`${github.as_of}T00:00:00Z`, locale, { day: "numeric", month: "long", year: "numeric" });
    html = replaceDataText(html, "data-github-asof", asOf);
  }
  html = html.replace(
    /<p class="section-note">(GitHub\s*:[\s\S]*?data-github-contribs[\s\S]*?)<\/p>/g,
    `<p class="section-note" aria-live="polite">$1</p>`
  );

  if (locale === "fr-FR") html = frenchTypography(html);
  if (html !== original) await writeFileAtomically(file, html, "utf8");
}

console.log(`Rendered static activity data into ${pages.length} pages.`);
