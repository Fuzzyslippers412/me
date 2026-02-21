import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const sourcesPath = path.join(dataDir, "sources.json");
const updatesPath = path.join(dataDir, "updates.json");

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const extractTag = (block, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : "";
};

const extractLink = (block) => {
  const attrMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (attrMatch) {
    return attrMatch[1].trim();
  }
  return extractTag(block, "link");
};

const parseXmlFeed = (xml, source) => {
  const items = [];
  const itemBlocks = xml.match(/<item>[\\s\\S]*?<\\/item>/gi) || [];
  const entryBlocks = xml.match(/<entry>[\\s\\S]*?<\\/entry>/gi) || [];
  const blocks = itemBlocks.length ? itemBlocks : entryBlocks;

  for (const block of blocks) {
    const title = extractTag(block, "title") || "Update";
    const date =
      extractTag(block, "pubDate") ||
      extractTag(block, "updated") ||
      extractTag(block, "dc:date") ||
      "";
    const url = extractLink(block) || source.site;

    items.push({
      source: source.name,
      title,
      date,
      url
    });
  }

  return items;
};

const normalizeJsonItems = (data, source) => {
  const rawItems = Array.isArray(data) ? data : data.items || data.entries || [];
  return rawItems.map((item) => ({
    source: item.source || source.name,
    title: item.title || item.summary || "Update",
    date: item.date || item.published || item.updated || "",
    url: item.url || item.link || source.site
  }));
};

const fetchSourceUpdates = async (source) => {
  if (!source.feed) {
    return [];
  }

  try {
    const response = await fetch(source.feed, {
      headers: { "User-Agent": "armeltenkiang.com updates" }
    });
    if (!response.ok) {
      return [];
    }

    const text = await response.text();
    const trimmed = text.trim();

    if (trimmed.startsWith("{")) {
      return normalizeJsonItems(JSON.parse(trimmed), source);
    }
    if (trimmed.startsWith("[")) {
      return normalizeJsonItems(JSON.parse(trimmed), source);
    }

    return parseXmlFeed(trimmed, source);
  } catch (error) {
    return [];
  }
};

const main = async () => {
  const { sources } = await readJson(sourcesPath);
  const allItems = [];

  for (const source of sources) {
    const items = await fetchSourceUpdates(source);
    allItems.push(...items.slice(0, 3));
  }

  const cleaned = allItems.filter((item) => item.date);
  cleaned.sort((a, b) => new Date(b.date) - new Date(a.date));

  const output = {
    generated_at: new Date().toISOString(),
    items: cleaned.slice(0, 10)
  };

  await fs.writeFile(updatesPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`Wrote ${output.items.length} updates to ${updatesPath}`);
};

main();
