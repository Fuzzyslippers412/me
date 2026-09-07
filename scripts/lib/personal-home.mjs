export const selectedProjects = ["mycasapro", "au-jour-le-jour", "liga-do-povo"];

const words = {
  it: {
    intro: "Sono un informatico e ricercatore. Mi occupo di software local-first, sistemi distribuiti e calcolo privato.",
    welcome: "Qui raccolgo i miei progetti, le note di ricerca e qualche selezione musicale.",
    work: "Una selezione di lavori", index: "Tutti i progetti", site: "Sito del progetto", note: "Leggi la nota",
    related: "Una domanda di ricerca", question: "Che cosa può trattare come un fatto un modello?",
    listening: "Ascolti", music: "Mix occasionali e playlist di riferimento su SoundCloud.",
    playlists: "Playlist su SoundCloud", allMusic: "Il mio SoundCloud", archive: "Tutti gli aggiornamenti di programmazione",
    profile: "Qualcosa su di me", contact: "Scrivimi", activity: "Attività GitHub", reading: "Note su Galidima",
    statuses: { "In the lab": "In laboratorio", Live: "Online", Active: "Attivo", Exploration: "Ricerca" },
    boundary: ["Accesso per invito", "Dati privati", "Proprietario", "Immobili, richieste e allegati", "Invito con scadenza", "Una sola richiesta", "Accesso circoscritto", "Fornitore ospite", "File condivisi e invio del preventivo"],
    boundaryNote: "Il link è revocabile. L’API controlla l’accesso; nel database resta solo l’hash del token.",
    delivery: "Se l’email non arriva?",
    about: ["Sono un informatico e ricercatore portoghese-americano di origine fulani e bamiléké. Ho studiato alla School of Computer Science (SCS).", "Lavoro nel software da oltre vent’anni, principalmente in TypeScript e Python. Mi interessano il controllo locale dei dati, il recupero dopo un guasto e la verifica dei risultati prodotti dai modelli."],
    redundant: ["Lavoro attuale", "Sistemi attuali"]
  },
  en: {
    intro: "I’m a computer scientist and researcher. I work on local-first software, distributed systems, and private computation.",
    welcome: "This is where I keep my projects, research notes, and occasional mixes.",
    work: "A selection of work", index: "All projects", site: "Project website", note: "Read the note",
    related: "A research question", question: "What should a model be allowed to treat as a fact?",
    listening: "Listening", music: "Occasional mixes and reference playlists on SoundCloud.",
    playlists: "SoundCloud playlists", allMusic: "My SoundCloud", archive: "All programming updates",
    profile: "A little about me", contact: "Write to me", activity: "GitHub activity", reading: "Notes on Galidima",
    statuses: { "In the lab": "In the lab", Live: "Live", Active: "Active", Exploration: "Research" },
    boundary: ["Access by invitation", "Private records", "Homeowner", "Properties, requests, and attachments", "Expiring invitation", "One repair request", "Scoped access", "Guest contractor", "Shared files and estimate submission"],
    boundaryNote: "The link can be revoked. The API controls access; only the token hash is stored in the database.",
    delivery: "What if the email fails?",
    about: ["I’m a Portuguese-American computer scientist and researcher of Fulani and Bamileke origin. I studied at the School of Computer Science (SCS).", "I’ve worked in software for more than twenty years, primarily in TypeScript and Python. My interests include local data ownership, recovery after failure, and checking the claims made by models."],
    redundant: ["Current Work", "Current Systems"]
  },
  fr: {
    intro: "Je suis informaticien et chercheur. Je travaille sur les logiciels local-first, les systèmes distribués et le calcul privé.",
    welcome: "Je rassemble ici mes projets, mes notes de recherche et quelques sélections musicales.",
    work: "Une sélection de travaux", index: "Tous les projets", site: "Site du projet", note: "Lire la note",
    related: "Une question de recherche", question: "Que peut-on autoriser un modèle à considérer comme un fait ?",
    listening: "Écoutes", music: "Mix occasionnels et playlists de référence sur SoundCloud.",
    playlists: "Playlists SoundCloud", allMusic: "Mon SoundCloud", archive: "Tous les travaux de programmation récents",
    profile: "Quelques mots sur moi", contact: "M’écrire", activity: "Activité GitHub", reading: "Notes sur Galidima",
    statuses: { "In the lab": "Au laboratoire", Live: "En ligne", Active: "Actif", Exploration: "Recherche" },
    boundary: ["Accès sur invitation", "Données privées", "Propriétaire", "Biens, demandes et pièces jointes", "Invitation temporaire", "Une seule demande", "Accès limité", "Prestataire invité", "Fichiers partagés et dépôt du devis"],
    boundaryNote: "Le lien est révocable. L’API contrôle l’accès ; seul le hachage du jeton est conservé en base.",
    delivery: "Et si l’email échoue ?",
    about: ["Je suis informaticien et chercheur portugais-américain, d’origine peule et bamiléké. J’ai étudié à la School of Computer Science (SCS).", "Je travaille dans le logiciel depuis plus de vingt ans, principalement en TypeScript et Python. Je m’intéresse à la maîtrise locale des données, à la reprise après une panne et à la vérification des affirmations produites par les modèles."],
    redundant: ["Travail actuel", "Systèmes actuels", "Travaux actuels"]
  },
  pt: {
    intro: "Sou cientista da computação e investigador. Trabalho em software local-first, sistemas distribuídos e computação privada.",
    welcome: "Reúno aqui os meus projetos, notas de investigação e algumas seleções musicais.",
    work: "Uma seleção de trabalhos", index: "Todos os projetos", site: "Site do projeto", note: "Ler a nota",
    related: "Uma questão de investigação", question: "O que pode um modelo tratar como um facto?",
    listening: "À escuta", music: "Mixes ocasionais e playlists de referência no SoundCloud.",
    playlists: "Playlists do SoundCloud", allMusic: "O meu SoundCloud", archive: "Todas as atualizações de programação",
    profile: "Um pouco sobre mim", contact: "Escreva-me", activity: "Atividade no GitHub", reading: "Notas sobre Galidima",
    statuses: { "In the lab": "Em laboratório", Live: "Online", Active: "Ativo", Exploration: "Investigação" },
    boundary: ["Acesso por convite", "Registos privados", "Proprietário", "Imóveis, pedidos e anexos", "Convite com prazo", "Um único pedido", "Acesso limitado", "Prestador convidado", "Ficheiros partilhados e envio do orçamento"],
    boundaryNote: "O link pode ser revogado. A API controla o acesso; só o hash do token é guardado na base de dados.",
    delivery: "E se o email falhar?",
    about: ["Sou cientista da computação e investigador português-americano, de origem fula e bamiléké. Estudei na School of Computer Science (SCS).", "Trabalho em software há mais de vinte anos, sobretudo em TypeScript e Python. Interesso-me pelo controlo local dos dados, pela recuperação após falhas e pela verificação das afirmações feitas por modelos."],
    redundant: ["Trabalho atual", "Sistemas atuais"]
  }
};

