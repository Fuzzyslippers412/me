import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileAtomically } from "./lib/write-atomically.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "data");
const sourcesPath = path.join(dataDir, "sources.json");
const updatesPath = path.join(dataDir, "updates.json");
const profilePath = path.join(dataDir, "profile.json");
const updateNotesPath = path.join(dataDir, "update-notes.json");
const MAX_UPDATES = 5;
const MAX_PER_SOURCE = 5;
const MAX_FINAL_PER_SOURCE = 3;
const REQUIRE_FRESH_PROFILE = process.env.REQUIRE_FRESH_PROFILE === "1";
const warn = (message) => console.warn(`[activity] ${message}`);

const getGitHubToken = () =>
  process.env.GITHUB_PROFILE_TOKEN || process.env.GH_STATS_TOKEN || process.env.GITHUB_TOKEN || "";
const hasExplicitProfileToken = () => Boolean(
  process.env.GITHUB_PROFILE_TOKEN || process.env.GH_STATS_TOKEN
);

const getRepoToken = (source) => {
  if (source?.visibility === "private") {
    return process.env.PROJECTS_READ_TOKEN || process.env.GITHUB_PROJECTS_TOKEN || getGitHubToken();
  }
  return getGitHubToken();
};

const readJson = async (filePath) => {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
};

const comparableJson = (value) => {
  if (!value || typeof value !== "object") return value;
  const { generated_at, ...rest } = value;
  return rest;
};

const writeJsonIfChanged = async (filePath, nextValue, previousValue) => {
  if (JSON.stringify(comparableJson(previousValue)) === JSON.stringify(nextValue)) {
    return false;
  }
  const output = {
    generated_at: new Date().toISOString(),
    ...nextValue
  };
  await writeFileAtomically(filePath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  return true;
};

const safeTime = (value) => {
  const time = Date.parse(value || "");
  return Number.isNaN(time) ? 0 : time;
};

const cleanUpdateTitle = (value) => {
  const title = String(value || "Update")
    .replace(/^(feat|fix|perf|refactor)(\([^)]+\))?:\s*/i, "")
    .trim();
  return title ? `${title[0].toUpperCase()}${title.slice(1)}` : "Update";
};

const isPresentableUpdate = (item) => {
  const title = String(item?.title || "").trim();
  return title.length >= 8 && !/^(chore|ci|build|style|test|docs)(\([^)]+\))?:|^merge\b|^wip\b|^save (local|remaining)|^initial commit$/i.test(title);
};

