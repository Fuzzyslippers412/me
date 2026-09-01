import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const expertise = JSON.parse(await fs.readFile(path.join(rootDir, "data/expertise.json"), "utf8"));

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const localeConfig = {
  it: {
    homeFile: "index.html",
    aboutFile: "about/index.html",
    home: "/",
    about: "/about/",
    projects: "/projects/",
    research: "/research/",
    updates: "/it/updates/",
    route: `/research/${expertise.slug}/`,
    nav: ["Home", "Progetti", "Ricerca", "Aggiornamenti", "Profilo"],
    breadcrumbLabel: "Percorso",
    languageLabel: "Lingua",
    skipLabel: "Vai al contenuto",
    currentStateLabel: "Stato attuale",
    footer: "Sistemi, ricerca e note di progetto."
  },
  en: {
    homeFile: "en/index.html",
    aboutFile: "en/about/index.html",
    home: "/en/",
    about: "/en/about/",
    projects: "/en/projects/",
    research: "/en/research/",
    updates: "/updates/",
    route: `/en/research/${expertise.slug}/`,
    nav: ["Home", "Projects", "Research", "Updates", "About"],
    breadcrumbLabel: "Breadcrumb",
    languageLabel: "Language",
    skipLabel: "Skip to content",
    currentStateLabel: "Current state",
    footer: "Systems, research, and project notes."
  },
  fr: {
    homeFile: "fr/index.html",
    aboutFile: "fr/about/index.html",
    home: "/fr/",
    about: "/fr/about/",
    projects: "/fr/projects/",
    research: "/fr/research/",
    updates: "/fr/updates/",
    route: `/fr/research/${expertise.slug}/`,
    nav: ["Accueil", "Projets", "Recherche", "Notes", "Profil"],
    breadcrumbLabel: "Fil d’Ariane",
    languageLabel: "Langue",
    skipLabel: "Aller au contenu",
    currentStateLabel: "État actuel",
    footer: "Systèmes, recherche et notes de projet."
  },
  pt: {
    homeFile: "pt/index.html",
    aboutFile: "pt/about/index.html",
    home: "/pt/",
    about: "/pt/about/",
    projects: "/pt/projects/",
    research: "/pt/research/",
    updates: "/pt/updates/",
    route: `/pt/research/${expertise.slug}/`,
    nav: ["Início", "Projetos", "Investigação", "Atualizações", "Perfil"],
    breadcrumbLabel: "Navegação estrutural",
    languageLabel: "Idioma",
    skipLabel: "Ir para o conteúdo",
    currentStateLabel: "Estado atual",
    footer: "Sistemas, investigação e notas de projeto."
  }
};

const routes = Object.fromEntries(
  Object.entries(localeConfig).map(([lang, config]) => [lang, config.route])
);

const markedBlock = (kind, content) => [
  `<!-- expertise:${expertise.slug}:${kind}:start -->`,
  content,
  `<!-- expertise:${expertise.slug}:${kind}:end -->`
].join("\n");

const replaceMarkedBlock = (html, kind, block, insertionIndex) => {
  const start = `<!-- expertise:${expertise.slug}:${kind}:start -->`;
  const end = `<!-- expertise:${expertise.slug}:${kind}:end -->`;
  const startIndex = html.indexOf(start);
  const endIndex = html.indexOf(end);
  if (startIndex >= 0 && endIndex > startIndex) {
    return `${html.slice(0, startIndex)}${block}${html.slice(endIndex + end.length)}`;
  }
  if (insertionIndex < 0) throw new Error(`Cannot place ${kind} expertise block`);
  return `${html.slice(0, insertionIndex)}${block}\n\n${html.slice(insertionIndex)}`;
};

const renderCapabilities = (capabilities) => `        <dl class="practice-ledger">
${capabilities.map((item) => `          <div>
            <dt>${escapeHtml(item.term)}</dt>
            <dd>${escapeHtml(item.description)}</dd>
          </div>`).join("\n")}
        </dl>`;

const renderHomeBlock = (lang, content) => markedBlock("home", `      <section class="systems-practice" id="private-intelligence">
        <h2>${escapeHtml(content.heading)}</h2>
        <div class="practice-layout">
          <div class="practice-intro">
            <p class="practice-statement">${escapeHtml(content.statement)}</p>
            <p>${escapeHtml(content.detail)}</p>
            <a class="section-link" href="${localeConfig[lang].route}">${escapeHtml(content.link)}</a>
          </div>
${renderCapabilities(content.capabilities)}
        </div>
      </section>`);

