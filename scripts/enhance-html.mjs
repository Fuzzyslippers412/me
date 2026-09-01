import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const projectData = JSON.parse(await fs.readFile(path.join(rootDir, "data/projects.json"), "utf8"));
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const expertiseData = JSON.parse(await fs.readFile(path.join(rootDir, "data/expertise.json"), "utf8"));
const siteData = JSON.parse(await fs.readFile(path.join(rootDir, "data/site.json"), "utf8"));
const featuredProgrammingNotes = (updateNotes.items || [])
  .filter((note) => note.technical_sections?.length && !note.historical)
  .slice(0, 4);
const localeConfig = {
  it: {
    home: "/",
    about: "/about/",
    projects: "/projects/",
    research: "/research/",
    updates: "/it/updates/",
    aboutTitle: "Profilo di Armel Tenkiang",
    projectsTitle: "Progetti software di Armel Tenkiang",
    jobTitle: "Informatico e ricercatore",
    description: "Informatico e ricercatore che lavora su sistemi distribuiti, software local-first, inferenza locale e strumenti orientati alla verifica.",
    languageLabel: "Lingua",
    skipLabel: "Vai al contenuto",
    homeLabel: "Home",
    projectsLabel: "Progetti",
    researchLabel: "Ricerca",
    updatesLabel: "Aggiornamenti",
    aboutLabel: "Profilo",
    primaryNavLabel: "Navigazione principale",
    footerNavLabel: "Piè di pagina",
    imageAlt: "Armel Tenkiang — sistemi, ricerca e software",
    breadcrumbLabel: "Percorso",
    projectByLabel: "Progetto di",
    noteByLabel: "Nota di programmazione di",
    programmingNotesLabel: "Note di programmazione",
    selectedNotesLabel: "Note tecniche selezionate",
    currentStateLabel: "Stato attuale",
    systemPathLabel: "Percorso del sistema",
    footerLine: "Sistemi, ricerca e note di progetto."
  },
  en: {
    home: "/en/",
    about: "/en/about/",
    projects: "/en/projects/",
    research: "/en/research/",
    updates: "/updates/",
    aboutTitle: "About Armel Tenkiang",
    projectsTitle: "Software Projects by Armel Tenkiang",
    jobTitle: "Computer scientist and researcher",
    description: "Computer scientist and researcher working on distributed systems, local-first software, local inference, and verification tools.",
    languageLabel: "Language",
    skipLabel: "Skip to content",
    homeLabel: "Home",
    projectsLabel: "Projects",
    researchLabel: "Research",
    updatesLabel: "Updates",
    aboutLabel: "About",
    primaryNavLabel: "Primary navigation",
    footerNavLabel: "Footer",
    imageAlt: "Armel Tenkiang — systems, research, and software",
    breadcrumbLabel: "Breadcrumb",
    projectByLabel: "Project by",
    noteByLabel: "Programming note by",
    programmingNotesLabel: "Programming Notes",
    selectedNotesLabel: "Selected Technical Notes",
    currentStateLabel: "Current State",
    systemPathLabel: "System path",
    footerLine: "Systems, research, and project notes."
  },
  fr: {
    home: "/fr/",
    about: "/fr/about/",
    projects: "/fr/projects/",
    research: "/fr/research/",
    updates: "/fr/updates/",
    aboutTitle: "Profil d’Armel Tenkiang",
    projectsTitle: "Projets logiciels d’Armel Tenkiang",
    jobTitle: "Informaticien et chercheur",
    description: "Informaticien et chercheur travaillant sur les systèmes distribués, les logiciels local-first, l’inférence locale et les outils de vérification.",
    languageLabel: "Langue",
    skipLabel: "Aller au contenu",
    homeLabel: "Accueil",
    projectsLabel: "Projets",
    researchLabel: "Recherche",
    updatesLabel: "Notes",
    aboutLabel: "Profil",
    primaryNavLabel: "Navigation principale",
    footerNavLabel: "Pied de page",
    imageAlt: "Armel Tenkiang — systèmes, recherche et logiciels",
    breadcrumbLabel: "Fil d’Ariane",
    projectByLabel: "Projet par",
    noteByLabel: "Note de programmation par",
    programmingNotesLabel: "Notes de programmation",
    selectedNotesLabel: "Notes techniques sélectionnées",
    currentStateLabel: "État actuel",
    systemPathLabel: "Parcours du système",
    footerLine: "Systèmes, recherche et notes de projet."
  },
  pt: {
    home: "/pt/",
    about: "/pt/about/",
    projects: "/pt/projects/",
    research: "/pt/research/",
    updates: "/pt/updates/",
    aboutTitle: "Perfil de Armel Tenkiang",
    projectsTitle: "Projetos de software de Armel Tenkiang",
    jobTitle: "Cientista da computação e investigador",
    description: "Cientista da computação e investigador que trabalha em sistemas distribuídos, software local-first, inferência local e ferramentas de verificação.",
    languageLabel: "Idioma",
    skipLabel: "Ir para o conteúdo",
    homeLabel: "Início",
    projectsLabel: "Projetos",
    researchLabel: "Investigação",
    updatesLabel: "Atualizações",
    aboutLabel: "Perfil",
    primaryNavLabel: "Navegação principal",
    footerNavLabel: "Rodapé",
    imageAlt: "Armel Tenkiang — sistemas, investigação e software",
    breadcrumbLabel: "Navegação estrutural",
    projectByLabel: "Projeto de",
    noteByLabel: "Nota de programação de",
    programmingNotesLabel: "Notas de programação",
    selectedNotesLabel: "Notas técnicas selecionadas",
    currentStateLabel: "Estado atual",
    systemPathLabel: "Percurso do sistema",
    footerLine: "Sistemas, investigação e notas de projeto."
  }
};

