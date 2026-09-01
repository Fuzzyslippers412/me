import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const notes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8")).items || [];
const updates = JSON.parse(await fs.readFile(path.join(rootDir, "data/updates.json"), "utf8"));

const routes = {
  it: "/it/updates/",
  en: "/updates/",
  fr: "/fr/updates/",
  pt: "/pt/updates/"
};

const localeData = {
  it: {
    locale: "it-IT", og: "it_IT", home: "/", projects: "/projects/", research: "/research/", about: "/about/",
    nav: ["Home", "Progetti", "Ricerca", "Aggiornamenti", "Profilo"],
    skip: "Vai al contenuto", eyebrow: "Aggiornamenti di programmazione", heading: "Aggiornamenti di programmazione",
    title: "Aggiornamenti di programmazione — Armel Tenkiang",
    description: "Note tecniche di Armel Tenkiang basate su commit verificati, fonti di progetto e modifiche pubblicate.",
    meta: ["Commit e fonti di progetto", "Registro tecnico permanente"],
    notesHeading: "Note pubblicate", notesCopy: "Note tecniche di Armel Tenkiang ricavate da commit e prove di rilascio verificabili. Ogni voce distingue il codice attuale dal lavoro storico.",
    recentHeading: "Attività recente", recentCopy: "Feed mobile dei progetti. Le note sopra restano il registro permanente e indicizzabile.",
    checked: "Ultimo controllo:", original: "I titoli dei commit restano nella lingua in cui sono stati pubblicati.", historical: "Storico",
    footer: "Sistemi, ricerca e note di progetto."
  },
  en: {
    locale: "en-US", og: "en_US", home: "/en/", projects: "/en/projects/", research: "/en/research/", about: "/en/about/",
    nav: ["Home", "Projects", "Research", "Updates", "About"],
    skip: "Skip to content", eyebrow: "Programming Updates", heading: "Programming Updates",
    title: "Programming Updates — Armel Tenkiang",
    description: "Technical notes by Armel Tenkiang based on verified commits, project sources, and published changes.",
    meta: ["Project commits and sources", "Permanent technical record"],
    notesHeading: "Published Notes", notesCopy: "Technical notes by Armel Tenkiang, written from verifiable project commits and release evidence. Each entry distinguishes current code from historical work.",
    recentHeading: "Recent Activity", recentCopy: "A rolling project feed. The notes above remain the permanent, indexable record.",
    checked: "Last checked:", original: "Commit titles are retained in the language in which they were published.", historical: "Historical",
    footer: "Systems, research, and project notes."
  },
  fr: {
    locale: "fr-FR", og: "fr_FR", home: "/fr/", projects: "/fr/projects/", research: "/fr/research/", about: "/fr/about/",
    nav: ["Accueil", "Projets", "Recherche", "Notes", "Profil"],
    skip: "Aller au contenu", eyebrow: "Notes de programmation", heading: "Notes de programmation",
    title: "Notes de programmation — Armel Tenkiang",
    description: "Notes techniques d’Armel Tenkiang fondées sur des commits vérifiés, des sources de projet et des changements publiés.",
    meta: ["Commits et sources de projet", "Registre technique permanent"],
    notesHeading: "Notes publiées", notesCopy: "Notes techniques d’Armel Tenkiang tirées de commits et de preuves de publication vérifiables. Chaque entrée distingue le code actuel du travail historique.",
    recentHeading: "Activité récente", recentCopy: "Flux courant des projets. Les notes ci-dessus restent le registre permanent et indexable.",
    checked: "Dernière vérification :", original: "Les titres de commit restent dans leur langue de publication.", historical: "Historique",
    footer: "Systèmes, recherche et notes de projet."
  },
  pt: {
    locale: "pt-PT", og: "pt_PT", home: "/pt/", projects: "/pt/projects/", research: "/pt/research/", about: "/pt/about/",
    nav: ["Início", "Projetos", "Investigação", "Notas", "Perfil"],
    skip: "Ir para o conteúdo", eyebrow: "Notas de programação", heading: "Notas de programação",
    title: "Notas de programação — Armel Tenkiang",
    description: "Notas técnicas de Armel Tenkiang baseadas em commits verificados, fontes dos projetos e alterações publicadas.",
    meta: ["Commits e fontes dos projetos", "Registo técnico permanente"],
    notesHeading: "Notas publicadas", notesCopy: "Notas técnicas de Armel Tenkiang elaboradas a partir de commits e provas de publicação verificáveis. Cada entrada distingue o código atual do trabalho histórico.",
    recentHeading: "Atividade recente", recentCopy: "Feed corrente dos projetos. As notas acima permanecem como registo permanente e indexável.",
    checked: "Última verificação:", original: "Os títulos dos commits mantêm a língua em que foram publicados.", historical: "Histórico",
    footer: "Sistemas, investigação e notas de projeto."
  }
};

