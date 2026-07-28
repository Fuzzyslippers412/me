import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const projectData = JSON.parse(await fs.readFile(path.join(rootDir, "data/projects.json"), "utf8"));
const updateNotes = JSON.parse(await fs.readFile(path.join(rootDir, "data/update-notes.json"), "utf8"));
const latestUpdateDate = (updateNotes.items || [])
  .map((note) => note.date)
  .filter(Boolean)
  .sort()
  .at(-1);
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
    homeLabel: "Home"
  },
  en: {
    home: "/en/",
    about: "/en/about/",
    projects: "/en/projects/",
    jobTitle: "Computer scientist and researcher",
    description: "Computer scientist and researcher working on distributed systems, local-first software, and verification tools.",
    languageLabel: "Language",
    skipLabel: "Skip to content",
    homeLabel: "Home"
  },
  fr: {
    home: "/fr/",
    about: "/fr/about/",
    projects: "/fr/projects/",
    jobTitle: "Informaticien et chercheur",
    description: "Informaticien et chercheur travaillant sur les systèmes distribués, les logiciels local-first et les outils de vérification.",
    languageLabel: "Langue",
    skipLabel: "Aller au contenu",
    homeLabel: "Accueil"
  },
  pt: {
    home: "/pt/",
    about: "/pt/about/",
    projects: "/pt/projects/",
    jobTitle: "Cientista da computação e investigador",
    description: "Cientista da computação e investigador que trabalha em sistemas distribuídos, software local-first e ferramentas de verificação.",
    languageLabel: "Idioma",
    skipLabel: "Ir para o conteúdo",
    homeLabel: "Início"
  }
};

const projects = (projectData.projects || []).map((project) => [project.name, project.slug]);

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

const personNode = (config) => ({
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: "Armel Tenkiang",
  url: `${siteUrl}/`,
  jobTitle: config.jobTitle,
  description: config.description,
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
  ]
});

const homeSchema = (lang) => {
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
        ...(latestUpdateDate ? { dateModified: latestUpdateDate } : {}),
        ...(profileActivity.length ? { hasPart: profileActivity } : {})
      },
      personNode(config),
      {
        "@type": "BreadcrumbList",
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
        mainEntity: { "@id": `${canonical}#projects` }
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
      }
    ]
  };
};

const updatesSchema = (canonical, title, description) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${canonical}#updates`,
  url: canonical,
  name: title,
  description,
  inLanguage: "en",
  isPartOf: { "@id": `${siteUrl}/#website` },
  author: { "@id": `${siteUrl}/#person` },
  hasPart: profileActivity
});

const schemaForRoute = (route, lang, html) => {
  const config = localeConfig[lang] || localeConfig.en;
  const canonical = getCanonical(html);
  const title = getTitle(html);
  if (route === config.home) return homeSchema(lang);
  if (route === config.about) return aboutSchema(lang, canonical, title);
  if (route === config.projects) return projectsSchema(lang, canonical, title);
  if (route === "/updates/") return updatesSchema(canonical, title, getMeta(html, "description"));
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

const enhance = async (file) => {
  let html = await fs.readFile(file, "utf8");
  const original = html;
  const route = getRoute(file);
  const lang = getLang(html);
  const config = localeConfig[lang] || localeConfig.en;
  const isRedirect = /http-equiv="refresh"/i.test(html);

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
    `${fontPreload}\n    <link rel="stylesheet" href="/style.css?v=24" />`
  );

  html = html.replace(/\/style\.css\?v=\d+/g, "/style.css?v=24");
  html = html.replace(/<(?:div|a) class="logo"[^>]*>(?:A|AT)<\/(?:div|a)>/g, `<a class="logo" href="${config.home}" aria-label="Armel Tenkiang — ${config.homeLabel}">A</a>`);
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

  const schema = schemaForRoute(route, lang, html);
  const replaceExisting = [config.home, config.about, config.projects, "/updates/"].includes(route);
  html = injectSchema(html, schema, replaceExisting);

  if (html !== original) await fs.writeFile(file, html, "utf8");
};

const files = await walkHtml(rootDir);
await Promise.all(files.map(enhance));
console.log(`Enhanced ${files.length} HTML files.`);
