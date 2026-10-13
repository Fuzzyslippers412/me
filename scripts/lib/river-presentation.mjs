const labels = {
  it: { menu: "Menù", label: "Flusso", on: "Animazione attiva", off: "Animazione disattivata", reduced: "Movimento ridotto" },
  en: { menu: "Menu", label: "Flow", on: "Motion on", off: "Motion off", reduced: "Reduced motion" },
  fr: { menu: "Menu", label: "Courant", on: "Animation activée", off: "Animation désactivée", reduced: "Mouvements réduits" },
  pt: { menu: "Menu", label: "Fluxo", on: "Animação ativada", off: "Animação desativada", reduced: "Movimento reduzido" }
};
const languageNames = { it: "Italiano", en: "English", fr: "Français", pt: "Português" };

export function riverSegment(kind = "article") {
  const bends = { source: [78, 23], work: [24, 72], research: [62, 37], updates: [33, 68], listening: [75, 31], ending: [38, 57], article: [36, 64] };
  const [a, b] = bends[kind] || bends.article;
  const curve = (offset) => `M${50 + offset} 0C${50 + offset} 60 ${a + offset} 70 ${a + offset} 120S${b + offset} 190 ${b + offset} 240 ${50 + offset} 300 ${50 + offset} 360`;
  return `<svg class="river-thread" data-river-kind="${kind}" viewBox="0 0 100 360" preserveAspectRatio="none" fill="none" aria-hidden="true" focusable="false"><g class="river-atmosphere"><path class="river-wash" d="${curve(0)}"/></g><path class="river-bank river-bank-far" d="${curve(-7)}"/><path class="river-bank river-bank-near" d="${curve(0)}"/><path class="river-bank river-bank-fine" d="${curve(7)}"/><path class="river-current river-current-main" d="${curve(0)}"/><path class="river-current river-current-echo" d="${curve(7)}"/></svg>`;
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
  const kinds = { introduction: "source", "selected-work": "work", "research-interlude": "research", updates: "updates", listening: "listening", "personal-end": "ending" };
  html = html.replace(/<section class="(introduction|selected-work|research-interlude|updates|listening|personal-end|page-section[^\"]*)"([^>]*)>/g,
    (match, name, attributes) => `<section class="${name}"${attributes} data-river-section>\n        ${riverSegment(kinds[name] || "article")}`);
  const control = `<div class="motion-preferences"><button class="motion-toggle" type="button" aria-pressed="false" aria-label="${text.label}: ${text.off}" data-motion-label="${text.label}" data-motion-on="${text.on}" data-motion-off="${text.off}" data-motion-reduced="${text.reduced}" hidden>${text.label}</button></div>`;
  html = html.replace(/\s*<\/header>/, `\n<!-- river:control:start -->\n${control}\n<!-- river:control:end -->\n    </header>`);
  html = html.replace(/\s*<\/body>/, '\n<!-- river:script:start -->\n    <script src="/scripts/river.js?v=3" defer></script>\n<!-- river:script:end -->\n  </body>');
  return lang === "fr" ? frenchTypography(html) : html;
}
