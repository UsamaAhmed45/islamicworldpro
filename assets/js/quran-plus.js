/* Islamic World Pro — Qur'an reading comfort: resume, recent, bookmarks panel,
   mobile reading dock. Works with quran-core.js / quran-reader.js / quran-hub.js.
   Everything stays in this browser (localStorage). © 2026 Aurevia Solution. */
(function () {
  'use strict';
  var IWP = window.IWP, Q = window.QCORE, META = window.QMETA;
  if (!IWP || !Q || !META) return;
  var d = document;
  var esc = IWP.esc;
  var ICON = {
    mark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6"/></svg>'
  };

  /* ---------- storage: per-surah position + recent surahs ---------- */
  var POS = 'qpos', RECENT = 'qrecent';
  function pos() { return IWP.store.get(POS, {}); }
  function recent() { return IWP.store.get(RECENT, []); }
  function remember(s, a) {
    var p = pos(); p[s] = a; IWP.store.set(POS, p);
    var r = recent().filter(function (x) { return x.s !== s; });
    r.unshift({ s: s, a: a, t: Date.now() });
    IWP.store.set(RECENT, r.slice(0, 8));
  }
  function surahUrl(s, a) { return '/quran/' + META[s - 1][2] + (a ? '#a' + a : ''); }
  function name(s) { return META[s - 1][1]; }
  function total(s) { return META[s - 1][5]; }
  function ago(t) {
    var m = Math.round((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 24) return h + ' h ago';
    var dd = Math.round(h / 24);
    return dd === 1 ? 'yesterday' : dd + ' days ago';
  }

  /* Only record "last read" after the reader has actually scrolled — opening a
     surah for a moment no longer overwrites where you really were. */
  var userScrolled = false, origSetLast = Q.setLast;
  ['wheel', 'touchmove', 'keydown'].forEach(function (ev) {
    window.addEventListener(ev, function () { userScrolled = true; }, { passive: true, once: true });
  });
  window.addEventListener('scroll', function () { if (window.scrollY > 300) userScrolled = true; }, { passive: true });
  Q.setLast = function (s, a) {
    if (!userScrolled) return;
    origSetLast(s, a);
    remember(s, a);
  };

  /* Bookmarks keep a short snippet of the ayah so the list is readable later */
  var origToggle = Q.toggleMark;
  Q.toggleMark = function (k, snip) {
    var on = origToggle(k);
    if (on) {
      var list = Q.bookmarks();
      if (list[0] && list[0].k === k && snip) { list[0].ar = snip.ar; list[0].en = snip.en; IWP.store.set('qbm', list); }
    }
    d.dispatchEvent(new CustomEvent('iwp:marks'));
    return on;
  };
  function removeMark(k) {
    IWP.store.set('qbm', Q.bookmarks().filter(function (b) { return b.k !== k; }));
    d.dispatchEvent(new CustomEvent('iwp:marks'));
  }
  function cut(t, n) { if (t.length <= n) return t; t = t.slice(0, n); var i = t.lastIndexOf(' '); return (i > n * 0.6 ? t.slice(0, i) : t) + '…'; }
  function markItem(b, cur) {
    var p = b.k.split(':'), s = +p[0], a = +p[1];
    var snip = b.en ? '<p class="bm-en">' + esc(cut(b.en, 140)) + '</p>' : '';
    var ar = b.ar ? '<p class="bm-ar" lang="ar" dir="rtl">' + esc(cut(b.ar, 90)) + '</p>' : '';
    return '<li class="bm-item"><a class="bm-go" href="' + surahUrl(s, a) + '"' + (cur === s ? ' data-here="' + a + '"' : '') + '>' +
      '<span class="bm-ref"><b>' + esc(name(s)) + '</b><span>' + b.k + '</span></span>' + ar + snip +
      '<small>Saved ' + ago(b.t) + '</small></a>' +
      '<button type="button" class="bm-del" data-del="' + b.k + '" aria-label="Remove bookmark ' + b.k + '">' + ICON.x + '</button></li>';
  }

  var reader = d.querySelector('main.qr');
  if (reader) initReader(); else if (d.getElementById('qhContinue')) initHub();

  /* ======================================================================== */
  function initReader() {
    var S = +reader.dataset.surah, COUNT = +reader.dataset.ayahs;
    var ayahs = Array.prototype.slice.call(d.querySelectorAll('#qrAyahs .ayah'));
    var byA = {}; ayahs.forEach(function (el) { byA[el.dataset.a] = el; });
    var cur = 1;

    function snippet(a) {
      var el = byA[a]; if (!el) return null;
      var arEl = el.querySelector('.ayah-ar'), enEl = el.querySelector('.ayah-en');
      var ar = arEl ? arEl.textContent.replace(/[٠-٩\s]+$/, '').trim() : '';
      return { ar: ar, en: enEl ? enEl.textContent.trim() : '' };
    }
    // patch the reader's bookmark action so it stores the snippet
    d.addEventListener('click', function (ev) {
      var b = ev.target.closest('.ayah-tools [data-t="mark"], .qr-pop [data-p="mark"], [data-p="mark"]');
      if (!b) return;
      var host = b.closest('.ayah') || null;
      var a = host ? +host.dataset.a : null;
      if (!a) { var k = d.querySelector('.ap-key'); if (k) { var m = /:(\d+)/.exec(k.textContent); if (m) a = +m[1]; } }
      if (a) pendingSnip = snippet(a);
    }, true);
    var pendingSnip = null;
    var t2 = Q.toggleMark;
    Q.toggleMark = function (k) { var s = pendingSnip; pendingSnip = null; return t2(k, s); };

    /* visible marker on bookmarked ayahs */
    function paintMarks() {
      var keys = {}; Q.bookmarks().forEach(function (b) { keys[b.k] = 1; });
      ayahs.forEach(function (el) {
        var on = !!keys[S + ':' + el.dataset.a];
        el.classList.toggle('is-marked', on);
        var mb = el.querySelector('.ayah-tools [data-t="mark"]');
        if (mb) { mb.classList.toggle('on', on); mb.setAttribute('aria-pressed', on); mb.setAttribute('aria-label', on ? 'Remove bookmark' : 'Bookmark'); }
      });
      var n = Q.bookmarks().length;
      d.querySelectorAll('.bm-count').forEach(function (c) { c.textContent = n || ''; c.hidden = !n; });
    }
    d.addEventListener('iwp:marks', function () { paintMarks(); if (!sheet.hidden) renderSheet(); });
    window.addEventListener('storage', function (e) { if (e.key === 'iwp:qbm') paintMarks(); });

    /* ---------- bookmarks sheet ---------- */
    var sheet = d.createElement('div');
    sheet.className = 'bm-sheet'; sheet.hidden = true;
    sheet.setAttribute('role', 'dialog'); sheet.setAttribute('aria-label', 'Your bookmarks');
    sheet.innerHTML = '<div class="bm-scrim" data-bm-close></div><div class="bm-panel"><span class="bm-grip" aria-hidden="true"></span>' +
      '<div class="bm-head"><h2>Your bookmarks</h2><button type="button" class="bm-x" data-bm-close aria-label="Close">' + ICON.x + '</button></div>' +
      '<div class="bm-body"></div></div>';
    d.body.appendChild(sheet);
    function renderSheet() {
      var list = Q.bookmarks(), body = sheet.querySelector('.bm-body');
      if (!list.length) {
        body.innerHTML = '<div class="bm-empty">' + ICON.mark + '<p><b>No bookmarks yet</b><br>Tap the bookmark icon on any ayah to save it here.</p></div>';
        return;
      }
      var here = list.filter(function (b) { return +b.k.split(':')[0] === S; });
      var other = list.filter(function (b) { return +b.k.split(':')[0] !== S; });
      body.innerHTML =
        (here.length ? '<h3>In Surah ' + esc(name(S)) + '</h3><ul class="bm-list">' + here.map(function (b) { return markItem(b, S); }).join('') + '</ul>' : '') +
        (other.length ? '<h3>Other surahs</h3><ul class="bm-list">' + other.map(function (b) { return markItem(b, S); }).join('') + '</ul>' : '');
    }
    function openSheet() { renderSheet(); sheet.hidden = false; requestAnimationFrame(function () { sheet.classList.add('open'); }); }
    function closeSheet() { sheet.classList.remove('open'); setTimeout(function () { sheet.hidden = true; }, 260); }
    sheet.addEventListener('click', function (ev) {
      if (ev.target.closest('[data-bm-close]')) { closeSheet(); return; }
      var del = ev.target.closest('[data-del]');
      if (del) { var li = del.closest('.bm-item'); li.classList.add('bm-out'); setTimeout(function () { removeMark(del.dataset.del); IWP.toast('Bookmark removed'); }, 220); return; }
      var go = ev.target.closest('[data-here]');
      if (go) { ev.preventDefault(); closeSheet(); location.hash = '#a' + go.dataset.here; }
    });
    d.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && !sheet.hidden) closeSheet();
      if ((ev.key === 'b' || ev.key === 'B') && !ev.target.closest('input,select,textarea') && !ev.metaKey && !ev.ctrlKey) { sheet.hidden ? openSheet() : closeSheet(); }
    });

    /* toolbar button (desktop) */
    var gear = d.querySelector('.qr-toolbar [data-act="settings"]');
    if (gear) {
      var tb = d.createElement('button');
      tb.type = 'button'; tb.className = 'tb-btn tb-marks'; tb.setAttribute('data-bm-open', '');
      tb.setAttribute('aria-label', 'Bookmarks (B)');
      tb.innerHTML = ICON.mark + '<span>Bookmarks</span><i class="bm-count" hidden></i>';
      gear.parentNode.insertBefore(tb, gear);
    }

    /* ---------- mobile reading dock ---------- */
    var dock = d.createElement('nav');
    dock.className = 'qr-dock'; dock.setAttribute('aria-label', 'Reading controls');
    dock.innerHTML =
      '<button type="button" data-act="rail">' + ICON.list + '<span>Surahs</span></button>' +
      '<button type="button" data-act="playall" class="dk-play">' + ICON.play + '<span>Listen</span></button>' +
      '<button type="button" class="dk-pos" data-dk-pos><b>1</b><span>of ' + COUNT + '</span><i class="dk-ring"></i></button>' +
      '<button type="button" data-bm-open>' + ICON.mark + '<span>Saved</span><i class="bm-count" hidden></i></button>' +
      '<button type="button" data-act="settings">' + ICON.gear + '<span>Settings</span></button>';
    d.body.appendChild(dock);
    d.body.classList.add('has-qr-dock');
    d.addEventListener('click', function (ev) { if (ev.target.closest('[data-bm-open]')) openSheet(); });

    /* position tracking for the dock + resume pill */
    var posB = dock.querySelector('.dk-pos b'), ring = dock.querySelector('.dk-pos');
    function setCur(a) {
      cur = a; posB.textContent = a;
      ring.style.setProperty('--p', Math.round(a / COUNT * 100));
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) setCur(+e.target.dataset.a); });
      }, { rootMargin: '-35% 0px -60% 0px' });
      ayahs.forEach(function (el) { io.observe(el); });
    }
    // tap the position chip = jump to an ayah
    dock.querySelector('[data-dk-pos]').addEventListener('click', function () {
      var v = window.prompt('Go to ayah (1–' + COUNT + ')', cur);
      var n = parseInt(v, 10);
      if (n >= 1 && n <= COUNT) location.hash = '#a' + n;
    });

    /* ---------- resume where you left off ---------- */
    var saved = pos()[S] || ((IWP.store.get('qlast', {}) || {}).s === S ? IWP.store.get('qlast', {}).a : 0);
    if (!/^#a?\d+$/.test(location.hash) && saved > 2 && saved <= COUNT) {
      var pill = d.createElement('div');
      pill.className = 'qr-resume';
      pill.innerHTML = '<button type="button" class="rs-go">' + ICON.down + '<span><b>Continue from ayah ' + saved + '</b><small>' +
        Math.round(saved / COUNT * 100) + '% of Surah ' + esc(name(S)) + '</small></span></button>' +
        '<button type="button" class="rs-x" aria-label="Dismiss">' + ICON.x + '</button>';
      d.body.appendChild(pill);
      requestAnimationFrame(function () { setTimeout(function () { pill.classList.add('show'); }, 350); });
      var hide = function () { pill.classList.remove('show'); setTimeout(function () { pill.remove(); }, 400); };
      pill.querySelector('.rs-go').onclick = function () { location.hash = '#a' + saved; userScrolled = true; hide(); };
      pill.querySelector('.rs-x').onclick = hide;
      setTimeout(hide, 15000);
      window.addEventListener('scroll', function onS() {
        if (cur >= saved) { hide(); window.removeEventListener('scroll', onS); }
      }, { passive: true });
    }
    paintMarks();
  }

  /* ======================================================================== */
  function initHub() {
    // Continue card with progress + recently read
    var box = d.getElementById('qhContinue');
    function renderContinue() {
      var r = recent();
      if (!r.length) { var l = IWP.store.get('qlast', null); if (l && META[l.s - 1]) r = [{ s: l.s, a: l.a, t: l.t }]; }
      if (!r.length) return;
      var top = r[0], pct = Math.min(100, Math.round(top.a / total(top.s) * 100));
      box.hidden = false;
      box.classList.add('qc-plus');
      box.innerHTML =
        '<div class="qc-main"><small>Continue reading · ' + ago(top.t) + '</small>' +
        '<strong>Surah ' + esc(name(top.s)) + ' · ayah ' + top.a + '</strong>' +
        '<div class="qc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><i style="width:' + pct + '%"></i></div>' +
        '<small>' + pct + '% · ' + top.a + ' of ' + total(top.s) + ' ayahs</small></div>' +
        '<a class="btn btn-gold btn-sm" href="' + surahUrl(top.s, top.a) + '">Resume</a>' +
        (r.length > 1 ? '<div class="qc-recent"><span>Recently read</span>' + r.slice(1, 6).map(function (x) {
          var p = Math.min(100, Math.round(x.a / total(x.s) * 100));
          return '<a href="' + surahUrl(x.s, x.a) + '" style="--p:' + p + '"><b>' + esc(name(x.s)) + '</b><small>' + x.s + ':' + x.a + ' · ' + p + '%</small></a>';
        }).join('') + '</div>' : '');
    }
    renderContinue();

    // Bookmarks tab: rich list with ayah text + remove, and a count badge
    var tab = d.querySelector('[data-idx="saved"]');
    if (tab && !tab.querySelector('.bm-count')) tab.insertAdjacentHTML('beforeend', ' <i class="bm-count" hidden></i>');
    function count() { var n = Q.bookmarks().length; d.querySelectorAll('.bm-count').forEach(function (c) { c.textContent = n || ''; c.hidden = !n; }); }
    function renderSaved() {
      var el = d.getElementById('idxSaved'), list = Q.bookmarks();
      if (!list.length) { el.innerHTML = '<div class="bm-empty">' + ICON.mark + '<p><b>No bookmarks yet</b><br>Open any surah and tap the bookmark icon on an ayah — it will appear here, with its text.</p></div>'; return; }
      el.innerHTML = '<ul class="bm-list bm-grid">' + list.map(function (b) { return markItem(b, 0); }).join('') + '</ul>';
    }
    if (tab) tab.addEventListener('click', function () { setTimeout(renderSaved, 0); });
    d.getElementById('idxSaved').addEventListener('click', function (ev) {
      var del = ev.target.closest('[data-del]');
      if (!del) return;
      var li = del.closest('.bm-item'); li.classList.add('bm-out');
      setTimeout(function () { removeMark(del.dataset.del); renderSaved(); count(); IWP.toast('Bookmark removed'); }, 220);
    });
    d.addEventListener('iwp:marks', count);
    count();
    if (location.hash === '#bookmarks' && tab) tab.click();
  }
})();
