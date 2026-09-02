import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(rootDir, "authority");
const projectOutputDir = path.join(outputDir, "project-sites");
const projectData = JSON.parse(await fs.readFile(path.join(rootDir, "data/projects.json"), "utf8"));
const sourceData = JSON.parse(await fs.readFile(path.join(rootDir, "data/sources.json"), "utf8"));
const sourcesByName = new Map((sourceData.sources || []).map((source) => [source.name, source]));

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#39;");

await fs.mkdir(projectOutputDir, { recursive: true });

const publicProjects = (projectData.projects || []).filter((project) => project.siteVerified !== false);
const publicRepositoryProjects = (projectData.projects || []).filter((project) =>
  project.identity?.repository && sourcesByName.get(project.name)?.visibility !== "private"
);
const personalSiteRepository = {
  repository: "Fuzzyslippers412/me",
  description: "Multilingual personal site and technical notes for Armel Tenkiang.",
  homepage: "https://armeltenkiang.com/",
  personalProjectPage: "https://armeltenkiang.com/"
};
const profileReadme = [
  "# Armel Tenkiang",
  "",
  "Computer scientist and researcher working on distributed systems, local-first software, privacy, and verification.",
  "",
  "[armeltenkiang.com](https://armeltenkiang.com/) · [Research](https://armeltenkiang.com/en/research/) · [Programming notes](https://armeltenkiang.com/updates/)",
  "",
  "## Selected systems",
  "",
  ...publicProjects.map((project) =>
    `- [${project.name}](https://armeltenkiang.com/en/projects/${project.slug}/) — ${project.identity.descriptor}.`
  ),
  "",
  "## Research areas",
  "",
  "- zero-knowledge proofs for private state and selective auditability",
  "- constraint design, compression, and controllable memory for language-model context",
  "- local-first synchronization and offline durability",
  "- privacy-preserving payments with verifiable settlement links",
  "- append-only coordination and audit-ready logs",
  "",
  "The personal site is the canonical index for project status and technical notes.",
  ""
].join("\n");

const profileMetadata = {
  displayName: "Armel Tenkiang",
  website: "https://armeltenkiang.com/",
  bio: "Computer scientist and researcher working on distributed systems, local-first software, privacy, and verification.",
  profileReadmeRepository: "Fuzzyslippers412/Fuzzyslippers412",
  pinnedRepositories: [
    personalSiteRepository.repository,
    ...publicRepositoryProjects.map((project) => project.identity.repository)
  ].slice(0, 6),
  repositories: [
    personalSiteRepository,
    ...publicRepositoryProjects.map((project) => ({
      repository: project.identity.repository,
      description: project.identity.repositoryDescription,
      homepage: project.siteVerified === false
        ? `https://armeltenkiang.com/en/projects/${project.slug}/`
        : project.site,
      personalProjectPage: `https://armeltenkiang.com/en/projects/${project.slug}/`
    }))
  ]
};

await fs.mkdir(path.join(outputDir, "github-profile"), { recursive: true });
await writeFileAtomically(path.join(outputDir, "github-profile", "README.md"), profileReadme, "utf8");
await writeFileAtomically(
  path.join(outputDir, "github-profile", "profile-metadata.json"),
  `${JSON.stringify(profileMetadata, null, 2)}\n`,
  "utf8"
);

const verificationRows = [];
for (const project of projectData.projects || []) {
  const personalProjectPage = `https://armeltenkiang.com/en/projects/${project.slug}/`;
  if (project.siteVerified === false) {
    verificationRows.push(`| ${project.name} | blocked | Live domain does not currently match the project; do not install an authorship patch yet. |`);
    continue;
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.name,
    url: project.site,
    description: project.seo.en.description,
    dateModified: project.modified,
    disambiguatingDescription: project.identity.descriptor,
    applicationCategory: "WebApplication",
    operatingSystem: "Web",
    creator: {
      "@type": "Person",
      "@id": "https://armeltenkiang.com/#person",
      name: "Armel Tenkiang",
      url: "https://armeltenkiang.com/"
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": personalProjectPage
    }
  };
  const snippet = [
    `<!-- Reciprocal project identity for ${escapeHtml(project.name)}. Keep the visible creator line. -->`,
    `<p class="project-creator">Created by <a href="${personalProjectPage}" rel="author">Armel Tenkiang</a>.</p>`,
    '<script type="application/ld+json">',
    JSON.stringify(schema, null, 2),
    "</script>",
    ""
  ].join("\n");
  await writeFileAtomically(path.join(projectOutputDir, `${project.slug}.snippet.txt`), snippet, "utf8");
  verificationRows.push(`| ${project.name} | ready | Install the visible creator line and matching JSON-LD on ${project.site}. |`);
}

const authorityReadme = [
  "# External authority assets",
  "",
  "These files are deployment patches for profiles and project sites outside the personal-site repository. They contain no credentials or private repository URLs.",
  "",
  "- `github-profile/README.md` is the content for the public `Fuzzyslippers412/Fuzzyslippers412` profile repository.",
  "- `github-profile/profile-metadata.json` records the exact GitHub profile and repository fields to apply.",
  "- `../scripts/apply-github-authority.mjs` previews these GitHub changes by default and performs them only with `--apply`.",
  "- `project-sites/*.snippet.txt` contains the visible reciprocal creator link and matching application graph for each verified project domain.",
  "- `source-patches/` contains source-specific, non-applied patches prepared from the inspected MyCasaPro, Au Jour Le Jour, and ChattyPatty trees.",
  "- Re-run `node scripts/build-authority-assets.mjs` whenever project identity data changes.",
  "",
  "## Domain readiness",
  "",
  "| Project | State | Action |",
  "| --- | --- | --- |",
  ...verificationRows,
  "",
  "Do not deploy a snippet onto a parked, repurposed, or mismatched domain. Verify the canonical HTTPS page first.",
  ""
].join("\n");

await writeFileAtomically(path.join(outputDir, "README.md"), authorityReadme, "utf8");
console.log(`Built GitHub profile metadata and ${publicProjects.length} project authority patches.`);
