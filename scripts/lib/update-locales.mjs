import fs from "node:fs/promises";
import { createHash } from "node:crypto";

export const noteLanguages = ["it", "en", "fr", "pt"];
export const notes = JSON.parse(await fs.readFile(new URL("../../data/update-notes.json", import.meta.url), "utf8")).items;
const translations = Object.fromEntries(await Promise.all(noteLanguages.filter((lang) => lang !== "en").map(async (lang) => [
  lang, JSON.parse(await fs.readFile(new URL(`../../data/update-translations/${lang}.json`, import.meta.url), "utf8"))
])));
const copyKeys = ["title", "seo_title", "seo_description", "source_label", "summary", "details", "engineering_note", "technical_sections"];
const text = (value) => typeof value === "string" && value.trim().length > 0;

export function sourceDigest(note) {
  const copy = Object.fromEntries(copyKeys.map((key) => [key, note[key]]));
  return createHash("sha256").update(JSON.stringify({ ...copy, historical: Boolean(note.historical) })).digest("hex");
}

// A changed source must be translated deliberately; never silently serve English
// under another language's URL or replace source evidence with translated metadata.
export function validateTranslation(note, translation, lang) {
  const fail = (reason) => { throw new Error(`${lang}/${note.slug}: ${reason}`); };
  if (!translation) fail("missing article translation");
  if (translation.source_sha256 !== sourceDigest(note)) fail("translation is stale; review the changed English source");
  for (const key of Object.keys(translation)) {
    if (![...copyKeys, "source_sha256"].includes(key)) fail(`unexpected translation field ${key}`);
  }
  for (const key of ["title", "seo_title", "source_label", "summary", "engineering_note"]) {
    if (!text(translation[key])) fail(`missing ${key}`);
  }
  if (translation.seo_description !== undefined && (!text(translation.seo_description) || translation.seo_description.length > 180)) fail("invalid SEO description");
  if (!Array.isArray(translation.details) || translation.details.length !== note.details.length || !translation.details.every(text)) fail("incomplete details");
  const sections = translation.technical_sections || [];
  if (!Array.isArray(sections) || sections.length !== (note.technical_sections || []).length) fail("incomplete technical sections");
  sections.forEach((section, index) => {
    if (!text(section.heading) || !Array.isArray(section.paragraphs) || section.paragraphs.length !== note.technical_sections[index].paragraphs.length || !section.paragraphs.every(text)) fail(`incomplete section ${index + 1}`);
  });
}

export function noteArchivePath(lang) {
  if (!noteLanguages.includes(lang)) throw new Error(`Unsupported article language: ${lang}`);
  return lang === "en" ? "/updates/" : `/${lang}/updates/`;
}

export const notePath = (slug, lang) => `${noteArchivePath(lang)}${slug}/`;

export function getLocalizedNote(note, lang) {
  noteArchivePath(lang);
  if (lang === "en") return note;
  const translation = translations[lang].items[note.slug];
  validateTranslation(note, translation, lang);
  return {
    ...note,
    ...Object.fromEntries(copyKeys.filter((key) => key in translation).map((key) => [key, translation[key]])),
    translated_on: translations[lang].translated_on
  };
}

export function noteModified(note, lang) {
  const localized = getLocalizedNote(note, lang);
  return localized.translated_on ? `${localized.translated_on}T00:00:00Z` : note.modified || note.date;
}

export function noteFromUrl(value) {
  let url;
  try { url = new URL(value, "https://armeltenkiang.com"); } catch { return undefined; }
  if (url.origin !== "https://armeltenkiang.com") return undefined;
  const slug = url.pathname.match(/^\/(?:it\/|en\/|fr\/|pt\/)?updates\/([a-z0-9-]+)\/$/)?.[1];
  return notes.find((note) => note.slug === slug);
}

for (const [lang, data] of Object.entries(translations)) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.translated_on) || !Number.isFinite(Date.parse(data.translated_on))) throw new Error(`${lang}: invalid translation date`);
  for (const slug of Object.keys(data.items)) {
    if (!notes.some((note) => note.slug === slug)) throw new Error(`${lang}: unknown article ${slug}`);
  }
  for (const note of notes) validateTranslation(note, data.items[note.slug], lang);
}
