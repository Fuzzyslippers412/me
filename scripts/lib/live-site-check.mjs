import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const siteUrl = "https://armeltenkiang.com";
const normalizeText = (value) => value.replaceAll("\r\n", "\n").trimEnd();

export function createSnapshotSource(root, { local = false } = {}) {
  const git = async (...args) => {
    try {
      const { stdout } = await exec("git", args, {
        cwd: root, encoding: "buffer", timeout: 30000, maxBuffer: 8 * 1024 * 1024,
        env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }
      });
      return stdout;
    } catch (error) {
      // Do not print remote URLs or authentication headers from Git diagnostics.
      throw new Error(`Git ${args[0]} ${error.killed ? "timed out" : "failed"}; cannot verify origin/main.`);
    }
  };
  const currentRevision = async () => {
    if (local) return "local working files";
    const result = (await git("ls-remote", "--exit-code", "origin", "refs/heads/main")).toString().trim();
    const [revision, ref] = result.split(/\s+/);
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/.test(revision) || ref !== "refs/heads/main") {
      throw new Error("Cannot determine the exact origin/main commit.");
    }
    return revision;
  };
  return {
    currentRevision,
    async load() {
      const revision = await currentRevision();
      if (!local) {
        try {
          await git("cat-file", "-e", `${revision}^{commit}`);
        } catch {
          // Fetch objects only: never checkout, reset, rebase, or change FETCH_HEAD/branches.
          await git("fetch", "--no-tags", "--no-write-fetch-head", "--no-recurse-submodules", "origin", revision);
        }
      }
      const read = (file) => local
        ? fs.readFile(path.join(root, file))
        : git("show", `${revision}:${file}`);
      const config = JSON.parse((await read("data/site.json")).toString());
      const files = await Promise.all(buildChecks(config).map(async (check) => ({
        ...check, expected: await read(check.file)
      })));
      return { revision, files };
    }
  };
}

function buildChecks(config) {
  if (!Array.isArray(config.priority_urls) || !config.priority_urls.length) {
    throw new Error("The selected snapshot has no priority URLs to check.");
  }
  return [
    ...config.priority_urls.map((url) => {
      const parsed = new URL(url);
      if (parsed.origin !== siteUrl || parsed.search || parsed.hash) {
        throw new Error("Priority URLs must be canonical URLs on armeltenkiang.com.");
      }
      const file = parsed.pathname.endsWith("/")
        ? `${parsed.pathname.slice(1)}index.html` : parsed.pathname.slice(1);
      return { url, file, type: "html" };
    }),
    ...[
      ["robots.txt", "text"], ["sitemap.xml", "xml"],
      ["favicon-48.png", "png"], ["favicon.png", "png"],
      ["apple-touch-icon.png", "png"], ["og-image.png", "png"], ["style.css", "css"]
    ].map(([file, type]) => ({ url: `${siteUrl}/${file}`, file, type }))
  ];
}

export async function verifyLiveFile({ url, file, type, expected }, fetchImpl = fetch) {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("site-health", Date.now().toString());
  const response = await fetchImpl(requestUrl, {
    redirect: "follow", signal: AbortSignal.timeout(20000),
    headers: { "user-agent": "armeltenkiang-site-health/1.0", "cache-control": "no-cache" }
  });
  if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
  if (response.headers.get("x-robots-tag")?.toLowerCase().includes("noindex")) {
    throw new Error(`${url} sends an X-Robots-Tag noindex directive`);
  }
  const contentType = response.headers.get("content-type") || "";
  if (type === "html" && !contentType.includes("text/html")) throw new Error(`${url} is not served as HTML`);
  if (type === "xml" && !/(?:xml|text\/plain)/i.test(contentType)) throw new Error(`${url} is not served as XML`);
  if (type === "png" && !contentType.includes("image/png")) throw new Error(`${url} is not served as PNG`);
  if (type === "css" && !contentType.includes("text/css")) throw new Error(`${url} is not served as CSS`);
  const finalUrl = new URL(response.url);
  if (finalUrl.origin !== siteUrl || finalUrl.pathname !== new URL(url).pathname) {
    throw new Error(`${url} unexpectedly redirects to ${response.url}`);
  }
  const live = Buffer.from(await response.arrayBuffer());
  const matches = type === "png"
    ? live.equals(expected)
    : normalizeText(live.toString("utf8")) === normalizeText(expected.toString("utf8"));
  if (!matches) throw new Error(`${url} does not match ${file} in the selected snapshot`);
  if (type === "html") {
    const html = live.toString("utf8");
    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/i)?.[1];
    if (canonical !== url) throw new Error(`${url} declares ${canonical || "no canonical URL"}`);
    if (/<meta name="robots" content="[^"]*noindex/i.test(html)) throw new Error(`${url} contains noindex`);
    if (!html.includes("Armel Tenkiang")) throw new Error(`${url} does not identify Armel Tenkiang`);
  }
}

export async function checkLiveSite({
  source, attempts = 1, delayMs = 45000, fetchImpl = fetch, logger = console,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
}) {
  let failures = [];
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const snapshot = await source.load();
      logger.log(`Live check ${attempt}/${attempts}: comparing ${snapshot.files.length} files with ${snapshot.revision}.`);
      const results = await Promise.allSettled(snapshot.files.map((file) => verifyLiveFile(file, fetchImpl)));
      failures = results.flatMap((result, index) => result.status === "rejected"
        ? [`${snapshot.files[index].file}: ${result.reason?.message || result.reason}`] : []);
      // A successful comparison against an obsolete commit is not a successful deployment check.
      const current = await source.currentRevision();
      if (current !== snapshot.revision) {
        failures.unshift(`origin/main advanced from ${snapshot.revision} to ${current}; a fresh comparison is required.`);
      }
      if (!failures.length) {
        logger.log(`Live search surface matches ${snapshot.files.length} repository files at ${snapshot.revision}.`);
        return { ok: true, revision: snapshot.revision, count: snapshot.files.length, failures: [] };
      }
    } catch (error) {
      failures = [error.message];
    }
    if (attempt < attempts) {
      logger.warn(`Live check ${attempt}/${attempts}: ${failures.join("; ")} Retrying in ${Math.round(delayMs / 1000)} seconds.`);
      await sleep(delayMs);
    }
  }
  return { ok: false, failures };
}
