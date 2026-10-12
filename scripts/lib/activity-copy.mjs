import fs from "node:fs/promises";

export const translatedTitles = JSON.parse(await fs.readFile(new URL("../../data/activity-titles.json", import.meta.url), "utf8"));

// Translations affect display only. Original titles, commit IDs, dates and URLs remain intact.
export function withActivityTitles(item) {
  const slug = String(item.url || "").match(/^\/updates\/([^/]+)\/$/)?.[1];
  const titles = translatedTitles[slug] || translatedTitles[item.verified_commit];
  return titles ? { ...item, display_titles: titles } : item;
}
