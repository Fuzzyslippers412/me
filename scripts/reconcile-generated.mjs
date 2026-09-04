import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cwd = fileURLToPath(new URL("../", import.meta.url));
const git = (...args) => execFileSync("git", args, { cwd, encoding: "utf8" });
if (git("branch", "--show-current").trim() !== "main") throw new Error("Reconciliation requires main.");
const entries = git("status", "--porcelain=v1", "-z").split("\0").filter(Boolean);
if (!entries.length) process.exit(0);
const files = entries.map((entry) => {
  const status = entry.slice(0, 2);
  const file = entry.slice(3);
  const generated = file.endsWith(".html") || ["sitemap.xml", "feed.xml"].includes(file) || file.startsWith("authority/");
  // Never sweep source edits, new files, deletions, or an unresolved conflict
  // into an automatic release commit.
  if (status !== " M" || !generated) throw new Error(`Review ${file} before release (status ${status}).`);
  return file;
});
git("add", "--", ...files);
git("commit", "-m", "Reconcile generated site after upstream updates");
console.log(`Reconciled ${files.length} generated files.`);