const dedupeItems = (items) => {
  const seen = new Set();
  return items.filter((item) => {
    const identity = item.verified_commit || item.title;
    const key = `${item.source}|${identity}`.trim().toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const selectRecentUpdates = (items) => {
  const sourceCounts = new Map();
  const selected = [];
  for (const item of [...items].sort((a, b) => safeTime(b.date) - safeTime(a.date))) {
    const count = sourceCounts.get(item.source) || 0;
    if (count >= MAX_FINAL_PER_SOURCE) continue;
    selected.push(item);
    sourceCounts.set(item.source, count + 1);
    if (selected.length === MAX_UPDATES) break;
  }
  return selected.sort((a, b) => safeTime(b.date) - safeTime(a.date));
};

const extractTag = (block, tag) => {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = block.match(regex);
  return match ? match[1].trim() : "";
};

const extractLink = (block) => {
  const attrMatch = block.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i);
  if (attrMatch) {
    return attrMatch[1].trim();
  }
  return extractTag(block, "link");
};

const parseXmlFeed = (xml, source) => {
  const items = [];
  const itemBlocks = xml.match(new RegExp("<item>[\\s\\S]*?<\\/item>", "gi")) || [];
  const entryBlocks = xml.match(new RegExp("<entry>[\\s\\S]*?<\\/entry>", "gi")) || [];
  const blocks = itemBlocks.length ? itemBlocks : entryBlocks;

  for (const block of blocks) {
    const title = extractTag(block, "title") || "Update";
    const date =
      extractTag(block, "pubDate") ||
      extractTag(block, "updated") ||
      extractTag(block, "dc:date") ||
      "";
    const url = extractLink(block) || source.site;

    items.push({
      source: source.name,
      title,
      date,
      url
    });
  }

  return items;
};

const normalizeJsonItems = (data, source) => {
  const rawItems = Array.isArray(data) ? data : data.items || data.entries || [];
  return rawItems.map((item) => ({
    source: item.source || source.name,
    title: item.title || item.summary || "Update",
    date: item.date || item.published || item.updated || "",
    url: item.url || item.link || source.site
  }));
};

const fetchFeedUpdates = async (source) => {
  if (!source.feed) {
    return [];
  }

  try {
    const response = await fetch(source.feed, {
      headers: { "User-Agent": "armeltenkiang.com updates" }
    });
    if (!response.ok) {
      warn(`${source.name} feed returned HTTP ${response.status}; retaining verified fallbacks.`);
      return [];
    }

    const text = await response.text();
    const trimmed = text.trim();

    if (trimmed.startsWith("{")) {
      return normalizeJsonItems(JSON.parse(trimmed), source);
    }
    if (trimmed.startsWith("[")) {
      return normalizeJsonItems(JSON.parse(trimmed), source);
    }

    return parseXmlFeed(trimmed, source);
  } catch (error) {
    warn(`${source.name} feed could not be read; retaining verified fallbacks.`);
    return [];
  }
};

const fetchGitHubUpdates = async (source) => {
  if (!source.repo) {
    return [];
  }

  const token = getRepoToken(source);
  const headers = {
    Accept: "application/vnd.github+json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${source.repo}/commits?per_page=10`,
      { headers }
    );
    if (!response.ok) {
      warn(`${source.name} repository returned HTTP ${response.status}; retaining verified fallbacks.`);
      return [];
    }

    const commits = await response.json();
    if (!Array.isArray(commits)) {
      return [];
    }

    return commits.map((commit) => {
      const message = commit.commit?.message || "Update";
      let title = message.split("\n")[0].trim();
      if (source.publish_mode === "marked") {
        const prefix = String(source.public_commit_prefix || "PUBLIC_UPDATE:");
        if (!title.startsWith(prefix)) return null;
        title = title.slice(prefix.length).trim();
      }
      return {
        source: source.name,
        title,
        date: commit.commit?.author?.date || commit.commit?.committer?.date || "",
        url: source.visibility === "private" ? source.site : (commit.html_url || source.site),
        verified_commit: String(commit.sha || "").slice(0, 7)
      };
    }).filter(Boolean);
  } catch (error) {
    warn(`${source.name} repository could not be read; retaining verified fallbacks.`);
    return [];
  }
};

const fetchGitHubContributionsFromHtml = async (login) => {
  try {
    const response = await fetch(`https://github.com/users/${login}/contributions`, {
      headers: { "User-Agent": "armeltenkiang.com updates" }
    });
    if (!response.ok) {
      warn("GitHub contribution HTML was unavailable.");
      return null;
    }
    const html = await response.text();
    const matches = [...html.matchAll(/data-count="(\d+)"/g)];
    if (!matches.length) {
      const headingMatch = html.match(
        /id="js-contribution-activity-description"[\s\S]*?>[\s\S]*?([0-9][0-9,]*)\s+contributions/i
      );
      if (headingMatch?.[1]) {
        return Number(headingMatch[1].replace(/,/g, ""));
      }

      const yearMatch = html.match(/([0-9][0-9,]*)\s+contributions\s+in\s+the\s+last\s+year/i);
      if (yearMatch?.[1]) {
        return Number(yearMatch[1].replace(/,/g, ""));
      }
      return null;
    }
    return matches.reduce((total, match) => total + Number(match[1]), 0);
  } catch (error) {
    warn("GitHub contribution HTML could not be read.");
    return null;
  }
};

const fetchGitHubContributions = async (login) => {
  if (!login) {
    return null;
  }

  const token = getGitHubToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body = JSON.stringify({
    query: `query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
          }
        }
      }
    }`,
    variables: { login }
  });

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body
    });
    if (response.ok) {
      const payload = await response.json();
      const total = payload?.data?.user?.contributionsCollection?.contributionCalendar?.totalContributions;
      if (typeof total === "number") {
        return total;
      }
    }
  } catch (error) {
    // fall through to HTML fallback
  }

  warn("GitHub contribution GraphQL data was unavailable; trying the public contribution graph.");

  return fetchGitHubContributionsFromHtml(login);
};

