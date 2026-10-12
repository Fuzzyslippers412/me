import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".woff2": "font/woff2", ".xml": "application/xml", ".webmanifest": "application/manifest+json" };

export async function previewFiles() {
  const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
  const files = new Map();
  for (const [, reference] of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = new URL(reference);
    if (url.origin !== "https://armeltenkiang.com") throw new Error("Unexpected sitemap origin");
    files.set(url.pathname, `${url.pathname.slice(1)}index.html`);
  }
  for (const file of ["404.html", "style.css", "site.webmanifest", "sitemap.xml", "feed.xml", "favicon.svg", "favicon.ico", "favicon.png", "favicon-48.png", "apple-touch-icon.png", "og-image.png", "scripts/updates.js", "scripts/profile-stats.js", "data/updates.json", "data/profile.json", "fonts/hanken-grotesk-latin.woff2", "fonts/fragment-mono-latin.woff2"]) files.set(`/${file}`, file);
  files.set("/fonts/newsreader-latin.woff2", "fonts/newsreader-latin.woff2");
  return files;
}

export function localizePreviewLinks(html) {
  return html.replace(/(<a\b[^>]*href=")https:\/\/armeltenkiang\.com(?=\/)/g, "$1");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT must be an integer from 1 to 65535");
  const files = await previewFiles();
  const server = http.createServer(async (request, response) => {
    if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405); response.end(); return; }
    try {
      const route = new URL(request.url, `http://127.0.0.1:${port}`).pathname;
      const file = files.get(route);
      if (!file) { response.writeHead(404, { "Content-Type": "text/plain" }); response.end("Not found"); return; }
      const extension = path.extname(file);
      const bytes = await fs.readFile(path.join(root, file));
      const body = extension === ".html" ? localizePreviewLinks(bytes.toString("utf8")) : bytes;
      response.writeHead(200, { "Content-Type": `${types[extension]}${[".html", ".css", ".js", ".json", ".xml"].includes(extension) ? "; charset=utf-8" : ""}`, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch { response.writeHead(500); response.end("Preview read failed"); }
  });
  server.on("error", (error) => { console.error(`Cannot start local preview (${error.code}).`); process.exitCode = 1; });
  // Serve only the public route/asset allowlist, never repository files or keys.
  server.listen(port, "127.0.0.1", () => console.log(`Preview: http://127.0.0.1:${port}/`));
}
