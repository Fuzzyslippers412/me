(() => {
  const list = document.querySelector("[data-updates]");
  if (!list) {
    return;
  }

  const DATA_URL = "/data/projects.json";
  const PLACEHOLDER = /YOUR-GITHUB-ORG|YOUR-USERNAME|YOUR-REPO/i;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "Recent";
    }
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const cleanMessage = (message) => {
    if (!message) return "Update";
    const firstLine = message.split("\n")[0].trim();
    return firstLine.replace(/\s+/g, " ");
  };

  const fetchLatestCommit = async (project) => {
    if (!project || !project.repo || PLACEHOLDER.test(project.repo)) {
      return null;
    }

    const response = await fetch(
      `https://api.github.com/repos/${project.repo}/commits?per_page=1`,
      { headers: { Accept: "application/vnd.github+json" } }
    );

    if (!response.ok) {
      return null;
    }

    const commits = await response.json();
    const latest = commits && commits[0];
    if (!latest || !latest.commit) {
      return null;
    }

    return {
      name: project.name,
      url: project.url,
      date: latest.commit.author?.date || latest.commit.committer?.date,
      message: cleanMessage(latest.commit.message)
    };
  };

  const updateList = async () => {
    try {
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      const projects = Array.isArray(data.projects) ? data.projects : [];
      const updates = (await Promise.all(projects.map(fetchLatestCommit))).filter(Boolean);

      if (!updates.length) {
        return;
      }

      updates.sort((a, b) => new Date(b.date) - new Date(a.date));

      list.innerHTML = "";
      updates.slice(0, 6).forEach((item) => {
        const li = document.createElement("li");
        const link = document.createElement("a");
        link.href = item.url || "/";
        link.textContent = `${formatDate(item.date)} — ${item.name}: ${item.message}`;
        li.appendChild(link);
        list.appendChild(li);
      });
    } catch (error) {
      // If GitHub is rate-limited or offline, keep the fallback list.
    }
  };

  document.addEventListener("DOMContentLoaded", updateList);
})();
