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
    var ticking = false;
    function onScroll() {
      if (ticking) return; ticking = true;
      w.requestAnimationFrame(function () {
        var y = w.scrollY || d.documentElement.scrollTop;
        var max = d.documentElement.scrollHeight - w.innerHeight;
        bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
        if (header) header.classList.toggle('is-scrolled', y > 12);
        ticking = false;
      });
    }
    w.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* Hero: soft moving light + staggered entrance of first-screen text */
    var hero = d.querySelector('.page-hero, .hub-hero, .pt-hero');
    if (hero && !reduce) {
      var aur = d.createElement('div');
      aur.className = 'iwp-aurora'; aur.setAttribute('aria-hidden', 'true');
      hero.insertBefore(aur, hero.firstChild);
    }

    /* Below-the-fold reveal */
    if (reduce || !('IntersectionObserver' in w)) return;
    var SEL = [
      '.section-head', '.feature-card', '.blog-card', '.nm-card', '.video-card', '.mode-card',
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
