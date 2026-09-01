import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const siteData = JSON.parse(await fs.readFile(path.join(rootDir, "data/site.json"), "utf8"));
const attempts = Math.max(1, Number.parseInt(process.env.LIVE_CHECK_ATTEMPTS || "1", 10));
const delayMs = Math.max(1_000, Number.parseInt(process.env.LIVE_CHECK_DELAY_MS || "45000", 10));

const localFileForUrl = (url) => {
  const pathname = new URL(url).pathname;
  if (pathname === "/") return "index.html";
  if (pathname.endsWith("/")) return `${pathname.slice(1)}index.html`;
  return pathname.slice(1);
};

const checks = [
  ...(siteData.priority_urls || []).map((url) => ({ url, file: localFileForUrl(url), type: "html" })),
  { url: `${siteUrl}/robots.txt`, file: "robots.txt", type: "text" },
  { url: `${siteUrl}/sitemap.xml`, file: "sitemap.xml", type: "xml" },
  { url: `${siteUrl}/favicon-48.png`, file: "favicon-48.png", type: "png" }
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const normalizeText = (value) => value.replaceAll("\r\n", "\n").trimEnd();

const verify = async ({ url, file, type }) => {
  const local = await fs.readFile(path.join(rootDir, file));
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("site-health", Date.now().toString());

  const response = await fetch(requestUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(20_000),
    headers: { "user-agent": "armeltenkiang-site-health/1.0" }
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  if (response.headers.get("x-robots-tag")?.toLowerCase().includes("noindex")) {
    throw new Error(`${url} sends an X-Robots-Tag noindex directive`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (type === "html" && !contentType.includes("text/html")) throw new Error(`${url} is not served as HTML`);
  if (type === "xml" && !/(?:xml|text\/plain)/i.test(contentType)) throw new Error(`${url} is not served as XML`);
  if (type === "png" && !contentType.includes("image/png")) throw new Error(`${url} is not served as PNG`);

  const live = Buffer.from(await response.arrayBuffer());
  const matches = type === "png"
    ? live.equals(local)
    : normalizeText(live.toString("utf8")) === normalizeText(local.toString("utf8"));
  if (!matches) throw new Error(`${url} does not match ${file} on main`);

  if (type === "html") {
    const html = live.toString("utf8");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
    if (canonical !== url) throw new Error(`${url} declares ${canonical || "no canonical URL"}`);
    if (/<meta name="robots" content="[^"]*noindex/i.test(html)) throw new Error(`${url} contains noindex`);
    if (!html.includes("Armel Tenkiang")) throw new Error(`${url} does not identify Armel Tenkiang`);
  }
};

let lastFailures = [];
for (let attempt = 1; attempt <= attempts; attempt += 1) {
  const results = await Promise.allSettled(checks.map(verify));
  lastFailures = results.flatMap((result, index) => result.status === "rejected"
    ? [`${checks[index].file}: ${result.reason?.message || result.reason}`]
    : []);
  if (!lastFailures.length) {
    console.log(`Live search surface matches ${checks.length} repository files.`);
    process.exit(0);
  }
  if (attempt < attempts) {
    console.warn(`Live check ${attempt}/${attempts} is not current; retrying in ${Math.round(delayMs / 1000)} seconds.`);
    await sleep(delayMs);
  }
}

console.error(lastFailures.map((failure) => `- ${failure}`).join("\n"));
process.exit(1);
