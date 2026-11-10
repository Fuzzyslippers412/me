import { editorial, publicProjectSite } from "./editorial-content.mjs";
import { renderArchitecture } from "./system-figures.mjs";
import { renderResearchNotes } from "./research-notes.mjs";
export const selectedProjects = editorial.selectedProjects;

export const homeCopy = (lang) => {
  if (!editorial.locales[lang]) throw new Error(`Missing homepage language: ${lang}`);
  return editorial.locales[lang];
};
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
  const key = project.feature?.item;
  const delivery = feature ? project.caseStudy?.[lang]?.items.find((item) => item.id === key)?.description : "";
  if (feature && (!key || !delivery || !project.feature.labels[lang])) throw new Error(`Missing featured evidence for ${project.slug}/${lang}`);
  const site = publicProjectSite(project);
  const detail = feature ? `
        <details class="project-aside"><summary>${escape(project.feature.labels[lang])}</summary><p>${escape(delivery)}</p></details>` : "";
  return `<article class="card card--${state}${feature ? " card--featured" : ""}" data-project="${project.slug}" data-state="${state}">
        <div class="tag${["Live", "Active"].includes(project.status) ? " tag-active" : ""}">${text.statuses[project.status] || escape(project.status)}</div>
        <h3><a href="${route}${project.slug}/">${escape(project.name)}</a></h3>
        <p>${escape(project.summary[lang])}</p>${detail}
        <div class="card-actions">
          <a class="card-link card-note" href="${route}${project.slug}/">${text.note}</a>${site ? `
          <a class="card-link" href="${escape(site)}" target="_blank" rel="noopener">${text.site}</a>` : ""}
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
  const main = `<main id="main-content">
      <section class="introduction" id="home">
        <span class="identity-label">${text.role}</span>
        <h1>Armel Tenkiang</h1>
        <div class="intro-copy"><p>${text.intro}</p><p>${text.welcome}</p><p class="technical-spine">${text.orientation}</p></div>
      </section>

      <section class="selected-work" id="projects" aria-labelledby="selected-work-title">
        <h2 id="selected-work-title">${text.work}</h2>
        <div class="work-body">
          <div class="featured-system">
          ${renderProjectCard(projects[0], lang, config.projects, true)}
          ${renderArchitecture(projects[0].slug, lang)}
          </div>
          <div class="supporting-work">
          <article class="research-selection"><span class="tag">${text.galidimaLabel}</span><h3><a href="${articleUrl}">Galidima</a></h3><p>${text.galidimaDescription}</p><a class="card-link" href="${articleUrl}">${text.reading}</a></article>
          ${projects.slice(1).map((project) => renderProjectCard(project, lang, config.projects)).join("\n          ")}
          </div>
          <div class="work-index"><span>${text.more}</span><nav aria-label="${text.more}">${["mycasapro", "au-jour-le-jour", "liga-do-povo"].map((slug) => { const p = projectData.projects.find((item) => item.slug === slug); return `<a href="${config.projects}${slug}/">${p.name}</a>`; }).join("")}<a href="${config.projects}">${text.index} <span aria-hidden="true">↗</span></a></nav></div>
        </div>
      </section>

      <section class="research-interlude" id="private-intelligence" aria-labelledby="research-question">
        <span class="eyebrow">${text.related}</span>
        <div class="research-copy">
          <h2 id="research-question">${text.question}</h2>
          <p class="practice-statement">${escape(text.questionIntro)}</p>
          ${renderResearchNotes(lang)}
        </div>
      </section>

      ${updates.replace(/\s*<a class="updates-archive"[^>]*>[\s\S]*?<\/a>/g, "").replace(/\s*<details class="activity-stats">[\s\S]*?<\/details>/g, "").replace("</section>", `  <a class="updates-archive" href="${config.updates}">${text.archive}</a>\n        <details class="activity-stats"><summary>${text.activity}</summary>${stats}</details>\n      </section>`)}

      <section class="listening" id="listening" aria-labelledby="listening-title">
        <div class="listening-intro"><h2 id="listening-title">${text.listening}</h2><p>${text.music}</p></div>
        <nav class="listening-shelf" aria-label="${text.playlists}">
          <a class="listening-midi" href="https://soundcloud.com/armel-tenkiang/sets/midi" target="_blank" rel="noopener"><span>MIDI</span><span class="playlist-platform">SoundCloud <span aria-hidden="true">↗</span></span></a>
          <a class="listening-day" href="https://soundcloud.com/armel-tenkiang/sets/daytime" target="_blank" rel="noopener"><span>Daytime</span><span class="playlist-platform">SoundCloud <span aria-hidden="true">↗</span></span></a>
          <a class="listening-night" href="https://soundcloud.com/armel-tenkiang/sets/nightime" target="_blank" rel="noopener"><span>Nighttime</span><span class="playlist-platform">SoundCloud <span aria-hidden="true">↗</span></span></a>
        </nav>
      </section>

      <section class="personal-end" id="contact">
        <h2>${text.profile}</h2>
        <div class="personal-copy"><p>${text.about[0]}</p><p>${text.background}</p><a class="about-link" href="${config.about || `${config.home}about/`}">${text.profileLink} <span aria-hidden="true">↗</span></a>
        <nav class="profile-links" aria-label="Armel Tenkiang">
          <a href="https://github.com/Fuzzyslippers412" rel="me noopener" target="_blank">GitHub</a>
          <a href="https://soundcloud.com/armel-tenkiang" rel="me noopener" target="_blank">SoundCloud</a>
          <a href="mailto:atenkiang2019@gmail.com">${text.contact}</a>
        </nav>
        </div>
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
