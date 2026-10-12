const labels = {
  it: { menu: "Menù", on: "Animazione attiva", off: "Animazione disattivata", reduced: "Movimento ridotto" },
  en: { menu: "Menu", on: "Motion on", off: "Motion off", reduced: "Reduced motion" },
  fr: { menu: "Menu", on: "Animation activée", off: "Animation désactivée", reduced: "Mouvements réduits" },
  pt: { menu: "Menu", on: "Animação ativada", off: "Animação desativada", reduced: "Movimento reduzido" }
};
const languageNames = { it: "Italiano", en: "English", fr: "Français", pt: "Português" };

export function riverSegment() {
  const path = "M12 0C12 42 3 48 3 83S21 126 21 164 12 205 12 240";
  return `<svg class="river-thread" viewBox="0 0 24 240" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><path class="river-bank" d="${path}"/><path class="river-current" d="${path}"/></svg>`;
}

export function frenchTypography(html) {
  // Only visible text nodes: never rewrite JSON-LD, URLs, code or attributes.
  return html.split(/(<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<pre\b[\s\S]*?<\/pre>|<code\b[\s\S]*?<\/code>|<[^>]+>)/gi)
    .map((part) => part.startsWith("<") ? part : part.replace(/(?: |&#8239;)([;:!?])/g, "\u202f$1"))
    .join("");
}

export function resetRiverPresentation(html) {
  return html.replace(/\s*<!-- river:[^:]+:start -->[\s\S]*?<!-- river:[^:]+:end -->/g, "")
    .replace(/\s*<svg class="river-thread"[\s\S]*?<\/svg>/g, "")
    .replace(/ data-river-section(?:="[^"]*")?/g, "");
}

export function enhanceRiverPresentation(html, lang) {
  const text = labels[lang] || labels.en;
  html = resetRiverPresentation(html);
  const nav = html.match(/<nav class="nav"[^>]*>[\s\S]*?<\/nav>/)?.[0];
  if (nav) {
    const menu = `<details class="mobile-menu"><summary>${text.menu}<span aria-hidden="true">+</span></summary>${nav.replace('class="nav"', 'class="mobile-nav"')}</details>`;
    html = html.replace(/^[ \t]*<nav class="nav"[^>]*>[\s\S]*?<\/nav>/m, `      <!-- river:menu:start -->\n${menu}\n<!-- river:menu:end -->\n      ${nav}`);
  }
  html = html.replace(/<div class="lang-switch"[^>]*>[\s\S]*?<\/div>/g, (switcher) => switcher.replace(/<a\b([^>]*)>([^<]+)<\/a>/g, (anchor, attributes, abbreviation) => {
    const language = attributes.match(/\blang="([^"]+)"/)?.[1];
    const name = languageNames[language];
    if (!name) return anchor;
    const clean = attributes.replace(/\s(?:aria-label|title|hreflang)="[^"]*"/g, "");
    return `<a${clean} hreflang="${language}" aria-label="${name} (${abbreviation})" title="${name}">${abbreviation}</a>`;
  }));
  html = html.replace(/<section class="(introduction|selected-work|research-interlude|updates|listening|personal-end|page-section[^\"]*)"([^>]*)>/g,
    (match, name, attributes) => `<section class="${name}"${attributes} data-river-section>\n        ${riverSegment()}`);
  const control = `<div class="motion-preferences"><button class="motion-toggle" type="button" aria-pressed="false" data-motion-on="${text.on}" data-motion-off="${text.off}" data-motion-reduced="${text.reduced}" hidden>${text.off}</button></div>`;
  html = html.replace(/\s*<\/main>/, `\n<!-- river:control:start -->\n${control}\n<!-- river:control:end -->\n    </main>`);
  html = html.replace(/\s*<\/body>/, '\n<!-- river:script:start -->\n    <script src="/scripts/river.js?v=1" defer></script>\n<!-- river:script:end -->\n  </body>');
  return lang === "fr" ? frenchTypography(html) : html;
}
