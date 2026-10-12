import { renderPersonalHome, renderProjectCard, renderInvitationBoundary, refineAbout } from "./personal-home.mjs";
import { renderArchitecture } from "./system-figures.mjs";
import { enhanceRiverPresentation, resetRiverPresentation } from "./river-presentation.mjs";

const copy = {
  it: {
    related: "Ricerca collegata", contents: "In questa pagina", note: "Nota tecnica",
    topics: ["Stato local-first e recupero", "Stato privato e verifica selettiva", "Contesto vincolato per LLM", "Inferenza locale ed evidenza", "Evidenza che cambia"]
  },
  en: {
    related: "Related research", contents: "On this page", note: "Technical note",
    topics: ["Local-first state and recovery", "Private state and selective verification", "Bounded context for LLM systems", "Local inference and evidence", "Verification under changing evidence"]
  },
  fr: {
    related: "Recherche associée", contents: "Sur cette page", note: "Note technique",
    topics: ["État local-first et reprise", "État privé et vérification sélective", "Contexte contraint pour les LLM", "Inférence locale et preuves", "Vérification face aux preuves changeantes"]
  },
  pt: {
    related: "Investigação relacionada", contents: "Nesta página", note: "Nota técnica",
    topics: ["Estado local-first e recuperação", "Estado privado e verificação seletiva", "Contexto delimitado para LLM", "Inferência local e evidência", "Verificação com evidência em mudança"]
  }
};

const topicIds = ["local-state", "private-state", "bounded-context", "local-inference", "changing-evidence"];
const projectTopics = {
  mycasapro: 0, "au-jour-le-jour": 0, "theo-farm": 0, ghostprotocol: 1,
  chattypatty: 3, respometer: 4, "soundcheck-ai": 4, "liga-do-povo": 4
};
const projectOrder = ["mycasapro", "au-jour-le-jour", "liga-do-povo", "respometer", "chattypatty", "theo-farm", "soundcheck-ai", "ghostprotocol"];
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const plain = (value) => value.replace(/<[^>]+>/g, "").trim();

// These transformations operate on the site's controlled, static templates.
// Generated regions are removed before reinsertion so hourly builds stay stable.
export function enhancePresentation(html, { lang, route, config, project, projectData, expertiseData }) {
  const text = copy[lang] || copy.en;
  html = resetRiverPresentation(html);
  html = html.replace(/\s*<!-- presentation:[^:]+:start -->[\s\S]*?<!-- presentation:[^:]+:end -->/g, "");
  html = html.replace(/\s*<div class="bg">\s*<div class="orb orb-a"><\/div>\s*<div class="orb orb-b"><\/div>\s*<div class="grid"><\/div>\s*<\/div>/g, "");
  html = html.replace(/<article class="card[^>]*>[\s\S]*?<\/article>/g, (card) => {
    const url = card.match(/<a class="card-link card-note" href="([^"]+)">/)?.[1];
    if (!url) return card;
    return card.replace(/<h3>([\s\S]*?)<\/h3>/, (_, title) => `<h3><a href="${url}">${plain(title)}</a></h3>`)
      .replace(/(<a class="card-link card-note"[^>]*>)[^<]*/, `$1${text.note}`);
  });

  if (route === config.projects) {
    const matches = [...html.matchAll(/<article class="card[^>]*>[\s\S]*?<\/article>/g)];
    if (!matches.length) throw new Error(`Missing project index region: ${route}`);
    const rank = (slug) => projectOrder.includes(slug) ? projectOrder.indexOf(slug) : projectOrder.length;
    const cards = [...projectData.projects].sort((a, b) => rank(a.slug) - rank(b.slug));
    html = html.slice(0, matches[0].index) + cards.map((item) => renderProjectCard(item, lang, config.projects)).join("\n\n") + html.slice(matches.at(-1).index + matches.at(-1)[0].length);
  }
  if (route === config.home) html = renderPersonalHome(html, { lang, config, projectData, expertiseData });
  if (route === config.about) html = refineAbout(html, lang);
  if (project?.slug === "mycasapro") {
    html = html.replace(/\s*<figure class="system-map"[\s\S]*?<\/figure>/, "");
    html = html.replace(/(<div class="cta">[\s\S]*?<\/div>)/, `$1\n<!-- presentation:diagram:start -->\n${renderInvitationBoundary(lang)}\n<!-- presentation:diagram:end -->`);
  }
  const architecture = renderArchitecture(project?.slug || (route === `${config.research}galidima/` ? "galidima" : ""), lang);
  if (architecture) {
    const region = `<!-- presentation:architecture:start -->\n${architecture}\n<!-- presentation:architecture:end -->`;
    if (project) {
      html = html.replace(/\s*<figure class="system-map"[\s\S]*?<\/figure>/, "");
      html = html.replace(/(<div class="cta">[\s\S]*?<\/div>)/, `$1\n${region}`);
    }
    else html = html.replace(/(\s*<section class="page-section")/, `\n${region}\n$1`);
  }

  if (route === config.research) {
    let sectionIndex = 0;
    html = html.replace(/<section class="page-section"[^>]*>/g, (match) => {
      const id = topicIds[sectionIndex++ - 1];
      return id ? `<section class="page-section" id="${id}">` : match;
    });
  }

  if (project && projectTopics[project.slug] !== undefined) {
    const topic = projectTopics[project.slug];
    const related = `\n<!-- presentation:related:start -->\n      <section class="page-section related-research">\n        <h2>${text.related}</h2>\n        <p><a href="${config.research}#${topicIds[topic]}">${text.topics[topic]}</a></p>\n      </section>\n<!-- presentation:related:end -->\n`;
    html = html.replace(/\s*<\/main>/, `${related}    </main>`);
  }

  const isReadingPage = project || route.includes("/research/") || /class="update-note-view"/.test(html);
  // Introduce the project before its architecture. Keep the same order in the DOM
  // for sighted readers, keyboard navigation and assistive technology.
  if (project) {
    const intro = html.match(/<section class="page-section"[^>]*>\s*(?:<svg class="river-thread"[\s\S]*?<\/svg>\s*)?<p>[\s\S]*?<\/section>/)?.[0];
    if (intro && !intro.includes("<h2")) {
      html = html.replace(intro, "");
      html = html.replace(/(<div class="cta">[\s\S]*?<\/div>)\s*/, `$1\n${intro}\n`);
    }
  }
  if (isReadingPage) {
    const headings = [];
    let index = 0;
    html = html.replace(/(<section\b[^>]*>\s*)<h2(?: id="[^"]*")?>([^<]+)<\/h2>/g, (match, opening, heading) => {
      const id = `section-${++index}`;
      headings.push({ id, heading });
      return `${opening}<h2 id="${id}">${heading}</h2>`;
    });
    if (headings.length > 3) {
      const nav = `\n<!-- presentation:contents:start -->\n      <details class="contents-disclosure"><summary>${text.contents}</summary><nav class="page-contents" aria-label="${text.contents}">\n        <ol>${headings.map(({ id, heading }) => `<li><a href="#${id}">${escape(heading)}</a></li>`).join("")}</ol>\n      </nav></details>\n<!-- presentation:contents:end -->\n`;
      const sectionStart = project ? /\s*(<section class="page-section"[^>]*>\s*(?:<svg class="river-thread"[\s\S]*?<\/svg>\s*)?<h2)/ : /\s*(<section class="page-section")/;
      html = html.replace(sectionStart, `${nav}      $1`);
    }
  }
  return enhanceRiverPresentation(html, lang);
}
