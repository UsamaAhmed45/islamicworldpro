// ============ Image Gallery (grid + lightbox) ============
(function () {
  function init() {
    const grid = document.getElementById("appGalleryGrid");
    const lightbox = document.getElementById("galleryLightbox");
    if (!grid || !lightbox) return;

    const thumbs = Array.from(grid.querySelectorAll(".gallery-thumb"));
    if (!thumbs.length) return;

    const img = document.getElementById("lightboxImage");
    const titleEl = document.getElementById("lightboxTitle");
    const subEl = document.getElementById("lightboxSub");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    const closeEls = lightbox.querySelectorAll("[data-lightbox-close]");

    let currentIndex = 0;
    let lastFocused = null;

    function show(index) {
      currentIndex = (index + thumbs.length) % thumbs.length;
      const thumb = thumbs[currentIndex];
      const full = thumb.getAttribute("data-full");
      const title = thumb.getAttribute("data-title") || "";
      const sub = thumb.getAttribute("data-sub") || "";

      img.classList.remove("loaded");
      const loader = new Image();
      loader.onload = () => {
        img.src = full;
        img.alt = title;
        requestAnimationFrame(() => img.classList.add("loaded"));
      };
      loader.src = full;

      titleEl.textContent = title;
      subEl.textContent = sub;
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const closeBtn = lightbox.querySelector(".lightbox-close");
      if (closeBtn) closeBtn.focus();
    }

    function close() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }

    thumbs.forEach((thumb, i) => {
      thumb.addEventListener("click", () => open(i));
    });

    closeEls.forEach((el) => el.addEventListener("click", close));
    prevBtn.addEventListener("click", () => show(currentIndex - 1));
    nextBtn.addEventListener("click", () => show(currentIndex + 1));

    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") show(currentIndex - 1);
      else if (e.key === "ArrowRight") show(currentIndex + 1);
    });

    // Basic swipe support for touch devices
    let touchStartX = null;
    lightbox.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    lightbox.addEventListener(
      "touchend",
      (e) => {
        if (touchStartX === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) > 40) {
          if (dx > 0) show(currentIndex - 1);
          else show(currentIndex + 1);
        }
        touchStartX = null;
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
