import fs from "node:fs/promises";
import { createHash } from "node:crypto";

export const languages = ["it", "en", "fr", "pt"];
export const origin = "https://armeltenkiang.com";
export const localizedPath = (lang, route) => {
  if (!languages.includes(lang)) throw new Error(`Unsupported language: ${lang}`);
  return lang === "it" ? route : `/${lang}${route}`;
};
export const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
export const readData = async (name) => JSON.parse(await fs.readFile(new URL(`../../data/${name}.json`, import.meta.url), "utf8"));

export function publicProjectSite(project) {
  if (!project.site || project.siteVerified === false) return null;
  const url = new URL(project.site);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error(`Unsafe public URL for ${project.slug}`);
  return url.href;
}

export function contentDigest(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export function assertReviewedContent(projects, editorial, review) {
  const records = Object.fromEntries(projects.map((p) => [p.slug, {
    status: p.status, summary: p.summary.en, seo: p.seo.en,
    caseStudy: p.caseStudy?.en, pageContent: p.pageContent?.en, feature: p.feature?.labels.en
  }]));
  records.profile = editorial.locales.en;
  for (const [id, source] of Object.entries(records)) {
    for (const lang of languages.filter((l) => l !== "en")) {
      if (review[id]?.[lang] !== contentDigest(source)) throw new Error(`${id}/${lang}: content changed; review the translation before building`);
    }
  }
  for (const p of projects) {
    for (const lang of languages) {
      if (!p.summary?.[lang]?.trim() || !p.seo?.[lang]?.description?.trim() || (p.caseStudy && !p.caseStudy[lang]?.items?.length)) throw new Error(`${p.slug}/${lang}: incomplete project translation`);
      if (p.pageContent && (!p.pageContent[lang]?.status || p.pageContent[lang]?.sections?.length !== p.pageContent.en.sections.length)) throw new Error(`${p.slug}/${lang}: incomplete case study`);
      p.pageContent?.[lang]?.sections.forEach((section, i) => {
        if (!section.heading || section.paragraphs?.length !== p.pageContent.en.sections[i].paragraphs.length || section.paragraphs.some((s) => !s.trim())) throw new Error(`${p.slug}/${lang}: incomplete case-study section`);
      });
    }
  }
  for (const lang of languages) {
    const translated = editorial.locales[lang];
    if (!translated || Object.keys(editorial.locales.en).some((key) => !translated[key])) throw new Error(`${lang}: incomplete editorial copy`);
    if (!Array.isArray(translated.about) || translated.about.length !== editorial.locales.en.about.length || translated.about.some((paragraph) => typeof paragraph !== "string" || !paragraph.trim())) throw new Error(`${lang}: incomplete biography`);
  }
}

export const editorial = await readData("editorial");
