import fs from "node:fs/promises";
import path from "node:path";

export const assertUniquePageCanonicals = async (root) => {
  const owners = new Map();
  const conflicts = [];
  const walk = async (directory) => {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if ([".git", "node_modules", "authority"].includes(entry.name)) continue;
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(file);
      } else if (entry.isFile() && entry.name.endsWith(".html")) {
        const html = await fs.readFile(file, "utf8");
        // Redirects and noindex aliases intentionally point at another page.
        if (/<meta\b[^>]*http-equiv=["']refresh["']/i.test(html) ||
            /<meta\b(?=[^>]*name=["']robots["'])[^>]*content=["'][^"']*\bnoindex\b/i.test(html)) continue;
        const canonical = html.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*\bhref=["']([^"']+)["']/i)?.[1];
        if (!canonical) continue;
        const relative = path.relative(root, file);
        if (owners.has(canonical)) conflicts.push(`${owners.get(canonical)} and ${relative}`);
        else owners.set(canonical, relative);
      }
    }
  };
  await walk(root);
  if (conflicts.length) {
    throw new Error([
      "Build stopped before changing files: multiple HTML files claim the same canonical URL.",
      ...conflicts.map((pair) => `- ${pair}`),
      "Compare the copies and back up confirmed duplicates outside the repository before retrying.",
      "Nothing was deleted or automatically selected. Use a working folder outside cloud-synced Desktop/Documents."
    ].join("\n"));
  }
};