export const homeCopy = (lang) => words[lang] || words.en;
const escape = (value) => String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export function renderInvitationBoundary(lang, id = "invitation-boundary") {
  const text = homeCopy(lang);
  const b = text.boundary;
  return `<figure class="boundary-figure" aria-labelledby="${id}">
          <figcaption id="${id}">${b[0]}</figcaption>
          <div class="boundary-zones">
            <div class="boundary-owner"><span>${b[1]}</span><strong>${b[2]}</strong><p>${b[3]}</p></div>
            <div class="boundary-bridge"><span>${b[4]}</span><small>${b[5]}</small></div>
            <div class="boundary-guest"><span>${b[6]}</span><strong>${b[7]}</strong><p>${b[8]}</p></div>
          </div>
          <p class="boundary-note">${text.boundaryNote}</p>
        </figure>`;
}

export function renderProjectCard(project, lang, route, feature = false) {
  const text = homeCopy(lang);
  const state = project.status.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const delivery = feature ? project.caseStudy?.[lang]?.items.find((item) => item.id === "invitation-delivery")?.description : "";
  if (feature && !delivery) throw new Error(`Missing invitation-delivery evidence for ${project.slug}/${lang}`);
  const detail = feature ? `
        ${renderInvitationBoundary(lang, "home-invitation-boundary")}
        <details class="project-aside"><summary>${text.delivery}</summary><p>${escape(delivery)}</p></details>` : "";
  return `<article class="card card--${state}${feature ? " card--featured" : ""}" data-project="${project.slug}" data-state="${state}">
        <div class="tag${["Live", "Active"].includes(project.status) ? " tag-active" : ""}">${text.statuses[project.status] || escape(project.status)}</div>
        <h3><a href="${route}${project.slug}/">${escape(project.name)}</a></h3>
        <p>${escape(project.summary[lang])}</p>${detail}
        <div class="card-actions">
          <a class="card-link card-note" href="${route}${project.slug}/">${text.note}</a>${project.siteVerified === false ? "" : `
          <a class="card-link" href="${escape(project.site)}" target="_blank" rel="noopener">${text.site}</a>`}
        </div>
      </article>`;
}

