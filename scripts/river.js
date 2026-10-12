(() => {
  const root = document.documentElement;
  const button = document.querySelector(".motion-toggle");
  const menu = document.querySelector(".mobile-menu");
  const sections = [...document.querySelectorAll("[data-river-section]")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const key = "armel-motion";
  let preference = "on";
  let observer;
  try { preference = localStorage.getItem(key) === "off" ? "off" : "on"; } catch { /* Storage is optional. */ }

  function applyMotion() {
    observer?.disconnect();
    const enabled = preference === "on" && !reduced.matches;
    root.dataset.motion = enabled ? "on" : "off";
    if (button) {
      button.hidden = false;
      button.disabled = reduced.matches;
      button.setAttribute("aria-pressed", String(enabled));
      button.textContent = reduced.matches ? button.dataset.motionReduced : enabled ? button.dataset.motionOn : button.dataset.motionOff;
    }
    if (!enabled) return;
    if (!("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.riverSeen = "true";
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px" });
    sections.filter((section) => !section.dataset.riverSeen).forEach((section) => observer.observe(section));
  }
  button?.addEventListener("click", () => {
    preference = root.dataset.motion === "on" ? "off" : "on";
    try { localStorage.setItem(key, preference); } catch { /* Still works for this page. */ }
    applyMotion();
  });
  reduced.addEventListener("change", applyMotion);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) menu.open = false;
  });
  applyMotion();
})();
