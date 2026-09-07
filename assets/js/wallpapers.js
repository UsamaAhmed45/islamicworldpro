// ============ Wallpaper Gallery (data-driven grid + lightbox) ============
(function () {
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function init() {
    const grid = document.getElementById("wallpaperGrid");
    const lightbox = document.getElementById("galleryLightbox");
    if (!grid) return;

    let items = [];
    try {
      const res = await fetch("assets/data/wallpapers.json", { cache: "no-store" });
      items = await res.json();
    } catch (e) {
      // Fetch failed (offline, blocked, etc.) — leave the server-rendered
      // wallpapers already in the page alone instead of wiping them out.
      items = [];
    }

    if (items.length) {
      grid.innerHTML = items
        .map(
          (w) => `
        <button type="button" class="gallery-thumb wallpaper-thumb" data-title="${escapeHtml(w.title)}" data-sub="${escapeHtml(w.category)} wallpaper" data-full="${w.image}">
          <img loading="lazy" decoding="async" src="${w.image}" alt="${escapeHtml(w.title)} — Islamic wallpaper from Islamic World Pro">
        </button>`
        )
        .join("");
    }

    if (!lightbox) return;
    const thumbs = Array.from(grid.querySelectorAll(".gallery-thumb"));
    if (!thumbs.length) return;

    const img = document.getElementById("lightboxImage");
    const titleEl = document.getElementById("lightboxTitle");
    const subEl = document.getElementById("lightboxSub");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    const closeEls = lightbox.querySelectorAll("[data-lightbox-close]");
    let currentIndex = 0;

    function show(index) {
      currentIndex = (index + thumbs.length) % thumbs.length;
      const thumb = thumbs[currentIndex];
      const full = thumb.getAttribute("data-full");
      img.src = full;
      img.alt = thumb.getAttribute("data-title") || "";
      titleEl.textContent = thumb.getAttribute("data-title") || "";
      subEl.textContent = thumb.getAttribute("data-sub") || "";
      img.classList.add("loaded");
    }

    function open(index) {
      show(index);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function close() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    thumbs.forEach((thumb, i) => thumb.addEventListener("click", () => open(i)));
    closeEls.forEach((el) => el.addEventListener("click", close));
    if (prevBtn) prevBtn.addEventListener("click", () => show(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener("click", () => show(currentIndex + 1));
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(currentIndex - 1);
      else if (e.key === "ArrowRight") show(currentIndex + 1);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
