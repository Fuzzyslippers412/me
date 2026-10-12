import fs from "node:fs/promises";
import { noteFromUrl, noteLanguages, notePath, getLocalizedNote } from "./update-locales.mjs";

const translatedTitles = JSON.parse(await fs.readFile(new URL("../../data/activity-titles.json", import.meta.url), "utf8"));

// Translations affect display only. Original titles, commit IDs, dates and URLs remain intact.
export function withActivityTitles(item) {
  const note = noteFromUrl(item.url);
  if (note) return {
    ...item,
    display_titles: Object.fromEntries(noteLanguages.map((lang) => [lang, getLocalizedNote(note, lang).title])),
    display_urls: Object.fromEntries(noteLanguages.map((lang) => [lang, notePath(note.slug, lang)]))
  };
  const titles = translatedTitles[item.verified_commit];
  return titles ? { ...item, display_titles: titles } : item;
}
