import { readData, localizedPath, escapeHtml as e, contentDigest, languages } from "./editorial-content.mjs";
export const researchNotes = (await readData("research-notes")).notes;
export const researchNotePath = (slug, lang) => localizedPath(lang, `/research/${slug}/`);

export function validateResearchNotes(notes, review) {
  const seen = new Set();
  for (const note of notes) {
    if (!/^[a-z0-9-]+$/.test(note.slug) || seen.has(note.slug)) throw new Error("Invalid or duplicate research slug");
    seen.add(note.slug);
    for (const lang of languages) {
      const copy = note.locales[lang];
      if (!copy?.title || !copy.summary || copy.sections?.length !== note.locales.en.sections.length) throw new Error(`${note.slug}/${lang}: missing research translation`);
      copy.sections.forEach((section, i) => {
        if (!section.heading || section.paragraphs?.length !== note.locales.en.sections[i].paragraphs.length || section.paragraphs.some((p) => !p.trim())) throw new Error(`${note.slug}/${lang}: incomplete research section`);
      });
      if (lang !== "en" && review[`note:${note.slug}`]?.[lang] !== contentDigest({ ...note, locales: note.locales.en })) throw new Error(`${note.slug}/${lang}: stale research translation`);
    }
  }
}

export function renderResearchNotes(lang, project) {
  const items = researchNotes.filter((note) => !project || note.project === project);
  if (!items.length) return "";
  return `<ol class="technical-notes">${items.map((note) => `<li><a href="${researchNotePath(note.slug, lang)}"><span>${e(note.locales[lang].title)}</span><small>${note.project === "home" ? "Home" : "Door Notes"}</small></a></li>`).join("")}</ol>`;
}

export const scopeCopy = {
  it: { label: "Nota tecnica", source: "Questa nota descrive il codice di Home del 27 ottobre 2026 e i risultati di test e compilazione già registrati. Non afferma una validazione su una TV fisica o un rilascio pubblico.", door: "Questa nota descrive il modello di ricerca esaminato nel codice e nella documentazione di Door Notes. Non certifica la storia professionale di una persona.", project: "Contesto del progetto", author: "Nota di", related: "Altre note", sourceLink: "Metodo e fonti di Door Notes" },
  en: { label: "Technical note", source: "This note describes the 27 October 2026 Home source snapshot and previously recorded test/build evidence. It does not claim physical-TV acceptance or public release.", door: "This note describes the research model reviewed in Door Notes source and documentation. It does not certify an individual’s professional history.", project: "Project context", author: "Note by", related: "Further notes", sourceLink: "Door Notes methodology and sources" },
  fr: { label: "Note technique", source: "Cette note décrit le code de Home du 27 octobre 2026 et les résultats de tests et de compilation déjà enregistrés. Elle ne revendique ni validation sur une télévision physique ni lancement public.", door: "Cette note décrit le modèle de recherche examiné dans le code et la documentation de Door Notes. Elle ne certifie pas le parcours professionnel d’une personne.", project: "Contexte du projet", author: "Note de", related: "Autres notes", sourceLink: "Méthode et sources de Door Notes" },
  pt: { label: "Nota técnica", source: "Esta nota descreve o código de Home de 27 de outubro de 2026 e a evidência de testes e compilação já registada. Não afirma validação numa televisão física nem lançamento público.", door: "Esta nota descreve o modelo de investigação examinado no código e na documentação de Door Notes. Não certifica o percurso profissional de uma pessoa.", project: "Contexto do projeto", author: "Nota de", related: "Outras notas", sourceLink: "Método e fontes de Door Notes" }
};
