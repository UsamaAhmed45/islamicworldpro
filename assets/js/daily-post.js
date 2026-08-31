// ============ Daily Post (Ayah / Hadith / Dua of the day) ============
(function () {
  function dayOfYear(d) {
    const start = new Date(d.getFullYear(), 0, 0);
    const diff = d - start;
    return Math.floor(diff / 86400000);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  async function init() {
    const card = document.getElementById("dailyPostCard");
    if (!card) return;

    let items = [];
    try {
      const res = await fetch("assets/data/daily-posts.json", { cache: "no-store" });
      items = await res.json();
    } catch (e) {
      card.innerHTML = '<p class="small-muted">Today\u2019s post could not be loaded right now.</p>';
      return;
    }
    if (!items.length) return;

    const idx = dayOfYear(new Date()) % items.length;
    const post = items[idx];

    card.innerHTML = `
      <span class="daily-post-type">${escapeHtml(post.type)} of the Day</span>
      <p class="daily-post-arabic" lang="ar" dir="rtl">${escapeHtml(post.arabic)}</p>
      <p class="daily-post-translation">"${escapeHtml(post.translation)}"</p>
      <span class="daily-post-source">${escapeHtml(post.source)}</span>
      <div class="daily-post-actions">
        <button type="button" class="btn btn-outline" id="dailyPostCopy">Copy</button>
        <a class="btn btn-gold" href="https://whatsapp.com/channel/0029Vb80wIgEVccKe2jRUL24" target="_blank" rel="noopener">Get Daily Posts on WhatsApp</a>
      </div>
    `;

    const copyBtn = document.getElementById("dailyPostCopy");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const text = `${post.arabic}\n\n"${post.translation}"\n— ${post.source}\n\nvia Islamic World Pro (islamicworldpro.com)`;
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.textContent = "Copied!";
          setTimeout(() => (copyBtn.textContent = "Copy"), 1800);
        } catch (e) {
          /* clipboard unavailable — no-op */
        }
      });
    }

    // Render the rest of the week underneath for context / SEO crawlable text.
    const list = document.getElementById("dailyPostArchive");
    if (list) {
      list.innerHTML = items
        .map(
          (p) => `
        <div class="feature-card">
          <span class="pill" style="margin-bottom:10px;">${escapeHtml(p.type)}</span>
          <p lang="ar" dir="rtl" style="font-family:var(--font-arabic, inherit);font-size:1.15rem;margin:0 0 10px;">${escapeHtml(p.arabic)}</p>
          <p style="color:var(--sand-600);font-size:.94rem;margin:0 0 6px;">"${escapeHtml(p.translation)}"</p>
          <span class="small-muted">${escapeHtml(p.source)}</span>
        </div>`
        )
        .join("");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
