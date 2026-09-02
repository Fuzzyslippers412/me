import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";
const notesPath = path.join(rootDir, "data/update-notes.json");

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const safeExternalUrl = (value) => {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error(`Unsupported source URL: ${value}`);
  return url.href;
};

const formatDate = (value) => new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC"
}).format(new Date(value));

const renderPage = (note) => {
  const canonical = `${siteUrl}/updates/${note.slug}/`;
  const projectUrl = `${siteUrl}/en/projects/${note.project_slug}/`;
  const sourceUrl = safeExternalUrl(note.source_url);
  const date = new Date(note.date);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date for ${note.slug}`);
  const dateOnly = date.toISOString().slice(0, 10);
  const modified = new Date(note.modified || note.date);
  if (Number.isNaN(modified.getTime())) throw new Error(`Invalid modified date for ${note.slug}`);
  const modifiedOnly = modified.toISOString().slice(0, 10);
  const modifiedMeta = modifiedOnly !== dateOnly
    ? `        <span>Updated ${escapeHtml(formatDate(note.modified))}</span>`
    : "";
  const documentTitle = note.seo_title || `${note.title} — ${note.source} | Armel Tenkiang`;
  const technicalParagraphs = (note.technical_sections || [])
    .flatMap((section) => section.paragraphs || []);
  const articleBody = [
    note.summary,
    ...(note.details || []),
    ...technicalParagraphs,
    note.engineering_note
  ]
    .filter(Boolean)
    .join("\n\n");
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${canonical}#article`,
        headline: note.title,
        description: note.summary,
        datePublished: note.date,
        dateModified: note.modified || note.date,
        inLanguage: "en",
        articleSection: "Programming Updates",
        articleBody,
        wordCount: articleBody.split(/\s+/).filter(Boolean).length,
        isAccessibleForFree: true,
        creativeWorkStatus: note.historical ? "Archived" : "Published",
        mainEntityOfPage: { "@id": `${canonical}#webpage` },
        url: canonical,
        author: {
          "@type": "Person",
          "@id": `${siteUrl}/#person`,
          name: "Armel Tenkiang",
          url: `${siteUrl}/en/about/`
        },
        isPartOf: { "@id": `${siteUrl}/updates/#updates` },
        about: {
          "@type": "SoftwareApplication",
          name: note.source,
          url: projectUrl
        },
        citation: sourceUrl
      },
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        url: canonical,
        name: documentTitle,
        inLanguage: "en",
        isPartOf: { "@id": `${siteUrl}/#website` },
        breadcrumb: { "@id": `${canonical}#breadcrumb` }
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonical}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Armel Tenkiang", item: `${siteUrl}/en/` },
          { "@type": "ListItem", position: 2, name: "Programming Updates", item: `${siteUrl}/updates/` },
          { "@type": "ListItem", position: 3, name: note.title, item: canonical }
        ]
      }
    ]
  };
  const detailParagraphs = note.details.map((detail) => `        <p>${escapeHtml(detail)}</p>`).join("\n");
  const technicalSections = (note.technical_sections || []).map((section) => `        <section class="page-section update-technical-section">
          <h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((paragraph) => `          <p>${escapeHtml(paragraph)}</p>`).join("\n")}
        </section>`).join("\n");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(documentTitle)}</title>
    <meta name="description" content="${escapeHtml(note.summary)}" />
    <meta name="robots" content="index, follow" />
    <meta name="author" content="Armel Tenkiang" />
    <meta name="theme-color" content="#f4f0e7" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="icon" href="/favicon.ico" sizes="16x16 32x32" />
    <link rel="icon" href="/favicon-48.png" type="image/png" sizes="48x48" />
    <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <link rel="canonical" href="${canonical}" />
    <link rel="me" href="https://github.com/Fuzzyslippers412" />
    <link rel="me" href="https://soundcloud.com/armel-tenkiang" />
    <link rel="alternate" type="application/atom+xml" title="Armel Tenkiang — Technical Notes" href="/feed.xml" />

    <meta property="og:title" content="${escapeHtml(documentTitle)}" />
    <meta property="og:description" content="${escapeHtml(note.summary)}" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content="Armel Tenkiang" />
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Armel Tenkiang — systems, research, and software" />
    <meta property="article:published_time" content="${escapeHtml(note.date)}" />
    <meta property="article:modified_time" content="${escapeHtml(note.modified || note.date)}" />
    <meta property="article:author" content="${siteUrl}/en/about/" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(documentTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(note.summary)}" />
    <meta name="twitter:image" content="${siteUrl}/og-image.png" />
    <meta name="twitter:image:alt" content="Armel Tenkiang — systems, research, and software" />

    <link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/style.css?v=30" />
    <script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
    </script>
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <div class="bg">
      <div class="orb orb-a"></div>
      <div class="orb orb-b"></div>
      <div class="grid"></div>
    </div>

    <header class="site-header">
      <a class="logo" href="/en/" aria-label="Armel Tenkiang — Home">A</a>
      <nav class="nav">
        <a href="/en/">Home</a>
        <a href="/en/projects/">Projects</a>
        <a href="/en/research/">Research</a>
        <a href="/updates/" aria-current="page">Updates</a>
        <a href="/en/about/">About</a>
      </nav>
    </header>

    <main id="main-content" class="page update-note">
      <span class="eyebrow">${note.historical ? "Historical architecture note" : "Programming update"}</span>
      <h1>${escapeHtml(note.title)}</h1>
      <div class="page-meta">
        <time datetime="${dateOnly}">${escapeHtml(formatDate(note.date))}</time>
