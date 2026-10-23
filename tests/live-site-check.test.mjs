import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { createSnapshotSource, checkLiveSite, verifyLiveFile } from "../scripts/lib/live-site-check.mjs";

const exec = promisify(execFile);
const origin = "https://armeltenkiang.com";
const logger = { log() {}, warn() {} };
const html = (url, stamp = "18:52", count = 251) => Buffer.from(
  `<link rel="canonical" href="${url}"><h1>Armel Tenkiang</h1><p>Last checked: ${stamp} UTC</p><p>${count}</p>`
);
const page = (route, stamp, count) => ({
  url: `${origin}${route}`, file: `${route.slice(1)}index.html`, type: "html",
  expected: html(`${origin}${route}`, stamp, count)
});
const snapshot = (revision) => ({ revision, files: ["/", "/en/", "/fr/", "/pt/"].map(
  (route) => page(route, revision === "old" ? "18:28" : "18:52", revision === "old" ? 250 : 251)
) });
const response = (file, { body = file.expected, status = 200, headers = {}, url = file.url } = {}) => {
  const contentType = { html: "text/html", css: "text/css", png: "image/png", xml: "application/xml", text: "text/plain" }[file.type];
  const result = new Response(body, { status, headers: { "content-type": contentType, ...headers } });
  Object.defineProperty(result, "url", { value: url });
  return result;
};
const findFile = (files, input) => files.find((file) => new URL(file.url).pathname === new URL(input).pathname);
const fixedSource = (value) => ({ load: async () => value, currentRevision: async () => value.revision });

test("live checker follows a refresh mid-comparison and rechecks all four languages at one new SHA", async () => {
  let current = "old";
  const loads = [];
  const checked = [];
  const source = {
    load: async () => { loads.push(current); return snapshot(current); },
    currentRevision: async () => current
  };
  const result = await checkLiveSite({ source, attempts: 2, logger, sleep: async () => {}, fetchImpl: async (url) => {
    current = "new";
    checked.push(new URL(url).pathname);
    return response(findFile(snapshot(current).files, url));
  } });
  assert.equal(result.ok, true);
  assert.equal(result.revision, "new");
  assert.deepEqual(loads, ["old", "new"]);
  assert.deepEqual(checked, ["/", "/en/", "/fr/", "/pt/", "/", "/en/", "/fr/", "/pt/"]);
});

test("matching an obsolete commit cannot pass when main moves before the final revision check", async () => {
  let checks = 0;
  const source = { load: async () => snapshot("old"), currentRevision: async () => "new" };
  const result = await checkLiveSite({ source, attempts: 2, logger, sleep: async () => {}, fetchImpl: async (url) => {
    checks += 1;
    return response(findFile(snapshot("old").files, url));
  } });
  assert.equal(result.ok, false);
  assert.equal(checks, 8);
  assert.match(result.failures.join("\n"), /main advanced from old to new/);
});

test("deployment propagation retries but does not ignore changed timestamps or contribution counts", async () => {
  let live = "old";
  let delays = 0;
  const result = await checkLiveSite({ source: fixedSource(snapshot("new")), attempts: 2, logger,
    sleep: async () => { delays += 1; live = "new"; },
    fetchImpl: async (url) => response(findFile(snapshot(live).files, url))
  });
  assert.equal(result.ok, true);
  assert.equal(delays, 1);
  for (const field of ["stamp", "count"]) {
    const file = page("/", "18:52", 251);
    await assert.rejects(verifyLiveFile(file, async () => response(file, {
      body: html(file.url, field === "stamp" ? "18:28" : "18:52", field === "count" ? 250 : 251)
    })), /does not match/);
  }
});

test("a partially deployed or permanently stale language still fails after bounded retries", async () => {
  let requests = 0;
  const result = await checkLiveSite({ source: fixedSource(snapshot("new")), attempts: 3, logger,
    sleep: async () => {}, fetchImpl: async (url) => {
      requests += 1;
      const version = new URL(url).pathname === "/fr/" ? "old" : "new";
      return response(findFile(snapshot(version).files, url));
    }
  });
  assert.equal(result.ok, false);
  assert.equal(requests, 12);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /fr\/index.html.*does not match/);
});

