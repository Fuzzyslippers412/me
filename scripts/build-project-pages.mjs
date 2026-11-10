import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pageShell } from "./lib/page-shell.mjs";
import { languages, localizedPath, readData, editorial, assertReviewedContent, escapeHtml as e, publicProjectSite } from "./lib/editorial-content.mjs";
import { writeFileAtomically } from "./lib/write-atomically.mjs";
import { researchNotes } from "./lib/research-notes.mjs";

const { projects } = await readData("projects");
assertReviewedContent(projects, editorial, await readData("content-review"));
const labels = {
  it: ["Progetto", "Stato attuale", "Sito del progetto", "Profilo", "Sviluppo privato"],
  en: ["Project", "Current state", "Project website", "Profile", "Private development"],
  fr: ["Projet", "État actuel", "Site du projet", "Profil", "Développement privé"],
  pt: ["Projeto", "Estado atual", "Site do projeto", "Perfil", "Desenvolvimento privado"]
};
for (const project of projects.filter((p) => p.pageContent)) {
  for (const lang of languages) {
    const [kind, state, website, , privateLabel] = labels[lang];
    const content = project.pageContent[lang];
    const site = publicProjectSite(project);
    const hasNotes = researchNotes.some((note) => note.project === project.slug);
    const status = project.status === "Private development" ? privateLabel : editorial.locales[lang].statuses[project.status];
    const main = `<span class="eyebrow">${kind}</span>
      <h1>${e(project.name)}</h1>
      <div class="page-meta"><span>${e(status)}</span></div>
      <div class="cta">${site ? `<a class="link" href="${e(site)}" rel="noopener" target="_blank">${website}</a>` : ""}<a class="link" href="${hasNotes ? "#technical-notes" : localizedPath(lang, "/projects/")}">${hasNotes ? editorial.locales[lang].notes : editorial.locales[lang].index}</a></div>
      <section class="page-section"><p>${e(project.summary[lang])}</p></section>
      ${content.sections.map((section) => `<section class="page-section"><h2>${e(section.heading)}</h2>${section.paragraphs.map((p) => `<p>${e(p)}</p>`).join("\n")}</section>`).join("\n")}
      <section class="page-section"><h2>${state}</h2><p>${e(content.status)}</p></section>`;
    const route = `/projects/${project.slug}/`;
    const file = new URL(`..${localizedPath(lang, route)}index.html`, import.meta.url);
    await fs.mkdir(new URL("./", file), { recursive: true });
    await writeFileAtomically(fileURLToPath(file), pageShell({ lang, route, ...project.seo[lang], main }));
  }
}
console.log("Generated reviewed project pages in four languages.");
