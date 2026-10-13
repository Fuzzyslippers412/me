import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import vm from "node:vm";
import os from "node:os";
import { enhancePresentation } from "../scripts/lib/presentation.mjs";
import { selectedProjects, refineAbout, renderProjectCard } from "../scripts/lib/personal-home.mjs";
import { previewFiles, localizePreviewLinks } from "../scripts/preview-site.mjs";
import { withActivityTitles } from "../scripts/lib/activity-copy.mjs";
import { resetRiverPresentation, frenchTypography } from "../scripts/lib/river-presentation.mjs";
import { notes, notePath, getLocalizedNote, sourceDigest, validateTranslation } from "../scripts/lib/update-locales.mjs";
import { updateUI } from "../scripts/lib/update-ui.mjs";
import { writeFileAtomically } from "../scripts/lib/write-atomically.mjs";
import { assertUniquePageCanonicals } from "../scripts/lib/check-page-copies.mjs";

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

const workspaceFixture = async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "armel-workspace-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
};

test("unchanged atomic writes preserve bytes, modification time, inode, and permissions", async (t) => {
  const directory = await workspaceFixture(t);
  const file = path.join(directory, "page.html");
  const content = "Fran\u00e7ais, italiano, portugu\u00eas, English";
  await writeFileAtomically(file, content);
  await fs.chmod(file, 0o600);
  await fs.utimes(file, 1000, 1000);
  const before = await fs.stat(file);
  await writeFileAtomically(file, content);
  await writeFileAtomically(file, Buffer.from(content));
  const after = await fs.stat(file);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  assert.equal(after.mode, before.mode);
  assert.equal(await fs.readFile(file, "utf8"), content);
  assert.deepEqual(await fs.readdir(directory), ["page.html"]);
});

test("changed atomic writes still replace output and honor explicit encoding", async (t) => {
  const directory = await workspaceFixture(t);
  const file = path.join(directory, "output.txt");
  await writeFileAtomically(file, "before");
  await writeFileAtomically(file, "apr\u00e8s", { encoding: "latin1" });
  assert.deepEqual(await fs.readFile(file), Buffer.from("apr\u00e8s", "latin1"));
  const before = await fs.stat(file);
  await writeFileAtomically(file, "apr\u00e8s", "latin1");
  assert.equal((await fs.stat(file)).ino, before.ino);
  assert.deepEqual(await fs.readdir(directory), ["output.txt"]);
});

test("failed atomic writes leave existing paths intact and no temporary artifacts", async (t) => {
  const directory = await workspaceFixture(t);
  const file = path.join(directory, "existing-directory");
  await fs.mkdir(file);
  await fs.writeFile(path.join(file, "keep.txt"), "keep");
  await assert.rejects(writeFileAtomically(file, "cannot replace directory"));
  assert.equal(await fs.readFile(path.join(file, "keep.txt"), "utf8"), "keep");
  assert.deepEqual(await fs.readdir(directory), ["existing-directory"]);
});

test("page-copy preflight refuses duplicate canonicals without changing either file", async (t) => {
  const directory = await workspaceFixture(t);
  const original = '<link rel="canonical" href="https://armeltenkiang.com/fr/updates/note/"><p>Original</p>';
  const copy = "<link href='https://armeltenkiang.com/fr/updates/note/' rel='canonical'><p>Unreviewed work</p>";
  await fs.writeFile(path.join(directory, "index.html"), original);
  await fs.writeFile(path.join(directory, "index 2.html"), copy);
  await assert.rejects(assertUniquePageCanonicals(directory), /Build stopped before changing files:[\s\S]*index 2\.html[\s\S]*index\.html/);
  assert.equal(await fs.readFile(path.join(directory, "index.html"), "utf8"), original);
  assert.equal(await fs.readFile(path.join(directory, "index 2.html"), "utf8"), copy);
});

test("page-copy preflight permits localized pages and deliberate non-indexable aliases", async (t) => {
  const directory = await workspaceFixture(t);
  for (const lang of locales) {
    await fs.mkdir(path.join(directory, lang));
    await fs.writeFile(path.join(directory, lang, "index.html"), `<link rel="canonical" href="https://armeltenkiang.com/${lang}/">`);
  }
  await fs.writeFile(path.join(directory, "alias.html"), '<meta name="robots" content="noindex,follow"><link rel="canonical" href="https://armeltenkiang.com/it/">');
  await fs.writeFile(path.join(directory, "redirect.html"), '<meta http-equiv="refresh" content="0;url=/it/"><link rel="canonical" href="https://armeltenkiang.com/it/">');
  await assertUniquePageCanonicals(directory);
});

