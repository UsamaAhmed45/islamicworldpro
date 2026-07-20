// ============ Slide Tabs (animated nav highlight) ============
(function () {
  function init() {
    const wrap = document.getElementById("navSlideTabs");
    const highlight = document.getElementById("navHighlight");
    if (!wrap || !highlight) return;

    const tabs = Array.from(wrap.querySelectorAll(".slide-tab"));
    if (!tabs.length) return;

    const activeTab = tabs.find((t) => t.classList.contains("active")) || null;

    function moveHighlightTo(tab, animate) {
      if (!tab) {
        highlight.classList.remove("visible");
        tabs.forEach((t) => t.classList.remove("on-highlight"));
        return;
      }
      if (animate === false) {
        highlight.style.transition = "none";
      } else {
        highlight.style.transition = "";
      }
      const left = tab.offsetLeft;
      const width = tab.offsetWidth;
      highlight.style.transform = "translateX(" + left + "px)";
      highlight.style.width = width + "px";
      highlight.classList.add("visible");
      tabs.forEach((t) => t.classList.toggle("on-highlight", t === tab));
      if (animate === false) {
        // Force reflow so the "no transition" rule applies before we clear it.
        // eslint-disable-next-line no-unused-expressions
        highlight.offsetHeight;
        highlight.style.transition = "";
      }
    }

    tabs.forEach((tab) => {
      tab.addEventListener("mouseenter", () => moveHighlightTo(tab, true));
      tab.addEventListener("focus", () => moveHighlightTo(tab, true));
    });

    wrap.addEventListener("mouseleave", () => moveHighlightTo(activeTab, true));

    // Position instantly (no slide-in animation) on first paint.
    moveHighlightTo(activeTab, false);

    let resizeTimer = null;
    window.addEventListener(
      "resize",
      () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          const hovered = tabs.find((t) => t.matches(":hover"));
          moveHighlightTo(hovered || activeTab, false);
        }, 100);
      },
      { passive: true }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