const fetchGitHubProfileStats = async (login, trackedRepos = []) => {
  if (!login) {
    return null;
  }

  const token = getGitHubToken();
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const now = new Date();
  const year = now.getUTCFullYear();
  const from = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString();
  const to = now.toISOString();
  const trackedRepoSet = new Set(trackedRepos.map((repo) => repo.toLowerCase()));

  const body = JSON.stringify({
    query: `query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        lastYear: contributionsCollection {
          contributionCalendar {
            totalContributions
          }
          restrictedContributionsCount
        }
        currentYear: contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          contributionCalendar {
            totalContributions
          }
          commitContributionsByRepository(maxRepositories: 100) {
            repository {
              nameWithOwner
            }
            contributions(first: 100) {
              totalCount
            }
          }
        }
      }
    }`,
    variables: { login, from, to }
  });

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers,
      body
    });
    if (!response.ok) {
      warn(`GitHub profile statistics returned HTTP ${response.status}.`);
      return null;
    }

    const payload = await response.json();
    const lastYear = payload?.data?.user?.lastYear;
    const currentYear = payload?.data?.user?.currentYear;
    const contributionsLastYear = lastYear?.contributionCalendar?.totalContributions;
    const currentYearTotal = currentYear?.contributionCalendar?.totalContributions;
    const currentYearCommits = currentYear?.totalCommitContributions;
    const trackedProjectCommits = Array.isArray(currentYear?.commitContributionsByRepository)
      ? currentYear.commitContributionsByRepository.reduce((total, repoStats) => {
          const repoName = repoStats?.repository?.nameWithOwner?.toLowerCase();
          if (!repoName || !trackedRepoSet.has(repoName)) {
            return total;
          }
          return total + (repoStats?.contributions?.totalCount || 0);
        }, 0)
      : null;

    if (typeof contributionsLastYear !== "number") {
      return null;
    }

    return {
      year,
      as_of: now.toISOString().slice(0, 10),
      window_started_at: from.slice(0, 10),
      measurement_source: "github_graphql_contributions_collection",
      contributions_last_year: contributionsLastYear,
      total_contributions_this_year:
        typeof currentYearTotal === "number" ? currentYearTotal : null,
      commit_contributions_this_year:
        typeof currentYearCommits === "number" ? currentYearCommits : null,
      tracked_project_commit_contributions_this_year:
        typeof trackedProjectCommits === "number" ? trackedProjectCommits : null,
      restricted_contributions_count:
        typeof lastYear?.restrictedContributionsCount === "number"
          ? lastYear.restrictedContributionsCount
          : 0
    };
  } catch (error) {
    warn("GitHub profile statistics could not be read.");
    return null;
  }
};

