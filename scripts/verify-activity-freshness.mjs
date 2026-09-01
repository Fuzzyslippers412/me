import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profilePath = path.join(rootDir, "data/profile.json");
const maxAgeDays = Number(process.env.PROFILE_MAX_AGE_DAYS || "3");
const now = process.env.PROFILE_FRESHNESS_NOW
  ? new Date(process.env.PROFILE_FRESHNESS_NOW)
  : new Date();

if (!Number.isFinite(maxAgeDays) || maxAgeDays < 0) {
  throw new Error("PROFILE_MAX_AGE_DAYS must be a non-negative number.");
}
if (Number.isNaN(now.getTime())) {
  throw new Error("PROFILE_FRESHNESS_NOW must be a valid date when supplied.");
}

const profile = JSON.parse(await fs.readFile(profilePath, "utf8"));
const github = profile.github || {};
const asOf = github.as_of;
const asOfDate = asOf ? new Date(`${asOf}T23:59:59Z`) : null;
const ageMs = asOfDate ? Math.max(0, now.getTime() - asOfDate.getTime()) : Infinity;
const ageDays = ageMs / (24 * 60 * 60 * 1000);
const requiredNumbers = [
  "contributions_last_year",
  "total_contributions_this_year",
  "commit_contributions_this_year",
  "tracked_project_commit_contributions_this_year"
];
const missingNumbers = requiredNumbers.filter((key) => !Number.isFinite(github[key]));

if (!asOf || !Number.isFinite(ageDays) || ageDays > maxAgeDays) {
  throw new Error(
    `GitHub profile snapshot is stale (as_of: ${asOf || "missing"}, age: ${Number.isFinite(ageDays) ? ageDays.toFixed(1) : "unknown"} days).`
  );
}
if (missingNumbers.length) {
  throw new Error(`GitHub profile snapshot is incomplete: ${missingNumbers.join(", ")}.`);
}
if (github.measurement_source !== "github_graphql_contributions_collection") {
  throw new Error(
    `GitHub profile snapshot is not backed by the expected GraphQL source (${github.measurement_source || "missing"}).`
  );
}

const summary = [
  "## GitHub activity snapshot",
  "",
  `- As of: ${asOf}`,
  `- Last 12 months: ${github.contributions_last_year} contributions`,
  `- ${github.year} contributions: ${github.total_contributions_this_year}`,
  `- ${github.year} commit contributions: ${github.commit_contributions_this_year}`,
  `- ${github.year} tracked-project commit contributions: ${github.tracked_project_commit_contributions_this_year}`,
  `- Source: ${github.measurement_source}`
].join("\n");

if (process.env.GITHUB_STEP_SUMMARY) {
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, "utf8");
}

console.log(summary.replace(/^## /, ""));
