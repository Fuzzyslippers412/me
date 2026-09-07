import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import vm from "node:vm";
import { enhancePresentation } from "../scripts/lib/presentation.mjs";
import { selectedProjects, refineAbout, renderProjectCard } from "../scripts/lib/personal-home.mjs";
import { previewFiles, localizePreviewLinks } from "../scripts/preview-site.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (file) => fs.readFile(path.join(root, file), "utf8");
const locales = ["it", "en", "fr", "pt"];
const projectData = JSON.parse(await read("data/projects.json"));
const expertiseData = JSON.parse(await read("data/expertise.json"));
const configFor = (lang) => {
  const prefix = lang === "it" ? "" : `/${lang}`;
  return { home: `${prefix}/`, about: `${prefix}/about/`, projects: `${prefix}/projects/`, research: `${prefix}/research/`, updates: lang === "en" ? "/updates/" : `/${lang}/updates/` };
};
const fileFor = (route) => `${route.slice(1)}index.html`;

for (const lang of locales) {
  const config = configFor(lang);
  test(`${lang}: homepage structure, source updates, and a single featured project`, async () => {
    const html = await read(fileFor(config.home));
    assert.match(html, /<h1>Armel Tenkiang<\/h1>/);
    const sections = [...html.matchAll(/<section class="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(sections, ["introduction", "selected-work", "listening", "updates", "personal-end"]);
    assert.equal((html.match(/class="boundary-figure"/g) || []).length, 1);
    assert.equal((html.match(/class="update-date"/g) || []).length, 5);
    const cards = [...html.matchAll(/<article[^>]+data-project="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(cards, selectedProjects);
    assert.equal(enhancePresentation(html, { lang, route: config.home, config, projectData, expertiseData }), html);
    assert.doesNotMatch(html, /class="hero-panel"|class="now"|class="contact"/);
    const playlists = [...html.matchAll(/href="(https:\/\/soundcloud.com\/armel-tenkiang\/sets\/[^\"]+)"/g)].map((match) => match[1]);
    assert.deepEqual(playlists, ["midi", "daytime", "nightime"].map((slug) => `https://soundcloud.com/armel-tenkiang/sets/${slug}`));
    assert.doesNotMatch(html, /<iframe|<audio|autoplay/);
  });

  test(`${lang}: project titles, research links, and descriptions stay coordinated`, async () => {
    const homepage = await read(fileFor(config.home));
    const projectIndex = await read(fileFor(config.projects));
    const research = await read(fileFor(config.research));
    for (const project of projectData.projects) {
      const route = `${config.projects}${project.slug}/`;
      const html = await read(fileFor(route));
      const anchor = `<h3><a href="${route}">${project.name}</a></h3>`;
      if (selectedProjects.includes(project.slug)) assert.ok(homepage.includes(anchor), `Missing selected title: ${project.name}`);
      assert.ok(projectIndex.includes(anchor), `Missing linked index title: ${project.name}`);
      const description = (source) => source.match(new RegExp(`<article[^>]+data-project="${project.slug}"[^>]*>[\\s\\S]*?<p>([\\s\\S]*?)<\\/p>`))?.[1].trim();
      if (selectedProjects.includes(project.slug)) assert.equal(description(homepage), description(projectIndex));
      const topic = html.match(/class="page-section related-research"[\s\S]*?href="([^"#]+)#([^"]+)"/);
      assert.equal(topic?.[1], config.research);
      assert.ok(research.includes(`id="${topic[2]}"`));
      assert.equal(enhancePresentation(html, { lang, route, config, project, projectData, expertiseData }), html);
    }
  });

  test(`${lang}: About has one stable introduction and retains biography and research`, async () => {
    const html = await read(fileFor(config.about));
    assert.equal((html.match(/class="page-section about-intro"/g) || []).length, 1);
    assert.match(html, /School of Computer Science \(SCS\)/);
    assert.ok(html.includes(expertiseData.locales[lang].about.paragraphs[0]));
    assert.equal(refineAbout(html, lang), html);
    assert.doesNotMatch(html, /class="page-meta"/);
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

test("the full project index includes new source records without hand-edited cards", async () => {
  const config = configFor("en");
  const html = await read(fileFor(config.projects));
  const additional = { ...projectData.projects[0], slug: "future-project", name: "Future project" };
  const updated = enhancePresentation(html, {
    lang: "en", route: config.projects, config, expertiseData,
    projectData: { ...projectData, projects: [...projectData.projects, additional] }
  });
  const slugs = [...updated.matchAll(/<article[^>]+data-project="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(slugs.length, projectData.projects.length + 1);
  assert.equal(slugs.at(-1), additional.slug);
});

test("the invitation annotation follows its evidence key, not its position", () => {
  const project = projectData.projects.find((item) => item.slug === "mycasapro");
  const reordered = structuredClone(project);
  for (const lang of locales) {
    reordered.caseStudy[lang].items.reverse();
    const route = configFor(lang).projects;
    assert.equal(renderProjectCard(reordered, lang, route, true), renderProjectCard(project, lang, route, true));
    reordered.caseStudy[lang].items = [];
    assert.throws(() => renderProjectCard(reordered, lang, route, true), /Missing invitation-delivery evidence/);
  }
});

test("local preview exposes only public pages and assets, while preserving canonical metadata", async () => {
  const files = await previewFiles();
  for (const route of ["/", "/en/", "/en/projects/mycasapro/", "/style.css", "/data/updates.json"]) assert.ok(files.has(route));
  for (const route of ["/.git/config", "/.env", "/data/sources.json", "/scripts/build-updates.mjs", "/authority/github-profile/profile-metadata.json", "/RELEASE_REVIEW.md"]) assert.ok(!files.has(route));
  const html = '<link rel="canonical" href="https://armeltenkiang.com/en/"><a href="https://armeltenkiang.com/fr/">FR</a><a href="https://github.com/Fuzzyslippers412">GitHub</a>';
  const preview = localizePreviewLinks(html);
  assert.ok(preview.includes('<a href="/fr/">'));
  assert.ok(preview.includes('rel="canonical" href="https://armeltenkiang.com/en/"'));
  assert.ok(preview.includes('href="https://github.com/Fuzzyslippers412"'));
});

test("each illustrated project keeps its own architecture and accessible caption", async () => {
  for (const lang of locales) {
    const config = configFor(lang);
    for (const [slug, kind] of [["au-jour-le-jour", "storage"], ["chattypatty", "distributed"], ["respometer", "revision"]]) {
      const html = await read(fileFor(`${config.projects}${slug}/`));
      assert.equal((html.match(/class="architecture-figure/g) || []).length, 1);
      assert.ok(html.includes(`architecture--${kind}`));
      assert.ok(html.includes(`aria-labelledby="architecture-${slug}"`));
      assert.ok(!html.includes('class="system-map"'));
    }
    const galidima = await read(fileFor(`${config.research}galidima/`));
    assert.ok(galidima.includes('architecture--inference'));
    const mycasa = await read(fileFor(`${config.projects}mycasapro/`));
    assert.equal((mycasa.match(/class="boundary-figure"/g) || []).length, 1);
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

test("text colours retain normal-text contrast on the light surfaces", async () => {
  const css = await read("style.css");
  const colours = Object.fromEntries([...css.matchAll(/--([a-z]+):\s*(#[0-9a-f]{6});/g)].map((match) => [match[1], match[2]]));
  const luminance = (hex) => hex.slice(1).match(/../g).map((part) => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  for (const background of [colours.ground, colours.paper, colours.celadon, "#e8eadf", "#efe8d8", "#dfe6e1"]) {
    for (const foreground of [colours.ink, colours.muted, colours.green, colours.accent]) {
      const levels = [luminance(background), luminance(foreground)].sort((a, b) => b - a);
      assert.ok((levels[0] + 0.05) / (levels[1] + 0.05) >= 4.5, `${foreground} on ${background}`);
    }
  }
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