const systemPaths = {
  mycasapro: {
    it: ["Richiesta privata", "Invito fornitore", "Preventivo", "Progetto condiviso", "Fattura"],
    en: ["Private request", "Contractor invite", "Estimate", "Shared project", "Invoice"],
    fr: ["Demande privée", "Invitation prestataire", "Devis", "Projet partagé", "Facture"],
    pt: ["Pedido privado", "Convite ao prestador", "Orçamento", "Projeto partilhado", "Fatura"]
  },
  "liga-do-povo": {
    it: ["Campo", "Partita ricorrente", "Presenze", "Coordinamento", "Rapporto sul campo"],
    en: ["Field", "Recurring game", "RSVP", "Coordination", "Field report"],
    fr: ["Terrain", "Match récurrent", "Présences", "Coordination", "Rapport de terrain"],
    pt: ["Campo", "Jogo recorrente", "Presenças", "Coordenação", "Relato de campo"]
  },
  "theo-farm": {
    it: ["Piano di campo", "Attività", "Scorte", "Note locali", "Sync differita"],
    en: ["Field plan", "Task flow", "Stock", "Local notes", "Delayed sync"],
    fr: ["Plan de parcelle", "Tâches", "Stock", "Notes locales", "Sync différée"],
    pt: ["Plano de campo", "Tarefas", "Inventário", "Notas locais", "Sync diferida"]
  },
  "au-jour-le-jour": {
    it: ["Piano mensile", "Scadenze", "Registro locale", "Backup leggibile", "Condivisione"],
    en: ["Monthly plan", "Due state", "Local ledger", "Readable backup", "Household sharing"],
    fr: ["Plan mensuel", "Échéances", "Registre local", "Sauvegarde lisible", "Partage"],
    pt: ["Plano mensal", "Vencimentos", "Registo local", "Cópia legível", "Partilha"]
  },
  respometer: {
    it: ["Evento fonte", "Evidenza", "Punteggio attore", "Confronto", "Revisione"],
    en: ["Source event", "Evidence", "Actor score", "Comparison", "Revision"],
    fr: ["Événement source", "Preuve", "Score d’acteur", "Comparaison", "Révision"],
    pt: ["Evento fonte", "Prova", "Pontuação de ator", "Comparação", "Revisão"]
  },
  ghostprotocol: {
    it: ["Wallet", "Shield", "Trasferimento privato", "Unshield", "Record di collegamento"],
    en: ["Wallet", "Shield", "Private transfer", "Unshield", "Linkage record"],
    fr: ["Wallet", "Shield", "Transfert privé", "Unshield", "Preuve de liaison"],
    pt: ["Wallet", "Shield", "Transferência privada", "Unshield", "Registo de ligação"]
  },
  chattypatty: {
    it: ["Carico", "Gateway", "Lease", "Ricevuta d’uso", "Attestazione"],
    en: ["Workload", "Gateway", "Lease", "Usage receipt", "Attestation"],
    fr: ["Charge", "Passerelle", "Bail", "Reçu d’usage", "Attestation"],
    pt: ["Carga", "Gateway", "Lease", "Recibo de uso", "Atestação"]
  },
  "soundcheck-ai": {
    it: ["Documento pubblico", "Estrazione", "Schema di spesa", "Verifica claim", "Revisione"],
    en: ["Public filing", "Extraction", "Spending pattern", "Claim check", "Review"],
    fr: ["Document public", "Extraction", "Profil de dépense", "Vérification", "Revue"],
    pt: ["Documento público", "Extração", "Padrão de gasto", "Verificação", "Revisão"]
  }
};

const projects = (projectData.projects || []).map((project) => [project.name, project.slug]);
const projectBySlug = new Map((projectData.projects || []).map((project) => [project.slug, project]));

const walkHtml = async (directory) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walkHtml(absolute));
    if (entry.isFile() && entry.name.endsWith(".html")) files.push(absolute);
  }
  return files;
};

