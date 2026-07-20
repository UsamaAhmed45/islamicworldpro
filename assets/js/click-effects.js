// ============ Click Effects (gold ring + sparkle burst) ============
// Vanilla JS port — no external animation library required.
(function () {
  const COLOR = "#d4af37";     // --gold-500
  const COLOR_LIGHT = "#f3d879"; // --gold-200
  const RING_SIZE = 46;
  const RING_DURATION = 550;   // ms
  const SPARKLE_COUNT = 6;
  const SPARKLE_DISTANCE = 34;
  const SPARKLE_DURATION = 500; // ms

  let layer;

  function ensureLayer() {
    if (layer) return layer;
    layer = document.createElement("div");
    layer.setAttribute("aria-hidden", "true");
    layer.style.position = "fixed";
    layer.style.inset = "0";
    layer.style.pointerEvents = "none";
    layer.style.zIndex = "9999";
    layer.style.overflow = "hidden";
    document.body.appendChild(layer);
    return layer;
  }

  function spawnRing(x, y) {
    const ring = document.createElement("div");
    ring.style.position = "absolute";
    ring.style.left = (x - RING_SIZE / 2) + "px";
    ring.style.top = (y - RING_SIZE / 2) + "px";
    ring.style.width = RING_SIZE + "px";
    ring.style.height = RING_SIZE + "px";
    ring.style.borderRadius = "50%";
    ring.style.border = "2px solid " + COLOR;
    ring.style.boxSizing = "border-box";
    ring.style.transform = "scale(0.4)";
    ring.style.opacity = "0.9";
    ring.style.transition =
      "transform " + RING_DURATION + "ms cubic-bezier(.2,.8,.2,1), opacity " + RING_DURATION + "ms ease-out";
    layer.appendChild(ring);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ring.style.transform = "scale(1.7)";
        ring.style.opacity = "0";
      });
    });

    setTimeout(() => ring.remove(), RING_DURATION + 50);
  }

  function spawnSparkles(x, y) {
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const angle = (i / SPARKLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
      const distance = SPARKLE_DISTANCE * (0.6 + Math.random() * 0.6);
      const size = 3 + Math.random() * 2;

      const dot = document.createElement("div");
      dot.style.position = "absolute";
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      dot.style.width = size + "px";
      dot.style.height = size + "px";
      dot.style.marginLeft = -(size / 2) + "px";
      dot.style.marginTop = -(size / 2) + "px";
      dot.style.borderRadius = "50%";
      dot.style.background = i % 2 === 0 ? COLOR : COLOR_LIGHT;
      dot.style.boxShadow = "0 0 6px " + COLOR_LIGHT;
      dot.style.opacity = "1";
      dot.style.transform = "translate(0, 0)";
      dot.style.transition =
        "transform " + SPARKLE_DURATION + "ms cubic-bezier(.2,.8,.2,1), opacity " + SPARKLE_DURATION + "ms ease-in";
      layer.appendChild(dot);

      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          dot.style.transform = "translate(" + dx + "px, " + dy + "px)";
          dot.style.opacity = "0";
        });
      });

      setTimeout(() => dot.remove(), SPARKLE_DURATION + 50);
    }
  }

  function handleClick(e) {
    // Skip effect on form controls to avoid interfering with double-tap/typing
    const tag = (e.target && e.target.tagName) || "";
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

    ensureLayer();
    spawnRing(e.clientX, e.clientY);
    spawnSparkles(e.clientX, e.clientY);
  }

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (!prefersReducedMotion) {
    document.addEventListener("click", handleClick);
  }
})();
