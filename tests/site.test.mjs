import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import vm from "node:vm";
import { enhancePresentation } from "../scripts/lib/presentation.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const locales = ["it", "en", "fr", "pt"];
const projectData = JSON.parse(await read("data/projects.json"));
const configFor = (lang) => {
  const prefix = lang === "it" ? "" : `/${lang}`;
  return { home: `${prefix}/`, projects: `${prefix}/projects/`, research: `${prefix}/research/` };
};
const fileFor = (route) => `${route.slice(1)}index.html`;

for (const lang of locales) {
  const config = configFor(lang);
  test(`${lang}: homepage structure, source updates, and a single featured project`, async () => {
    const html = await read(fileFor(config.home));
    assert.match(html, /<h1>Armel Tenkiang<\/h1>/);
    const sections = [...html.matchAll(/<section class="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(sections, ["hero", "projects", "systems-practice", "updates", "now", "profile-snapshot", "contact"]);
    assert.equal((html.match(/class="project-flow"/g) || []).length, 1);
    assert.equal((html.match(/class="update-date"/g) || []).length, 5);
    const cards = [...html.matchAll(/<article[^>]+data-project="([^"]+)"/g)].map((m) => m[1]);
    assert.equal(cards[0], "mycasapro");
    assert.equal(new Set(cards).size, projectData.projects.length);
    assert.equal(enhancePresentation(html, { lang, route: config.home, config }), html);
  });

  test(`${lang}: project titles, research links, and descriptions stay coordinated`, async () => {
    const homepage = await read(fileFor(config.home));
    const projectIndex = await read(fileFor(config.projects));
    const research = await read(fileFor(config.research));
    for (const project of projectData.projects) {
      const route = `${config.projects}${project.slug}/`;
      const html = await read(fileFor(route));
      const anchor = `<h3><a href="${route}">${project.name}</a></h3>`;
      assert.ok(homepage.includes(anchor), `Missing linked title: ${project.name}`);
      assert.ok(projectIndex.includes(anchor), `Missing linked index title: ${project.name}`);
      const description = (source) => source.match(new RegExp(`<article[^>]+data-project="${project.slug}"[^>]*>[\\s\\S]*?<p>([\\s\\S]*?)<\\/p>`))?.[1].trim();
      assert.equal(description(homepage), description(projectIndex));
      const topic = html.match(/class="page-section related-research"[\s\S]*?href="([^"#]+)#([^"]+)"/);
      assert.equal(topic?.[1], config.research);
      assert.ok(research.includes(`id="${topic[2]}"`));
      assert.equal(enhancePresentation(html, { lang, route, config, project }), html);
    }
  });
}

test("all local fragment links resolve and section ids are unique", async () => {
  const walk = async (dir) => {
    const paths = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      if ([".git", "node_modules", "authority", "reports"].includes(entry.name)) continue;
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) paths.push(...await walk(file));
      else if (file.endsWith(".html")) paths.push(file);
    }
    return paths;
  };
  for (const file of await walk(root)) {
    const html = await fs.readFile(file, "utf8");
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `Duplicate id in ${file}`);
    for (const match of html.matchAll(/<a\b[^>]+href="#([^"]+)"/g)) {
      assert.ok(ids.includes(match[1]), `Broken #${match[1]} in ${file}`);
    }
  }
});

test("sitemap uses semantic dates rather than build or git timestamps", async () => {
  const sitemap = await read("sitemap.xml");
  const expertise = JSON.parse(await read("data/expertise.json"));
  const research = JSON.parse(await read("data/research-outputs.json"));
  const site = JSON.parse(await read("data/site.json"));
  assert.equal(research.items[0].datePublished, expertise.published);
  const dateFor = (route) => [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map((match) => match[1]).find((block) => block.includes(`<loc>https://armeltenkiang.com${route}</loc>`))?.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
  for (const lang of locales) {
    const config = configFor(lang);
    assert.equal(dateFor(`${config.research}galidima/`), expertise.modified || expertise.published);
    assert.equal(dateFor(`${config.home}about/`), site.profile_modified);
    for (const project of projectData.projects) assert.equal(dateFor(`${config.projects}${project.slug}/`), project.modified);
  }
  const generator = await read("scripts/build-sitemap.mjs");
  assert.doesNotMatch(generator, /gitDate|execFileSync|localCalendarDate/);
});

test("presentation has a small payload and explicit accessibility fallbacks", async () => {
  const css = await read("style.css");
  assert.ok(gzipSync(css).length < 8_000, "Stylesheet exceeds 8 KB compressed");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /@media print/);
  assert.match(css, /focus-visible/);
  assert.doesNotMatch(css, /AT \/26|INDEX \/ 2026|SCS \/ SYSTEMS/);
  assert.doesNotMatch(css, /grid-row: 1 \/ span (?:12|20)/);
});

test("social and browser icon dimensions match the advertised sizes", async () => {
  for (const [file, width, height] of [["favicon.png", 512, 512], ["favicon-48.png", 48, 48], ["apple-touch-icon.png", 180, 180], ["og-image.png", 1200, 630]]) {
    const bytes = await fs.readFile(path.join(root, file));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), width, file);
    assert.equal(bytes.readUInt32BE(20), height, file);
  }
});

test("GitHub refresh preserves UTC dates and exposes missing provenance", async () => {
  class TimeElement { textContent = ""; dateTime = ""; }
  const asOf = new TimeElement();
  const quality = { textContent: "" };
  const data = { github: { as_of: "2026-09-02" } };
  const document = {
    documentElement: { lang: "en" },
    querySelectorAll: (selector) => ({ "[data-github-asof]": [asOf], "[data-github-quality]": [quality] })[selector] || []
  };
  const source = await read("scripts/profile-stats.js");
  const previousTZ = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    const context = { document, HTMLTimeElement: TimeElement, fetch: async () => ({ ok: true, json: async () => data }) };
    await vm.runInNewContext(source, context);
    assert.equal(asOf.textContent, "September 2, 2026");
    assert.equal(asOf.dateTime, "2026-09-02");
    assert.match(quality.textContent, /verification pending/);
    data.github.measurement_source = "github_graphql_contributions_collection";
    await vm.runInNewContext(source, { ...context });
    assert.equal(quality.textContent, "");
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});

test("programming updates use the same UTC month and day as the static snapshot", async () => {
  const element = () => ({ children: [], append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); } });
  const list = element();
  const stamp = { textContent: "", getAttribute: () => "Last updated:" };
  let load;
  const document = {
    documentElement: { lang: "en" }, querySelector: () => list,
    querySelectorAll: () => [stamp], createElement: element,
    addEventListener: (_event, callback) => { load = callback; }
  };
  const previousTZ = process.env.TZ;
  process.env.TZ = "America/Los_Angeles";
  try {
    vm.runInNewContext(await read("scripts/updates.js"), {
      document, URL,
      fetch: async () => ({ ok: true, json: async () => ({
        latest_item_at: "2026-09-01T00:10:00Z",
        items: [{ date: "2026-09-01T00:10:00Z", title: "Example", source: "Example", url: "/updates/" }]
      }) })
    });
    await load();
    assert.equal(stamp.textContent, "Last updated: September 1, 2026");
    assert.equal(list.children[0].children[0].children[0].textContent, "September 2026");
  } finally {
    if (previousTZ === undefined) delete process.env.TZ;
    else process.env.TZ = previousTZ;
  }
});
