const loadProfileStats = async () => {
  try {
    const response = await fetch("/data/profile.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const langKey = (document.documentElement.lang || "en").slice(0, 2);
    const warnings = {
      en: "Cached snapshot; source verification pending.",
      it: "Snapshot in cache; verifica della fonte in attesa.",
      fr: "Instantané en cache ; vérification de la source en attente.",
      pt: "Snapshot em cache; verificação da fonte pendente."
    };
    document.querySelectorAll("[data-github-quality]").forEach((el) => {
      el.textContent = data?.github?.measurement_source === "github_graphql_contributions_collection"
        ? "" : warnings[langKey] || warnings.en;
    });
    const contributions = data?.github?.contributions_last_year;
    if (typeof contributions === "number") {
      document.querySelectorAll("[data-github-contribs]").forEach((el) => {
        el.textContent = contributions.toString();
      });
    }

    const year = data?.github?.year;
    if (typeof year === "number") {
      document.querySelectorAll("[data-github-year]").forEach((el) => {
        el.textContent = year.toString();
      });
    }

    const totalYear = data?.github?.total_contributions_this_year;
    if (typeof totalYear === "number") {
      document.querySelectorAll("[data-github-total-year]").forEach((el) => {
        el.textContent = totalYear.toString();
      });
    }

    const commitYear = data?.github?.commit_contributions_this_year;
    if (typeof commitYear === "number") {
      document.querySelectorAll("[data-github-year-commits]").forEach((el) => {
        el.textContent = commitYear.toString();
      });
    }

    const trackedCommitYear = data?.github?.tracked_project_commit_contributions_this_year;
    if (typeof trackedCommitYear === "number") {
      document.querySelectorAll("[data-tracked-year-commits]").forEach((el) => {
        el.textContent = trackedCommitYear.toString();
      });
    }

    const asOf = data?.github?.as_of;
    if (asOf) {
      const lang = document.documentElement.lang || "en";
      const date = new Date(`${asOf}T00:00:00Z`);
      if (!Number.isNaN(date.getTime())) {
        const formatted = date.toLocaleDateString(lang, {
          year: "numeric",
          month: "long",
          day: "numeric",
          timeZone: "UTC"
        });
        document.querySelectorAll("[data-github-asof]").forEach((el) => {
          el.textContent = formatted;
          if (el instanceof HTMLTimeElement) {
            el.dateTime = asOf;
          }
        });
      }
    }
  } catch (error) {
    // Ignore errors and keep fallback text.
  }
};

loadProfileStats();
