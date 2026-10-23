import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { generateKeyPairSync } from "node:crypto";
import { preparePrivateReportPath, writePrivateReport } from "../scripts/lib/private-report.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const exec = promisify(execFile);
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const put = async (file, value) => {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value));
};

async function fixture(t, files) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "armel-regression-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const site = path.join(directory, "site");
  await fs.mkdir(site);
  for (const file of files) {
    await fs.mkdir(path.dirname(path.join(site, file)), { recursive: true });
    await fs.copyFile(path.join(root, file), path.join(site, file));
  }
  const home = path.join(directory, "home");
  const tmp = path.join(directory, "tmp");
  await fs.mkdir(home);
  await fs.mkdir(tmp);
  // No inherited credentials, network fallback, or public CI summary destinations.
  const env = { HOME: home, TMPDIR: tmp, PATH: path.dirname(process.execPath), LANG: "C.UTF-8", TZ: "UTC" };
  const mock = path.join(directory, "mock-fetch.mjs");
  const responses = path.join(directory, "responses.json");
  await fs.writeFile(mock, `import fs from "node:fs/promises";
    const responses = JSON.parse(await fs.readFile(new URL("./responses.json", import.meta.url), "utf8"));
    globalThis.fetch = async (input) => {
      const entry = responses[String(input)];
      if (!entry) throw new Error("Unmocked request blocked");
      console.log("MOCK_REQUEST");
      return new Response(JSON.stringify(entry.body), { status: entry.status || 200 });
    };`);
  await put(responses, {});
  const run = async (script, extra = {}) => {
    try {
      const result = await exec(process.execPath, ["--import", mock, `scripts/${script}.mjs`], {
        cwd: site, env: { ...env, ...extra }, timeout: 15000, maxBuffer: 128 * 1024
      });
      return { ...result, code: 0 };
    } catch (error) {
      return { code: error.code, stdout: error.stdout || "", stderr: error.stderr || "" };
    }
  };
  return { directory, site, home, responses, run };
}

const atomic = "scripts/lib/write-atomically.mjs";
const validItem = (title, date = "2026-10-22T12:00:00Z") => ({ title, date, url: "https://example.invalid/update" });
const profileResponse = { data: { user: {
  lastYear: { contributionCalendar: { totalContributions: 123 }, restrictedContributionsCount: 4 },
  currentYear: { contributionCalendar: { totalContributions: 101 }, totalCommitContributions: 87, commitContributionsByRepository: [] }
} } };

async function feedFixture(t) {
  const f = await fixture(t, ["scripts/build-updates.mjs", atomic]);
  await put(path.join(f.site, "data/sources.json"), {
    sources: ["First", "Second"].map((name) => ({ name, site: "https://example.invalid/", feed: `https://feed.invalid/${name}` })),
    profile: { github_user: "fixture-user" }
  });
  await put(path.join(f.site, "data/update-notes.json"), { items: [] });
  await put(path.join(f.site, "data/updates.json"), { items: [
    { ...validItem("Retained verified update", "2026-01-01T00:00:00Z"), source: "Second" },
    { ...validItem({ toString: 0 }), source: "Second" }, null
  ] });
  await put(path.join(f.site, "data/profile.json"), { github: { contributions_last_year: 1 } });
  f.refresh = async (first) => {
    await put(f.responses, {
      "https://feed.invalid/First": { body: first },
      "https://feed.invalid/Second": { body: { entries: [validItem("Other source fresh update")] } },
      "https://api.github.com/graphql": { body: profileResponse }
    });
    const result = await f.run("build-updates", { REQUIRE_FRESH_PROFILE: "1", GH_STATS_TOKEN: "dummy-fixture-token" });
    assert.equal(result.code, 0, result.stderr);
    const updates = await readJson(path.join(f.site, "data/updates.json"));
    const profile = await readJson(path.join(f.site, "data/profile.json"));
    assert.ok(updates.items.some((item) => item.title === "Other source fresh update"));
    assert.ok(updates.items.some((item) => item.title === "Retained verified update"));
    assert.equal(profile.github.contributions_last_year, 123);
    assert.equal(profile.github.commit_contributions_this_year, 87);
    return updates.items;
  };
  return f;
}

