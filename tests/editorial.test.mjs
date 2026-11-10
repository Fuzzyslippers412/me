import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { languages, readData, editorial, assertReviewedContent, publicProjectSite, localizedPath, escapeHtml } from "../scripts/lib/editorial-content.mjs";
import { frenchTypography } from "../scripts/lib/river-presentation.mjs";
import { researchNotes, researchNotePath, validateResearchNotes } from "../scripts/lib/research-notes.mjs";
import { renderProjectCard } from "../scripts/lib/personal-home.mjs";

const { projects } = await readData("projects");
const review = await readData("content-review");
const readPage = (route) => fs.readFile(new URL(`..${route}index.html`, import.meta.url), "utf8");
const graph = (html) => JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])["@graph"];

test("reviewed project and biography translations fail on missing or stale copy", () => {
  assertReviewedContent(projects, editorial, review);
  const changed = structuredClone(projects);
  changed[0].summary.en += " Changed source.";
  assert.throws(() => assertReviewedContent(changed, editorial, review), /review the translation/);
  const missing = structuredClone(projects);
  delete missing[0].pageContent.fr;
  assert.throws(() => assertReviewedContent(missing, editorial, review), /incomplete case study/);
  const bio = structuredClone(editorial);
  bio.locales.en.about[0] += " Changed biography.";
  assert.throws(() => assertReviewedContent(projects, bio, review), /profile.*review the translation/);
  const incompleteBio = structuredClone(editorial);
  incompleteBio.locales.fr.about.pop();
  assert.throws(() => assertReviewedContent(projects, incompleteBio, review), /fr: incomplete biography/);
});

test("technical-note translations fail closed and cannot silently fall back", () => {
  validateResearchNotes(researchNotes, review);
  const changed = structuredClone(researchNotes);
  changed[0].locales.en.sections[0].paragraphs[0] += " Changed explanation.";
  assert.throws(() => validateResearchNotes(changed, review), /stale research translation/);
  const missing = structuredClone(researchNotes);
  delete missing[0].locales.pt;
  assert.throws(() => validateResearchNotes(missing, review), /missing research translation/);
});

test("featured project rendering uses a selected evidence key, not MyCasaPro assumptions", () => {
  for (const lang of languages) {
    const home = projects.find((p) => p.slug === "home");
    assert.match(renderProjectCard(home, lang, localizedPath(lang, "/projects/"), true), /project-aside/);
    assert.equal(publicProjectSite(home), null);
    assert.doesNotMatch(renderProjectCard(home, lang, "/projects/", true), /href="(?:undefined|null)"|target="_blank"/);
    const modified = structuredClone(home);
    modified.caseStudy[lang].items.reverse();
    assert.equal(renderProjectCard(modified, lang, "/projects/", true), renderProjectCard(home, lang, "/projects/", true));
    delete modified.feature;
    assert.throws(() => renderProjectCard(modified, lang, "/projects/", true), /Missing featured evidence/);
  }
  assert.throws(() => publicProjectSite({ slug: "unsafe", site: "javascript:alert(1)" }), /Unsafe/);
  assert.throws(() => publicProjectSite({ slug: "unsafe", site: "https://user:pass@example.com/" }), /Unsafe/);
});

for (const lang of languages) {
  test(`${lang}: approved background stays complete on About and brief on the homepage`, async () => {
    const about = await readPage(localizedPath(lang, "/about/"));
    const home = await readPage(localizedPath(lang, "/"));
    const intro = about.match(/<section class="page-section about-intro"[^>]*>([\s\S]*?)<\/section>/)?.[1];
    assert.ok(intro, "About biography is present in static HTML");
    assert.equal((intro.match(/<p>/g) || []).length, editorial.locales[lang].about.length);
    for (const paragraph of editorial.locales[lang].about) {
      const expected = `<p>${paragraph}</p>`;
      assert.ok(intro.includes(lang === "fr" ? frenchTypography(expected) : expected));
    }
    for (const name of ["Pittsburgh", "Carnegie Mellon University", "Siemens", "Google"]) assert.ok(intro.includes(name));
    assert.doesNotMatch(intro, /2018|School of Computer Science|\bSCS\b|\bmaster\b|\bmestrado\b|\bmagistrale\b/i);
    const short = `<p>${editorial.locales[lang].background}</p>`;
    assert.ok(home.includes(lang === "fr" ? frenchTypography(short) : short));
    assert.doesNotMatch(home, /School of Computer Science|Siemens|Pittsburgh/);
    for (const code of languages) {
      assert.ok(about.includes(`href="https://armeltenkiang.com${localizedPath(code, "/about/")}"`));
    }
  });
  test(`${lang}: every project introduction uses the same approved summary as its index`, async () => {
    for (const project of projects) {
      const html = await readPage(localizedPath(lang, `/projects/${project.slug}/`));
      const expected = `<p>${escapeHtml(project.summary[lang])}</p>`;
      assert.ok(html.includes(lang === "fr" ? frenchTypography(expected) : expected), `${project.slug}/${lang}: summary drift`);
    }
  });
  test(`${lang}: new case studies keep their summary, private status and source boundary`, async () => {
    for (const project of projects.filter((p) => p.pageContent)) {
      const html = await readPage(localizedPath(lang, `/projects/${project.slug}/`));
      assert.equal(graph(html).find((n) => n["@type"] === "SoftwareApplication").dateModified, project.modified);
      assert.match(html, /rel="author">Armel Tenkiang/);
      assert.ok(html.includes(project.name));
      assert.doesNotMatch(html, /\/Users\/|192\.168\.|10\.\d+\.\d+\.\d+|Home-Build-Worker|BEGIN .*PRIVATE KEY|ssh-ed25519/);
      if (!publicProjectSite(project)) {
        assert.equal(graph(html).find((n) => n["@type"] === "SoftwareApplication").sameAs, undefined);
      }
    }
    const home = await readPage(localizedPath(lang, "/projects/home/"));
    assert.match(home, /27/);
    assert.equal(graph(home).find((n) => n["@type"] === "SoftwareApplication").operatingSystem, "Android TV");
  });

  test(`${lang}: authored research is complete, linked and language-stable`, async () => {
    for (const note of researchNotes) {
      const html = await readPage(researchNotePath(note.slug, lang));
      const article = graph(html).find((n) => n["@type"] === "TechArticle");
      assert.equal(article.inLanguage, lang);
      assert.equal(article.headline, note.locales[lang].title);
      assert.equal(article.datePublished, note.published);
      assert.equal(article.dateModified, note.modified);
      for (const section of note.locales[lang].sections) for (const p of section.paragraphs) assert.ok(article.articleBody.includes(p));
      for (const code of languages) assert.ok(html.includes(`href="https://armeltenkiang.com${researchNotePath(note.slug, code)}"`));
      assert.ok(html.includes(`href="${localizedPath(lang, `/projects/${note.project}/`)}"`));
      assert.doesNotMatch(html, /\/Users\/|192\.168\.|Home-Build-Worker|github\.com\/[^"\s]+\/Home/);
    }
  });
}

test("private Home and MUDECA work is not automatically harvested into the public feed", async () => {
  const sources = (await readData("sources")).sources;
  assert.ok(!sources.some((s) => ["Home", "MUDECA"].includes(s.name)));
  assert.ok(sources.some((s) => s.name === "Door Notes" && s.repo === "Fuzzyslippers412/pipeline-map-open"));
  assert.ok(!(await readData("updates")).items.some((item) => ["Home", "MUDECA"].includes(item.source)));
});
