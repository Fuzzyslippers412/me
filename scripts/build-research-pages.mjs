import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteUrl = "https://armeltenkiang.com";

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

const locales = {
  it: {
    route: "/research/",
    home: "/",
    projects: "/projects/",
    updates: "/it/updates/",
    about: "/about/",
    title: "Ricerca — Armel Tenkiang",
    description: "Ricerca applicata di Armel Tenkiang su sistemi local-first, stato privato verificabile, contesto vincolato per LLM e registri append-only.",
    eyebrow: "Ricerca applicata",
    heading: "Ricerca",
    meta: ["Sistemi distribuiti", "Privacy", "Ragionamento automatico"],
    sections: [
      {
        heading: "Ambito",
        paragraphs: ["La mia ricerca riguarda sistemi che devono rimanere comprensibili quando lo stato è distribuito, la connettività è intermittente o le decisioni automatizzate sono difficili da ispezionare. È un lavoro applicato: ogni area è legata a software che sto costruendo."]
      },
      {
        heading: "Stato local-first e recupero",
        paragraphs: ["Studio come mantenere un'applicazione utile offline, integrare modifiche ritardate senza nascondere i conflitti e conservare una cronologia leggibile da chi la usa.", "Gli strumenti principali sono CRDT, registri append-only, identificatori deterministici e percorsi di recupero che non dipendono dalla disponibilità permanente di un servizio."],
        links: [["/projects/mycasapro/", "MyCasaPro"], ["/projects/au-jour-le-jour/", "Au Jour Le Jour"], ["/projects/theo-farm/", "Theo.farm"]]
      },
      {
        heading: "Stato privato e verifica selettiva",
        paragraphs: ["Le prove a conoscenza zero e il settlement privato servono quando un sistema deve dimostrare che una condizione è stata soddisfatta senza esporre l'intero stato sottostante.", "Il lavoro attuale considera collegamenti di pagamento, divulgazione selettiva e registri di audit verificabili senza trasformare la privacy in opacità."],
        links: [["/projects/ghostprotocol/", "GhostProtocol"], ["/research/galidima/", "Galidima"]]
      },
      {
        heading: "Contesto vincolato per LLM",
        paragraphs: ["Il comportamento di un modello dipende da ciò che entra nel contesto, da ciò che viene escluso e da come la memoria viene compressa.", "Esploro vincoli, confini di retrieval, provenienza e memoria controllabile per flussi in cui una risposta non supportata costa più di un rifiuto esplicito."],
        links: [["/projects/chattypatty/", "ChattyPatty"], ["/research/galidima/", "Galidima"]]
      },
      {
        heading: "Inferenza locale ed evidenza",
        paragraphs: ["Un modello locale è utile solo se il sistema circostante controlla contesto, memoria, fonti e modalità di guasto.", "In Galidima, la cronologia ha budget espliciti, gli strumenti deterministici gestiscono calcoli e dati finanziari e le risposte contestate non vengono riutilizzate come fatti."],
        links: [["/research/galidima/", "Galidima"]]
      },
      {
        heading: "Evidenza che cambia",
        paragraphs: ["Le analisi pubbliche e i sistemi operativi devono incorporare nuove prove senza riscrivere la storia. Mi interessano registri sensibili alle revisioni, variazioni di confidenza e code di revisione che separano le prove proposte dalle affermazioni pubblicate."],
        links: [["/projects/respometer/", "Respometer"], ["/projects/soundcheck-ai/", "Soundcheck.AI"], ["/projects/liga-do-povo/", "Liga do Povo"]]
      },
      {
        heading: "Metodo",
        paragraphs: ["Il metodo comune è definire prima gli invarianti, rendere visibile l'incertezza, conservare le fonti e verificare le modalità degradate oltre al percorso ideale."],
        links: [["/it/updates/", "Note di programmazione"], ["https://github.com/Fuzzyslippers412", "GitHub"]]
      }
    ],
    nav: ["Home", "Progetti", "Ricerca", "Aggiornamenti", "Profilo"],
    footer: "Armel Tenkiang — sistemi, ricerca e note di progetto."
  },
  en: {
    route: "/en/research/",
    home: "/en/",
    projects: "/en/projects/",
    updates: "/updates/",
    about: "/en/about/",
    title: "Research — Armel Tenkiang",
    description: "Applied research by Armel Tenkiang on local-first systems, verifiable private state, bounded LLM context, and append-only coordination.",
    eyebrow: "Applied research",
    heading: "Research",
    meta: ["Distributed systems", "Privacy", "Machine reasoning"],
    sections: [
      {
        heading: "Scope",
        paragraphs: ["My research concerns systems that must remain understandable when state is distributed, connectivity is unreliable, or automated decisions are difficult to inspect. The work is practical: each area is tied to software I am building."]
      },
      {
        heading: "Local-first state and recovery",
        paragraphs: ["I study how an application can remain useful offline, merge delayed changes without hiding conflicts, and preserve an operator-readable history.", "The main tools are CRDTs, append-only event records, deterministic identifiers, and recovery paths that do not depend on a service remaining available."],
        links: [["/en/projects/mycasapro/", "MyCasaPro"], ["/en/projects/au-jour-le-jour/", "Au Jour Le Jour"], ["/en/projects/theo-farm/", "Theo.farm"]]
      },
      {
        heading: "Private state and selective verification",
        paragraphs: ["Zero-knowledge proofs and private settlement are useful when a system needs to establish that a condition was met without exposing the complete underlying state.", "Current work considers payment linkage, selective disclosure, and audit records whose claims can be checked without turning privacy into opacity."],
        links: [["/en/projects/ghostprotocol/", "GhostProtocol"], ["/en/research/galidima/", "Galidima"]]
      },
      {
        heading: "Bounded context for LLM systems",
        paragraphs: ["A model's behaviour depends on what enters context, what is excluded, and how memory is compressed.", "I am exploring constraint design, retrieval boundaries, provenance, and controllable memory for workflows where unsupported output is more costly than an explicit refusal."],
        links: [["/en/projects/chattypatty/", "ChattyPatty"], ["/en/research/galidima/", "Galidima"]]
      },
      {
        heading: "Local inference and evidence",
        paragraphs: ["A local model is useful only when the surrounding system controls context, memory, sources, and failure modes.", "In Galidima, recent history has explicit budgets, deterministic tools handle calculations and financial data, and contested answers are not reused as facts."],
        links: [["/en/research/galidima/", "Galidima"]]
      },
      {
        heading: "Verification under changing evidence",
        paragraphs: ["Public analyses and operational systems need to absorb new evidence without rewriting history. I am interested in revision-aware records, confidence changes, and review queues that separate proposed evidence from published claims."],
        links: [["/en/projects/respometer/", "Respometer"], ["/en/projects/soundcheck-ai/", "Soundcheck.AI"], ["/en/projects/liga-do-povo/", "Liga do Povo"]]
      },
      {
        heading: "Method",
        paragraphs: ["The common method is to define invariants first, expose uncertainty, preserve source evidence, and test degraded modes rather than only the happy path."],
        links: [["/updates/", "Programming notes"], ["https://github.com/Fuzzyslippers412", "GitHub"]]
      }
    ],
    nav: ["Home", "Projects", "Research", "Updates", "About"],
    footer: "Armel Tenkiang — systems, research, and project notes."
  },
  fr: {
    route: "/fr/research/",
    home: "/fr/",
    projects: "/fr/projects/",
    updates: "/fr/updates/",
    about: "/fr/about/",
    title: "Recherche — Armel Tenkiang",
    description: "Recherche appliquée d’Armel Tenkiang sur les systèmes local-first, l’état privé vérifiable, le contexte LLM contraint et les journaux append-only.",
    eyebrow: "Recherche appliquée",
    heading: "Recherche",
    meta: ["Systèmes distribués", "Vie privée", "Raisonnement automatique"],
    sections: [
      {
        heading: "Périmètre",
        paragraphs: ["Ma recherche porte sur des systèmes qui doivent rester compréhensibles lorsque l’état est distribué, la connexion intermittente ou les décisions automatisées difficiles à inspecter. Elle reste appliquée : chaque axe est lié à un logiciel que je construis."]
      },
      {
        heading: "État local-first et reprise",
        paragraphs: ["J’étudie comment une application peut rester utile hors ligne, intégrer des modifications différées sans masquer les conflits et conserver un historique lisible par l’opérateur.", "Les principaux outils sont les CRDT, les journaux d’événements append-only, les identifiants déterministes et les procédures de reprise qui ne dépendent pas de la disponibilité permanente d’un service."],
        links: [["/fr/projects/mycasapro/", "MyCasaPro"], ["/fr/projects/au-jour-le-jour/", "Au Jour Le Jour"], ["/fr/projects/theo-farm/", "Theo.farm"]]
      },
      {
        heading: "État privé et vérification sélective",
        paragraphs: ["Les preuves à divulgation nulle de connaissance et le règlement privé sont utiles lorsqu’un système doit établir qu’une condition est remplie sans exposer tout l’état sous-jacent.", "Le travail actuel concerne les liens de paiement, la divulgation sélective et des journaux d’audit vérifiables sans transformer la confidentialité en opacité."],
        links: [["/fr/projects/ghostprotocol/", "GhostProtocol"], ["/fr/research/galidima/", "Galidima"]]
      },
      {
        heading: "Contexte contraint pour les LLM",
        paragraphs: ["Le comportement d’un modèle dépend de ce qui entre dans le contexte, de ce qui en est exclu et de la manière dont la mémoire est compressée.", "J’explore la conception de contraintes, les limites de récupération, la provenance et la mémoire contrôlable pour les flux où une sortie non étayée coûte plus qu’un refus explicite."],
        links: [["/fr/projects/chattypatty/", "ChattyPatty"], ["/fr/research/galidima/", "Galidima"]]
      },
      {
        heading: "Inférence locale et preuves",
        paragraphs: ["Un modèle local n’est utile que si le système qui l’entoure contrôle le contexte, la mémoire, les sources et les modes de panne.", "Dans Galidima, l’historique possède des budgets explicites, les outils déterministes traitent les calculs et les données financières, et les réponses contestées ne sont pas réutilisées comme des faits."],
        links: [["/fr/research/galidima/", "Galidima"]]
      },
      {
        heading: "Vérification face aux preuves changeantes",
        paragraphs: ["Les analyses publiques et les systèmes opérationnels doivent intégrer de nouvelles preuves sans réécrire l’historique. Je m’intéresse aux enregistrements sensibles aux révisions, aux variations de confiance et aux files de revue qui séparent les preuves proposées des affirmations publiées."],
        links: [["/fr/projects/respometer/", "Respometer"], ["/fr/projects/soundcheck-ai/", "Soundcheck.AI"], ["/fr/projects/liga-do-povo/", "Liga do Povo"]]
      },
      {
        heading: "Méthode",
        paragraphs: ["La méthode commune consiste à définir d’abord les invariants, rendre l’incertitude visible, conserver les sources et tester les modes dégradés plutôt que le seul parcours idéal."],
        links: [["/fr/updates/", "Notes de programmation"], ["https://github.com/Fuzzyslippers412", "GitHub"]]
      }
    ],
    nav: ["Accueil", "Projets", "Recherche", "Notes", "Profil"],
    footer: "Armel Tenkiang — systèmes, recherche et notes de projet."
  },
  pt: {
    route: "/pt/research/",
    home: "/pt/",
    projects: "/pt/projects/",
    updates: "/pt/updates/",
    about: "/pt/about/",
    title: "Investigação — Armel Tenkiang",
    description: "Investigação aplicada de Armel Tenkiang sobre sistemas local-first, estado privado verificável, contexto LLM limitado e registos append-only.",
    eyebrow: "Investigação aplicada",
    heading: "Investigação",
    meta: ["Sistemas distribuídos", "Privacidade", "Raciocínio automático"],
    sections: [
      {
        heading: "Âmbito",
        paragraphs: ["A minha investigação trata de sistemas que devem continuar compreensíveis quando o estado é distribuído, a ligação é intermitente ou as decisões automatizadas são difíceis de inspecionar. É trabalho aplicado: cada área está ligada a software que estou a construir."]
      },
      {
        heading: "Estado local-first e recuperação",
        paragraphs: ["Estudo como uma aplicação pode continuar útil offline, integrar alterações atrasadas sem esconder conflitos e preservar um histórico legível pelo operador.", "As ferramentas principais são CRDTs, registos de eventos append-only, identificadores determinísticos e percursos de recuperação que não dependem da disponibilidade permanente de um serviço."],
        links: [["/pt/projects/mycasapro/", "MyCasaPro"], ["/pt/projects/au-jour-le-jour/", "Au Jour Le Jour"], ["/pt/projects/theo-farm/", "Theo.farm"]]
      },
      {
        heading: "Estado privado e verificação seletiva",
        paragraphs: ["As provas de conhecimento zero e a liquidação privada são úteis quando um sistema precisa de demonstrar que uma condição foi cumprida sem expor todo o estado subjacente.", "O trabalho atual considera ligações de pagamento, divulgação seletiva e registos de auditoria verificáveis sem transformar privacidade em opacidade."],
        links: [["/pt/projects/ghostprotocol/", "GhostProtocol"], ["/pt/research/galidima/", "Galidima"]]
      },
      {
        heading: "Contexto limitado para sistemas LLM",
        paragraphs: ["O comportamento de um modelo depende do que entra no contexto, do que é excluído e de como a memória é comprimida.", "Exploro desenho de restrições, limites de recuperação, proveniência e memória controlável para fluxos em que uma saída sem suporte custa mais do que uma recusa explícita."],
        links: [["/pt/projects/chattypatty/", "ChattyPatty"], ["/pt/research/galidima/", "Galidima"]]
      },
      {
        heading: "Inferência local e evidência",
        paragraphs: ["Um modelo local só é útil quando o sistema envolvente controla contexto, memória, fontes e modos de falha.", "Em Galidima, o histórico tem limites explícitos, ferramentas determinísticas tratam cálculos e dados financeiros, e respostas contestadas não são reutilizadas como factos."],
        links: [["/pt/research/galidima/", "Galidima"]]
      },
      {
        heading: "Verificação com provas em mudança",
        paragraphs: ["As análises públicas e os sistemas operacionais precisam de absorver novas provas sem reescrever o histórico. Interesso-me por registos sensíveis a revisões, alterações de confiança e filas de revisão que separam provas propostas de afirmações publicadas."],
        links: [["/pt/projects/respometer/", "Respometer"], ["/pt/projects/soundcheck-ai/", "Soundcheck.AI"], ["/pt/projects/liga-do-povo/", "Liga do Povo"]]
      },
      {
        heading: "Método",
        paragraphs: ["O método comum é definir primeiro os invariantes, tornar a incerteza visível, preservar as fontes e testar modos degradados em vez de apenas o percurso ideal."],
        links: [["/pt/updates/", "Notas de programação"], ["https://github.com/Fuzzyslippers412", "GitHub"]]
      }
    ],
    nav: ["Início", "Projetos", "Investigação", "Atualizações", "Perfil"],
    footer: "Armel Tenkiang — sistemas, investigação e notas de projeto."
  }
};