const fetchGitHubRepoCommitCountSince = async (source, author, since) => {
  if (!source?.repo || !author || !since) {
    return null;
  }

  const token = getRepoToken(source);
  const headers = {
    Accept: "application/vnd.github+json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let page = 1;
  let total = 0;

  while (true) {
    try {
      const params = new URLSearchParams({
        per_page: "100",
        page: String(page),
        since,
        author
      });
      const response = await fetch(`https://api.github.com/repos/${source.repo}/commits?${params}`, { headers });
      if (!response.ok) {
        warn(`${source.name} commit count returned HTTP ${response.status}.`);
        return total > 0 ? total : null;
      }

      const commits = await response.json();
      if (!Array.isArray(commits) || commits.length === 0) {
        return total;
      }

      total += commits.length;
      if (commits.length < 100) {
        return total;
      }

      page += 1;
    } catch (error) {
      warn(`${source.name} commit count could not be read.`);
      return total > 0 ? total : null;
    }
  }
};

const fetchTrackedProjectCommitCountSince = async (sources, author, since) => {
  let total = 0;
  let counted = false;

  for (const source of sources) {
    if (!source?.repo) {
      continue;
    }

    const repoCount = await fetchGitHubRepoCommitCountSince(source, author, since);
    if (typeof repoCount === "number") {
      total += repoCount;
      counted = true;
    }
  }

  return counted ? total : null;
};


const main = async () => {
  const { sources, profile } = await readJson(sourcesPath);
  const updateNotes = await readJson(updateNotesPath);
  const githubUser = profile?.github_user || "";
  if (REQUIRE_FRESH_PROFILE && !hasExplicitProfileToken()) {
    throw new Error(
      "GH_STATS_TOKEN is required for an account-level contribution snapshot; the repository GITHUB_TOKEN is not accepted as an exact-profile source."
    );
  }
  const perSourceItems = [];
  let previousUpdates = null;
  try {
    previousUpdates = await readJson(updatesPath);
  } catch (error) {
    previousUpdates = null;
  }

  const noteItems = (updateNotes.items || []).filter((note) => !note.historical).map((note) => ({
    source: note.source,
    title: note.title,
    date: note.date,
    url: `/updates/${note.slug}/`,
    source_url: note.source_url,
    summary: note.summary,
    verified_commit: note.verified_commit,
    editorial: true
  }));

  for (const source of sources) {
    const feedItems = await fetchFeedUpdates(source);
    const gitItems = await fetchGitHubUpdates(source);
    const sourceNotes = noteItems.filter((item) => item.source === source.name);
    // A provider outage must not erase the last verified public snapshot.
    const previousSourceItems = (previousUpdates?.items || []).filter(
      (item) => item.source === source.name
    );
    const combined = [...sourceNotes, ...feedItems, ...gitItems, ...previousSourceItems];

    const normalized = combined
      .filter((item) => item && item.date && isPresentableUpdate(item))
      .map((item) => ({
        source: item.source || source.name,
        title: cleanUpdateTitle(item.title),
        date: item.date,
        url: item.url || source.site,
        ...(item.source_url ? { source_url: item.source_url } : {}),
        ...(item.summary ? { summary: item.summary } : {}),
        ...(item.verified_commit ? { verified_commit: item.verified_commit } : {}),
        ...(item.editorial ? { editorial: true } : {})
      }));

    const unique = dedupeItems(normalized).sort((a, b) => safeTime(b.date) - safeTime(a.date));
    perSourceItems.push(unique.slice(0, MAX_PER_SOURCE));
  }

  const finalItems = selectRecentUpdates(
    dedupeItems(perSourceItems.flat()).sort((a, b) => safeTime(b.date) - safeTime(a.date))
  );
  const latestItemAt = finalItems.length > 0 ? finalItems[0].date : null;
  const output = {
    latest_item_at: latestItemAt,
    items: finalItems
  };

  const updatesChanged = await writeJsonIfChanged(updatesPath, output, previousUpdates);
  console.log(updatesChanged
    ? `Wrote ${output.items.length} updates to ${updatesPath}`
    : "Project updates are unchanged.");

  let previousProfile = null;
  try {
    previousProfile = await readJson(profilePath);
  } catch (error) {
    previousProfile = null;
  }

  const profileStats = await fetchGitHubProfileStats(
    githubUser,
    sources.map((source) => source.repo).filter(Boolean)
  );
  if (REQUIRE_FRESH_PROFILE && !profileStats) {
    throw new Error(
      "A fresh GitHub GraphQL contribution snapshot is required. Check GH_STATS_TOKEN, account access, and Actions network status."
    );
  }
  const statsYearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1, 0, 0, 0)).toISOString();
  const trackedProjectCommitCount = typeof profileStats?.tracked_project_commit_contributions_this_year === "number"
    ? profileStats.tracked_project_commit_contributions_this_year
    : await fetchTrackedProjectCommitCountSince(sources, githubUser, statsYearStart);
  const contributions =
    typeof profileStats?.contributions_last_year === "number"
      ? profileStats.contributions_last_year
      : await fetchGitHubContributions(githubUser);
  const fallbackContributions = previousProfile?.github?.contributions_last_year ?? null;
  const contributionsValue = typeof contributions === "number" ? contributions : fallbackContributions;
  const asOf =
    profileStats?.as_of ||
    (typeof contributions === "number"
      ? new Date().toISOString().slice(0, 10)
      : (previousProfile?.github?.as_of || null));
  const statsYear =
    typeof profileStats?.year === "number"
      ? profileStats.year
      : (previousProfile?.github?.year || new Date().getUTCFullYear());

  const profileOutput = {
    github: {
      user: githubUser,
      measurement_source:
        profileStats?.measurement_source ||
        previousProfile?.github?.measurement_source ||
        "retained_verified_snapshot",
      window_started_at:
        profileStats?.window_started_at || previousProfile?.github?.window_started_at || null,
      contributions_last_year: contributionsValue,
      total_contributions_this_year:
        typeof profileStats?.total_contributions_this_year === "number"
          ? profileStats.total_contributions_this_year
          : (previousProfile?.github?.total_contributions_this_year ?? null),
      commit_contributions_this_year:
        typeof profileStats?.commit_contributions_this_year === "number"
          ? profileStats.commit_contributions_this_year
          : (previousProfile?.github?.commit_contributions_this_year ?? null),
      tracked_project_commit_contributions_this_year:
        typeof trackedProjectCommitCount === "number"
          ? trackedProjectCommitCount
          : (previousProfile?.github?.tracked_project_commit_contributions_this_year ?? null),
      restricted_contributions_count:
        typeof profileStats?.restricted_contributions_count === "number"
          ? profileStats.restricted_contributions_count
          : (previousProfile?.github?.restricted_contributions_count ?? 0),
      year: statsYear,
      as_of: asOf
    }
  };

  const profileChanged = await writeJsonIfChanged(profilePath, profileOutput, previousProfile);
  console.log(profileChanged ? `Wrote profile stats to ${profilePath}` : "GitHub profile stats are unchanged.");
};

main();