test("HTTP errors, redirects, incorrect types and indexing defects still fail", async () => {
  const file = page("/");
  for (const [options, error] of [
    [{ status: 404 }, /HTTP 404/],
    [{ headers: { "content-type": "text/plain" } }, /not served as HTML/],
    [{ headers: { "x-robots-tag": "noindex" } }, /noindex/],
    [{ url: `${origin}/en/` }, /unexpectedly redirects/],
    [{ url: "https://other.invalid/" }, /unexpectedly redirects/],
    [{ body: html(`${origin}/wrong/`) }, /declares/],
    [{ body: Buffer.from(`<meta name="robots" content="noindex">${file.expected}`) }, /contains noindex/],
    [{ body: Buffer.from(`<link rel="canonical" href="${origin}/">Missing identity`) }, /does not identify/],
    [{ body: Buffer.from("<h1>Armel Tenkiang</h1>") }, /no canonical URL/]
  ]) {
    const expected = options.body ? { ...file, expected: options.body } : file;
    await assert.rejects(verifyLiveFile(expected, async () => response(file, options)), error);
  }
  for (const type of ["css", "png", "xml"]) {
    const asset = { ...file, type, expected: Buffer.from("asset") };
    await assert.rejects(verifyLiveFile(asset, async () => response(asset, {
      headers: { "content-type": "text/html" }
    })), /not served as/);
    await assert.rejects(verifyLiveFile(asset, async () => response(asset, { body: "changed" })), /does not match/);
  }
});

test("network and revision lookup failures cannot produce success or fall back to stale files", async () => {
  for (const source of [
    { load: async () => { throw new Error("Git unavailable"); } },
    { load: async () => snapshot("new"), currentRevision: async () => { throw new Error("Revision check unavailable"); } }
  ]) {
    const result = await checkLiveSite({ source, logger, fetchImpl: async (url) => response(findFile(snapshot("new").files, url)) });
    assert.equal(result.ok, false);
    assert.match(result.failures[0], /unavailable/);
  }
  const result = await checkLiveSite({ source: fixedSource(snapshot("new")), logger,
    fetchImpl: async () => { throw new Error("Request timed out"); }
  });
  assert.equal(result.ok, false);
  assert.equal(result.failures.length, 4);
});

test("a transient snapshot lookup failure retries rather than silently skipping the check", async () => {
  let calls = 0;
  const source = { ...fixedSource(snapshot("new")), load: async () => {
    if (++calls === 1) throw new Error("Temporary Git failure");
    return snapshot("new");
  } };
  const result = await checkLiveSite({ source, attempts: 2, logger, sleep: async () => {},
    fetchImpl: async (url) => response(findFile(snapshot("new").files, url))
  });
  assert.equal(result.ok, true);
  assert.equal(calls, 2);
});

test("only CRLF and trailing whitespace are normalized; requests bypass stale caches", async () => {
  const file = page("/");
  await verifyLiveFile(file, async (url, options) => {
    assert.ok(new URL(url).searchParams.has("site-health"));
    assert.equal(options.headers["cache-control"], "no-cache");
    assert.ok(options.signal instanceof AbortSignal);
    return response(file, { body: `${file.expected}\r\n` });
  });
});

