(() => {
  const list = document.querySelector("[data-updates]");
  if (!list) {
    return;
  }

  const DATA_URL = "/data/updates.json";
  const lang = (document.documentElement.lang || "en").toLowerCase();
  const langKey = lang.slice(0, 2);
  const localeMap = {
    en: "en-US",
    fr: "fr-FR",
    pt: "pt-PT",
    it: "it-IT"
  };
  const recentLabelMap = {
    en: "Recent",
    fr: "Récent",
    pt: "Recente",
    it: "Recente"
  };
  const locale = localeMap[langKey] || "en-US";
  const recentLabel = recentLabelMap[langKey] || "Recent";

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return recentLabel;
    }
    return new Intl.DateTimeFormat(locale, {
      month: "long",
      year: "numeric"
    }).format(date);
  };

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return recentLabel;
    }
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const updateUpdatedAt = (value) => {
    if (!value) {
      return;
    }
    const label = formatFullDate(value);
    document.querySelectorAll("[data-updated-at]").forEach((el) => {
      const prefix = el.getAttribute("data-prefix") || "";
      el.textContent = prefix ? `${prefix} ${label}` : label;
    });
  };

  const renderUpdates = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const safeTime = (value) => {
      const time = Date.parse(value || "");
      return Number.isNaN(time) ? 0 : time;
    };

    const sorted = [...items].sort((a, b) => safeTime(b.date) - safeTime(a.date));
    list.innerHTML = "";
    sorted.slice(0, 5).forEach((item) => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      const source = item.source ? `${item.source}: ` : "";
      link.href = item.url || "/";
      link.textContent = `${formatDate(item.date)} — ${source}${item.title || "Update"}`;
      li.appendChild(link);
      list.appendChild(li);
    });
  };

  const updateList = async () => {
    try {
      const response = await fetch(DATA_URL, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      updateUpdatedAt(data.generated_at);
      renderUpdates(data.items || []);
    } catch (error) {
      // Keep the fallback list when offline.
    }
  };

  document.addEventListener("DOMContentLoaded", updateList);
})();
