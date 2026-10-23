import { fileURLToPath } from "node:url";
import { createSnapshotSource, checkLiveSite } from "./lib/live-site-check.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const positiveInteger = (name, fallback) => {
  const value = process.env[name] ?? String(fallback);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return Number(value);
};

try {
  if (process.argv.slice(2).some((arg) => arg !== "--local")) {
    throw new Error("Usage: node scripts/check-live-site.mjs [--local]");
  }
  const result = await checkLiveSite({
    source: createSnapshotSource(root, { local: process.argv.includes("--local") }),
    attempts: positiveInteger("LIVE_CHECK_ATTEMPTS", 1),
    delayMs: Math.max(1000, positiveInteger("LIVE_CHECK_DELAY_MS", 45000))
  });
  if (!result.ok) {
    console.error(result.failures.map((failure) => `- ${failure}`).join("\n"));
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
