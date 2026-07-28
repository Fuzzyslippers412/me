import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const updates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));
const profile = JSON.parse(await fs.readFile(path.join(rootDir, "data/profile.json"), "utf8"));
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));

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
  return `          <li><a href="${escapeHtml(safeUrl(item.url))}"><time class="update-date" datetime="${escapeHtml(item.date || "")}">${escapeHtml(date)}</time><span class="update-project">${source}</span><span class="update-title">${escapeHtml(item.title || "Update")}</span></a></li>`;
}).join("\n");

const renderUpdateArchive = (locale) => (updateNotes.items || []).map((item) => {
  const date = formatDate(item.date, locale, { day: "numeric", month: "short", year: "numeric" });
  const source = escapeHtml(item.source || "Project");
  return `          <li><a href="/updates/${escapeHtml(item.slug)}/"><time class="update-date" datetime="${escapeHtml(String(item.date || "").slice(0, 10))}">${escapeHtml(date)}</time><span class="update-project">${source}</span><span class="update-title">${escapeHtml(item.title || "Programming note")}</span></a></li>`;
}).join("\n");

const replaceDataText = (html, attribute, value) => html.replace(
  new RegExp(`(<[^>]+${attribute}[^>]*>)[\\s\\S]*?(<\\/[^>]+>)`, "g"),
  `$1${escapeHtml(value)}$2`
);

for (const [relative, locale] of pages) {
  const file = path.join(rootDir, relative);
  let html = await fs.readFile(file, "utf8");
  const original = html;

  if (/data-updates/.test(html) && updates.items?.length) {
    html = html.replace(
      /(<ul class="updates-list" data-updates>)[\s\S]*?(<\/ul>)/,
      `$1\n${renderUpdates(locale)}\n        $2`
    );
  }

  if (/data-update-archive/.test(html) && updateNotes.items?.length) {
    html = html.replace(
      /(<ul class="updates-list" data-update-archive>)[\s\S]*?(<\/ul>)/,
      `$1\n${renderUpdateArchive(locale)}\n        $2`
    );
  }

  const latest = updates.latest_item_at || updates.generated_at;
  if (latest && /data-updated-at/.test(html)) {
    const prefix = html.match(/data-updated-at[^>]*data-prefix="([^"]*)"/)?.[1] || "";
    const date = formatDate(latest, locale, { day: "numeric", month: "long", year: "numeric" });
    html = replaceDataText(html, "data-updated-at", prefix ? `${prefix} ${date}` : date);
  }

  const github = profile.github || {};
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
    const asOf = formatDate(`${github.as_of}T00:00:00Z`, locale, { day: "numeric", month: "long", year: "numeric" });
    html = replaceDataText(html, "data-github-asof", asOf);
  }

  if (html !== original) await fs.writeFile(file, html, "utf8");
}

console.log(`Rendered static activity data into ${pages.length} pages.`);
