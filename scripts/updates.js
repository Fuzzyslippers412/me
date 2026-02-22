(() => {
  const list = document.querySelector("[data-updates]");
  if (!list) {
    return;
  }

  const DATA_URL = "/data/updates.json";

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
      renderUpdates(data.items || []);
    } catch (error) {
      // Keep the fallback list when offline.
    }
  };

  document.addEventListener("DOMContentLoaded", updateList);
})();
