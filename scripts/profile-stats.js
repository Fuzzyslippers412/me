const loadProfileStats = async () => {
  try {
    const response = await fetch("/data/profile.json", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = await response.json();
    const contributions = data?.github?.contributions_last_year;
    if (typeof contributions === "number") {
      document.querySelectorAll("[data-github-contribs]").forEach((el) => {
        el.textContent = contributions.toString();
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
          day: "numeric"
        });
        document.querySelectorAll("[data-github-asof]").forEach((el) => {
          el.textContent = formatted;
        });
      }
    }
  } catch (error) {
    // Ignore errors and keep fallback text.
  }
};

loadProfileStats();
