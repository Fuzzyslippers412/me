import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pageShell } from "./lib/page-shell.mjs";
import { languages, origin, localizedPath, readData, editorial, escapeHtml as e } from "./lib/editorial-content.mjs";
import { researchNotes, researchNotePath, validateResearchNotes, scopeCopy } from "./lib/research-notes.mjs";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

validateResearchNotes(researchNotes, await readData("content-review"));
for (const note of researchNotes) {
  for (const lang of languages) {
    const copy = note.locales[lang], ui = scopeCopy[lang];
    const scope = note.project === "home" ? ui.source : ui.door;
    const route = `/research/${note.slug}/`, canonical = origin + researchNotePath(note.slug, lang);
    const projectRoute = localizedPath(lang, `/projects/${note.project}/`);
    const title = `${copy.title} | Armel Tenkiang`;
    const date = new Intl.DateTimeFormat(lang, { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${note.published}T00:00:00Z`));
    const main = `<span class="eyebrow">${ui.label}</span><h1>${e(copy.title)}</h1>
      <div class="page-meta"><time datetime="${note.published}">${date}</time></div>
      <p class="page-byline">${ui.author} <a href="${localizedPath(lang, "/about/")}" rel="author">Armel Tenkiang</a>.</p>
      <section class="page-section"><p>${e(copy.summary)}</p></section>
      ${copy.sections.map((section) => `<section class="page-section"><h2>${e(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${e(p)}</p>`).join("\n")}</section>`).join("\n")}
      <section class="page-section evidence-scope"><h2>${editorial.locales[lang].reviewLabel}</h2><p>${e(scope)}</p><p><a href="${projectRoute}">${ui.project}: ${note.project === "home" ? "Home" : "Door Notes"}</a>${note.project === "door-notes" ? ` · <a href="https://doornotes.org/method/">${ui.sourceLink}</a>` : ""}</p></section>`;
    const schema = { "@context": "https://schema.org", "@graph": [
      { "@type": "TechArticle", "@id": `${canonical}#article`, url: canonical, headline: copy.title, description: copy.summary, inLanguage: lang,
        datePublished: note.published, dateModified: note.modified, author: { "@id": `${origin}/#person` }, about: { "@id": `${origin}/#project-${note.project}` },
        mainEntityOfPage: { "@id": `${canonical}#webpage` }, articleBody: [copy.summary, ...copy.sections.flatMap((s) => s.paragraphs), scope].join("\n\n"),
        ...(lang === "en" ? { workTranslation: languages.filter((l) => l !== "en").map((l) => ({ "@type": "TechArticle", "@id": `${origin}${researchNotePath(note.slug, l)}#article`, inLanguage: l })) } : { translationOfWork: { "@type": "TechArticle", "@id": `${origin}${researchNotePath(note.slug, "en")}#article`, inLanguage: "en" } }) },
      { "@type": "WebPage", "@id": `${canonical}#webpage`, url: canonical, name: title, inLanguage: lang, isPartOf: { "@id": `${origin}/#website` }, breadcrumb: { "@id": `${canonical}#breadcrumb` } },
      { "@type": "BreadcrumbList", "@id": `${canonical}#breadcrumb`, itemListElement: [
        { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: origin + localizedPath(lang, "/") },
        { "@type": "ListItem", position: 2, name: ui.label, item: origin + localizedPath(lang, "/research/") },
        { "@type": "ListItem", position: 3, name: copy.title, item: canonical }
      ] }
    ] };
    const file = fileURLToPath(new URL(`..${localizedPath(lang, route)}index.html`, import.meta.url));
    await fs.mkdir(path.dirname(file), { recursive: true });
    await writeFileAtomically(file, pageShell({ lang, route, title, description: copy.summary, main, schema }));
  }
}
console.log("Generated source-reviewed technical notes in four languages.");