const alternates = {
  en: `${siteUrl}/en/research/`,
  fr: `${siteUrl}/fr/research/`,
  pt: `${siteUrl}/pt/research/`,
  it: `${siteUrl}/research/`,
  "x-default": `${siteUrl}/research/`
};

const renderLinks = (links = []) => links.length
  ? `        <p class="research-links">${links.map(([href, label]) => {
      const external = href.startsWith("http");
      return `<a class="card-link" href="${escapeHtml(href)}"${external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(label)}</a>`;
    }).join("")}</p>\n`
  : "";

const renderPage = (lang, page) => {
  const canonical = `${siteUrl}${page.route}`;
  const languageLinks = Object.entries(alternates)
    .map(([code, href]) => `    <link rel="alternate" hreflang="${code}" href="${href}" />`)
    .join("\n");
  const switchLinks = Object.entries({ en: "/en/research/", fr: "/fr/research/", pt: "/pt/research/", it: "/research/" })
    .map(([code, href]) => `    <a${code === lang ? ' class="active" aria-current="page"' : ""} href="${href}" lang="${code}">${code.toUpperCase()}</a>`)
    .join("\n");
  const sections = page.sections.map((section) => `      <section class="page-section">
        <h2>${escapeHtml(section.heading)}</h2>
${section.paragraphs.map((paragraph) => `        <p>${escapeHtml(paragraph)}</p>`).join("\n")}
${renderLinks(section.links)}      </section>`).join("\n\n");

  return `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
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

    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:locale" content="${lang === "en" ? "en_US" : lang === "fr" ? "fr_FR" : lang === "pt" ? "pt_PT" : "it_IT"}" />
    <meta property="og:site_name" content="Armel Tenkiang" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${siteUrl}/og-image.png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Armel Tenkiang — systems, research, and software" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(page.title)}" />
    <meta name="twitter:description" content="${escapeHtml(page.description)}" />
    <meta name="twitter:image" content="${siteUrl}/og-image.png" />
    <meta name="twitter:image:alt" content="Armel Tenkiang — systems, research, and software" />

    <link rel="preload" href="/fonts/hanken-grotesk-latin.woff2" as="font" type="font/woff2" crossorigin />
    <link rel="stylesheet" href="/style.css?v=30" />
  </head>
  <body>
    <a class="skip-link" href="#main-content">Skip to content</a>
    <header class="site-header">
      <a class="logo" href="${page.home}" aria-label="Armel Tenkiang — Home">A</a>
      <nav class="nav" aria-label="Primary">
        <a href="${page.home}">${escapeHtml(page.nav[0])}</a>
        <a href="${page.projects}">${escapeHtml(page.nav[1])}</a>
        <a href="${page.route}" aria-current="page">${escapeHtml(page.nav[2])}</a>
        <a href="${page.updates}">${escapeHtml(page.nav[3])}</a>
        <a href="${page.about}">${escapeHtml(page.nav[4])}</a>
      </nav>
      <div class="lang-switch" aria-label="Language">
${switchLinks}
      </div>
    </header>

    <main id="main-content" class="page research-page">
      <span class="eyebrow">${escapeHtml(page.eyebrow)}</span>
      <h1>${escapeHtml(page.heading)}</h1>
      <div class="page-meta">
${page.meta.map((item) => `        <span>${escapeHtml(item)}</span>`).join("\n")}
      </div>

${sections}
    </main>

    <footer class="site-footer">
      <p>${escapeHtml(page.footer)}</p>
      <p>© 2026 Armel Tenkiang. All rights reserved.</p>
    </footer>
  </body>
</html>
`;
};

for (const [lang, page] of Object.entries(locales)) {
  const directory = path.join(rootDir, page.route.replace(/^\//, ""));
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, "index.html"), renderPage(lang, page), "utf8");
}

console.log(`Wrote ${Object.keys(locales).length} localized research pages.`);
