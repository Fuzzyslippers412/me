import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const projectData = JSON.parse(await fs.readFile(path.join(rootDir, "data/projects.json"), "utf8"));
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const profileActivity = (updateNotes.items || []).slice(0, 5).map((note) => ({
  "@type": "TechArticle",
  name: note.title,
  url: `${siteUrl}/updates/${note.slug}/`,
  datePublished: note.date
}));

const localeConfig = {
  it: {
    home: "/",
    about: "/about/",
    projects: "/projects/",
    jobTitle: "Informatico e ricercatore",
    description: "Informatico e ricercatore che lavora su sistemi distribuiti, software local-first e strumenti orientati alla verifica.",
    languageLabel: "Lingua",
    skipLabel: "Vai al contenuto",
    homeLabel: "Home",
    projectsLabel: "Progetti",
    updatesLabel: "Aggiornamenti",
    aboutLabel: "Profilo",
    breadcrumbLabel: "Percorso",
    projectByLabel: "Progetto di",
    noteByLabel: "Nota di programmazione di",
    programmingNotesLabel: "Note di programmazione"
  },
  en: {
    home: "/en/",
    about: "/en/about/",
    projects: "/en/projects/",
    jobTitle: "Computer scientist and researcher",
    description: "Computer scientist and researcher working on distributed systems, local-first software, and verification tools.",
    languageLabel: "Language",
    skipLabel: "Skip to content",
    homeLabel: "Home",
    projectsLabel: "Projects",
    updatesLabel: "Updates",
    aboutLabel: "About",
    breadcrumbLabel: "Breadcrumb",
    projectByLabel: "Project by",
    noteByLabel: "Programming note by",
    programmingNotesLabel: "Programming Notes"
  },
  fr: {
    home: "/fr/",
    about: "/fr/about/",
    projects: "/fr/projects/",
    jobTitle: "Informaticien et chercheur",
    description: "Informaticien et chercheur travaillant sur les systèmes distribués, les logiciels local-first et les outils de vérification.",
    languageLabel: "Langue",
    skipLabel: "Aller au contenu",
    homeLabel: "Accueil",
    projectsLabel: "Projets",
    updatesLabel: "Notes",
    aboutLabel: "Profil",
    breadcrumbLabel: "Fil d’Ariane",
    projectByLabel: "Projet par",
    noteByLabel: "Note de programmation par",
    programmingNotesLabel: "Notes de programmation"
  },
  pt: {
    home: "/pt/",
    about: "/pt/about/",
    projects: "/pt/projects/",
    jobTitle: "Cientista da computação e investigador",
    description: "Cientista da computação e investigador que trabalha em sistemas distribuídos, software local-first e ferramentas de verificação.",
    languageLabel: "Idioma",
    skipLabel: "Ir para o conteúdo",
    homeLabel: "Início",
    projectsLabel: "Projetos",
    updatesLabel: "Atualizações",
    aboutLabel: "Perfil",
    breadcrumbLabel: "Navegação estrutural",
    projectByLabel: "Projeto de",
    noteByLabel: "Nota de programação de",
    programmingNotesLabel: "Notas de programação"
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
    "Privacy-preserving payments"
  ],
  knowsLanguage: ["English", "French", "Italian", "Portuguese"]
});

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
        alternateName: "AT / Systems + Research",
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
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": `${canonical}#profilepage`,
        url: canonical,
        name: title,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${siteUrl}/#person` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` },
        ...(profileActivity.length ? { hasPart: profileActivity } : {})
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

const updatesSchema = (canonical, title, description) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "@id": `${canonical}#updates`,
      url: canonical,
      name: title,
      description,
      inLanguage: "en",
      isPartOf: { "@id": `${siteUrl}/#website` },
      author: { "@id": `${siteUrl}/#person` },
      breadcrumb: { "@id": `${canonical}#breadcrumb` },
      hasPart: profileActivity
    },
    personNode(localeConfig.en),
    {
      "@type": "BreadcrumbList",
      "@id": `${canonical}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}/en/` },
        { "@type": "ListItem", position: 2, name: "Programming Updates", item: canonical }
      ]
    }
  ]
});

