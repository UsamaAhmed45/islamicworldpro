/* Islamic World Pro — polish layer: scroll progress, header state, hero light,
   below-the-fold reveal and card tilt. Content is never hidden for crawlers or
   no-JS visitors: only elements below the first screen are faded, and only
   after this script runs. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ready(fn) { if (d.readyState !== 'loading') fn(); else d.addEventListener('DOMContentLoaded', fn); }

  ready(function () {
    var header = d.querySelector('.site-header');

    /* Scroll progress bar + header state (one rAF-throttled listener) */
    var bar = d.createElement('div');
    bar.className = 'iwp-progress'; bar.setAttribute('aria-hidden', 'true');
    d.body.appendChild(bar);
    /* Smart header: hide on scroll down, show on scroll up. Keeps --hdr-h in
       sync so sticky toolbars below it (Qur'an, Hadith, Mushaf) slide up too. */
    var rootEl = d.documentElement, lastY = w.scrollY || 0, hdrH = 0, hidden = false, acc = 0;
    function measure() {
      if (!header) return;
      hdrH = header.offsetHeight;
      rootEl.style.setProperty('--hdr-full', hdrH + 'px');
      if (!hidden) rootEl.style.setProperty('--hdr-h', hdrH + 'px');
    }
    function setHidden(h) {
      if (!header || h === hidden) return;
      hidden = h;
      header.classList.toggle('hdr-hide', h);
      rootEl.style.setProperty('--hdr-h', h ? '0px' : hdrH + 'px');
    }
    function smartHeader(y) {
      if (!header) return;
      var dy = y - lastY; lastY = y;
      if (d.body.classList.contains('nav-open') || d.querySelector('.nav-links.open')) { setHidden(false); return; }
      if (y < hdrH + 40) { acc = 0; setHidden(false); return; }
      acc = (dy > 0) === (acc > 0) ? acc + dy : dy;   // accumulate movement in one direction
      if (acc > 24) setHidden(true);
      else if (acc < -10) setHidden(false);
    }
    measure();
    w.addEventListener('resize', measure, { passive: true });
    d.addEventListener('focusin', function (e) { if (header && header.contains(e.target)) setHidden(false); });
    // opening the mobile menu always brings the header (and menu) into view
    d.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.nav-toggle')) { setHidden(false); measure(); } }, true);

    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      w.requestAnimationFrame(function () {
        var y = w.scrollY || d.documentElement.scrollTop;
        var max = d.documentElement.scrollHeight - w.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        if (header) header.classList.toggle('is-scrolled', y > 12);
        smartHeader(y);
        var btt = d.querySelector('.back-to-top');
        if (btt) btt.style.setProperty('--p', max > 0 ? Math.round(Math.min(1, y / max) * 100) : 0);
        ticking = false;
      });
    }
    w.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Mobile menu: icons for each link, Play icon on Download, social row */
    var ICON = {
      '/': '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
      '/quran': '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-4a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h4z"/>',
      '/hadith': '<path d="M5 4h11l3 3v13H5z"/><path d="M9 10h6M9 14h6"/>',
      '/azkar': '<circle cx="12" cy="5" r="2"/><circle cx="6" cy="11" r="2"/><circle cx="18" cy="11" r="2"/><circle cx="8" cy="18" r="2"/><circle cx="16" cy="18" r="2"/>',
      '/duas': '<path d="M7 11V6a2 2 0 0 1 4 0v5M11 10V5a2 2 0 0 1 4 0v6M15 9a2 2 0 0 1 4 0v4a7 7 0 0 1-14 0v-2a2 2 0 0 1 2-2"/>',
      '/prayer-times': '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
      '/99-names-of-allah': '<path d="M12 2l2.6 6.6L21 11l-6.4 2.4L12 20l-2.6-6.6L3 11l6.4-2.4z"/>',
      '/features': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
      '/blog': '<path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2"/><path d="M8 7h6"/>',
      '/about': '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'
    };
    var navLinks = d.querySelector('.nav-links');
    if (navLinks && !navLinks.dataset.iwpMenu) {
      navLinks.dataset.iwpMenu = '1';
      var n = 0;
      navLinks.querySelectorAll('.slide-tab').forEach(function (a) {
        var ic = ICON[a.getAttribute('href')] || ICON['/features'];
        var label = a.textContent.trim();
        a.innerHTML = '<span class="mi" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + ic + '</svg></span><span class="ml"></span>';
        a.querySelector('.ml').textContent = label;
        a.style.setProperty('--mi', n++);
      });
      var cta = navLinks.querySelector('.nav-cta');
      if (cta) {
        cta.style.setProperty('--mi', n++);
        cta.insertAdjacentHTML('afterbegin', '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>');
        cta.insertAdjacentHTML('beforeend', '<span class="cta-long">the app</span>');
      }
      var soc = d.querySelectorAll('.social-row .social-icon');
      if (soc.length) {
        var foot = d.createElement('div');
        foot.className = 'nav-menu-foot'; foot.style.setProperty('--mi', n++);
        soc.forEach(function (s) { var c = s.cloneNode(true); c.className = ''; foot.appendChild(c); });
        navLinks.appendChild(foot);
      }
    }

    /* Hero: soft moving light + staggered entrance of first-screen text */
    var hero = d.querySelector('.page-hero, .hub-hero, .pt-hero');
    if (hero && !reduce) {
      var aur = d.createElement('div');
      aur.className = 'iwp-aurora'; aur.setAttribute('aria-hidden', 'true');
      hero.insertBefore(aur, hero.firstChild);
    }

    /* Hero v3: gentle 3D tilt of the product card toward the pointer */
    var hv = d.getElementById('hvCard');
    if (hv && !reduce && w.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var vis = hv.closest('.hero-v3-visual');
      vis.addEventListener('pointermove', function (e) {
        var r = vis.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        hv.style.transform = 'rotateY(' + (-10 + x * 16).toFixed(2) + 'deg) rotateX(' + (4 - y * 10).toFixed(2) + 'deg)';
      });
      vis.addEventListener('pointerleave', function () { hv.style.transform = ''; });
    }

    /* Hero promo video: start as soon as the page is interactive, play while
       visible, retry on the first touch if the browser blocked autoplay
       (e.g. iPhone Low Power Mode), WebM fallback, pause button. */
    var pv = d.getElementById('heroPromo');
    if (pv) {
      var conn = navigator.connection || {};
      var pp = d.getElementById('heroPromoPP');
      var inView = true, started = false;
      pv.muted = true; pv.defaultMuted = true; pv.playsInline = true;
      pv.setAttribute('muted', ''); pv.setAttribute('playsinline', ''); pv.setAttribute('webkit-playsinline', '');
      var tryPlay = function () {
        if (pv.dataset.paused || !inView) return;
        var pr = pv.play();
        if (pr && pr.catch) pr.catch(function () {
          // autoplay blocked: play on the first interaction anywhere
          var kick = function () { if (!pv.dataset.paused) pv.play().catch(function () {}); rm(); };
          var rm = function () { ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (t) { w.removeEventListener(t, kick, true); }); };
          ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(function (t) { w.addEventListener(t, kick, { capture: true, passive: true, once: true }); });
        });
      };
      var startVideo = function () {
        if (started) return; started = true;
        var mp4ok = pv.canPlayType('video/mp4; codecs="avc1.640028"') || pv.canPlayType('video/mp4');
        pv.preload = 'auto';
        pv.src = mp4ok || !pv.dataset.srcWebm ? pv.dataset.src : pv.dataset.srcWebm;
        pv.addEventListener('error', function () {
          if (pv.dataset.srcWebm && pv.currentSrc.indexOf('.webm') < 0) { pv.src = pv.dataset.srcWebm; pv.load(); tryPlay(); }
        });
        pv.addEventListener('canplay', tryPlay);
        pv.load(); tryPlay();
        if (pp) pp.hidden = false;
      };
      if ('IntersectionObserver' in w) {
        new IntersectionObserver(function (es) {
          inView = es[0].isIntersecting;
          if (inView) { startVideo(); tryPlay(); } else if (started) pv.pause();
        }, { threshold: 0.15 }).observe(pv);
      }
      if (!conn.saveData) setTimeout(startVideo, 150);
      else if (pp) { pp.hidden = false; }          // data saver: poster until the visitor taps play
      if (pp) pp.addEventListener('click', function () {
        startVideo();
        if (pv.paused) { delete pv.dataset.paused; pv.play().catch(function () {}); pp.querySelector('path').setAttribute('d', 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z'); pp.setAttribute('aria-label', 'Pause video'); }
        else { pv.dataset.paused = '1'; pv.pause(); pp.querySelector('path').setAttribute('d', 'M8 5v14l11-7z'); pp.setAttribute('aria-label', 'Play video'); }
      });
    }

    /* Card family: sweep layers + tap shimmer for Hadith books and Azkar tiles */
    d.querySelectorAll('.cat').forEach(function (c) { if (!c.querySelector('.c-star')) { var st = d.createElement('span'); st.className = 'c-star'; st.setAttribute('aria-hidden', 'true'); c.appendChild(st); } });
    d.querySelectorAll('.book, .cat').forEach(function (c) {
      if (c.querySelector('.b-sweep, .c-sweep')) return;
      var sw = d.createElement('span');
      sw.className = c.classList.contains('book') ? 'b-sweep' : 'c-sweep';
      sw.setAttribute('aria-hidden', 'true');
      c.appendChild(sw);
      c.addEventListener('pointerdown', function () {
        if (reduce) return;
        sw.style.animation = 'none'; void sw.offsetWidth; sw.style.animation = 'cardSweep .7s ease forwards';
      }, { passive: true });
    });

    /* Homepage "Today" card: pick today's Ayah / Hadith / Dua, share button */
    var tc = d.getElementById('todayCard');
    if (tc) {
      var set = function (post) {
        d.getElementById('tdType').textContent = post.type + ' of the Day';
        d.getElementById('tdAr').textContent = post.arabic;
        d.getElementById('tdTr').textContent = '“' + post.translation + '”';
        d.getElementById('tdSrc').textContent = post.source;
        tc.classList.remove('fade-swap'); void tc.offsetWidth; tc.classList.add('fade-swap');
      };
      fetch(tc.dataset.src).then(function (r) { return r.json(); }).then(function (items) {
        if (!items || !items.length) return;
        var now = new Date(), start = new Date(now.getFullYear(), 0, 0);
        var i = Math.floor((now - start) / 86400000) % items.length;
        if (i) set(items[i]);
      }).catch(function () {});
      var sh = d.getElementById('tdShare');
      if (sh) sh.addEventListener('click', function () {
        var text = d.getElementById('tdAr').textContent + '\n\n' + d.getElementById('tdTr').textContent + '\n— ' + d.getElementById('tdSrc').textContent + '\n\nhttps://islamicworldpro.com';
        if (navigator.share) { navigator.share({ title: d.getElementById('tdType').textContent, text: text }).catch(function () {}); return; }
        (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () {
          sh.textContent = 'Copied ✓'; setTimeout(function () { sh.textContent = 'Share'; }, 1800);
        }).catch(function () {});
      });
    }

    /* Count-up numbers (e.g. homepage stats); final value is already in the HTML */
    var nums = d.querySelectorAll('[data-count]');
    if (nums.length && !reduce && 'IntersectionObserver' in w) {
      var fmt = function (v) { return Math.round(v).toLocaleString('en-US'); };
      var cio = new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          cio.unobserve(e.target);
          var el = e.target, to = +el.dataset.count, suf = el.dataset.suffix || '', final = el.dataset.final || el.textContent;
          if (!to) { el.textContent = final; return; }
          var start = performance.now(), dur = 1400;
          (function step() {
            var k = Math.min(1, (performance.now() - start) / dur), ease = 1 - Math.pow(1 - k, 4);
            el.textContent = k < 1 ? fmt(to * ease) : final;
            if (k < 1) w.requestAnimationFrame(step);
          })();
          setTimeout(function () { el.textContent = final; }, dur + 200); // guarantee the true value
        });
      }, { threshold: 0.6 });
      nums.forEach(function (n) {
        if (n.getBoundingClientRect().top > w.innerHeight) { n.dataset.final = n.textContent; n.textContent = '0'; }
        cio.observe(n);
      });
    }

    /* Below-the-fold reveal */
    if (reduce || !('IntersectionObserver' in w)) return;
    var SEL = [
      '.section-head', '.feature-card', '.blog-card', '.video-card', '.mode-card',
      '.contact-card', '.accordion-item', '.pt-card', '.sc', '.book', '.cat', '.jz', '.cf-card',
      '.cf-year-wrap', '.cf-near', '.daily-post-card', '.row-head', '.tt-wrap'
    ].join(',');
    var vh = w.innerHeight;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });

    var els = d.querySelectorAll(SEL);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.classList.contains('reveal') || el.closest('.reveal')) continue; // existing system
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92) { el.classList.add('is-in'); continue; }   // already on screen: never hide
      if (!r.height || r.left < -2 || r.right > w.innerWidth + 2) continue; // hidden / in a side-scroller
      // stagger siblings in the same row
      var idx = 0, s = el.previousElementSibling;
      while (s && idx < 6) { idx++; s = s.previousElementSibling; }
      el.style.setProperty('--pz-i', idx % 6);
      el.classList.add('pz');
      io.observe(el);
    }

    /* Safety net: never leave anything hidden once the reader reaches the end */
    w.addEventListener('scroll', function end() {
      if (w.innerHeight + w.scrollY < d.documentElement.scrollHeight - 40) return;
      d.querySelectorAll('.pz:not(.is-in)').forEach(function (e) { e.classList.add('is-in'); });
      w.removeEventListener('scroll', end);
    }, { passive: true });

    /* Subtle 3D tilt on large cards (desktop pointer only) */
    if (!w.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    d.querySelectorAll('.blog-card, .mode-card, .video-card').forEach(function (card) {
      card.addEventListener('pointermove', function (ev) {
        var b = card.getBoundingClientRect();
        var x = (ev.clientX - b.left) / b.width - 0.5, y = (ev.clientY - b.top) / b.height - 0.5;
        card.style.transform = 'perspective(900px) translateY(-5px) rotateX(' + (-y * 4).toFixed(2) + 'deg) rotateY(' + (x * 5).toFixed(2) + 'deg)';
      });
      card.addEventListener('pointerleave', function () { card.style.transform = ''; });
    });
  });
})();