test("poison title does not block healthy updates or profile refresh", async (t) => {
  const f = await feedFixture(t);
  const cache = await readJson(path.join(f.site, "data/updates.json"));
  await put(path.join(f.site, "data/updates.json"), { items: cache.items.filter((item) => typeof item?.title === "string") });
  const items = await f.refresh({ items: [validItem({ toString: 0 }), validItem("Healthy same-source update")] });
  assert.equal(items.length, 3);
  assert.ok(items.some((item) => item.title === "Healthy same-source update"));
});

test("malformed feed and cached records cannot block healthy siblings, other sources, or profile refresh", async (t) => {
  const f = await feedFixture(t);
  const poisoned = { toString: 0 };
  const invalid = [null, [], 12, "entry", ...["title", "date", "source", "url"].map((key) => ({
    ...validItem("Malformed record rejected"), [key]: poisoned
  })), { ...validItem("Invalid date rejected"), date: "not a date" }];
  const items = await f.refresh({ items: [...invalid, validItem("feat: Healthy same-source update")] });
  assert.equal(items.length, 3);
  assert.ok(items.some((item) => item.title === "Healthy same-source update"));
  assert.ok(items.every((item) => typeof item.title === "string" && typeof item.date === "string"));
});

test("invalid JSON feed envelopes are isolated and valid array/entries feeds still work", async (t) => {
  const f = await feedFixture(t);
  for (const body of [null, false, 7, "text", {}, { items: {} }, { items: "wrong" }, { entries: null }]) {
    const items = await f.refresh(body);
    assert.equal(items.length, 2);
  }
  for (const body of [[validItem("Valid array record")], { entries: [validItem("Valid array record")] }]) {
    assert.ok((await f.refresh(body)).some((item) => item.title === "Valid array record"));
  }
});

test("private repository updates still require the public marker and never expose repository links", async (t) => {
  const f = await feedFixture(t);
  await put(path.join(f.site, "data/sources.json"), { sources: [{
    name: "Private", repo: "fixture/private", site: "https://example.invalid/",
    visibility: "private", publish_mode: "marked", public_commit_prefix: "PUBLIC_UPDATE:"
  }], profile: { github_user: "fixture-user" } });
  const commit = (message) => ({ sha: "abcdef1234567", html_url: "https://github.com/fixture/private/commit/abcdef1", commit: {
    message, author: { date: "2026-10-22T12:00:00Z" }
  } });
  await put(f.responses, {
    "https://api.github.com/repos/fixture/private/commits?per_page=10": { body: [commit("Internal confidential work"), commit("PUBLIC_UPDATE: Published change")] },
    "https://api.github.com/graphql": { body: profileResponse }
  });
  const result = await f.run("build-updates");
  assert.equal(result.code, 0, result.stderr);
  const { items } = await readJson(path.join(f.site, "data/updates.json"));
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "Published change");
  assert.equal(items[0].url, "https://example.invalid/");
});

const pages = ["index.html", "en/index.html", "fr/index.html", "pt/index.html",
  "about/index.html", "en/about/index.html", "fr/about/index.html", "pt/about/index.html", "updates/index.html"];
const escape = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const literal = "Literal $1 $2 $& $` $' $$ <em>not markup</em>";