const renderAboutBlock = (lang, content) => markedBlock("about", `      <section class="page-section systems-practice-detail" id="systems-practice">
        <h2>${escapeHtml(content.heading)}</h2>
${content.paragraphs.map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`).join("\n")}
        <p class="research-links"><a class="card-link" href="${localeConfig[lang].route}">${escapeHtml(content.link)}</a></p>
      </section>`);

const renderProjectBlock = (lang, slug, content) => markedBlock(`project-${slug}`, `      <section class="page-section expertise-integration">
        <h2>${escapeHtml(content.heading)}</h2>
        <p>${escapeHtml(content.paragraph)}</p>
        <p class="research-links"><a class="card-link" href="${localeConfig[lang].route}">${escapeHtml(content.link)}</a></p>
      </section>`);

const writeEmbeddedSections = async (lang, locale) => {
  const config = localeConfig[lang];
  const homePath = path.join(rootDir, config.homeFile);
  const aboutPath = path.join(rootDir, config.aboutFile);

  let homeHtml = await fs.readFile(homePath, "utf8");
  const projectIndex = homeHtml.indexOf('      <section class="projects"');
  homeHtml = replaceMarkedBlock(homeHtml, "home", renderHomeBlock(lang, locale.home), projectIndex);
  await fs.writeFile(homePath, homeHtml, "utf8");

  let aboutHtml = await fs.readFile(aboutPath, "utf8");
  const researchHeading = `<h2>${escapeHtml(locale.research_heading)}</h2>`;
  const headingIndex = aboutHtml.indexOf(researchHeading);
  const sectionIndex = headingIndex >= 0
    ? aboutHtml.lastIndexOf('      <section class="page-section">', headingIndex)
    : -1;
  aboutHtml = replaceMarkedBlock(aboutHtml, "about", renderAboutBlock(lang, locale.about), sectionIndex);
  await fs.writeFile(aboutPath, aboutHtml, "utf8");

  for (const [slug, content] of Object.entries(locale.project_notes || {})) {
    const prefix = lang === "it" ? "" : `${lang}/`;
    const projectPath = path.join(rootDir, `${prefix}projects/${slug}/index.html`);
    let projectHtml = await fs.readFile(projectPath, "utf8");
    const sections = [...projectHtml.matchAll(/^[ \t]*<section class="page-section">[\s\S]*?<\/section>/gmi)];
    const stateSection = sections.find((match) => new RegExp(
      `<h2>${escapeHtml(config.currentStateLabel)}</h2>`,
      "i"
    ).test(match[0]));
    projectHtml = replaceMarkedBlock(
      projectHtml,
      `project-${slug}`,
      renderProjectBlock(lang, slug, content),
      stateSection?.index ?? -1
    );
    await fs.writeFile(projectPath, projectHtml, "utf8");
  }
};

const personNode = (lang, config) => ({
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: "Armel Tenkiang",
  url: `${siteUrl}/`,
  mainEntityOfPage: { "@id": `${siteUrl}${config.about}#profilepage` },
  sameAs: [
    "https://github.com/Fuzzyslippers412",
    "https://soundcloud.com/armel-tenkiang"
  ],
  knowsAbout: [
    "Distributed systems",
    "Local-first software",
    "Local language model inference",
    "Context engineering",
    "Evidence-grounded generation",
    "Durable data systems"
  ],
  knowsLanguage: ["English", "French", "Italian", "Portuguese"],
  inLanguage: lang
});

const articleSchema = (lang, config, article) => {
  const canonical = `${siteUrl}${config.route}`;
  const breadcrumbId = `${canonical}#breadcrumb`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${canonical}#article`,
        headline: article.title.split(" | ")[0],
        description: article.description,
        url: canonical,
        datePublished: expertise.published,
        dateModified: expertise.published,
        inLanguage: lang,
        author: { "@id": `${siteUrl}/#person` },
        publisher: { "@id": `${siteUrl}/#person` },
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
        about: [
          "Local language model inference",
          "Context engineering",
          "Evidence verification",
          "Local-first software"
        ]
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: article.title,
        description: article.description,
        inLanguage: lang,
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${canonical}#article` },
        breadcrumb: { "@id": breadcrumbId }
      },
      personNode(lang, config),
      {
        "@type": "BreadcrumbList",
        "@id": breadcrumbId,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}${config.home}` },
          { "@type": "ListItem", position: 2, name: config.nav[2], item: `${siteUrl}${config.research}` },
          { "@type": "ListItem", position: 3, name: "Galidima", item: canonical }
        ]
      }
    ]
  };
};

const renderArticle = (lang, locale) => {
  const config = localeConfig[lang];
  const article = locale.article;
  const canonical = `${siteUrl}${config.route}`;
  const languageLinks = Object.entries(routes)
    .map(([code, route]) => `    <link rel="alternate" hreflang="${code}" href="${siteUrl}${route}" />`)
    .concat(`    <link rel="alternate" hreflang="x-default" href="${siteUrl}${routes.it}" />`)
    .join("\n");
  const switchLinks = Object.entries(routes)
    .map(([code, route]) => `        <a${code === lang ? ' class="active" aria-current="page"' : ""} href="${route}" lang="${code}">${code.toUpperCase()}</a>`)
    .join("\n");
  const sections = article.sections.map((section) => `      <section class="page-section">
        <h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`).join("\n")}
${section.links?.length ? `        <p class="research-links">${section.links.map(([href, label]) => `<a class="card-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`).join("")}</p>\n` : ""}      </section>`).join("\n\n");
  const ogLocale = lang === "en" ? "en_US" : lang === "fr" ? "fr_FR" : lang === "pt" ? "pt_PT" : "it_IT";

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(article.title)}</title>
    <meta name="description" content="${escapeHtml(article.description)}" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Armel Tenkiang" />
    <meta name="theme-color" content="#f4f0e7" />
    <link rel="canonical" href="${canonical}" />
    <link rel="me" href="https://github.com/Fuzzyslippers412" />
    <link rel="me" href="https://soundcloud.com/armel-tenkiang" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="16x16 32x32" />
    <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
    <link rel="manifest" href="/site.webmanifest" />
