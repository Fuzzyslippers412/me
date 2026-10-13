import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertUniquePageCanonicals } from "./lib/check-page-copies.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
await assertUniquePageCanonicals(root);
const steps = [
  "build-expertise", "build-research-pages", "build-update-pages",
  "build-update-indexes", "build-feed", "build-authority-assets",
  "build-research-assets", "enhance-html", "render-static-data", "build-sitemap"
];
for (const step of steps) {
  execFileSync(process.execPath, [`scripts/${step}.mjs`], { cwd: root, stdio: "inherit" });
}
execFileSync(process.execPath, ["scripts/validate-site.mjs"], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, ["scripts/audit-search-surface.mjs", "--strict"], { cwd: root, stdio: "inherit" });
execFileSync(process.execPath, ["--test", "tests/site.test.mjs"], { cwd: root, stdio: "inherit" });