export function renderPersonalHome(html, { lang, config, projectData, expertiseData }) {
  const text = homeCopy(lang);
  const projects = selectedProjects.map((slug) => projectData.projects.find((project) => project.slug === slug));
  if (projects.some((project) => !project?.summary?.[lang])) throw new Error(`Missing selected-project content for ${lang}`);
  const updates = html.match(/<section class="updates"[\s\S]*?<\/section>/)?.[0];
  const stats = [...html.matchAll(/<p class="section-note"[^>]*>[\s\S]*?<\/p>/g)].find(([paragraph]) => paragraph.includes("data-github-contribs"))?.[0];
  if (!updates || !stats) throw new Error(`Missing activity fallback in ${lang} homepage`);
  const articleUrl = `${config.research}galidima/`;
  const expertise = expertiseData.locales[lang].home;
  const main = `<main id="main-content">
      <section class="introduction" id="home">
        <h1>Armel Tenkiang</h1>
        <div class="intro-copy"><p>${text.intro}</p><p>${text.welcome}</p></div>
      </section>

      <section class="selected-work" id="projects" aria-labelledby="selected-work-title">
        <h2 id="selected-work-title">${text.work}</h2>
        <div class="selected-layout">
          ${renderProjectCard(projects[0], lang, config.projects, true)}
          <!-- expertise:galidima:home:start -->
          <aside class="research-postcard" id="private-intelligence" aria-labelledby="research-question">
            <span class="eyebrow">${text.related}</span>
            <h3 id="research-question">${text.question}</h3>
            <p class="practice-statement">${escape(expertise.statement)}</p>
            <a class="section-link" href="${articleUrl}">${text.reading}</a>
          </aside>
          <!-- expertise:galidima:home:end -->
        </div>
        <div class="supporting-work">
          ${projects.slice(1).map((project) => renderProjectCard(project, lang, config.projects)).join("\n          ")}
        </div>
        <div class="work-index"><a class="section-link" href="${config.projects}">${text.index} <span aria-hidden="true">↗</span></a>
          <details class="activity-stats"><summary>${text.activity}</summary>${stats}</details>
        </div>
      </section>

      <section class="listening" id="listening" aria-labelledby="listening-title">
        <div class="listening-intro"><h2 id="listening-title">${text.listening}</h2><p>${text.music}</p></div>
        <nav class="listening-shelf" aria-label="${text.playlists}">
          <a class="listening-midi" href="https://soundcloud.com/armel-tenkiang/sets/midi" target="_blank" rel="noopener"><span>MIDI</span><span class="playlist-platform">SoundCloud <span aria-hidden="true">↗</span></span></a>
          <a class="listening-day" href="https://soundcloud.com/armel-tenkiang/sets/daytime" target="_blank" rel="noopener"><span>Daytime</span><span class="playlist-platform">SoundCloud <span aria-hidden="true">↗</span></span></a>
          <a class="listening-night" href="https://soundcloud.com/armel-tenkiang/sets/nightime" target="_blank" rel="noopener"><span>Nighttime</span><span class="playlist-platform">SoundCloud <span aria-hidden="true">↗</span></span></a>
        </nav>
      </section>

      ${updates.replace(/\s*<a class="updates-archive"[^>]*>[\s\S]*?<\/a>/g, "").replace("</section>", `  <a class="updates-archive" href="${config.updates}">${text.archive}</a>\n      </section>`)}

      <section class="personal-end" id="contact">
        <a class="about-link" href="${config.about || `${config.home}about/`}">${text.profile} <span aria-hidden="true">↗</span></a>
        <nav class="profile-links" aria-label="Armel Tenkiang">
          <a href="https://github.com/Fuzzyslippers412" rel="me noopener" target="_blank">GitHub</a>
          <a href="https://soundcloud.com/armel-tenkiang" rel="me noopener" target="_blank">SoundCloud</a>
          <a href="mailto:atenkiang2019@gmail.com">${text.contact}</a>
        </nav>
      </section>
    </main>`;
  return html.replace(/<main\b[^>]*>[\s\S]*?<\/main>/, main);
}

export function refineAbout(html, lang) {
  const text = homeCopy(lang);
  html = html.replace(/\s*<div class="page-meta">[\s\S]*?<\/div>/, "");
  html = html.replace(/<section class="page-section(?: about-intro)?">[\s\S]*?<\/section>/, `<section class="page-section about-intro">\n${text.about.map((paragraph) => `        <p>${paragraph}</p>`).join("\n")}\n      </section>`);
  return html.replace(/\s*<section class="page-section">\s*<h2>([^<]+)<\/h2>[\s\S]*?<\/section>/g, (section, heading) => text.redundant.includes(heading.trim()) ? "" : section);
}