${languageLinks}

    <meta property="og:title" content="${escapeHtml(article.title)}" />
    <meta property="og:description" content="${escapeHtml(article.description)}" />
    <meta property="og:locale" content="${ogLocale}" />
    <meta property="og:site_name" content="Armel Tenkiang" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Armel Tenkiang — systems, research, and software" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(article.title)}" />
    <meta name="twitter:description" content="${escapeHtml(article.description)}" />
    <meta name="twitter:image" content="${siteUrl}/og-image.png" />
    <meta name="twitter:image:alt" content="Armel Tenkiang — systems, research, and software" />

    <link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/style.css?v=30" />
    <script type="application/ld+json">
${JSON.stringify(articleSchema(lang, config, article), null, 2)}
    </script>
  </head>
  <body class="research-note-view">
    <a class="skip-link" href="#main-content">${escapeHtml(config.skipLabel)}</a>
    <header class="site-header">
      <a class="logo" href="${config.home}" aria-label="Armel Tenkiang — ${escapeHtml(config.nav[0])}">A</a>
      <nav class="nav" aria-label="Primary">
        <a href="${config.home}">${escapeHtml(config.nav[0])}</a>
        <a href="${config.projects}">${escapeHtml(config.nav[1])}</a>
        <a href="${config.research}" aria-current="location">${escapeHtml(config.nav[2])}</a>
        <a href="${config.updates}">${escapeHtml(config.nav[3])}</a>
        <a href="${config.about}">${escapeHtml(config.nav[4])}</a>
      </nav>
      <div class="lang-switch" aria-label="${escapeHtml(config.languageLabel)}">
${switchLinks}
      </div>
    </header>

    <main id="main-content" class="page research-note">
      <nav class="breadcrumbs" aria-label="${escapeHtml(config.breadcrumbLabel)}"><a href="${config.home}">Armel Tenkiang</a><span aria-hidden="true">/</span><a href="${config.research}">${escapeHtml(config.nav[2])}</a><span aria-hidden="true">/</span><span aria-current="page">Galidima</span></nav>
      <span class="eyebrow">${escapeHtml(article.eyebrow)}</span>
      <h1>${escapeHtml(article.heading)}</h1>
      <div class="page-meta">
${article.meta.map((item) => `        <span>${escapeHtml(item)}</span>`).join("\n")}
      </div>
      <p class="page-byline">${escapeHtml(article.byline)} <a href="${config.about}" rel="author">Armel Tenkiang</a>.</p>

${sections}
    </main>

    <footer class="site-footer">
      <div class="footer-signature">
        <a href="${config.home}">Armel Tenkiang</a>
        <span>${escapeHtml(config.footer)}</span>
      </div>
      <nav class="footer-nav" aria-label="Footer">
        <a href="${config.projects}">${escapeHtml(config.nav[1])}</a>
        <a href="${config.research}">${escapeHtml(config.nav[2])}</a>
        <a href="${config.updates}">${escapeHtml(config.nav[3])}</a>
        <a href="${config.about}">${escapeHtml(config.nav[4])}</a>
        <a href="https://github.com/Fuzzyslippers412" target="_blank" rel="noopener">GitHub</a>
      </nav>
      <p class="footer-meta">© 2026 Armel Tenkiang</p>
    </footer>
  </body>
</html>
`;
};

for (const [lang, locale] of Object.entries(expertise.locales)) {
  if (!localeConfig[lang]) throw new Error(`Unsupported expertise locale: ${lang}`);
  await writeEmbeddedSections(lang, locale);
  const config = localeConfig[lang];
  const directory = path.join(rootDir, config.route.replace(/^\//, ""));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), renderArticle(lang, locale), "utf8");
}

console.log(`Rendered Galidima expertise across ${Object.keys(expertise.locales).length} locales.`);