test("shallow remote snapshots fetch new commits without changing checkout, index, refs, FETCH_HEAD or untracked work", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "armel-live-git-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const upstream = path.join(directory, "upstream");
  const checkout = path.join(directory, "checkout");
  const home = path.join(directory, "home");
  await fs.mkdir(upstream);
  await fs.mkdir(home);
  // Local Git fixtures only: no inherited tokens, user configuration, hooks, or signing.
  const env = { PATH: process.env.PATH, HOME: home, GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null" };
  const git = async (cwd, ...args) => (await exec("git", args, { cwd, env, timeout: 10000 })).stdout.trim();
  await git(upstream, "init", "-b", "main");
  await git(upstream, "config", "user.name", "Fixture");
  await git(upstream, "config", "user.email", "fixture@example.invalid");
  await fs.mkdir(path.join(upstream, "data"));
  const writeSnapshot = async (version, extra = false) => {
    const value = snapshot(version);
    if (extra) value.files.push(page("/updates/", "18:52"));
    await fs.writeFile(path.join(upstream, "data/site.json"), JSON.stringify({ priority_urls: value.files.map((file) => file.url) }));
    for (const file of value.files) {
      await fs.mkdir(path.dirname(path.join(upstream, file.file)), { recursive: true });
      await fs.writeFile(path.join(upstream, file.file), file.expected);
    }
    for (const file of ["robots.txt", "sitemap.xml", "favicon-48.png", "favicon.png", "apple-touch-icon.png", "og-image.png", "style.css"]) {
      await fs.writeFile(path.join(upstream, file), file);
    }
    await git(upstream, "add", ".");
    await git(upstream, "commit", "-m", version);
    return git(upstream, "rev-parse", "HEAD");
  };
  const old = await writeSnapshot("old");
  await git(directory, "clone", "--depth=1", "--no-local", upstream, checkout);
  assert.equal(await git(checkout, "rev-parse", "--is-shallow-repository"), "true");
  const current = await writeSnapshot("new", true);
  const protectedFiles = ["RELEASE_REVIEW 2.md", "apple-touch-icon 2.png", "scripts/lib/presentation 2.mjs", "tests/site.test 2.mjs"];
  for (const file of protectedFiles) {
    await fs.mkdir(path.dirname(path.join(checkout, file)), { recursive: true });
    await fs.writeFile(path.join(checkout, file), `Unreviewed work: ${file}`);
  }
  await fs.writeFile(path.join(checkout, "index.html"), "Uncommitted homepage");
  await git(checkout, "add", "index.html");
  await fs.writeFile(path.join(checkout, "style.css"), "Unstaged stylesheet");
  await fs.writeFile(path.join(checkout, ".git/FETCH_HEAD"), "Keep previous fetch state\n");
  const state = async () => ({
    head: await git(checkout, "rev-parse", "HEAD"), refs: await git(checkout, "show-ref"),
    status: await git(checkout, "status", "--porcelain=v1"),
    index: await fs.readFile(path.join(checkout, ".git/index")),
    fetchHead: await fs.readFile(path.join(checkout, ".git/FETCH_HEAD")),
    files: await Promise.all(["index.html", "style.css", ...protectedFiles].map((file) => fs.readFile(path.join(checkout, file))))
  });
  const before = await state();
  const source = createSnapshotSource(checkout);
  const pinned = await source.load();
  assert.equal(pinned.revision, current);
  assert.equal(pinned.files.length, 12); // New remote configuration, not the old local priority list.
  assert.ok(pinned.files.some((file) => file.file === "updates/index.html"));
  assert.equal(pinned.files[0].expected.toString(), html(`${origin}/`).toString());
  assert.deepEqual(await state(), before);
  assert.equal(before.head, old);
  const result = await checkLiveSite({ source, logger,
    fetchImpl: async (url) => response(findFile(pinned.files, url))
  });
  assert.equal(result.ok, true);
  assert.deepEqual(await state(), before);
  const local = await createSnapshotSource(checkout, { local: true }).load();
  assert.equal(local.revision, "local working files");
  assert.equal(local.files[0].expected.toString(), "Uncommitted homepage");
  assert.equal(local.files.length, 11);
});

test("CLI rejects invalid retry settings before accessing Git or the network", async () => {
  const script = fileURLToPath(new URL("../scripts/check-live-site.mjs", import.meta.url));
  for (const [name, value] of [["LIVE_CHECK_ATTEMPTS", "NaN"], ["LIVE_CHECK_ATTEMPTS", "0"], ["LIVE_CHECK_DELAY_MS", "12oops"]]) {
    await assert.rejects(exec(process.execPath, [script], {
      env: { PATH: path.dirname(process.execPath), [name]: value }, timeout: 5000
    }), (error) => error.code === 1 && error.stderr.includes(`${name} must be a positive integer`));
  }
});