const schemaForRoute = (route, lang, html) => {
  const config = localeConfig[lang] || localeConfig.en;
  const canonical = getCanonical(html);
  const title = getTitle(html);
  const description = getMeta(html, "description");
  const project = projectForRoute(route, config);
  if (route === config.home) return homeSchema(lang, canonical, title, description);
  if (route === config.about) return aboutSchema(lang, canonical, title);
  if (route === config.projects) return projectsSchema(lang, canonical, title);
  if (project) return projectSchema(lang, canonical, title, description, project);
  if (route === "/updates/") return updatesSchema(canonical, title, description);
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
  const updatesState = route === "/updates/" ? "page" : route.startsWith("/updates/") ? "location" : "";
  const aboutState = route === config.about ? "page" : "";

  return [
    "      <nav class=\"nav\" aria-label=\"Primary\">",
    navItem(config.home, config.homeLabel, homeState),
    navItem(config.projects, config.projectsLabel, projectsState),
    navItem("/updates/", config.updatesLabel, updatesState),
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
  } else if (route === "/updates/") {
    items = [[config.home, "Armel Tenkiang"], ["", config.updatesLabel]];
  } else if (route.startsWith("/updates/")) {
    items = [[config.home, "Armel Tenkiang"], ["/updates/", config.updatesLabel], ["", pageName]];
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

const setDocumentTitle = (html, title) => {
  const escaped = escapeHtml(title);
  return html
    .replace(/<title>[^<]*<\/title>/i, `<title>${escaped}</title>`)
    .replace(/(<meta property="og:title" content=")[^"]*(" \/>)/i, `$1${escaped}$2`)
    .replace(/(<meta name="twitter:title" content=")[^"]*(" \/>)/i, `$1${escaped}$2`);
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

  if (project && !/\| Armel Tenkiang$/i.test(getTitle(html))) {
    html = setDocumentTitle(html, `${getTitle(html)} | Armel Tenkiang`);
  }

  if (!/<meta name="author"/i.test(html)) {
    html = html.replace(/(<meta name="robots"[^>]*>)/i, `$1\n    <meta name="author" content="Armel Tenkiang" />\n    <meta name="theme-color" content="#f7f4ec" />`);
  }
  html = html.replace(/<meta name="theme-color" content="#[0-9a-f]{6}" \/>/i, `<meta name="theme-color" content="#f7f4ec" />`);
  const iconBlock = [
    "    <link rel=\"icon\" href=\"/favicon.svg\" type=\"image/svg+xml\" />",
    "    <link rel=\"icon\" href=\"/favicon.ico\" sizes=\"16x16 32x32\" />",
    "    <link rel=\"icon\" href=\"/favicon.png\" type=\"image/png\" sizes=\"512x512\" />",
    "    <link rel=\"apple-touch-icon\" sizes=\"180x180\" href=\"/favicon.png\" />",
    "    <link rel=\"manifest\" href=\"/site.webmanifest\" />"
  ].join("\n");
  const existingIconBlock = /\s*<link rel="icon" href="\/favicon\.svg"[\s\S]*?<link rel="shortcut icon" href="\/favicon\.ico" \/>/i;
  if (existingIconBlock.test(html)) {
    html = html.replace(existingIconBlock, `\n${iconBlock}`);
  } else if (!/<link rel="icon"[^>]+favicon\.svg/i.test(html)) {
    html = html.replace(/(<link rel="icon" href="\/favicon\.ico"[^>]*>)/i, `${iconBlock}\n$1`);
  }
  if (!/<meta property="og:site_name"/i.test(html)) {
    html = html.replace(/(<meta property="og:type"[^>]*>)/i, `    <meta property="og:site_name" content="Armel Tenkiang" />\n$1`);
  }
  html = html.replace(
    /\s*<meta property="og:site_name" content="Armel Tenkiang" \/>\s*<meta property="og:type" content="([^"]+)" \/>/i,
    `\n    <meta property="og:site_name" content="Armel Tenkiang" />\n    <meta property="og:type" content="$1" />`
  );
  if (!/<meta property="og:image:width"/i.test(html)) {
    html = html.replace(/(<meta property="og:image"[^>]*>)/i, `$1\n    <meta property="og:image:width" content="1200" />\n    <meta property="og:image:height" content="630" />\n    <meta property="og:image:alt" content="Armel Tenkiang — systems, research, and software" />`);
  }
  if (!/<meta name="twitter:image"/i.test(html)) {
    html = html.replace(/(<meta\s+name="twitter:description"[\s\S]*?>)/i, `$1\n    <meta name="twitter:image" content="https://armeltenkiang.com/og-image.png" />\n    <meta name="twitter:image:alt" content="Armel Tenkiang — systems, research, and software" />`);
  }

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
    `${fontPreload}\n    <link rel="stylesheet" href="/style.css?v=25" />`
  );

  html = html.replace(/\/style\.css\?v=\d+/g, "/style.css?v=25");
  html = html.replace(/<(?:div|a) class="logo"[^>]*>(?:A|AT)<\/(?:div|a)>/g, `<a class="logo" href="${config.home}" aria-label="Armel Tenkiang — ${config.homeLabel}">A</a>`);
  html = html.replace(/^[ \t]*<nav class="nav"(?:\s[^>]*)?>[\s\S]*?^[ \t]*<\/nav>/im, renderNavigation(config, route));
  html = html.replace(/<div class="lang-switch">/g, `<div class="lang-switch" aria-label="${config.languageLabel}">`);
  html = html.replace(/<a class="active"(?:\s+aria-current="page")*/g, `<a class="active" aria-current="page"`);

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

  html = html.replace(/\s*<section class="page-section project-programming-notes">[\s\S]*?<\/section>/gi, "");
  if (!isRedirect && project) {
    const updateSection = renderProjectUpdates(project, config, lang);
    if (updateSection) {
      const marker = '      <section class="page-section">';
      const insertionPoint = html.lastIndexOf(marker);
      if (insertionPoint >= 0) html = `${html.slice(0, insertionPoint)}${updateSection}${html.slice(insertionPoint)}`;
    }
  }

  const schema = schemaForRoute(route, lang, html);
  const replaceExisting = Boolean(project) || [config.home, config.about, config.projects, "/updates/"].includes(route);
  html = injectSchema(html, schema, replaceExisting);

  if (html !== original) await fs.writeFile(file, html, "utf8");
};

const files = await walkHtml(rootDir);
await Promise.all(files.map(enhance));
console.log(`Enhanced ${files.length} HTML files.`);