const translatedTitles = {
  "2026-08-au-jour-localized-year-review": {
    it: "Un solo stato linguistico per registro, assistente ed esportazioni",
    fr: "Un seul état de langue pour le registre, l’assistant et les exports",
    pt: "Um único estado de idioma para registo, assistente e exportações"
  },
  "2026-07-mycasapro-durable-invitations": {
    it: "Link privati per fornitori con consegna email durevole",
    fr: "Liens privés prestataires avec livraison email durable",
    pt: "Links privados para prestadores com entrega de email durável"
  },
  "2026-07-au-jour-runtime-trust": {
    it: "Storage esplicito tra edizioni browser e locale",
    fr: "Stockage explicite entre les éditions navigateur et locale",
    pt: "Armazenamento explícito entre as edições de navegador e local"
  },
  "2026-07-liga-matchday-details": {
    it: "Dettagli partita e controlli di partecipazione più sicuri",
    fr: "Détails du match et contrôles de participation plus sûrs",
    pt: "Detalhes do jogo e controlos de participação mais seguros"
  },
  "2026-07-liga-recurring-discovery": {
    it: "Scoperta delle partite ricorrenti e affidabilità della directory",
    fr: "Découverte des matchs récurrents et fiabilité du répertoire",
    pt: "Descoberta de jogos recorrentes e confiança no diretório"
  },
  "2026-07-liga-offline-links": {
    it: "Link stabili alle partite ricorrenti durante le interruzioni",
    fr: "Liens stables vers les matchs récurrents pendant les pannes",
    pt: "Links estáveis para jogos recorrentes durante falhas"
  },
  "2026-06-au-jour-runtime-checks": {
    it: "I controlli runtime distinguono errori e provider indisponibili",
    fr: "Les contrôles runtime distinguent les erreurs des fournisseurs indisponibles",
    pt: "Os controlos de runtime distinguem erros de providers indisponíveis"
  },
  "2026-06-au-jour-readable-backups": {
    it: "Backup leggibili e recuperabili del registro domestico",
    fr: "Sauvegardes lisibles et récupérables du registre domestique",
    pt: "Backups legíveis e recuperáveis do registo doméstico"
  },
  "2026-04-respometer-article-shape": {
    it: "L’acquisizione distingue i resoconti degli eventi dal contesto",
    fr: "L’ingestion distingue les comptes rendus d’événements du contexte",
    pt: "A ingestão distingue relatos de eventos do contexto"
  },
  "2026-03-chattypatty-receipt-bound-inference": {
    it: "Inferenza distribuita vincolata alle ricevute",
    fr: "Inférence distribuée liée aux reçus",
    pt: "Inferência distribuída vinculada a recibos"
  },
  "2026-02-mycasapro-proof-layer": {
    it: "Esperimento Alpha 5 archiviato su prove e settlement",
    fr: "Expérience Alpha 5 archivée sur les preuves et le règlement",
    pt: "Experiência Alpha 5 arquivada sobre prova e liquidação"
  }
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");

const safeUrl = (value) => {
  if (/^\/(?!\/)/.test(String(value || ""))) return String(value);
  const parsed = new URL(value);
  return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "/updates/";
};

const formatDate = (value, locale, options) => new Intl.DateTimeFormat(locale, {
  timeZone: "UTC", ...options
}).format(new Date(value));

const renderNoteItems = (lang, config) => notes.map((note) => {
  const title = lang === "en" ? note.title : translatedTitles[note.slug]?.[lang] || note.title;
  const status = note.historical ? `<span class="update-status">${escapeHtml(config.historical)}</span>` : "";
  return `          <li><a href="/updates/${escapeHtml(note.slug)}/" hreflang="en"><time class="update-date" datetime="${escapeHtml(note.date.slice(0, 10))}">${escapeHtml(formatDate(note.date, config.locale, { day: "numeric", month: "short", year: "numeric" }))}</time><span class="update-project">${escapeHtml(note.source)}</span><span class="update-title">${escapeHtml(title)}${status}</span></a></li>`;
}).join("\n");

const renderRecentItems = (config) => (updates.items || []).slice(0, 5).map((item) =>
  `          <li><a href="${escapeHtml(safeUrl(item.url))}"><time class="update-date" datetime="${escapeHtml(item.date || "")}">${escapeHtml(formatDate(item.date, config.locale, { month: "long", year: "numeric" }))}</time><span class="update-project">${escapeHtml(item.source)}</span><span class="update-title" lang="en">${escapeHtml(item.title)}</span></a></li>`
).join("\n");

const renderAlternates = () => Object.entries(routes).map(([lang, route]) =>
  `    <link rel="alternate" hreflang="${lang}" href="${siteUrl}${route}" />`
).concat(`    <link rel="alternate" hreflang="x-default" href="${siteUrl}${routes.en}" />`).join("\n");

const renderLanguageSwitch = (active) => Object.entries(routes).map(([lang, route]) =>
  `        <a${lang === active ? ' class="active" aria-current="page"' : ""} href="${route}" lang="${lang}">${lang.toUpperCase()}</a>`
).join("\n");

const renderPage = (lang) => {
  const config = localeData[lang];
  const canonical = `${siteUrl}${routes[lang]}`;
  const latest = updates.latest_item_at || updates.generated_at;
  const checked = latest ? formatDate(latest, config.locale, { day: "numeric", month: "long", year: "numeric" }) : "—";
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#updates`,
    url: canonical,
    name: config.title,
    description: config.description,
    inLanguage: lang,
    author: { "@type": "Person", "@id": `${siteUrl}/#person`, name: "Armel Tenkiang", url: `${siteUrl}${config.about}` }
  };
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(config.title)}</title>
    <meta name="description" content="${escapeHtml(config.description)}" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Armel Tenkiang" />
    <meta name="theme-color" content="#f4f0e7" />
    <link rel="canonical" href="${canonical}" />
