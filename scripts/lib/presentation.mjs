const copy = {
  it: {
    discipline: "Informatico e ricercatore", index: "Lavori selezionati",
    tagline: "Sistemi distribuiti, software local-first e calcolo privato.",
    intro: "Lavoro in TypeScript e Python su stato distribuito, controllo locale dei dati e recupero con connettività intermittente.",
    experience: ["Esperienza", "Oltre 20 anni nel software"],
    related: "Ricerca collegata", contents: "In questa pagina", note: "Nota tecnica",
    flow: ["Richiesta privata", "Invito", "Preventivo", "Fattura"],
    topics: ["Stato local-first e recupero", "Stato privato e verifica selettiva", "Contesto vincolato per LLM", "Inferenza locale ed evidenza", "Evidenza che cambia"]
  },
  en: {
    discipline: "Computer scientist and researcher", index: "Selected work",
    tagline: "Distributed systems, local-first software, and private computation.",
    intro: "I work in TypeScript and Python on distributed state, local data ownership, and recovery under partial connectivity.",
    experience: ["Experience", "20+ years in software"],
    related: "Related research", contents: "On this page", note: "Technical note",
    flow: ["Private request", "Invitation", "Estimate", "Invoice"],
    topics: ["Local-first state and recovery", "Private state and selective verification", "Bounded context for LLM systems", "Local inference and evidence", "Verification under changing evidence"]
  },
  fr: {
    discipline: "Informaticien et chercheur", index: "Travaux sélectionnés",
    tagline: "Systèmes distribués, logiciels local-first et calcul privé.",
    intro: "Je travaille en TypeScript et Python sur l’état distribué, la maîtrise locale des données et la reprise en cas de connexion intermittente.",
    experience: ["Expérience", "Plus de 20 ans dans le logiciel"],
    related: "Recherche associée", contents: "Sur cette page", note: "Note technique",
    flow: ["Demande privée", "Invitation", "Devis", "Facture"],
    topics: ["État local-first et reprise", "État privé et vérification sélective", "Contexte contraint pour les LLM", "Inférence locale et preuves", "Vérification face aux preuves changeantes"]
  },
  pt: {
    discipline: "Cientista da computação e investigador", index: "Trabalhos selecionados",
    tagline: "Sistemas distribuídos, software local-first e computação privada.",
    intro: "Trabalho em TypeScript e Python sobre estado distribuído, controlo local dos dados e recuperação com conectividade intermitente.",
    experience: ["Experiência", "Mais de 20 anos em software"],
    related: "Investigação relacionada", contents: "Nesta página", note: "Nota técnica",
    flow: ["Pedido privado", "Convite", "Orçamento", "Fatura"],
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
export function enhancePresentation(html, { lang, route, config, project }) {
  const text = copy[lang] || copy.en;
  html = html.replace(/\s*<!-- presentation:[^:]+:start -->[\s\S]*?<!-- presentation:[^:]+:end -->/g, "");
  html = html.replace(/\s*<div class="bg">\s*<div class="orb orb-a"><\/div>\s*<div class="orb orb-b"><\/div>\s*<div class="grid"><\/div>\s*<\/div>/g, "");
  html = html.replace(/<article class="card[^>]*>[\s\S]*?<\/article>/g, (card) => {
    const url = card.match(/<a class="card-link card-note" href="([^"]+)">/)?.[1];
    if (!url) return card;
    return card.replace(/<h3>([\s\S]*?)<\/h3>/, (_, title) => `<h3><a href="${url}">${plain(title)}</a></h3>`)
      .replace(/(<a class="card-link card-note"[^>]*>)[^<]*/, `$1${text.note}`);
  });

  if (route === config.home || route === config.projects) {
    const matches = [...html.matchAll(/<article class="card[^>]*>[\s\S]*?<\/article>/g)];
    if (matches.length !== projectOrder.length) throw new Error(`Unexpected project count: ${route}`);
    const cards = matches.map(([card]) => card);
    cards.sort((a, b) => projectOrder.indexOf(a.match(/data-project="([^"]+)"/)[1]) - projectOrder.indexOf(b.match(/data-project="([^"]+)"/)[1]));
    html = html.slice(0, matches[0].index) + cards.join("\n\n") + html.slice(matches.at(-1).index + matches.at(-1)[0].length);
  }

  if (route === config.home) {
    html = html.replace(/<p class="tagline">[\s\S]*?<\/p>/, `<p class="tagline">${text.tagline}</p>`);
    html = html.replace(/<p class="lede">[\s\S]*?<\/p>/, `<p class="lede">${text.intro}</p>`);
    let panelIndex = 0;
    html = html.replace(/<div class="panel-item">[\s\S]*?<\/div>/g, (match) => ++panelIndex === 2
      ? `<div class="panel-item">\n  <span class="panel-label">${text.experience[0]}</span>\n  <span class="panel-value">${text.experience[1]}</span>\n</div>` : match);
    html = html.replace('<div class="hero-main">', `<div class="hero-main">\n<!-- presentation:discipline:start -->\n          <p class="eyebrow hero-discipline">${text.discipline}</p>\n<!-- presentation:discipline:end -->`);
    html = html.replace(/(<section class="projects" id="projects">\s*)<h2>[^<]*<\/h2>/,
      `$1<h2>${text.index}</h2>`);
    html = html.replace(/<section class="projects"[\s\S]*?<\/section>/, (section) => {
      const stats = section.match(/\s*<p class="section-note"[^>]*>[\s\S]*?<\/p>/)?.[0];
      return stats ? section.replace(stats, "").replace(/(\s*<a class="section-link")/, `${stats}$1`) : section;
    });
    html = html.replace(/(<article[^>]*data-project="mycasapro"[^>]*>[\s\S]*?)(<div class="card-actions">)/,
      `$1<!-- presentation:flow:start -->\n  <ol class="project-flow" aria-label="MyCasaPro">${text.flow.map((label) => `<li>${label}</li>`).join("")}</ol>\n<!-- presentation:flow:end -->\n  $2`);
    // Put work before biography, while preserving the expertise generator's region.
    html = html.replace(/(<main[^>]*>)([\s\S]*?)(<\/main>)/, (match, open, body, close) => {
      const sections = [...body.matchAll(/<section\b[\s\S]*?<\/section>/g)].map(([section]) => section);
      const order = ["hero", "projects", "systems-practice", "updates", "now", "profile-snapshot", "contact"];
      if (sections.length !== order.length) throw new Error(`Unexpected homepage sections: ${route}`);
      sections.sort((a, b) => order.indexOf(a.match(/class="([^"]+)"/)[1]) - order.indexOf(b.match(/class="([^"]+)"/)[1]));
      return `${open}\n${sections.map((section) => section.startsWith('<section class="systems-practice"')
        ? `<!-- expertise:galidima:home:start -->\n${section}\n<!-- expertise:galidima:home:end -->` : section).join("\n\n")}\n    ${close}`;
    });
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
  if (isReadingPage) {
    const headings = [];
    let index = 0;
    html = html.replace(/(<section\b[^>]*>\s*)<h2(?: id="[^"]*")?>([^<]+)<\/h2>/g, (match, opening, heading) => {
      const id = `section-${++index}`;
      headings.push({ id, heading });
      return `${opening}<h2 id="${id}">${heading}</h2>`;
    });
    if (headings.length > 3) {
      const nav = `\n<!-- presentation:contents:start -->\n      <nav class="page-contents" aria-label="${text.contents}">\n        <span>${text.contents}</span>\n        <ol>${headings.map(({ id, heading }) => `<li><a href="#${id}">${escape(heading)}</a></li>`).join("")}</ol>\n      </nav>\n<!-- presentation:contents:end -->\n`;
      html = html.replace(/\s*(<section class="page-section")/, `${nav}      $1`);
    }
  }
  return html;
}
