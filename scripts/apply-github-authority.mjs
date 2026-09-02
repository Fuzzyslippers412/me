import fs from "fs/promises";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const metadataPath = path.join(rootDir, "authority/github-profile/profile-metadata.json");
const readmePath = path.join(rootDir, "authority/github-profile/README.md");
const apply = process.argv.includes("--apply");
const unexpected = process.argv.slice(2).filter((argument) => argument !== "--apply");

if (unexpected.length) {
  console.error(`Unknown argument(s): ${unexpected.join(", ")}`);
  process.exit(2);
}

const metadata = JSON.parse(await fs.readFile(metadataPath, "utf8"));
const profileReadme = await fs.readFile(readmePath, "utf8");
const owner = metadata.profileReadmeRepository.split("/")[0];

const runGh = (args, { allowFailure = false } = {}) => {
  const result = spawnSync("gh", args, { cwd: rootDir, encoding: "utf8" });
  if (result.error) {
    console.error(`Unable to run gh: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0 && !allowFailure) {
    console.error(result.stderr.trim() || `gh ${args.join(" ")} failed`);
    process.exit(result.status || 1);
  }
  return result;
};

const isNotFound = (result) => result.status !== 0 && /(?:HTTP 404|not found)/i.test(result.stderr || "");

const printPlan = () => {
  console.log("GitHub authority plan (read-only preview)");
  console.log(`- profile name: ${metadata.displayName}`);
  console.log(`- profile website: ${metadata.website}`);
  console.log(`- profile bio: ${metadata.bio}`);
  console.log(`- profile README: ${metadata.profileReadmeRepository}/README.md`);
  for (const repository of metadata.repositories) {
    console.log(`- repository: ${repository.repository}`);
    console.log(`  description: ${repository.description}`);
    console.log(`  homepage: ${repository.homepage}`);
  }
  console.log(`- proposed pins (manual): ${metadata.pinnedRepositories.join(", ")}`);
};

printPlan();
if (!apply) {
  console.log("\nNo changes made. Re-run with --apply after reviewing this plan.");
  process.exit(0);
}

const authenticated = runGh(["api", "user"]);
let login;
try {
  login = JSON.parse(authenticated.stdout).login;
} catch {
  console.error("GitHub returned an unreadable authenticated-user response.");
  process.exit(1);
}
if (String(login).toLowerCase() !== owner.toLowerCase()) {
  console.error(`Authenticated as ${login}; expected ${owner}. No changes made.`);
  process.exit(1);
}

runGh([
  "api", "--method", "PATCH", "user",
  "-f", `name=${metadata.displayName}`,
  "-f", `bio=${metadata.bio}`,
  "-f", `blog=${metadata.website}`
]);
console.log(`Updated profile fields for ${login}.`);

for (const repository of metadata.repositories) {
  runGh([
    "api", "--method", "PATCH", `repos/${repository.repository}`,
    "-f", `description=${repository.description}`,
    "-f", `homepage=${repository.homepage}`
  ]);
  console.log(`Updated ${repository.repository}.`);
}

const profileRepository = metadata.profileReadmeRepository;
let repositoryCheck = runGh(["api", `repos/${profileRepository}`], { allowFailure: true });
if (repositoryCheck.status !== 0) {
  if (!isNotFound(repositoryCheck)) {
    console.error(repositoryCheck.stderr.trim() || `Could not inspect ${profileRepository}. No repository was created.`);
    process.exit(repositoryCheck.status || 1);
  }
  runGh([
    "repo", "create", profileRepository,
    "--public",
    "--description", "GitHub profile for Armel Tenkiang"
  ]);
  console.log(`Created ${profileRepository}.`);
}

const contentPath = `repos/${profileRepository}/contents/README.md`;
const existing = runGh(["api", contentPath], { allowFailure: true });
let existingSha = "";
let existingText = "";
if (existing.status === 0) {
  try {
    const payload = JSON.parse(existing.stdout);
    existingSha = payload.sha || "";
    existingText = Buffer.from(String(payload.content || "").replaceAll("\n", ""), "base64").toString("utf8");
  } catch {
    console.error("GitHub returned unreadable profile README metadata.");
    process.exit(1);
  }
} else if (!isNotFound(existing)) {
  console.error(existing.stderr.trim() || "Could not inspect the profile README. No README was changed.");
  process.exit(existing.status || 1);
}

if (existingText === profileReadme) {
  console.log("Profile README already matches; no README commit created.");
} else {
  const argumentsForPut = [
    "api", "--method", "PUT", contentPath,
    "-f", "message=Update public profile",
    "-f", `content=${Buffer.from(profileReadme, "utf8").toString("base64")}`
  ];
  if (existingSha) argumentsForPut.push("-f", `sha=${existingSha}`);
  runGh(argumentsForPut);
  console.log("Updated the public profile README.");
}

console.log("GitHub profile metadata applied. Review and set the proposed pins in the GitHub profile UI.");