const getRoute = (file) => {
  const relative = path.relative(rootDir, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  return `/${relative.replace(/index\.html$/, "")}`;
};

const getLang = (html) => html.match(/<html\s+lang="([^"]+)"/)?.[1]?.slice(0, 2) || "en";
const getMeta = (html, name) => html.match(new RegExp(`<meta\\s+name="${name}"\\s+content="([^"]*)"\\s*/?>`, "i"))?.[1] || "";
const getCanonical = (html) => html.match(/<link\s+rel="canonical"\s+href="([^"]+)"\s*\/>/i)?.[1] || "";
const getTitle = (html) => html.match(/<title>([^<]+)<\/title>/i)?.[1] || "Armel Tenkiang";
const getH1 = (html) => html.match(/<h1(?:\s[^>]*)?>([\s\S]*?)<\/h1>/i)?.[1]?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "";
const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const projectForRoute = (route, config) => {
  if (!route.startsWith(config.projects) || route === config.projects) return null;
  const slug = route.slice(config.projects.length).split("/")[0];
  return projectBySlug.get(slug) || null;
};

const personNode = (config) => ({
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: "Armel Tenkiang",
  givenName: "Armel",
  familyName: "Tenkiang",
  alternateName: "Fuzzyslippers412",
  url: `${siteUrl}/`,
  jobTitle: config.jobTitle,
  description: config.description,
  mainEntityOfPage: { "@id": `${siteUrl}${config.about}#profilepage` },
  sameAs: [
    "https://github.com/Fuzzyslippers412",
    "https://soundcloud.com/armel-tenkiang"
  ],
  knowsAbout: [
    "Distributed systems",
    "Local-first software",
    "Zero-knowledge proofs",
    "Large language model context engineering",
    "Local language model inference",
    "Evidence-grounded generation",
    "AI system evaluation",
    "Durable data systems",
    "Privacy-preserving payments"
  ],
  knowsLanguage: ["English", "French", "Italian", "Portuguese"]
});

const profileActivity = (lang, config) => {
  const expertiseLocale = expertiseData.locales?.[lang] || expertiseData.locales?.en;
  const expertiseUrl = `${siteUrl}${config.research}${expertiseData.slug}/`;
  return [{
    "@type": "TechArticle",
    "@id": `${expertiseUrl}#article`,
    headline: expertiseLocale?.article?.heading || "Galidima",
    url: expertiseUrl,
    datePublished: expertiseData.published,
    inLanguage: lang,
    author: { "@id": `${siteUrl}/#person` }
  }, ...featuredProgrammingNotes.map((note) => ({
    "@type": "TechArticle",
    "@id": `${siteUrl}/updates/${note.slug}/#article`,
    headline: note.title,
    url: `${siteUrl}/updates/${note.slug}/`,
    datePublished: note.date,
    dateModified: note.modified || note.date,
    inLanguage: "en",
    author: { "@id": `${siteUrl}/#person` }
  }))];
};

const homeSchema = (lang, canonical, title, description) => {
  const config = localeConfig[lang];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: "Armel Tenkiang",
        alternateName: "armeltenkiang.com",
        inLanguage: ["it", "en", "fr", "pt"],
        publisher: { "@id": `${siteUrl}/#person` }
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${siteUrl}/#person` }
      },
      personNode(config)
    ]
  };
};

const aboutSchema = (lang, canonical, title) => {
  const config = localeConfig[lang];
  const activity = profileActivity(lang, config);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${canonical}#profilepage`,
        url: canonical,
        name: title,
        dateCreated: siteData.profile_created,
        dateModified: siteData.profile_modified,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${siteUrl}/#person` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
        ...(activity.length ? { hasPart: activity } : {})
      },
      personNode(config),
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}${config.home}` },
          { "@type": "ListItem", position: 2, name: title, item: canonical }
        ]
      }
    ]
  };
};

const projectsSchema = (lang, canonical, title) => {
  const config = localeConfig[lang];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${canonical}#collection`,
        url: canonical,
        name: title,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${canonical}#projects` },
        author: { "@id": `${siteUrl}/#person` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` }
      },
      {
        "@type": "ItemList",
        "@id": `${canonical}#projects`,
        itemListElement: projects.map(([name, slug], index) => ({
          "@type": "ListItem",
          position: index + 1,
          name,
          url: `${siteUrl}${config.projects}${slug}/`
        }))
      },
      personNode(config),
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}${config.home}` },
          { "@type": "ListItem", position: 2, name: config.projectsLabel, item: canonical }
        ]
      }
    ]
  };
};

const researchSchema = (lang, canonical, title, description) => {
  const config = localeConfig[lang];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#person` },
        author: { "@id": `${siteUrl}/#person` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` }
      },
      personNode(config),
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}${config.home}` },
          { "@type": "ListItem", position: 2, name: config.researchLabel, item: canonical }
        ]
      }
    ]
  };
};

