import { languages, localizedPath, origin, escapeHtml as e } from "./editorial-content.mjs";

export function pageShell({ lang, route, title, description, main, schema }) {
  const url = origin + localizedPath(lang, route);
  const alternates = [...languages, "x-default"].map((code) => `<link rel="alternate" hreflang="${code}" href="${origin}${localizedPath(code === "x-default" ? "it" : code, route)}" />`).join("\n    ");
  const switcher = languages.map((code) => `<a${code === lang ? ' class="active"' : ""} href="${origin}${localizedPath(code, route)}" lang="${code}">${code.toUpperCase()}</a>`).join("\n        ");
  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${e(title)}</title>
    <meta name="description" content="${e(description)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <link rel="canonical" href="${url}" />
    ${alternates}
    <meta property="og:type" content="article" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${e(title)}" />
    <meta property="og:description" content="${e(description)}" />
    <meta property="og:locale" content="${{ it: "it_IT", en: "en_US", fr: "fr_FR", pt: "pt_PT" }[lang]}" />
    <meta property="og:image" content="${origin}/og-image.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${e(title)}" />
    <meta name="twitter:description" content="${e(description)}" />
    <link rel="stylesheet" href="/style.css?v=42" />
${schema ? `    <script type="application/ld+json">\n${JSON.stringify(schema, null, 2).replaceAll("<", "\\u003c")}\n    </script>` : ""}
  </head>
  <body>
    <header class="site-header">
      <a class="logo" href="${localizedPath(lang, "/")}">AT</a>
      <nav class="nav">
      </nav>
      <div class="lang-switch">
        ${switcher}
      </div>
    </header>
    <main id="main-content" class="page">
      ${main}
    </main>
    <footer class="site-footer">
    </footer>
  </body>
</html>
`;
}