${renderAlternates()}
    <link rel="author" href="${config.about}" />
    <link rel="me" href="https://github.com/Fuzzyslippers412" />
    <link rel="me" href="https://soundcloud.com/armel-tenkiang" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="16x16 32x32" />
    <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
    <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="alternate" type="application/atom+xml" title="Armel Tenkiang — Technical Notes" href="/feed.xml" />
    <meta property="og:title" content="${escapeHtml(config.title)}" />
    <meta property="og:description" content="${escapeHtml(config.description)}" />
    <meta property="og:locale" content="${config.og}" />
    <meta property="og:site_name" content="Armel Tenkiang" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Armel Tenkiang — systems, research, and software" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(config.title)}" />
    <meta name="twitter:description" content="${escapeHtml(config.description)}" />
    <meta name="twitter:image" content="${siteUrl}/og-image.png" />
    <meta name="twitter:image:alt" content="Armel Tenkiang — systems, research, and software" />
    <link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/style.css?v=30" />
    <script src="/scripts/updates.js" defer></script>
    <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
    </script>
  </head>
  <body class="updates-view">
    <a class="skip-link" href="#main-content">${escapeHtml(config.skip)}</a>
    <div class="bg"><div class="orb orb-a"></div><div class="orb orb-b"></div><div class="grid"></div></div>
    <header class="site-header">
      <a class="logo" href="${config.home}" aria-label="Armel Tenkiang — Home">A</a>
      <nav class="nav" aria-label="Primary">
        <a href="${config.home}">${config.nav[0]}</a><a href="${config.projects}">${config.nav[1]}</a><a href="${config.research}">${config.nav[2]}</a><a href="${routes[lang]}" aria-current="page">${config.nav[3]}</a><a href="${config.about}">${config.nav[4]}</a>
      </nav>
      <div class="lang-switch" aria-label="Language">
${renderLanguageSwitch(lang)}
      </div>
    </header>
    <main id="main-content" class="page">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="${config.home}">Armel Tenkiang</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(config.nav[3])}</span></nav>
      <span class="eyebrow">${escapeHtml(config.eyebrow)}</span>
      <h1>${escapeHtml(config.heading)}</h1>
      <div class="page-meta"><span>${escapeHtml(config.meta[0])}</span><span>${escapeHtml(config.meta[1])}</span></div>
      <section class="page-section">
        <h2>${escapeHtml(config.notesHeading)}</h2>
        <div class="update-archive-copy"><p>${escapeHtml(config.notesCopy)}</p></div>
        <ul class="updates-list" data-update-archive>
${renderNoteItems(lang, config)}
        </ul>
      </section>
      <section class="page-section">
        <h2>${escapeHtml(config.recentHeading)}</h2>
        <div class="update-archive-copy"><p>${escapeHtml(config.recentCopy)}</p><p class="section-note">${escapeHtml(config.original)}</p></div>
        <ul class="updates-list" data-updates>
${renderRecentItems(config)}
        </ul>
        <p class="updates-note updates-updated" data-updated-at data-prefix="${escapeHtml(config.checked)}">${escapeHtml(config.checked)} ${escapeHtml(checked)}</p>
      </section>
    </main>
    <footer class="site-footer"><div class="footer-signature"><a href="${config.home}">Armel Tenkiang</a><span>${escapeHtml(config.footer)}</span></div></footer>
  </body>
</html>
`;
};

for (const lang of Object.keys(routes)) {
  const relative = routes[lang] === "/updates/" ? "updates/index.html" : `${routes[lang].slice(1)}index.html`;
  const target = path.join(rootDir, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, renderPage(lang), "utf8");
}

console.log("Wrote 4 localized programming-update indexes.");
