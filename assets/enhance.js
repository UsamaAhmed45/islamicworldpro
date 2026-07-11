/* ============================================================
   ISLAMIC WORLD PRO — VISUAL POLISH
   Scroll-reveal animations, staggered card entrances, and a
   gentle count-up for the hero stats. Pure progressive
   enhancement: if this file fails to load, the site still
   works exactly as before, just without the motion.
   ============================================================ */

(function () {
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- 0. Mobile nav: toggle + auto-close on link click / outside click / Escape ---- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    var closeNav = function () {
      navLinks.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = navLinks.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });
    document.addEventListener('click', function (e) {
      if (navLinks.classList.contains('open') && !navLinks.contains(e.target) && e.target !== navToggle) {
        closeNav();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
  }

  /* ---- 1. Mark up sections for reveal-on-scroll ---- */
  var groupSelectors = [
    '.feature-grid',
    '.prayer-strip',
    '.two-col',
    '.timeline',
  ];
  groupSelectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.classList.add('reveal-stagger');
    });
  });

  var singleSelectors = [
    '.section-head',
    '.panel',
    '.cta-band',
    '.ayah-banner',
    '.faq-item',
  ];
  singleSelectors.forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el) {
      // Skip panels/items that already live inside a staggered group —
      // their parent handles the animation via nth-child delays.
      if (el.closest('.reveal-stagger')) return;
      el.classList.add('reveal');
    });
  });

  // Two-column sections get a dramatic 3D flip-in: left column swings in
  // from the left, right column swings in from the right. The hero's own
  // grid-2 is skipped — it already animates instantly via hero-fade-in.
  document.querySelectorAll('.grid-2').forEach(function (grid) {
    if (grid.closest('.hero')) return;
    var cols = grid.querySelectorAll(':scope > div');
    if (cols[0]) cols[0].classList.add('flip-left');
    if (cols[1]) cols[1].classList.add('flip-right');
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal, .reveal-stagger, .flip-left, .flip-right').forEach(function (el) {
      el.classList.add('in-view');
    });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-stagger, .flip-left, .flip-right').forEach(function (el) {
      io.observe(el);
    });
  }

  // Once a staggered card finishes its entrance animation, drop the
  // animation so the element's own hover/tilt transforms take back over.
  document.querySelectorAll(
    '.reveal-stagger .feature-card, .reveal-stagger .panel, .reveal-stagger .prayer-cell, .reveal-stagger .timeline-item, .reveal-stagger .faq-item'
  ).forEach(function (el) {
    el.addEventListener('animationend', function () {
      el.style.animation = 'none';
    });
  });

  /* ---- 2. Hero entrance on the homepage ---- */
  var heroCol = document.querySelector('.hero .container > div:first-child');
  if (heroCol) {
    var eyebrow = heroCol.querySelector('.eyebrow');
    var h1 = heroCol.querySelector('h1');
    var lede = heroCol.querySelector('.lede');
    var btnRow = heroCol.querySelector('.btn-row');
    var statRow = heroCol.querySelector('.stat-row');
    [eyebrow, h1].forEach(function (el) { if (el) el.classList.add('hero-fade-in'); });
    if (lede) lede.classList.add('hero-fade-in', 'hero-delay-1');
    [btnRow, statRow].forEach(function (el) { if (el) el.classList.add('hero-fade-in', 'hero-delay-2'); });
  }

  /* ---- 3. Count up the hero stats ---- */
  var nums = document.querySelectorAll('.stat-row .num');
  if (nums.length && !reduceMotion) {
    var animateNum = function (el) {
      var text = el.textContent.trim();
      var match = text.match(/^(\d+)(.*)$/);
      if (!match) return;
      var target = parseInt(match[1], 10);
      var suffix = match[2] || '';
      var duration = 900;
      var start = null;
      el.textContent = '0' + suffix;
      function step(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        var value = Math.round(eased * target);
        el.textContent = value + suffix;
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };

    if ('IntersectionObserver' in window) {
      var statIo = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateNum(entry.target);
              statIo.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      nums.forEach(function (el) { statIo.observe(el); });
    }
  }

  if (reduceMotion) return; // everything below is pure motion — skip it entirely

  /* ---- 4. Floating parallax orbs (depth layers) ---- */
  var orbHosts = document.querySelectorAll('.hero, .cta-band, .section-alt, .ayah-banner');
  var orbs = [];
  orbHosts.forEach(function (host, i) {
    host.classList.add('parallax-host');
    var count = host.classList.contains('hero') ? 2 : 1;
    for (var n = 0; n < count; n++) {
      var orb = document.createElement('div');
      var isGold = (i + n) % 2 === 0;
      orb.className = 'parallax-orb ' + (isGold ? 'orb-gold' : 'orb-emerald');
      var size = 200 + ((i * 57 + n * 113) % 220);
      orb.style.width = size + 'px';
      orb.style.height = size + 'px';
      orb.style.left = (n === 0 ? -6 + (i * 13) % 20 : 60 + (i * 7) % 30) + '%';
      orb.style.top = (n === 0 ? -10 : 40 + (i * 11) % 40) + '%';
      host.appendChild(orb);
      orbs.push({ el: orb, speed: 0.12 + ((i + n) % 3) * 0.11, drift: (n === 0 ? 1 : -1) * (0.03 + (i % 3) * 0.02) });
    }
  });

  /* ---- 5. Hero compass: tilts and recedes in 3D as you scroll past it ---- */
  var compass = document.querySelector('.compass-wrap');
  var heroEl = document.querySelector('.hero');

  /* ---- 6. Gentle 3D tilt on feature cards / panels as they track through the viewport ---- */
  var tiltEls = Array.prototype.slice.call(
    document.querySelectorAll('.feature-card, .panel:not(.cta-band)')
  );

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var scrollY = window.scrollY || window.pageYOffset;
      var vh = window.innerHeight;

      // Nav depth shadow
      var nav = document.querySelector('.site-nav');
      if (nav) nav.classList.toggle('scrolled', scrollY > 12);

      // Parallax orbs drift at their own speed relative to scroll
      orbs.forEach(function (o) {
        var y = scrollY * o.speed;
        var x = scrollY * o.drift;
        o.el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      });

      // Hero compass recedes into the screen as the page scrolls away from it
      if (compass && heroEl) {
        var heroHeight = heroEl.offsetHeight || vh;
        var progress = Math.min(Math.max(scrollY / heroHeight, 0), 1);
        var rotateX = progress * 55;
        var rotateY = Math.sin(scrollY / 260) * 10;
        var scale = 1 - progress * 0.32;
        var translateZ = -progress * 260;
        compass.style.transform =
          'perspective(1100px) rotateX(' + rotateX.toFixed(2) + 'deg) rotateY(' + rotateY.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ') translateZ(' + translateZ.toFixed(1) + 'px)';
      }

      // Cards tilt dramatically toward "upright" as they cross the centre of the viewport
      tiltEls.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        var centre = rect.top + rect.height / 2;
        var distanceFromCentre = (centre - vh / 2) / vh; // -0.5..0.5 roughly
        if (Math.abs(distanceFromCentre) > 0.85) return; // far off-screen, skip work
        var tiltX = Math.max(Math.min(distanceFromCentre * 46, 26), -26);
        var tiltY = Math.max(Math.min((rect.left - vh * 0.3) * 0.02, 10), -10);
        el.style.setProperty('--scroll-tilt', tiltX.toFixed(2) + 'deg');
        el.style.setProperty('--scroll-tilt-y', tiltY.toFixed(2) + 'deg');
      });

      ticking = false;
    });
  }

  // Apply the --scroll-tilt custom property as an actual rotation, but only
  // once the entrance animation has finished (so it never fights the reveal).
  var style = document.createElement('style');
  style.textContent =
    '.feature-card, .panel:not(.cta-band){ transform: perspective(1000px) rotateX(var(--scroll-tilt, 0deg)) rotateY(var(--scroll-tilt-y, 0deg)); }' +
    '.feature-card:hover, .panel:not(.cta-band):hover{ transform: perspective(1000px) rotateX(var(--scroll-tilt, 0deg)) rotateY(var(--scroll-tilt-y, 0deg)) translateY(-6px) scale(1.02); }';
  document.head.appendChild(style);

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