const projectSchema = (lang, canonical, title, description, project) => {
  const config = localeConfig[lang];
  const notes = (updateNotes.items || [])
    .filter((note) => note.project_slug === project.slug)
    .map((note) => ({
      "@type": "TechArticle",
      headline: note.title,
      url: `${siteUrl}/updates/${note.slug}/`,
      datePublished: note.date,
      author: { "@id": `${siteUrl}/#person` }
    }));
  const breadcrumbId = `${canonical}#breadcrumb`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        author: { "@id": `${siteUrl}/#person` },
        mainEntity: { "@id": `${siteUrl}/#project-${project.slug}` },
        breadcrumb: { "@id": breadcrumbId }
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#project-${project.slug}`,
        name: project.name,
        url: project.site,
        applicationCategory: "WebApplication",
        operatingSystem: "Web",
        description,
        author: { "@id": `${siteUrl}/#person` },
        creator: { "@id": `${siteUrl}/#person` },
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
        ...(notes.length ? { subjectOf: notes } : {})
      },
      personNode(config),
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}${config.home}` },
          { "@type": "ListItem", position: 2, name: config.projectsLabel, item: `${siteUrl}${config.projects}` },
          { "@type": "ListItem", position: 3, name: project.name, item: canonical }
        ]
      }
    ]
  };
};

const updatesSchema = (lang, canonical, title, description) => {
  const config = localeConfig[lang] || localeConfig.en;
  return ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${canonical}#updates`,
      url: canonical,
      name: title,
      description,
      inLanguage: lang,
      isPartOf: { "@id": `${siteUrl}/#website` },
      author: { "@id": `${siteUrl}/#person` },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      hasPart: profileActivity
    },
    personNode(config),
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}${config.home}` },
        { "@type": "ListItem", position: 2, name: config.updatesLabel, item: canonical }
      ]
    }
  ]
  });
};

const schemaForRoute = (route, lang, html) => {
  const config = localeConfig[lang] || localeConfig.en;
  const canonical = getCanonical(html);
  const title = getTitle(html);
  const description = getMeta(html, "description");
  const project = projectForRoute(route, config);
  if (route === config.home) return homeSchema(lang, canonical, title, description);
  if (route === config.about) return aboutSchema(lang, canonical, title);
  if (route === config.projects) return projectsSchema(lang, canonical, title);
  if (route === config.research) return researchSchema(lang, canonical, title, description);
  if (project) return projectSchema(lang, canonical, title, description, project);
  if (route === config.updates) return updatesSchema(lang, canonical, title, description);
  return null;
};

const injectSchema = (html, schema, replaceExisting) => {
  if (!schema) return html;
  const block = `    <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n    </script>`;
  const pattern = /\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (replaceExisting && pattern.test(html)) return html.replace(pattern, `\n${block}`);
  if (pattern.test(html)) return html;
  return html.replace("  </head>", `${block}\n  </head>`);
};

const renderNavigation = (config, route) => {
  const navItem = (href, label, state = "") => {
    const current = state ? ` aria-current="${state}"` : "";
    return `        <a href="${href}"${current}>${label}</a>`;
  };
  const homeState = route === config.home ? "page" : "";
  const projectsState = route === config.projects ? "page" : route.startsWith(config.projects) ? "location" : "";
  const researchState = route === config.research ? "page" : route.startsWith(config.research) ? "location" : "";
  const updatesState = route === config.updates ? "page" : route.startsWith(config.updates) ? "location" : "";
  const aboutState = route === config.about ? "page" : "";

  return [
    `      <nav class="nav" aria-label="${escapeHtml(config.primaryNavLabel)}">`,
    navItem(config.home, config.homeLabel, homeState),
    navItem(config.projects, config.projectsLabel, projectsState),
    navItem(config.research, config.researchLabel, researchState),
    navItem(config.updates, config.updatesLabel, updatesState),
    navItem(config.about, config.aboutLabel, aboutState),
    "      </nav>"
  ].join("\n");
};

const renderBreadcrumbs = (route, config, project, pageName) => {
  let items = [];
  if (project) {
    items = [
      [config.home, "Armel Tenkiang"],
      [config.projects, config.projectsLabel],
      ["", project.name]
    ];
  } else if (route === config.projects) {
    items = [[config.home, "Armel Tenkiang"], ["", config.projectsLabel]];
  } else if (route === config.about) {
    items = [[config.home, "Armel Tenkiang"], ["", config.aboutLabel]];
  } else if (route === config.research) {
    items = [[config.home, "Armel Tenkiang"], ["", config.researchLabel]];
  } else if (route.startsWith(config.research)) {
    items = [[config.home, "Armel Tenkiang"], [config.research, config.researchLabel], ["", pageName]];
  } else if (route === config.updates) {
    items = [[config.home, "Armel Tenkiang"], ["", config.updatesLabel]];
  } else if (route.startsWith(config.updates)) {
    items = [[config.home, "Armel Tenkiang"], [config.updates, config.updatesLabel], ["", pageName]];
  }
  if (!items.length) return "";

  const content = items.map(([href, label], index) => {
    const item = href
      ? `<a href="${href}">${escapeHtml(label)}</a>`
      : `<span aria-current="page">${escapeHtml(label)}</span>`;
    return index ? `<span aria-hidden="true">/</span>${item}` : item;
  }).join("");
  return `      <nav class="breadcrumbs" aria-label="${escapeHtml(config.breadcrumbLabel)}">${content}</nav>`;
};

const renderProjectUpdates = (project, config, lang) => {
  const notes = (updateNotes.items || []).filter((note) => note.project_slug === project.slug);
  if (!notes.length) return "";
  const formatter = new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
  const items = notes.map((note) => {
    const date = new Date(note.date);
    const dateOnly = date.toISOString().slice(0, 10);
    return `          <li><time datetime="${dateOnly}">${escapeHtml(formatter.format(date))}</time><a href="/updates/${escapeHtml(note.slug)}/">${escapeHtml(note.title)}</a></li>`;
  }).join("\n");
  return [
    "      <section class=\"page-section project-programming-notes\">",
    `        <h2>${escapeHtml(config.programmingNotesLabel)}</h2>`,
    "        <ul class=\"project-update-list\">",
    items,
    "        </ul>",
    "      </section>",
    ""
  ].join("\n");
};

const renderSystemPath = (project, config, lang) => {
  const stages = systemPaths[project.slug]?.[lang] || systemPaths[project.slug]?.en || [];
  if (!stages.length) return "";
  const id = `system-path-${project.slug}`;
  const items = stages.map((stage, index) => [
    "        <li>",
    `          <span class="system-step">0${index + 1}</span>`,
    `          <span>${escapeHtml(stage)}</span>`,
    "        </li>"
  ].join("\n")).join("\n");
  return [
    `      <figure class="system-map" aria-labelledby="${id}">`,
    `        <figcaption id="${id}"><span>${escapeHtml(config.systemPathLabel)}</span><strong>${escapeHtml(project.name)}</strong></figcaption>`,
    "        <ol>",
    items,
    "        </ol>",
    "      </figure>"
  ].join("\n");
};

const renderProjectEvidence = (project, lang) => {
  const caseStudy = project.caseStudy?.[lang];
  if (!caseStudy?.items?.length) return "";
  const relatedNote = (updateNotes.items || []).find(
    (note) => note.project_slug === project.slug && note.technical_sections?.length && !note.historical
  );
  const items = caseStudy.items.map((item) => [
    "          <div>",
    `            <dt>${escapeHtml(item.term)}</dt>`,
    `            <dd>${escapeHtml(item.description)}</dd>`,
    "          </div>"
  ].join("\n")).join("\n");
  return [
    `<!-- project-evidence:${project.slug}:start -->`,
    "      <section class=\"page-section project-evidence\">",
    `        <h2>${escapeHtml(caseStudy.heading)}</h2>`,
    "        <dl class=\"project-evidence-grid\">",
    items,
    "        </dl>",
    relatedNote ? `        <p class=\"research-links\"><a class=\"card-link\" href=\"/updates/${escapeHtml(relatedNote.slug)}/\">${escapeHtml(caseStudy.noteLabel)}</a></p>` : "",
    "      </section>",
    `<!-- project-evidence:${project.slug}:end -->`,
    ""
  ].filter(Boolean).join("\n") + "\n";
};

