import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { writeFileAtomically } from "./write-atomically.mjs";

export function assertLocalReporting(env = process.env) {
  if (env.CI || env.GITHUB_ACTIONS || env.GITHUB_STEP_SUMMARY) {
    throw new Error("Search Console reporting is local-only; do not run it in CI.");
  }
  if (typeof process.getuid !== "function") {
    throw new Error("Owner-only report permissions require a POSIX filesystem.");
  }
}

const within = (parent, child) => {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
};

// Resolve existing ancestors too, so a symlink cannot redirect a report into the site.
async function resolveDestination(file) {
  try {
    return await fs.realpath(file);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const parent = path.dirname(file);
    if (parent === file) throw error;
    return path.join(await resolveDestination(parent), path.basename(file));
  }
}

export async function preparePrivateReportPath(root, requested = path.join(
  os.homedir(), ".local/share/armeltenkiang/search-console/report.json"
)) {
  const destination = path.resolve(requested);
  const resolved = await resolveDestination(destination);
  const site = await fs.realpath(root);
  if (within(site, resolved) || within(path.resolve(root), destination)) {
    throw new Error("Search Console reports must be outside the website folder.");
  }
  const directory = path.dirname(resolved);
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const info = await fs.lstat(directory);
  if (!info.isDirectory() || info.uid !== process.getuid() || (info.mode & 0o077)) {
    throw new Error("The report directory must be owned by you with permissions 0700.");
  }
  // Never follow an existing leaf symlink or overwrite another user's/shared file.
  const existing = await fs.lstat(destination).catch((error) => {
    if (error.code !== "ENOENT") throw error;
    return null;
  });
  if (existing && (!existing.isFile() || existing.nlink !== 1
    || existing.uid !== process.getuid() || (existing.mode & 0o077))) {
    throw new Error("An existing report must be an owner-only regular file (0600).");
  }
  return resolved;
}

export async function writePrivateReport(root, file, content) {
  const destination = await preparePrivateReportPath(root, file);
  await writeFileAtomically(destination, content, { encoding: "utf8", mode: 0o600, flag: "wx" });
}