${modifiedMeta}
        <span>${escapeHtml(note.source)}</span>
        <span>Verified change ${escapeHtml(note.verified_commit)}</span>
${note.historical ? "        <span>Archived branch</span>" : ""}
      </div>
      <p class="page-byline">Technical note by <a href="/en/about/" rel="author">Armel Tenkiang</a>.</p>

      <article>
        <section class="page-section update-summary">
          <p>${escapeHtml(note.summary)}</p>
        </section>
        <section class="page-section">
          <h2>What changed</h2>
${detailParagraphs}
        </section>
${technicalSections ? `${technicalSections}\n` : ""}
${note.engineering_note ? `        <section class="page-section update-engineering-note">
          <h2>Engineering note</h2>
          <p>${escapeHtml(note.engineering_note)}</p>
        </section>
` : ""}        <section class="page-section update-provenance">
          <h2>Provenance</h2>
          <p>${note.historical
            ? `This note is based on verified source from the archived pre-rebuild branch at commit <code>${escapeHtml(note.verified_commit)}</code>. It is retained as engineering history and does not describe the current product.`
            : `This note is based on verified project source at commit <code>${escapeHtml(note.verified_commit)}</code>. It records a programming change, not a personal-status update.`}</p>
          <div class="cta">
            <a class="button" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">${escapeHtml(note.source_label)}</a>
            <a class="link" href="/en/projects/${escapeHtml(note.project_slug)}/">Project note</a>
            <a class="link" href="/updates/">All updates</a>
          </div>
        </section>
      </article>
    </main>

    <footer class="site-footer">
      <p>Armel Tenkiang — systems, research, and project notes.</p>
      <p>© 2026 Armel Tenkiang. All rights reserved.</p>
    </footer>
  </body>
</html>
`;
};

const data = JSON.parse(await fs.readFile(notesPath, "utf8"));
const items = data.items || [];
const slugs = new Set();

for (const note of items) {
  if (!/^[a-z0-9-]+$/.test(note.slug)) throw new Error(`Invalid update slug: ${note.slug}`);
  if (slugs.has(note.slug)) throw new Error(`Duplicate update slug: ${note.slug}`);
  if (!Array.isArray(note.details) || note.details.length < 2) throw new Error(`Update ${note.slug} needs detail paragraphs`);
  for (const section of note.technical_sections || []) {
    if (!section.heading || !Array.isArray(section.paragraphs) || section.paragraphs.length < 2) {
      throw new Error(`Update ${note.slug} has an incomplete technical section`);
    }
  }
  slugs.add(note.slug);
  const directory = path.join(rootDir, "updates", note.slug);
  await fs.mkdir(directory, { recursive: true });
  await writeFileAtomically(path.join(directory, "index.html"), renderPage(note), "utf8");
}

console.log(`Wrote ${items.length} permanent programming-update pages.`);