const findSectionBeforeHeading = (html, heading) => {
  const headingMatch = new RegExp(`<h2>${escapeHtml(heading)}</h2>`, "i").exec(html);
  if (!headingMatch) return -1;
  return html.lastIndexOf('<section class="page-section">', headingMatch.index);
};

const renderProfileNotes = (config, lang) => {
  const prefix = lang === "it" ? "" : `/${lang}`;
  const localeArticle = expertiseData.locales?.[lang]?.article;
  const notes = [
    {
      date: `${expertiseData.published}T00:00:00Z`,
      title: localeArticle?.heading || "Galidima",
      url: `${prefix}/research/${expertiseData.slug}/`.replace(/^\/\//, "/")
    },
    ...featuredProgrammingNotes.map((note) => ({
      date: note.date,
      title: note.title,
      url: `/updates/${note.slug}/`
    }))
  ];
  const formatter = new Intl.DateTimeFormat(lang, {
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  });
  const items = notes.map((note) => {
    const date = new Date(note.date);
    return `          <li><time datetime="${date.toISOString().slice(0, 10)}">${escapeHtml(formatter.format(date))}</time><a href="${escapeHtml(note.url)}">${escapeHtml(note.title)}</a></li>`;
  }).join("\n");
  return [
    "<!-- selected-technical-notes:start -->",
    "      <section class=\"page-section profile-selected-notes\">",
    `        <h2>${escapeHtml(config.selectedNotesLabel)}</h2>`,
    "        <ul class=\"project-update-list\">",
    items,
    "        </ul>",
    "      </section>",
    "<!-- selected-technical-notes:end -->",
    ""
  ].join("\n");
};

const renderFooter = (config) => [
  "    <footer class=\"site-footer\">",
  "      <div class=\"footer-signature\">",
  `        <a href="${config.home}">Armel Tenkiang</a>`,
  `        <span>${escapeHtml(config.footerLine)}</span>`,
  "      </div>",
  `      <nav class="footer-nav" aria-label="${escapeHtml(config.footerNavLabel)}">`,
  `        <a href="${config.projects}">${escapeHtml(config.projectsLabel)}</a>`,
  `        <a href="${config.research}">${escapeHtml(config.researchLabel)}</a>`,
  `        <a href="${config.updates}">${escapeHtml(config.updatesLabel)}</a>`,
  `        <a href="${config.about}">${escapeHtml(config.aboutLabel)}</a>`,
  "        <a href=\"https://github.com/Fuzzyslippers412\" target=\"_blank\" rel=\"noopener\">GitHub</a>",
  "      </nav>",
  "      <p class=\"footer-meta\">© 2026 Armel Tenkiang</p>",
  "    </footer>"
].join("\n");

const bodyClassForRoute = (route, config, project, programmingNote) => {
  if (route === config.home) return "home";
  if (route === config.projects) return "projects-index";
  if (project) return `project-page project-${project.slug}`;
  if (route === config.research) return "research-view";
  if (route.startsWith(config.research)) return "research-note-view";
  if (route === config.about) return "profile-view";
  if (route === config.updates) return "updates-view";
  if (programmingNote) return "update-note-view";
  return "";
};

const decorateProjectCards = (html) => html.replace(
  /<article class="card(?: [^"]*)?"[^>]*>([\s\S]*?)<\/article>/gi,
  (match, content) => {
    const name = content.match(/<h3>([^<]+)<\/h3>/i)?.[1]?.trim();
    const project = projectData.projects?.find((item) => item.name === name);
    if (!project) return match;
    const state = project.status.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    return `<article class="card card--${state}" data-project="${escapeHtml(project.slug)}" data-state="${escapeHtml(state)}">${content}</article>`;
  }
);

