/* ============================================================
   ISLAMIC WORLD PRO — SITE CONFIG
   Update PLAY_STORE_URL below once your app is live on Google
   Play. Every "Get it on Google Play" button on every page
   reads from this single file, so you only ever edit it here.
   ============================================================ */

const SITE_CONFIG = {
  // Paste your real Play Store listing URL here when it's live, e.g.
  // "https://play.google.com/store/apps/details?id=com.aurevia.islamicworld"
  PLAY_STORE_URL: "#",

  // Shown on the Download page and in a small badge on the button
  // while the app isn't published yet. Set to false once it's live.
  COMING_SOON: true,
};

document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll("[data-play-store]");
  links.forEach((link) => {
    link.setAttribute("href", SITE_CONFIG.PLAY_STORE_URL);
    if (SITE_CONFIG.COMING_SOON) {
      link.classList.add("is-coming-soon");
      if (link.hasAttribute("target")) link.removeAttribute("target");
      link.addEventListener("click", (e) => {
        if (SITE_CONFIG.PLAY_STORE_URL === "#") {
          e.preventDefault();
        }
      });
    }
  });

  const badges = document.querySelectorAll("[data-coming-soon-badge]");
  badges.forEach((badge) => {
    badge.style.display = SITE_CONFIG.COMING_SOON ? "inline-flex" : "none";
  });
});
