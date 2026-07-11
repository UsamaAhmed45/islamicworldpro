/* ============================================================
   ISLAMIC WORLD PRO — LIQUID GLASS INTERACTION ENGINE
   Vanilla JS. Every effect below is transform/opacity driven,
   rAF-throttled, and respects prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. Loading screen ---------- */
  var loader = document.querySelector('.loader');
  if (loader) {
    var hideLoader = function () {
      loader.classList.add('done');
      setTimeout(function () { loader.remove(); }, 700);
    };
    if (document.readyState === 'complete') hideLoader();
    else window.addEventListener('load', function () { setTimeout(hideLoader, 350); });
  }

  /* ---------- 2. Scroll progress bar ---------- */
  var progressBar = document.querySelector('.scroll-progress');

  /* ---------- 3. Nav: blur ramp + hide/show + active link ---------- */
  var nav = document.querySelector('.nav-premium');
  var lastY = window.scrollY;
  var navSections = Array.prototype.slice.call(document.querySelectorAll('main [data-nav-section]'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-list a[href^="#"]'));

  function updateOnScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (progressBar) progressBar.style.width = (docH > 0 ? (y / docH) * 100 : 0) + '%';

    if (nav) {
      var blur = Math.min(22, (y / 140) * 22);
      var alpha = Math.min(0.55, (y / 140) * 0.55);
      nav.style.setProperty('--nav-blur', blur.toFixed(1) + 'px');
      nav.style.setProperty('--nav-alpha', alpha.toFixed(2));
      nav.classList.toggle('nav-scrolled', y > 12);
      if (y > lastY + 4 && y > 140) nav.classList.add('nav-hidden');
      else if (y < lastY - 4 || y < 140) nav.classList.remove('nav-hidden');
      lastY = y;
    }

    var backBtn = document.querySelector('.back-to-top');
    if (backBtn) backBtn.classList.toggle('visible', y > window.innerHeight * 0.8);

    if (navLinks.length) {
      var current = null;
      navSections.forEach(function (sec) {
        var rect = sec.getBoundingClientRect();
        if (rect.top <= 140 && rect.bottom > 140) current = sec.id;
      });
      navLinks.forEach(function (a) {
        a.classList.toggle('active', current && a.getAttribute('href') === '#' + current);
      });
    }
  }

  var scrollTicking = false;
  window.addEventListener('scroll', function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () { updateOnScroll(); scrollTicking = false; });
  }, { passive: true });
  updateOnScroll();

  /* ---------- 4. Mobile nav toggle ---------- */
  var navToggle = document.getElementById('navToggle');
  var navList = document.getElementById('navLinks');
  if (navToggle && navList) {
    var closeMobileNav = function () {
      navList.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    };
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = navList.classList.toggle('open');
      navToggle.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
    });
    navList.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMobileNav); });
    document.addEventListener('click', function (e) {
      if (navList.classList.contains('open') && !navList.contains(e.target) && e.target !== navToggle) closeMobileNav();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMobileNav(); });
  }

  /* ---------- 5. Back to top ---------- */
  var backToTop = document.querySelector('.back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 6. Scroll reveal (IntersectionObserver, plays once) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal], [data-stagger]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- 7. Animated counters ---------- */
  var nums = document.querySelectorAll('.hero-stats .num');
  if (nums.length) {
    var animateNum = function (el) {
      var text = el.textContent.trim();
      var match = text.match(/^(\d+)(.*)$/);
      if (!match) return;
      var target = parseInt(match[1], 10);
      var suffix = match[2] || '';
      if (reduceMotion) { el.textContent = target + suffix; return; }
      var duration = 1000, start = null;
      el.textContent = '0' + suffix;
      function step(ts) {
        if (start === null) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    };
    if ('IntersectionObserver' in window) {
      var numIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { animateNum(entry.target); numIo.unobserve(entry.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(function (el) { numIo.observe(el); });
    }
  }

  /* ---------- 8. FAQ accordion ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var btn = item.querySelector('.faq-q');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.getAttribute('data-open') === 'true';
      item.setAttribute('data-open', String(!isOpen));
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* ---------- 9. Ripple + magnetic buttons ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      var rect = btn.getBoundingClientRect();
      var span = document.createElement('span');
      var size = Math.max(rect.width, rect.height) * 1.6;
      span.className = 'ripple';
      span.style.width = span.style.height = size + 'px';
      span.style.left = (e.clientX - rect.left - size / 2) + 'px';
      span.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(span);
      span.addEventListener('animationend', function () { span.remove(); });
    });

    if (finePointer && !reduceMotion) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.setProperty('--bx', (x * 0.18).toFixed(1) + 'px');
        btn.style.setProperty('--by', (y * 0.28).toFixed(1) + 'px');
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.setProperty('--bx', '0px');
        btn.style.setProperty('--by', '0px');
      });
    }
  });

  /* ---------- 10. Nav link magnetic hover ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.nav-list a').forEach(function (a) {
      a.addEventListener('mousemove', function (e) {
        var rect = a.getBoundingClientRect();
        var x = (e.clientX - rect.left - rect.width / 2) * 0.25;
        a.style.transform = 'translateX(' + x.toFixed(1) + 'px)';
      });
      a.addEventListener('mouseleave', function () { a.style.transform = ''; });
    });
  }

  /* ---------- 11. Glass card 3D tilt ---------- */
  if (finePointer && !reduceMotion) {
    document.querySelectorAll('.glass-card').forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = 'perspective(900px) rotateX(' + (-py * 10).toFixed(2) + 'deg) rotateY(' + (px * 12).toFixed(2) + 'deg) translateY(-4px)';
      });
      card.addEventListener('mouseleave', function () { card.style.transform = ''; });
    });
  }

  /* ---------- 12. Mouse parallax (hero shapes + spotlight + custom cursor) ---------- */
  var spotlight = document.querySelector('.spotlight');
  var cursorDot = document.querySelector('.cursor-dot');
  var cursorRing = document.querySelector('.cursor-ring');
  var parallaxLayers = document.querySelectorAll('[data-parallax]');
  var instrument = document.querySelector('.instrument-glass');

  if (finePointer) document.documentElement.classList.add('has-custom-cursor');

  var mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  var ringX = mouseX, ringY = mouseY;

  window.addEventListener('mousemove', function (e) {
    mouseX = e.clientX; mouseY = e.clientY;
    if (spotlight) {
      spotlight.style.setProperty('--mx', mouseX + 'px');
      spotlight.style.setProperty('--my', mouseY + 'px');
    }
    if (cursorDot) cursorDot.style.transform = 'translate3d(' + mouseX + 'px,' + mouseY + 'px,0) translate(-50%,-50%)';

    if (!reduceMotion) {
      var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
      var relX = (mouseX - cx) / cx, relY = (mouseY - cy) / cy;
      parallaxLayers.forEach(function (el) {
        var depth = parseFloat(el.getAttribute('data-parallax')) || 10;
        el.style.transform = 'translate3d(' + (relX * depth).toFixed(1) + 'px,' + (relY * depth).toFixed(1) + 'px,0)';
      });
      if (instrument) {
        instrument.style.transform = 'rotateY(' + (relX * 10).toFixed(2) + 'deg) rotateX(' + (-relY * 10).toFixed(2) + 'deg)';
      }
    }
  }, { passive: true });

  if (cursorRing && !reduceMotion) {
    (function loopCursorRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = 'translate3d(' + ringX + 'px,' + ringY + 'px,0) translate(-50%,-50%)';
      requestAnimationFrame(loopCursorRing);
    })();
    document.querySelectorAll('a, button, .glass-card, [data-cursor-hover]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorRing.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { cursorRing.classList.remove('is-hover'); });
    });
  }

  /* ---------- 13. Scroll parallax for hero instrument on scroll ---------- */
  var heroEl = document.querySelector('.hero-premium');
  if (heroEl && instrument && !reduceMotion) {
    var scrollTick2 = false;
    window.addEventListener('scroll', function () {
      if (scrollTick2) return;
      scrollTick2 = true;
      requestAnimationFrame(function () {
        var y = window.scrollY || window.pageYOffset;
        var h = heroEl.offsetHeight || window.innerHeight;
        var p = Math.min(Math.max(y / h, 0), 1);
        instrument.style.opacity = String(1 - p * 0.6);
        var wrap = document.querySelector('.instrument-wrap');
        if (wrap) wrap.style.transform = 'translateY(' + (p * 60).toFixed(1) + 'px) scale(' + (1 - p * 0.12).toFixed(3) + ')';
        scrollTick2 = false;
      });
    }, { passive: true });
  }

  /* ---------- 14. Image blur-up reveal ---------- */
  document.querySelectorAll('img[data-blur-up]').forEach(function (img) {
    if (img.complete) { img.classList.add('is-loaded'); return; }
    img.addEventListener('load', function () { img.classList.add('is-loaded'); }, { once: true });
  });

  /* ---------- 15. Screenshot showcase: arrows + auto-advance ---------- */
  var showcaseRail = document.querySelector('[data-showcase-rail]');
  if (showcaseRail) {
    var prevBtn = document.querySelector('[data-showcase-prev]');
    var nextBtn = document.querySelector('[data-showcase-next]');
    var track = showcaseRail.querySelector('.showcase-track');
    var cards = Array.prototype.slice.call(track.children);
    var AUTO_DELAY = 3800;
    var autoTimer = null;
    var isPointerDown = false;

    function cardStep() {
      var card = cards[0];
      if (!card) return 240;
      var style = window.getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap || 20);
      return card.getBoundingClientRect().width + gap;
    }

    function maxScroll() {
      return showcaseRail.scrollWidth - showcaseRail.clientWidth;
    }

    function updateArrows() {
      var x = showcaseRail.scrollLeft;
      var max = maxScroll();
      if (prevBtn) prevBtn.disabled = x <= 2;
      if (nextBtn) nextBtn.disabled = x >= max - 2;
    }

    function goTo(delta) {
      var max = maxScroll();
      var target = showcaseRail.scrollLeft + delta;
      if (target >= max - 2) target = max;
      if (target <= 2) target = 0;
      showcaseRail.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function step(dir) {
      goTo(dir * cardStep());
    }

    function autoAdvance() {
      if (isPointerDown) return;
      var max = maxScroll();
      if (showcaseRail.scrollLeft >= max - 2) {
        showcaseRail.scrollTo({ left: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      } else {
        step(1);
      }
    }

    function startAuto() {
      if (reduceMotion) return;
      stopAuto();
      autoTimer = window.setInterval(autoAdvance, AUTO_DELAY);
    }
    function stopAuto() {
      if (autoTimer) { window.clearInterval(autoTimer); autoTimer = null; }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { step(-1); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { step(1); startAuto(); });

    var scTick = false;
    showcaseRail.addEventListener('scroll', function () {
      if (scTick) return;
      scTick = true;
      requestAnimationFrame(function () { updateArrows(); scTick = false; });
    }, { passive: true });

    ['mouseenter', 'touchstart', 'pointerdown', 'focusin'].forEach(function (evt) {
      showcaseRail.addEventListener(evt, function () { isPointerDown = true; stopAuto(); }, { passive: true });
    });
    ['mouseleave', 'touchend', 'pointerup', 'focusout'].forEach(function (evt) {
      showcaseRail.addEventListener(evt, function () { isPointerDown = false; startAuto(); }, { passive: true });
    });

    showcaseRail.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { step(1); startAuto(); }
      if (e.key === 'ArrowLeft') { step(-1); startAuto(); }
    });

    var showcaseIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) startAuto(); else stopAuto();
      });
    }, { threshold: 0.3 });
    showcaseIo.observe(showcaseRail);

    updateArrows();
  }
})();