const setDocumentTitle = (html, title) => {
  const escaped = escapeHtml(title);
  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${escaped}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/i, `$1${escaped}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(" \/>)/i, `$1${escaped}$2`);
};

const setMetaDescription = (html, description) => {
  const escaped = escapeHtml(description);
  return html
    .replace(/(<meta name="description" content=")[^"]*(" \/>)/i, `$1${escaped}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(" \/>)/i, `$1${escaped}$2`)
    .replace(/(<meta name="twitter:description" content=")[^"]*(" \/>)/i, `$1${escaped}$2`);
};

const enhance = async (file) => {
  let html = await fs.readFile(file, "utf8");
  const original = html;
  const route = getRoute(file);
  const lang = getLang(html);
  const config = localeConfig[lang] || localeConfig.en;
  const project = projectForRoute(route, config);
  const programmingNote = (updateNotes.items || []).find((note) => route === `/updates/${note.slug}/`);
  const isRedirect = /http-equiv="refresh"/i.test(html);

  if (route === config.about) html = setDocumentTitle(html, config.aboutTitle);
  if (route === config.projects) html = setDocumentTitle(html, config.projectsTitle);

  if (project) {
    const seo = project.seo?.[lang];
    html = setDocumentTitle(html, seo?.title || `${getTitle(html).replace(/\s*\| Armel Tenkiang$/i, "")} | Armel Tenkiang`);
    if (seo?.description) html = setMetaDescription(html, seo.description);
  }

  if (!/<meta name="author"/i.test(html)) {
    html = html.replace(/(<meta name="robots"[^>]*>)/i, `$1\n    <meta name="author" content="Armel Tenkiang" />\n    <meta name="theme-color" content="#f4f0e7" />`);
  }
  if (!isRedirect && !/<link rel="author"/i.test(html)) {
    html = html.replace(
      /(<link rel="canonical" href="[^"]+" \/>)/i,
      `$1\n    <link rel="author" href="${config.about}" />`
    );
  }
  html = html.replace(/<meta name="theme-color" content="#[0-9a-f]{6}" \/>/i, `<meta name="theme-color" content="#f4f0e7" />`);
  const iconBlock = [
    "    <link rel=\"icon\" href=\"/favicon.svg\" type=\"image/svg+xml\" />",
    "    <link rel=\"icon\" href=\"/favicon.ico\" sizes=\"16x16 32x32\" />",
    "    <link rel=\"icon\" href=\"/favicon-48.png\" type=\"image/png\" sizes=\"48x48\" />",
    "    <link rel=\"icon\" href=\"/favicon.png\" type=\"image/png\" sizes=\"512x512\" />",
    "    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/favicon.png\" />",
    "    <link rel=\"manifest\" href=\"/site.webmanifest\" />"
  ].join("\n");
  const existingIconBlock = /\s*<link rel="icon" href="\/favicon\.svg"[\s\S]*?<link rel="shortcut icon" href="\/favicon\.ico" \/>/i;
  if (existingIconBlock.test(html)) {
    html = html.replace(existingIconBlock, `\n${iconBlock}`);
  } else if (!/<link rel="icon"[^>]+favicon\.svg/i.test(html)) {
    if (/<link rel="icon" href="\/favicon\.ico"[^>]*>/i.test(html)) {
      html = html.replace(/<link rel="icon" href="\/favicon\.ico"[^>]*>/i, iconBlock);
    } else {
      html = html.replace("  </head>", `${iconBlock}\n  </head>`);
    }
  }
  if (!/href="\/favicon-48\.png"/i.test(html)) {
    html = html.replace(
      /(<link rel="icon" href="\/favicon\.ico"[^>]*>)/i,
      `$1\n    <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />`
    );
  }
  if (!/type="application\/atom\+xml"[^>]+href="\/feed\.xml"/i.test(html)) {
    html = html.replace(
      /(<link rel="manifest" href="\/site\.webmanifest" \/>)/i,
      `$1\n    <link rel="alternate" type="application/atom+xml" title="Armel Tenkiang — Technical Notes" href="/feed.xml" />`
    );
  }
  if (!/<meta property="og:site_name"/i.test(html)) {
    html = html.replace(/(<meta property="og:type"[^>]*>)/i, `    <meta property="og:site_name" content="Armel Tenkiang" />\n$1`);
  }
  html = html.replace(
    /\s*<meta property="og:site_name" content="Armel Tenkiang" \/>\s*<meta property="og:type" content="([^"]+)" \/>/i,
    `\n    <meta property="og:site_name" content="Armel Tenkiang" />\n    <meta property="og:type" content="$1" />`
  );
  if (!/<meta property="og:image:width"/i.test(html)) {
    html = html.replace(/(<meta property="og:image"[^>]*>)/i, `$1\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="${escapeHtml(config.imageAlt)}" />`);
  }
  html = html.replace(/(<meta property="og:image:alt" content=")[^"]*(" \/>)/i, `$1${escapeHtml(config.imageAlt)}$2`);
  if (!/<meta name="twitter:image"/i.test(html)) {
    html = html.replace(/(<meta\s+name="twitter:description"[\s\S]*?>)/i, `$1\n    <meta name="twitter:image" content="https://armeltenkiang.com/og-image.png" />\n    <meta name="twitter:image:alt" content="${escapeHtml(config.imageAlt)}" />`);
  }
  html = html.replace(/(<meta name="twitter:image:alt" content=")[^"]*(" \/>)/i, `$1${escapeHtml(config.imageAlt)}$2`);

  const fontPreload = "    <link rel=\"preload\" href=\"/fonts/hanken-grotesk-latin.woff2\" as=\"font\" type=\"font/woff2\" crossorigin />";
  html = html.replace(
    /^[ \t]*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\r?\n[ \t]*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\r?\n[ \t]*<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]+" \/>\r?\n/im,
    ""
  );
  if (!/rel="preload" href="\/fonts\/hanken-grotesk-latin\.woff2"/i.test(html)) {
    html = html.replace(/^[ \t]*(<link rel="stylesheet" href="\/style\.css[^>]*>)[ \t]*$/im, `${fontPreload}\n    $1`);
  }
  html = html.replace(
    /^[ \t]*<link rel="preload" href="\/fonts\/hanken-grotesk-latin\.woff2" as="font" type="font\/woff2" crossorigin \/>\r?\n[ \t]*<link rel="stylesheet" href="\/style\.css\?v=\d+" \/>/im,
    `${fontPreload}\n    <link rel="stylesheet" href="/style.css?v=30" />`
  );

  html = html.replace(/\/style\.css\?v=\d+/g, "/style.css?v=30");
  html = html.replace(/<(?:div|a) class="logo"[^>]*>(?:A|AT)<\/(?:div|a)>/g, `<a class="logo" href="${config.home}" aria-label="Armel Tenkiang — ${config.homeLabel}">A</a>`);
  html = html.replace(/^[ \t]*<nav class="nav"(?:\s[^>]*)?>[\s\S]*?^[ \t]*<\/nav>/im, renderNavigation(config, route));
  html = html.replace(/<div class="lang-switch">/g, `<div class="lang-switch" aria-label="${config.languageLabel}">`);
  html = html.replace(/<a class="active"(?:\s+aria-current="page")*/g, `<a class="active" aria-current="page"`);

  if (!isRedirect) {
    const bodyClass = bodyClassForRoute(route, config, project, programmingNote);
    html = html.replace(/<body(?:\s+class="[^"]*")?\s*>/i, `<body${bodyClass ? ` class="${bodyClass}"` : ""}>`);
    html = decorateProjectCards(html);
  }

  if (!isRedirect && !/<a class="skip-link"/i.test(html)) {
    html = html.replace(/(<body[^>]*>)/i, `$1\n    <a class="skip-link" href="#main-content">Skip to content</a>`);
  }
  if (!isRedirect) {
    html = html.replace(/<a class="skip-link" href="#main-content">[^<]*<\/a>/i, `<a class="skip-link" href="#main-content">${config.skipLabel}</a>`);
  }
  if (!isRedirect && !/<main[^>]+id="main-content"/i.test(html)) {
    html = html.replace(/<main(\s|>)/i, `<main id="main-content"$1`);
  }

  if (!isRedirect && !/class="breadcrumbs"/i.test(html)) {
    const breadcrumbs = renderBreadcrumbs(route, config, project, getH1(html));
    if (breadcrumbs) html = html.replace(/(<main[^>]*>)/i, `$1\n${breadcrumbs}`);
  }

  if (!isRedirect && (project || programmingNote) && !/class="page-byline"/i.test(html)) {
    const label = project ? config.projectByLabel : config.noteByLabel;
    const profileRoute = project ? config.about : localeConfig.en.about;
    const byline = `      <p class="page-byline">${escapeHtml(label)} <a href="${profileRoute}" rel="author">Armel Tenkiang</a>.</p>`;
    html = html.replace(/(<div class="page-meta">[\s\S]*?<\/div>)/i, `$1\n${byline}`);
  }
  html = html.replace(/(<p class="page-byline">[\s\S]*?<a href="[^"]+")(?: rel="author")?>Armel Tenkiang<\/a>/i, `$1 rel="author">Armel Tenkiang</a>`);

  html = html.replace(/\s*<figure class="system-map"[\s\S]*?<\/figure>/gi, "");
  if (!isRedirect && project) {
    const systemPath = renderSystemPath(project, config, lang);
    if (systemPath) {
      html = html.replace(/(<div class="cta">[\s\S]*?<\/div>)/i, `$1\n${systemPath}`);
    }
  }

  html = html.replace(/\s*<section class="page-section project-programming-notes">[\s\S]*?<\/section>/gi, "");
  html = html.replace(/\s*<!-- project-evidence:[^:]+:start -->[\s\S]*?<!-- project-evidence:[^:]+:end -->/gi, "");
  if (!isRedirect && project) {
    const evidenceSection = renderProjectEvidence(project, lang);
    if (evidenceSection) {
      const insertionPoint = findSectionBeforeHeading(html, config.currentStateLabel);
      if (insertionPoint >= 0) html = `${html.slice(0, insertionPoint)}${evidenceSection}${html.slice(insertionPoint)}`;
    }
    const updateSection = renderProjectUpdates(project, config, lang);
    if (updateSection) {
      const insertionPoint = findSectionBeforeHeading(html, config.currentStateLabel);
      if (insertionPoint >= 0) html = `${html.slice(0, insertionPoint)}${updateSection}${html.slice(insertionPoint)}`;
    }
  }

  html = html.replace(/\s*<!-- selected-technical-notes:start -->[\s\S]*?<!-- selected-technical-notes:end -->/gi, "");
  if (!isRedirect && route === config.about) {
    const notesSection = renderProfileNotes(config, lang);
    const sections = [...html.matchAll(/^[ \t]*<section class="page-section">[\s\S]*?<\/section>/gmi)];
    const insertionPoint = sections.at(-1)?.index ?? -1;
    if (insertionPoint >= 0) html = `${html.slice(0, insertionPoint)}${notesSection}${html.slice(insertionPoint)}`;
  }

  const schema = schemaForRoute(route, lang, html);
  const replaceExisting = Boolean(project) || [config.home, config.about, config.projects, config.research, config.updates].includes(route);
  html = injectSchema(html, schema, replaceExisting);

  if (!isRedirect) {
    html = html.replace(/^[ \t]*<footer class="site-footer">[\s\S]*?<\/footer>/im, renderFooter(config));
  }

  if (html !== original) await fs.writeFile(file, html, "utf8");
};

const files = await walkHtml(rootDir);
await Promise.all(files.map(enhance));
console.log(`Enhanced ${files.length} HTML files.`);
