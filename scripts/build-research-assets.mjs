import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(rootDir, "authority/research");
const data = JSON.parse(await fs.readFile(path.join(rootDir, "data/research-outputs.json"), "utf8"));

const allowedTypes = new Set(["TechArticle", "ScholarlyArticle", "SoftwareSourceCode"]);
for (const item of data.items || []) {
  if (!item.id || !item.title || !item.author || !item.url || !item.datePublished) {
    throw new Error(`Incomplete research output: ${item.id || "unknown"}`);
  }
  if (!allowedTypes.has(item.type)) throw new Error(`Unsupported research output type: ${item.type}`);
  if (item.doi && !/^10\.\d{4,9}\/.+/.test(item.doi)) throw new Error(`Invalid DOI for ${item.id}`);
  if (item.pdf && !/^https:\/\//.test(item.pdf)) throw new Error(`PDF URL must use HTTPS for ${item.id}`);
}

await fs.mkdir(outputDir, { recursive: true });
await writeFileAtomically(
  path.join(outputDir, "research-outputs.json"),
  `${JSON.stringify(data, null, 2)}\n`,
  "utf8"
);

const checklist = [
  "# Research release gate",
  "",
  "A web note is not presented as a paper or independent citation. Before changing an output to `ScholarlyArticle` or adding it to ORCID or Google Scholar, require:",
  "",
  "1. a stable title, named author, publication date, and canonical URL",
  "2. an abstract, explicit system model or question, method, evaluation, limitations, and references",
  "3. a searchable full-text PDF on a stable HTTPS URL",
  "4. a public release or archive with a licence and reproducible supporting material where applicable",
  "5. a DOI from a real archive such as Zenodo before adding a DOI field",
  "6. matching metadata across the archive, repository, PDF, and personal site",
  "",
  "Never add an education credential, institutional affiliation, DOI, or independent-review claim that cannot be verified.",
  ""
].join("\n");

await writeFileAtomically(path.join(outputDir, "RELEASE_GATE.md"), checklist, "utf8");
await writeFileAtomically(path.join(outputDir, "CITATION.cff.template"), [
  "cff-version: 1.2.0",
  "message: \"If you use this software, cite the archived release.\"",
  "type: software",
  "title: \"REPLACE WITH RELEASE TITLE\"",
  "authors:",
  "  - family-names: Tenkiang",
  "    given-names: Armel",
  "repository-code: \"REPLACE WITH PUBLIC REPOSITORY URL\"",
  "url: \"REPLACE WITH CANONICAL PROJECT PAGE\"",
  "version: \"REPLACE WITH RELEASE VERSION\"",
  "date-released: \"YYYY-MM-DD\"",
  "license: \"REPLACE WITH SPDX IDENTIFIER\"",
  "doi: \"REPLACE ONLY AFTER ARCHIVE ISSUES A DOI\"",
  ""
].join("\n"), "utf8");
await writeFileAtomically(path.join(outputDir, "zenodo-metadata.template.json"), `${JSON.stringify({
  title: "REPLACE WITH RELEASE TITLE",
  description: "REPLACE WITH A FACTUAL RELEASE ABSTRACT",
  creators: [{ name: "Tenkiang, Armel" }],
  upload_type: "software",
  access_right: "open",
  license: "REPLACE WITH SPDX IDENTIFIER",
  related_identifiers: [{
    identifier: "REPLACE WITH CANONICAL PROJECT PAGE",
    relation: "isSupplementTo",
    scheme: "url"
  }]
}, null, 2)}\n`, "utf8");
console.log(`Prepared ${data.items?.length || 0} research-output record(s).`);
