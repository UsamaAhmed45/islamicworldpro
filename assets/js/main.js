// ============ Mobile nav toggle ============
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    const backdrop = document.createElement('div');
    backdrop.className = 'nav-backdrop';
    document.body.appendChild(backdrop);

    function closeMenu() {
      links.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    function openMenu() {
      links.classList.add('open');
      backdrop.classList.add('open');
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', () => {
      links.classList.contains('open') ? closeMenu() : openMenu();
    });
    backdrop.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && links.classList.contains('open')) closeMenu();
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  }

  // ============ Reveal on scroll ============
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  // ============ Accordion (FAQ) ============
  document.querySelectorAll('.accordion-item').forEach(item => {
    const q = item.querySelector('.accordion-q');
    if (!q) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      item.closest('.accordion').querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ============ Generic tab bar ============
  document.querySelectorAll('.tabbar').forEach(bar => {
    const buttons = bar.querySelectorAll('button[data-tab]');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        const scope = bar.closest('[data-tab-scope]') || document;
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        scope.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        const panel = scope.querySelector('#' + target);
        if (panel) panel.classList.add('active');
      });
    });
  });

  // ============ Hero Bismillah typing animation ============
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bismillahEl = document.getElementById('bismillahType');
  if (bismillahEl) {
    const text = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
    if (reduceMotion) {
      bismillahEl.textContent = text;
    } else {
      const chars = Array.from(text);
      let i = 0;
      let deleting = false;
      const typeSpeed = 90;
      const deleteSpeed = 40;
      const holdAfterType = 3200;
      const holdAfterDelete = 700;
      function tick() {
        if (!deleting) {
          i++;
          bismillahEl.textContent = chars.slice(0, i).join('');
          if (i >= chars.length) {
            deleting = true;
            setTimeout(tick, holdAfterType);
            return;
          }
          setTimeout(tick, typeSpeed);
        } else {
          i--;
          bismillahEl.textContent = chars.slice(0, i).join('');
          if (i <= 0) {
            deleting = false;
            setTimeout(tick, holdAfterDelete);
            return;
          }
          setTimeout(tick, deleteSpeed);
        }
      }
      tick();
    }
  }

});

/* ---- Loading smoothness ---------------------------------------------- */
(function () {
  // Once a photo has decoded, drop its blur placeholder so the browser
  // stops compositing a background layer it no longer needs.
  var imgs = document.querySelectorAll('img.lqip');
  function clear(img) {
    img.style.backgroundImage = '';
    img.classList.remove('lqip');
  }
  imgs.forEach(function (img) {
    if (img.complete && img.naturalWidth > 0) { clear(img); return; }
    img.addEventListener('load', function () { clear(img); }, { once: true });
    img.addEventListener('error', function () { clear(img); }, { once: true });
  });
})();

/* ---- Hero ambient loop ------------------------------------------------ */
(function () {
  var v = document.querySelector('.hero-ambient');
  if (!v) return;

  // Never on small screens, never against a reduced-motion or data-saver
  // preference, and never before the page has finished loading.
  var small = window.matchMedia('(max-width:900px)').matches;
  var still = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var conn = navigator.connection || {};
  var thrifty = conn.saveData === true || /2g/.test(conn.effectiveType || '');
  if (small || still || thrifty) return;

  function start() {
    ['webm', 'mp4'].forEach(function (type) {
      var url = v.getAttribute('data-src-' + type);
      if (!url) return;
      var src = document.createElement('source');
      src.src = url;
      src.type = type === 'webm' ? 'video/webm' : 'video/mp4';
      v.appendChild(src);
    });
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; leave hidden */ });
    v.addEventListener('playing', function () { v.classList.add('is-playing'); }, { once: true });
  }

  if (document.readyState === 'complete') setTimeout(start, 400);
  else window.addEventListener('load', function () { setTimeout(start, 400); });

  // Stop burning frames when the hero is off screen or the tab is hidden.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!v.src && !v.children.length) return;
        e.isIntersecting ? v.play().catch(function () {}) : v.pause();
      });
    }, { threshold: 0.05 }).observe(v);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) v.pause();
    else if (v.children.length) v.play().catch(function () {});
  });
})();

/* ---- Hero app-demo video (phone mockup) -------------------------------- */
(function () {
  var v = document.getElementById('heroDemoVideo');
  if (!v) return;

  // Same policy as the hero-ambient clip: skip on small screens, reduced
  // motion, or a data-saver connection — the poster image is already a
  // full, meaningful screenshot, so nothing is lost.
  var small = window.matchMedia('(max-width:900px)').matches;
  var still = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
  var conn = navigator.connection || {};
  var thrifty = conn.saveData === true || /2g/.test(conn.effectiveType || '');
  if (small || still || thrifty) return;

  function start() {
    var url = v.getAttribute('data-src-mp4');
    if (!url) return;
    var src = document.createElement('source');
    src.src = url;
    src.type = 'video/mp4';
    v.appendChild(src);
    v.preload = 'auto';
    v.load();
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked; poster stays visible */ });
  }

  if (document.readyState === 'complete') setTimeout(start, 400);
  else window.addEventListener('load', function () { setTimeout(start, 400); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!v.children.length) return;
        e.isIntersecting ? v.play().catch(function () {}) : v.pause();
      });
    }, { threshold: 0.05 }).observe(v);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) v.pause();
    else if (v.children.length) v.play().catch(function () {});
  });
})();

/* ---- App walkthrough video: autoplay-on-scroll ------------------------- */
// The <source> now carries a real, crawlable `src` in the markup (so
// Googlebot and other crawlers can discover/verify the video without
// running JS or scrolling it into view). preload="none" on the <video>
// still stops the browser from downloading anything until play() is
// actually called, so this keeps the same lazy-download behaviour as
// before — it's just no longer hidden behind an IntersectionObserver.
(function () {
  var v = document.getElementById('walkthroughVideo');
  if (!v) return;

  var loaded = false;
  function loadAndPlay() {
    if (!loaded) {
      v.load();
      loaded = true;
    }
    var p = v.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked until user interacts */ });
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          loadAndPlay();
        } else if (loaded) {
          v.pause();
        }
      });
    }, { threshold: 0.4 });
    io.observe(v);
  } else {
    // No IntersectionObserver support — just load on demand when scrolled near.
    loadAndPlay();
  }

  // If the user unmutes, keep their choice while it stays in view (don't
  // force re-mute on our own re-triggers).
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) v.pause();
  });
})();
