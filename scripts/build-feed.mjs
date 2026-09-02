import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const expertise = JSON.parse(await fs.readFile(path.join(rootDir, "data/expertise.json"), "utf8"));

const escapeXml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&apos;");

const entries = [
  {
    id: `${siteUrl}/research/${expertise.slug}/`,
    url: `${siteUrl}/research/${expertise.slug}/`,
    title: "Galidima: Private Intelligence Systems",
    summary: expertise.locales.en.article.description,
    published: `${expertise.published}T00:00:00Z`,
    updated: `${expertise.published}T00:00:00Z`
  },
  ...(updateNotes.items || []).filter((note) => !note.historical).map((note) => ({
    id: `${siteUrl}/updates/${note.slug}/`,
    url: `${siteUrl}/updates/${note.slug}/`,
    title: note.title,
    summary: note.summary,
    published: note.date,
    updated: note.modified || note.date
  }))
].sort((a, b) => new Date(b.updated) - new Date(a.updated));

if (!entries.length) throw new Error("Cannot build an empty technical-notes feed");

const feed = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<feed xmlns="http://www.w3.org/2005/Atom">',
  '  <id>https://armeltenkiang.com/</id>',
  '  <title>Armel Tenkiang — Technical Notes</title>',
  `  <updated>${escapeXml(entries[0].updated)}</updated>`,
  '  <author>',
  '    <name>Armel Tenkiang</name>',
  '    <uri>https://armeltenkiang.com/en/about/</uri>',
  '  </author>',
  '  <link rel="self" type="application/atom+xml" href="https://armeltenkiang.com/feed.xml" />',
  '  <link rel="alternate" type="text/html" href="https://armeltenkiang.com/updates/" />',
  ...entries.flatMap((entry) => [
    '  <entry>',
    `    <id>${escapeXml(entry.id)}</id>`,
    `    <title>${escapeXml(entry.title)}</title>`,
    `    <link rel="alternate" type="text/html" href="${escapeXml(entry.url)}" />`,
    `    <published>${escapeXml(entry.published)}</published>`,
    `    <updated>${escapeXml(entry.updated)}</updated>`,
    `    <summary type="text">${escapeXml(entry.summary)}</summary>`,
    '  </entry>'
  ]),
  '</feed>',
  ''
].join("\n");

await writeFileAtomically(path.join(rootDir, "feed.xml"), feed, "utf8");
console.log(`Wrote ${entries.length} entries to feed.xml.`);