for (const lang of locales) {
  const config = configFor(lang);
  test(`${lang}: homepage structure, source updates, and a single featured project`, async () => {
    const html = await read(fileFor(config.home));
    assert.match(html, /<h1>Armel Tenkiang<\/h1>/);
    const sections = [...html.matchAll(/<section class="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(sections, ["introduction", "selected-work", "research-interlude", "updates", "listening", "personal-end"]);
    assert.equal((html.match(/class="boundary-figure"/g) || []).length, 0);
    assert.equal((html.match(/class="project-aside"/g) || []).length, 1);
    assert.equal((html.match(/class="activity-stats"/g) || []).length, 1);
    assert.match(html, /class="river-thread"[^>]*aria-hidden="true"/);
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
    const content = resetRiverPresentation(html);
    assert.equal(refineAbout(content, lang), content);
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
  for (const background of [colours.ground, colours.paper, colours.stone, colours.celadon, "#e8eadf", "#efe8d8", "#dfe6e1"]) {
    for (const foreground of [colours.ink, colours.muted, colours.green, colours.accent]) {
      const levels = [luminance(background), luminance(foreground)].sort((a, b) => b - a);
      assert.ok((levels[0] + 0.05) / (levels[1] + 0.05) >= 4.5, `${foreground} on ${background}`);
    }
  }
});

test("editorial font is self-hosted, licensed, preloaded and available in preview", async () => {
  const files = await previewFiles();
  assert.ok(files.has("/fonts/newsreader-latin.woff2"));
  assert.ok((await fs.stat(path.join(root, "fonts/newsreader-latin.woff2"))).size < 40_000);
  assert.match(await read("fonts/Newsreader-OFL.txt"), /SIL OPEN FONT LICENSE/);
  for (const lang of locales) {
    const html = await read(fileFor(configFor(lang).home));
    assert.equal((html.match(/rel="preload" href="\/fonts\/newsreader-latin.woff2"/g) || []).length, 1);
    assert.match(html, /class="logo"[^>]*aria-label="Armel Tenkiang[^>]*><img src="\/favicon.svg" width="38" height="38" alt=""/);
  }
});

test("activity display translations preserve the published evidence and survive the static build", async () => {
  const updates = JSON.parse(await read("data/updates.json"));
  for (const item of updates.items) {
    const localized = withActivityTitles(item);
    for (const field of ["title", "date", "url", "source_url", "verified_commit"]) assert.equal(localized[field], item[field]);
    if (!localized.display_titles) continue;
    for (const lang of ["it", "fr", "pt"]) {
      assert.ok(localized.display_titles[lang]);
      const html = await read(fileFor(configFor(lang).home));
      assert.ok(html.includes(localized.display_titles[lang]));
    }
  }
  const unknown = { title: "Original source title", url: "/updates/future-note/" };
  assert.deepEqual(withActivityTitles(unknown), unknown);
});

test("social and browser icon dimensions match the advertised sizes", async () => {
  for (const [file, width, height] of [["favicon.png", 512, 512], ["favicon-48.png", 48, 48], ["apple-touch-icon.png", 180, 180], ["og-image.png", 1200, 630]]) {
    const bytes = await fs.readFile(path.join(root, file));
    assert.equal(bytes.subarray(1, 4).toString(), "PNG");
    assert.equal(bytes.readUInt32BE(16), width, file);
    assert.equal(bytes.readUInt32BE(20), height, file);
  }
});

test("mobile navigation and motion controls are localized and generated once", async () => {
  const labels = { it: "Animazione attiva", en: "Motion on", fr: "Animation activée", pt: "Animação ativada" };
  for (const lang of locales) {
    const config = configFor(lang);
    for (const route of [config.home, config.about, config.projects, config.research, config.updates, `${config.projects}mycasapro/`]) {
      const html = await read(fileFor(route));
      const desktop = html.match(/<nav class="nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
      const mobile = html.match(/<nav class="mobile-nav"[^>]*>([\s\S]*?)<\/nav>/)[1];
      assert.equal(mobile, desktop, `${route}: mobile navigation diverged`);
      assert.equal((html.match(/class="mobile-menu"/g) || []).length, 1);
      assert.ok(html.includes(`<details class="mobile-menu"><summary>${lang === "it" ? "Menù" : "Menu"}`));
      assert.equal((html.match(/src="\/scripts\/river.js\?v=1" defer/g) || []).length, 1);
      assert.ok(html.includes(`data-motion-on="${labels[lang]}"`));
      assert.match(html, /class="motion-toggle"[^>]+ hidden>/);
    }
  }
  assert.ok((await previewFiles()).has("/scripts/river.js"));
});

test("project introductions precede diagrams and the table of contents", async () => {
  for (const lang of locales) {
    for (const project of projectData.projects) {
      const html = await read(fileFor(`${configFor(lang).projects}${project.slug}/`));
      const intro = html.indexOf('<section class="page-section"');
      assert.ok(intro > 0);
      const diagram = html.search(/<figure class="(?:boundary-figure|architecture-figure|system-map)/);
      if (diagram >= 0) assert.ok(intro < diagram, `${lang}/${project.slug}: diagram precedes introduction`);
      const contents = html.indexOf('<details class="contents-disclosure"');
      if (contents >= 0) assert.ok(intro < contents);
    }
  }
});

test("language choices expose full names and retain their visible abbreviations", async () => {
  const names = { it: "Italiano", en: "English", fr: "Français", pt: "Português" };
  for (const lang of locales) {
    for (const route of [configFor(lang).home, configFor(lang).about, configFor(lang).projects]) {
      const html = await read(fileFor(route));
      const switcher = html.match(/<div class="lang-switch"[^>]*>[\s\S]*?<\/div>/)[0];
      for (const [code, name] of Object.entries(names)) {
        assert.ok(switcher.includes(`hreflang="${code}" aria-label="${name} (${code.toUpperCase()})" title="${name}"`));
      }
      assert.equal((switcher.match(/aria-label=/g) || []).length, 5);
      assert.equal((switcher.match(/aria-current="page"/g) || []).length, 1);
    }
  }
});

test("decorative curves do not affect reading-page spacing or activity grid placement", async () => {
  const css = await read("style.css");
  assert.ok(css.includes('.page-section > :not(.river-thread) + :not(.river-thread)'));
  assert.ok(css.includes('.page-section:first-of-type:not(:has(h2)) > p:first-of-type'));
  assert.ok(css.includes('.home .updates > :not(.river-thread)'));
  assert.ok(!css.includes('.page-section > * + *'));
  assert.ok(!css.includes('.home .updates > *'));
  assert.match(css, /\.updates-list a:is\(:hover, :focus-visible\)/);
  assert.match(css, /\.listening-shelf > a:is\(:hover, :focus-visible\)/);
});

test("river segments track the six homepage sections and remain decorative", async () => {
  for (const lang of locales) {
    const html = await read(fileFor(configFor(lang).home));
    assert.equal((html.match(/ data-river-section>/g) || []).length, 6);
    const segments = [...html.matchAll(/<svg class="river-thread"[^>]*>/g)];
    assert.equal(segments.length, 6);
    for (const [svg] of segments) {
      assert.ok(svg.includes('aria-hidden="true"'));
      assert.ok(svg.includes('focusable="false"'));
    }
  }
  const css = await read("style.css");
  assert.match(css, /\.river-thread[^}]+pointer-events: none/);
  assert.match(css, /@supports \(animation-timeline: view\(\)\)/);
  assert.match(css, /data-motion="off"/);
  assert.ok(gzipSync(await read("scripts/river.js")).length < 3_000);
});

test("French typography preserves source meaning, attributes, and executable content", () => {
  const original = '<p>Texte : oui ! Une question ?</p><a href="https://example.com/?q=a:b" title="Titre : brut">Lien ; suite</a><script type="application/ld+json">{"name":"Nom : brut"}</script><code>value : raw</code>';
  const formatted = frenchTypography(original);
  assert.ok(formatted.includes('Texte\u202f: oui\u202f! Une question\u202f?'));
  assert.equal(formatted.replaceAll('\u202f', ' '), original);
  assert.ok(formatted.includes('title="Titre : brut"'));
  assert.ok(formatted.includes('{"name":"Nom : brut"}'));
  assert.ok(formatted.includes('<code>value : raw</code>'));
  assert.equal(frenchTypography(formatted), formatted);
});

async function motionHarness({ saved = null, reduced = false, storageDenied = false, observers = true } = {}) {
  const root = { dataset: {} };
  const button = { dataset: { motionOn: 'on', motionOff: 'off', motionReduced: 'reduced' }, hidden: true, attributes: {}, handlers: {}, setAttribute(key, value) { this.attributes[key] = value; }, addEventListener(event, callback) { this.handlers[event] = callback; } };
  const media = { matches: reduced, addEventListener(_event, callback) { this.change = callback; } };
  const sections = [{ dataset: {} }, { dataset: {} }];
  const observations = [];
  const menu = { open: false, focusReturned: false, addEventListener() {}, querySelector() { return { focus: () => { menu.focusReturned = true; } }; } };
  const handlers = {};
  class Observer {
    constructor(callback) { this.callback = callback; observations.push(this); }
    observed = []; disconnected = false;
    observe(element) { this.observed.push(element); }
    unobserve(element) { this.observed = this.observed.filter((item) => item !== element); }
    disconnect() { this.disconnected = true; }
  }
  const context = {
    document: { documentElement: root, querySelector: (selector) => selector === '.motion-toggle' ? button : menu, querySelectorAll: () => sections, addEventListener: (event, callback) => { handlers[event] = callback; } },
    matchMedia: () => media,
    localStorage: { getItem: () => { if (storageDenied) throw new Error('denied'); return saved; }, setItem: (_key, value) => { if (storageDenied) throw new Error('denied'); saved = value; } },
    window: observers ? { IntersectionObserver: Observer } : {}, IntersectionObserver: Observer
  };
  vm.runInNewContext(await read('scripts/river.js'), context);
  return { root, button, media, observations, sections, menu, handlers, saved: () => saved };
}

test("motion preference persists and off disconnects observers", async () => {
  const h = await motionHarness();
  assert.equal(h.root.dataset.motion, 'on');
  assert.equal(h.button.hidden, false);
  assert.equal(h.button.attributes['aria-pressed'], 'true');
  h.button.handlers.click();
  assert.equal(h.root.dataset.motion, 'off');
  assert.equal(h.saved(), 'off');
  assert.equal(h.observations[0].disconnected, true);
  assert.equal((await motionHarness({ saved: 'off' })).root.dataset.motion, 'off');
});

test("system reduced motion wins and reacts to preference changes", async () => {
  const h = await motionHarness({ reduced: true });
  assert.equal(h.root.dataset.motion, 'off');
  assert.equal(h.button.disabled, true);
  assert.equal(h.button.textContent, 'reduced');
  assert.equal(h.observations.length, 0);
  h.media.matches = false; h.media.change();
  assert.equal(h.root.dataset.motion, 'on');
  h.media.matches = true; h.media.change();
  assert.equal(h.root.dataset.motion, 'off');
  assert.equal(h.observations[0].disconnected, true);
});

test("motion is optional when storage or IntersectionObserver is unavailable", async () => {
  const h = await motionHarness({ storageDenied: true, observers: false });
  assert.equal(h.root.dataset.motion, 'on');
  h.button.handlers.click();
  assert.equal(h.root.dataset.motion, 'off');
  assert.equal(h.observations.length, 0);
});

test("section entrances run once and Escape closes the mobile menu", async () => {
  const h = await motionHarness();
  h.observations[0].callback([{ target: h.sections[0], isIntersecting: true }]);
  assert.equal(h.sections[0].dataset.riverSeen, 'true');
  assert.equal(h.observations[0].observed.includes(h.sections[0]), false);
  h.menu.open = true; h.handlers.keydown({ key: 'Escape' });
  assert.equal(h.menu.open, false); assert.equal(h.menu.focusReturned, true);
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

test("browser refresh retains the selected display language without changing source links", async () => {
  for (const lang of locales) {
    const element = () => ({ children: [], append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); } });
    const list = element();
    let load;
    const item = { title: "Published title", url: "/updates/example/", source: "Project", date: "2026-09-01T00:00:00Z", display_titles: { it: "Titolo", fr: "Titre", pt: "Título" } };
    const document = {
      documentElement: { lang }, querySelector: () => list,
      querySelectorAll: () => [], createElement: element,
      addEventListener: (_event, callback) => { load = callback; }
    };
    vm.runInNewContext(await read("scripts/updates.js"), { document, URL, fetch: async () => ({ ok: true, json: async () => ({ items: [item] }) }) });
    await load();
    const link = list.children[0].children[0];
    assert.equal(link.href, item.url);
    assert.equal(link.children[2].textContent, item.display_titles[lang] || item.title);
    assert.equal(item.title, "Published title");
  }
});

test("French activity refresh keeps punctuation attached without rewriting feed data", async () => {
  const element = () => ({ children: [], append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); } });
  const list = element();
  const stamp = { textContent: "", getAttribute: () => "Dernière mise à jour :" };
  const item = { title: "Source title", display_titles: { fr: "Contexte : lecture ?" }, date: "2026-09-01", url: "/updates/example/" };
  let load;
  const document = {
    documentElement: { lang: "fr" }, querySelector: () => list,
    querySelectorAll: () => [stamp], createElement: element,
    addEventListener: (_event, callback) => { load = callback; }
  };
  vm.runInNewContext(await read("scripts/updates.js"), {
    document, URL, fetch: async () => ({ ok: true, json: async () => ({ latest_item_at: item.date, items: [item] }) })
  });
  await load();
  assert.match(stamp.textContent, /jour\u202f:/);
  assert.equal(list.children[0].children[0].children[2].textContent, "Contexte\u202f: lecture\u202f?");
  assert.equal(item.display_titles.fr, "Contexte : lecture ?");
});

for (const lang of locales) {
  test(`${lang}: all articles have complete bodies, reciprocal switches and preserved evidence`, async () => {
    const config = configFor(lang);
    for (const note of notes) {
      const route = notePath(note.slug, lang);
      const html = (await read(fileFor(route))).replace(/\u202f/g, " ");
      const copy = getLocalizedNote(note, lang);
      const switcher = html.match(/<div class="lang-switch"[^>]*>([\s\S]*?)<\/div>/)[1];
      assert.equal((switcher.match(/<a /g) || []).length, 4);
      for (const language of locales) {
        const target = notePath(note.slug, language);
        assert.ok(switcher.includes(`href="${target}"`), `${route}: missing ${language} switch`);
        assert.ok(html.includes(`hreflang="${language}" href="https://armeltenkiang.com${target}"`));
      }
      const active = switcher.match(/<a[^>]*aria-current="page"[^>]*>/g);
      assert.equal(active.length, 1);
      assert.ok(active[0].includes(`href="${route}"`));
      assert.match(html, new RegExp(`<html lang="${lang}">`));
      assert.ok(html.includes(`href="${config.about}" rel="author"`));
      assert.ok(html.includes(`href="${config.projects}${note.project_slug}/"`));
      const article = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"].find((node) => node["@type"] === "TechArticle");
      assert.equal(article.headline, copy.title);
      assert.equal(article.inLanguage, lang);
      assert.equal(article.citation, note.source_url);
      assert.equal(article.datePublished, note.date);
      assert.equal(article.creativeWorkStatus, note.historical ? "Archived" : "Published");
      assert.equal((html.match(/class="page-section update-technical-section"/g) || []).length, (note.technical_sections || []).length);
      if (lang === "en") assert.equal(article.workTranslation.length, 3);
      else {
        assert.equal(article.translationOfWork["@id"], `https://armeltenkiang.com/updates/${note.slug}/#article`);
        assert.equal(article.dateModified.slice(0, 10), copy.translated_on);
        assert.ok(html.includes(`datetime="${copy.translated_on}"`));
        assert.notEqual(copy.summary, note.summary);
        assert.doesNotMatch(html, />What changed<|>Engineering note<|>All updates<|>Project note</);
      }
      const provenance = html.match(/<section class="page-section update-provenance"[\s\S]*?<\/section>/)[0];
      const expected = (note.historical ? updateUI[lang].archiveSource : updateUI[lang].source).replace("{commit}", `<code>${note.verified_commit}</code>`);
      assert.ok(provenance.includes(expected));
      assert.equal(enhancePresentation(html, { lang, route, config, projectData, expertiseData }).replace(/\u202f/g, " "), html);
    }
  });
}

test("article translations fail closed on missing, incomplete, stale or evidence-changing copy", () => {
  const note = notes[0];
  const localized = getLocalizedNote(note, "it");
  const copy = Object.fromEntries(["title", "seo_title", "source_label", "summary", "details", "engineering_note", "technical_sections"].map((key) => [key, localized[key]]));
  const valid = { ...copy, source_sha256: sourceDigest(note) };
  assert.doesNotThrow(() => validateTranslation(note, valid, "it"));
  assert.throws(() => validateTranslation(note, undefined, "it"), /missing article translation/);
  assert.throws(() => validateTranslation(note, { ...valid, details: [] }, "it"), /incomplete details/);
  assert.throws(() => validateTranslation(note, { ...valid, technical_sections: [] }, "it"), /incomplete technical sections/);
  assert.throws(() => validateTranslation({ ...note, summary: `${note.summary} Changed.` }, valid, "it"), /translation is stale/);
  assert.throws(() => validateTranslation({ ...note, historical: true }, valid, "it"), /translation is stale/);
  assert.throws(() => validateTranslation(note, { ...valid, source_url: "https://example.com/" }, "it"), /unexpected translation field/);
  assert.throws(() => getLocalizedNote(note, "de"), /Unsupported article language/);
  assert.equal(sourceDigest({ ...note, verified_commit: "abcdef1" }), sourceDigest(note));
});

test("all internal article links in page content retain that page's language", async () => {
  const sitemap = await read("sitemap.xml");
  const paths = [...sitemap.matchAll(/<loc>https:\/\/armeltenkiang\.com([^<]+)<\/loc>/g)].map((match) => match[1]);
  for (const route of paths) {
    const html = await read(fileFor(route));
    const lang = html.match(/<html lang="([^"]+)"/)[1];
    const main = html.match(/<main[^>]*>([\s\S]*?)<\/main>/)[1];
    for (const [, reference] of main.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      const url = new URL(reference, "https://armeltenkiang.com");
      if (url.origin !== "https://armeltenkiang.com") continue;
      const note = notes.find((item) => url.pathname.endsWith(`/updates/${item.slug}/`));
      if (note) assert.equal(url.pathname, notePath(note.slug, lang), `${route}: wrong-language article link`);
    }
  }
  const allowed = await previewFiles();
  for (const note of notes) for (const lang of locales) assert.ok(allowed.has(notePath(note.slug, lang)));
  for (const lang of ["it", "fr", "pt"]) assert.ok(!allowed.has(`/data/update-translations/${lang}.json`));
});

test("translated activity uses article titles and routes while preserving original records", () => {
  for (const note of notes) {
    const item = { title: note.title, url: `/updates/${note.slug}/`, date: note.date, source: note.source, source_url: note.source_url, verified_commit: note.verified_commit };
    const before = JSON.stringify(item);
    const localized = withActivityTitles(item);
    assert.equal(JSON.stringify(item), before);
    for (const field of Object.keys(item)) assert.equal(localized[field], item[field]);
    for (const lang of locales) {
      assert.equal(localized.display_urls[lang], notePath(note.slug, lang));
      assert.equal(localized.display_titles[lang], getLocalizedNote(note, lang).title);
    }
  }
  const external = { url: `https://example.com/updates/${notes[0].slug}/`, title: "External source" };
  assert.equal(withActivityTitles(external), external);
});

test("browser activity refresh uses localized article routes and rejects unsafe links", async () => {
  for (const lang of locales) {
    const element = () => ({ children: [], append(...children) { this.children.push(...children); }, appendChild(child) { this.children.push(child); } });
    const list = element();
    let load;
    const note = notes[0];
    const item = withActivityTitles({ title: note.title, date: note.date, url: `/updates/${note.slug}/`, source: note.source });
    const unsafe = { ...item, display_urls: { [lang]: "javascript:alert(1)" } };
    const document = {
      documentElement: { lang }, querySelector: () => list,
      querySelectorAll: () => [], createElement: element,
      addEventListener: (_event, callback) => { load = callback; }
    };
    vm.runInNewContext(await read("scripts/updates.js"), { document, URL, fetch: async () => ({ ok: true, json: async () => ({ items: [item, unsafe] }) }) });
    await load();
    assert.equal(list.children[0].children[0].href, notePath(note.slug, lang));
    assert.equal(list.children[1].children[0].href, "/updates/");
  }
});
