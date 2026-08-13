// ============ Mobile nav toggle ============
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', links.classList.contains('open'));
    });
    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }));
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

  // ============ Hero 3D tilt ============
  const hero3D = document.getElementById('hero3D');
  const heroWrap = hero3D ? hero3D.closest('.hero-visual-wrap') : null;
  const canTilt = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hero3D && heroWrap && canTilt && !reduceMotion) {
    heroWrap.addEventListener('mousemove', (e) => {
      const rect = heroWrap.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      hero3D.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 16}deg)`;
    });
    heroWrap.addEventListener('mouseleave', () => {
      hero3D.style.transform = 'rotateY(0deg) rotateX(0deg)';
    });
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