for (const translated of [false, true]) {
  test(`renderer preserves replacement tokens as escaped text in all four languages (${translated ? "localized" : "source"} titles)`, async (t) => {
    const f = await fixture(t, ["scripts/render-static-data.mjs", atomic, "scripts/lib/activity-copy.mjs",
      "scripts/lib/update-locales.mjs", "scripts/lib/river-presentation.mjs", ...pages]);
    await put(path.join(f.site, "data/update-notes.json"), { items: [] });
    for (const lang of ["it", "fr", "pt"]) await put(path.join(f.site, `data/update-translations/${lang}.json`), { translated_on: "2026-10-22", items: {} });
    const titles = Object.fromEntries(["it", "en", "fr", "pt"].map((lang) => [lang, `${lang} ${literal}`]));
    await put(path.join(f.site, "data/activity-titles.json"), translated ? { abcdef1: titles } : {});
    await put(path.join(f.site, "data/profile.json"), { github: { as_of: "$1", contributions_last_year: 123 } });
    await put(path.join(f.site, "data/updates.json"), { latest_item_at: "2026-10-22T12:00:00Z", items:
      Array.from({ length: 5 }, (_, i) => ({ ...validItem(`${literal} ${i}`), source: "Source $1 <em>", verified_commit: "abcdef1" }))
    });
    for (const file of pages) {
      const full = path.join(f.site, file);
      const html = await fs.readFile(full, "utf8");
      await fs.writeFile(full, html.replace(/data-prefix="[^"]*"/g, () => `data-prefix="${escape(literal)}"`));
    }
    const first = new Map();
    for (let pass = 0; pass < 2; pass++) {
      const result = await f.run("render-static-data");
      assert.equal(result.code, 0, result.stderr);
      for (const [index, file] of pages.entries()) {
        const html = await fs.readFile(path.join(f.site, file), "utf8");
        if (index < 4) {
          const lang = ["it", "en", "fr", "pt"][index];
          assert.ok(html.includes(escape(translated ? titles[lang] : `${literal} 0`)), file);
          assert.equal((html.match(/<ul class="updates-list" data-updates>/g) || []).length, 1, file);
          assert.equal((html.match(/class="update-date"/g) || []).length, 5, file);
          assert.ok(html.includes('datetime="$1"'), file);
        }
        assert.ok(!html.includes('<span class="update-title">Literal <ul'), file);
        assert.ok(!html.includes("<em>not markup</em>"), file);
        if (pass === 0) first.set(file, html);
        else assert.equal(html, first.get(file), `${file}: second render must be identical`);
      }
    }
  });
}

test("private reports use owner-only directory/file permissions and never enter the website", async (t) => {
  const f = await fixture(t, []);
  const report = path.join(f.directory, "private/report.json");
  const output = await preparePrivateReportPath(f.site, report);
  await writePrivateReport(f.site, output, "private data");
  assert.equal((await fs.stat(path.dirname(output))).mode & 0o777, 0o700);
  assert.equal((await fs.stat(output)).mode & 0o777, 0o600);
  await writePrivateReport(f.site, output, "private data");
  assert.equal((await fs.stat(output)).mode & 0o777, 0o600);
  assert.deepEqual(await fs.readdir(path.dirname(output)), ["report.json"]);
  await assert.rejects(preparePrivateReportPath(f.site, path.join(f.site, "report.json")), /outside/);
  const alias = path.join(f.directory, "site-alias");
  await fs.symlink(f.site, alias);
  await assert.rejects(preparePrivateReportPath(f.site, path.join(alias, "new/report.json")), /outside/);
  assert.deepEqual(await fs.readdir(f.site), []);
});

test("private report output refuses shared directories, shared files, symlinks, and hard links", async (t) => {
  const f = await fixture(t, []);
  const output = await preparePrivateReportPath(f.site, path.join(f.directory, "private/report.json"));
  await writePrivateReport(f.site, output, "keep existing work");
  const alias = path.join(path.dirname(output), "alias.json");
  await fs.symlink(output, alias);
  await assert.rejects(writePrivateReport(f.site, alias, "replace"), /owner-only/);
  await fs.unlink(alias);
  await fs.link(output, alias);
  await assert.rejects(writePrivateReport(f.site, output, "replace"), /owner-only/);
  await fs.unlink(alias);
  await fs.chmod(output, 0o644);
  await assert.rejects(writePrivateReport(f.site, output, "replace"), /owner-only/);
  await fs.chmod(output, 0o600);
  await fs.chmod(path.dirname(output), 0o755);
  await assert.rejects(writePrivateReport(f.site, output, "replace"), /0700/);
  assert.equal(await fs.readFile(output, "utf8"), "keep existing work");
});

const reportFiles = ["scripts/search-console-report.mjs", "scripts/lib/private-report.mjs", atomic];
const marker = "PRIVATE_ANALYTICS_MUST_NOT_APPEAR_IN_LOGS";
test("Search Console reporting refuses CI before credentials, API calls, or summary writes", async (t) => {
  const f = await fixture(t, reportFiles);
  const summary = path.join(f.directory, "summary.txt");
  for (const key of ["CI", "GITHUB_ACTIONS", "GITHUB_STEP_SUMMARY"]) {
    const result = await f.run("search-console-report", { [key]: key === "GITHUB_STEP_SUMMARY" ? summary : "true",
      GOOGLE_SERVICE_ACCOUNT_JSON: marker });
    assert.notEqual(result.code, 0);
    assert.doesNotMatch(result.stdout + result.stderr, new RegExp(`${marker}|MOCK_REQUEST`));
  }
  await assert.rejects(fs.access(summary));
  assert.deepEqual(await fs.readdir(f.home), []);
});

test("Search Console mocked success is private; OAuth/API/credential failures preserve the old report without leaking", async (t) => {
  const f = await fixture(t, reportFiles);
  await put(path.join(f.site, "data/site.json"), { priority_urls: ["https://example.invalid/"] });
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
  const env = { GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: "fixture@example.invalid", private_key: privateKey }), SEARCH_CONSOLE_QUERY: marker };
  const oauth = "https://oauth2.googleapis.com/token";
  const analytics = "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aarmeltenkiang.com/searchAnalytics/query";
  const responses = {
    [oauth]: { body: { access_token: "dummy-access-token" } },
    [analytics]: { body: { rows: [{ keys: [marker], clicks: 9, impressions: 4321 }] } },
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect": { body: { inspectionResult: { indexStatusResult: { verdict: "PASS" } } } },
    "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aarmeltenkiang.com/sitemaps": { body: { sitemap: [] } }
  };
  await put(f.responses, responses);
  const result = await f.run("search-console-report", env);
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, new RegExp(`${marker}|4321|dummy-access-token|PRIVATE KEY`));
  const file = path.join(f.home, ".local/share/armeltenkiang/search-console/report.json");
  const original = await fs.readFile(file, "utf8");
  assert.equal(JSON.parse(original).periods.last_28_days.totals.impressions, 4321);
  assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
  for (const endpoint of [oauth, analytics]) {
    await put(f.responses, { ...responses, [endpoint]: { status: 403, body: { error: { message: marker } } } });
    const failed = await f.run("search-console-report", env);
    assert.notEqual(failed.code, 0);
    assert.doesNotMatch(failed.stdout + failed.stderr, new RegExp(marker));
    assert.equal(await fs.readFile(file, "utf8"), original);
  }
  const malformed = await f.run("search-console-report", { GOOGLE_SERVICE_ACCOUNT_JSON: `{"secret":"${marker}"` });
  assert.notEqual(malformed.code, 0);
  assert.doesNotMatch(malformed.stdout + malformed.stderr, new RegExp(marker));
  assert.equal(await fs.readFile(file, "utf8"), original);
});

test("public workflows cannot collect or upload Search Console reports", async () => {
  const directory = path.join(root, ".github/workflows");
  for (const file of await fs.readdir(directory)) {
    const workflow = await fs.readFile(path.join(directory, file), "utf8");
    assert.doesNotMatch(workflow, /search-console-report|GOOGLE_SERVICE_ACCOUNT_JSON|SEARCH_CONSOLE_REPORT_PATH/i, file);
  }
});
