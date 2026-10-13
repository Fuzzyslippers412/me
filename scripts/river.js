(() => {
  const root = document.documentElement;
  const button = document.querySelector(".motion-toggle");
  const menu = document.querySelector(".mobile-menu");
  const sections = [...document.querySelectorAll("[data-river-section]")];
  const rivers = sections.map((section) => section.querySelector(".river-thread"));
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const key = "armel-motion";
  const epoch = performance.now();
  let preference = "on";
  let observer;
  let layoutFrame = 0;
  try { preference = localStorage.getItem(key) === "off" ? "off" : "on"; } catch { /* Storage is optional. */ }

  function alignCurrent(svg) {
    if (!svg?.getAnimations) return;
    for (const animation of svg.getAnimations({ subtree: true })) {
      if (animation.animationName === "river-flow" || animation.animationName === "river-flow-echo") {
        animation.currentTime = performance.now() - epoch;
      }
    }
  }

  function measureRivers() {
    layoutFrame = 0;
    const compact = matchMedia("(max-width: 900px)").matches;
    // Read layout together; SVG writes never change the text column's dimensions.
    const bounds = sections.map((section) => section.getBoundingClientRect());
    const riverBounds = rivers.map((svg) => svg?.getBoundingClientRect());
    const travelled = [0, 0];
    rivers.forEach((svg, index) => {
      const width = riverBounds[index]?.width;
      if (!svg || !width) return;
      const height = Math.max(1, (riverBounds[index + 1]?.top ?? bounds[index].bottom) - riverBounds[index].top);
      const kind = svg.dataset.riverKind;
      const [strength, phase] = ({ source: [.36, -.8], work: [.29, 1.6], research: [.17, .5], updates: [.26, -.6], listening: [.35, 1], ending: [.18, 2.2] })[kind] || [.19, index * .9];
      const cycles = Math.min(3, Math.max(.8, height / (compact ? 700 : 620)));
      const count = Math.max(4, Math.ceil(height / 150));
      const spacing = Math.max(2.5, width * .065);
      const nodes = Array.from({ length: count + 1 }, (_, i) => {
        const t = i / count;
        return [width * (.5 + strength * Math.sin(t * Math.PI * 2 * cycles + phase) * Math.sin(t * Math.PI)), t * height];
      });
      const round = (number) => Math.round(number * 100) / 100;
      // Smooth interior tangents, with vertical endpoints shared by adjacent sections.
      const curve = (offset) => {
        const points = nodes.map(([x, y], i) => [x + offset * (1 + .35 * Math.sin(Math.PI * i / count)), y]);
        return points.map(([x, y], i) => {
          if (!i) return `M${round(x)} 0`;
          const [previousX, previousY] = points[i - 1];
          const beforeX = points[Math.max(0, i - 2)][0];
          const afterX = points[Math.min(count, i + 1)][0];
          const firstX = i === 1 ? previousX : previousX + (x - beforeX) / 6;
          const secondX = i === count ? x : x - (afterX - previousX) / 6;
          const third = (y - previousY) / 3;
          return `C${round(firstX)} ${round(previousY + third)} ${round(secondX)} ${round(y - third)} ${round(x)} ${round(y)}`;
        }).join("");
      };
      svg.style.height = `${height}px`;
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.dataset.riverFirst = String(index === 0);
      svg.dataset.riverLast = String(index === rivers.length - 1);
      for (const [selector, offset] of [[".river-wash", 0], [".river-bank-far", -spacing], [".river-bank-near", 0], [".river-bank-fine", spacing], [".river-current-main", 0], [".river-current-echo", spacing]]) {
        svg.querySelector(selector).setAttribute("d", curve(offset));
      }
      // Offset each segment by preceding arc lengths so highlights cross joins.
      for (const [lane, selector, period] of [[0, ".river-current-main", 556], [1, ".river-current-echo", 660]]) {
        svg.style.setProperty(`--river-phase-${lane}`, `${round(travelled[lane] % period)}px`);
        travelled[lane] += svg.querySelector(selector).getTotalLength();
      }
      alignCurrent(svg);
    });
    root.dataset.riverWidth = String(window.innerWidth);
  }

  function scheduleLayout() {
    if (!layoutFrame) layoutFrame = requestAnimationFrame(measureRivers);
  }

  function applyMotion() {
    observer?.disconnect();
    sections.forEach((section) => { section.dataset.riverVisible = "false"; });
    const enabled = preference === "on" && !reduced.matches;
    root.dataset.motion = enabled ? "on" : "off";
    root.dataset.riverPageVisible = document.hidden ? "false" : "true";
    if (button) {
      button.hidden = false;
      button.disabled = reduced.matches;
      button.setAttribute("aria-pressed", String(enabled));
      const state = reduced.matches ? button.dataset.motionReduced : enabled ? button.dataset.motionOn : button.dataset.motionOff;
      button.setAttribute("aria-label", `${button.dataset.motionLabel}: ${state}`);
      button.title = state;
    }
    if (!enabled || document.hidden) return;
    if (!("IntersectionObserver" in window)) return;
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        entry.target.dataset.riverVisible = String(entry.isIntersecting);
        if (entry.isIntersecting) alignCurrent(entry.target.querySelector(".river-thread"));
      }
    }, { rootMargin: "100px 0px" });
    sections.forEach((section) => observer.observe(section));
  }
  button?.addEventListener("click", () => {
    preference = root.dataset.motion === "on" ? "off" : "on";
    try { localStorage.setItem(key, preference); } catch { /* Still works for this page. */ }
    applyMotion();
  });
  reduced.addEventListener("change", applyMotion);
  document.addEventListener("visibilitychange", applyMotion);
  window.addEventListener("pageshow", () => { applyMotion(); scheduleLayout(); });
  if ("ResizeObserver" in window) {
    const resize = new ResizeObserver(scheduleLayout);
    sections.forEach((section) => resize.observe(section));
    const main = document.querySelector("main");
    if (main) resize.observe(main);
  } else {
    window.addEventListener("resize", scheduleLayout);
    document.addEventListener("toggle", scheduleLayout, true);
  }
  document.fonts?.ready.then(scheduleLayout);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menu?.open) {
      menu.open = false;
      menu.querySelector("summary").focus();
    }
  });
  menu?.addEventListener("click", (event) => {
    if (event.target.closest("a")) menu.open = false;
  });
  scheduleLayout();
  applyMotion();
})();
