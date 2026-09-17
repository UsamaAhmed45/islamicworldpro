/* Islamic World Pro — Mushaf pages. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP, Q = window.QCORE, META = window.QMETA;
  var root = document.querySelector('main.ms');
  if (!root || !Q) return;
  var book = document.getElementById('msBook');
  var inPage = document.getElementById('msPage'), selS = document.getElementById('msSurah'), selJ = document.getElementById('msJuz');
  var chunks = {}, page = 1, tajweed = false, BISM = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ';

  function spread() { return window.innerWidth > 1100; }
  function chunk(p) {
    var c = Math.ceil(p / 20);
    if (chunks[c]) return Promise.resolve(chunks[c]);
    return IWP.fetchJSON('/assets/data/quran/mushaf/' + c + '.json').then(function (j) { chunks[c] = j; return j; });
  }
  function getPage(p) { return chunk(p).then(function (c) { return c[p]; }); }

  function pageHTML(p, verses, side) {
    var first = verses[0], m = META[first[0] - 1];
    var html = '<div class="ms-page ' + side + '" data-page="' + p + '"><div class="ms-head"><span>Juz ' + first[3] + '</span><span class="ms-sname" lang="ar">' + IWP.esc(m[4]) + '</span></div><div class="ms-text" lang="ar">';
    verses.forEach(function (v) {
      var s = v[0], a = v[1];
      if (a === 1) {
        html += '<span class="ms-sura">سُورَةُ ' + IWP.esc(META[s - 1][4]) + '</span>';
        if (s !== 1 && s !== 9) html += '<span class="ms-bism">' + BISM + '</span>';
      }
      html += '<span class="v" data-s="' + s + '" data-a="' + a + '" tabindex="0">' + IWP.esc(v[2]) + ' <span class="ayah-end">' + Q.arNum(a) + '</span></span> ';
    });
    return html + '</div><div class="ms-foot">' + Q.arNum(p) + '</div></div>';
  }

  function fitPageText(pageEl) {
    var textEl = pageEl.querySelector('.ms-text');
    if (!textEl) return;
    var base = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ar-size')) || 34;
    textEl.style.fontSize = base + 'px';
    var size = base, floor = Math.max(16, base * 0.55), guard = 0;
    while (textEl.scrollHeight > textEl.clientHeight + 1 && size > floor && guard < 40) {
      size -= 1;
      textEl.style.fontSize = size + 'px';
      guard++;
    }
  }

  function show(p, push) {
    p = Math.max(1, Math.min(604, p | 0));
    var pages = [p];
    if (spread()) {
      var right = p % 2 ? p : p - 1;
      pages = [right];
      if (right + 1 <= 604) pages.push(right + 1);
      p = right;
    }
    page = p;
    Promise.all(pages.map(getPage)).then(function (list) {
      book.classList.toggle('single', list.length === 1);
      book.innerHTML = list.map(function (v, i) { return pageHTML(pages[i], v, i === 0 ? 'right' : 'left'); }).join('');
      book.querySelectorAll('.ms-page').forEach(fitPageText);
      inPage.value = pages[0];
      syncSelects(list[0][0]);
      IWP.store.set('mpage', pages[0]);
      var u = new URL(location.href);
      u.searchParams.set('page', pages[0]);
      history[push ? 'pushState' : 'replaceState']({ page: pages[0] }, '', u);
      document.title = "Qur'an Mushaf – Page " + pages[0] + ' | Islamic World Pro';
      if (tajweed) applyTajweed();
      highlight();
    }).catch(function () {
      book.innerHTML = '<div class="state-msg">This page could not load. Check your connection and try again.</div>';
    });
  }

  function syncSelects(firstVerse) {
    var s = firstVerse[0];
    selS.value = META[s - 1][7];
    var j = firstVerse[3];
    selJ.selectedIndex = j - 1;
  }

  function step(dir) { show(page + dir * (spread() ? 2 : 1), true); }

  /* tajweed */
  function applyTajweed() {
    var spans = book.querySelectorAll('.v');
    var surahs = {};
    spans.forEach(function (sp) { surahs[sp.dataset.s] = 1; });
    Promise.all(Object.keys(surahs).map(function (s) { return Q.tajweed(+s).then(function (t) { return [s, t]; }); })).then(function (all) {
      if (!tajweed) return;
      var map = {};
      all.forEach(function (x) { map[x[0]] = x[1]; });
      spans.forEach(function (sp) {
        var t = map[sp.dataset.s] && map[sp.dataset.s][sp.dataset.a];
        if (t) sp.innerHTML = t + ' <span class="ayah-end">' + Q.arNum(sp.dataset.a) + '</span>';
      });
    }).catch(function () { IWP.toast('Tajweed colours need an internet connection'); });
  }

  /* audio */
  Q.bindAudioBar();
  Q.audio.on(highlight);
  function highlight() {
    var cur = Q.audio.current();
    book.querySelectorAll('.v.playing').forEach(function (x) { x.classList.remove('playing'); });
    if (!cur || cur.bism) return;
    var el = book.querySelector('.v[data-s="' + cur.s + '"][data-a="' + cur.a + '"]');
    if (el) el.classList.add('playing');
    else if (Q.audio.playing()) {
      // recitation moved beyond the open pages: turn the page
      chunk(Math.max(1, page - 2)).then(function () {
        for (var p = page; p <= Math.min(604, page + 3); p++) {
          var c = chunks[Math.ceil(p / 20)];
          if (c && c[p] && c[p].some(function (v) { return v[0] === cur.s && v[1] === cur.a; })) { show(p); return; }
        }
      });
    }
  }
  function queueFrom(s, a) {
    var q = [];
    var spans = book.querySelectorAll('.v'), started = false;
    spans.forEach(function (sp) {
      var vs = +sp.dataset.s, va = +sp.dataset.a;
      if (vs === s && va === a) started = true;
      if (!started) return;
      if (va === 1 && vs !== 1 && vs !== 9) q.push({ s: 1, a: 1, bism: true });
      q.push({ s: vs, a: va });
    });
    // keep reciting into the following surah text
    var last = q[q.length - 1];
    if (last) {
      var m = META[last.s - 1];
      for (var x = last.a + 1; x <= m[5]; x++) q.push({ s: last.s, a: x });
    }
    return q;
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (b) {
      var act = b.dataset.act;
      if (act === 'next') step(1);
      else if (act === 'prev') step(-1);
      else if (act === 'fullscreen') Q.fullscreen(root);
      else if (act === 'tajweed') {
        tajweed = !tajweed;
        b.setAttribute('aria-pressed', tajweed);
        if (tajweed) applyTajweed(); else show(page);
      } else if (act === 'playpage') {
        if (Q.audio.current()) Q.audio.toggle();
        else { var f = book.querySelector('.v'); if (f) Q.audio.play(queueFrom(+f.dataset.s, +f.dataset.a), 0); }
      }
      return;
    }
    var v = ev.target.closest('.v');
    if (v) {
      var s = +v.dataset.s, a = +v.dataset.a, m = META[s - 1], key = s + ':' + a;
      var pop = Q.popover(v, '<div class="ap-key">Surah ' + IWP.esc(m[1]) + ' · ' + key + '</div>' +
        '<div class="ap-actions"><button data-p="play">Play from here</button><a href="/quran/' + m[2] + '#a' + a + '">Tarjuma &amp; tafseer</a><button data-p="mark">' + (Q.isMarked(key) ? 'Remove bookmark' : 'Bookmark') + '</button><button data-p="copy">Copy</button></div>');
      if (pop) pop.onclick = function (e2) {
        var pb = e2.target.closest('[data-p]');
        if (!pb) return;
        if (pb.dataset.p === 'play') Q.audio.play(queueFrom(s, a), 0);
        if (pb.dataset.p === 'mark') Q.toggleMark(key);
        if (pb.dataset.p === 'copy') IWP.copy(v.textContent.trim() + '\n— Qur\'an ' + key, 'Ayah ' + key + ' copied');
        pop.hidden = true;
      };
    }
  });

  selS.addEventListener('change', function () { show(+selS.value, true); });
  selJ.addEventListener('change', function () { show(+selJ.value, true); });
  inPage.addEventListener('change', function () { show(+inPage.value, true); });

  document.addEventListener('keydown', function (ev) {
    if (ev.target.closest('input,select,textarea') || ev.metaKey || ev.ctrlKey) return;
    if (ev.key === 'ArrowLeft') step(1);
    else if (ev.key === 'ArrowRight') step(-1);
    else if (ev.key === ' ') { ev.preventDefault(); if (!Q.audio.toggle()) { var f = book.querySelector('.v'); if (f) Q.audio.play(queueFrom(+f.dataset.s, +f.dataset.a), 0); } }
    else if (ev.key === 'f' || ev.key === 'F') Q.fullscreen(root);
  });

  var tx = null;
  book.addEventListener('touchstart', function (ev) { tx = ev.touches[0].clientX; }, { passive: true });
  book.addEventListener('touchend', function (ev) {
    if (tx == null) return;
    var dx = ev.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 60) step(dx > 0 ? 1 : -1);
    tx = null;
  });

  var wasSpread = spread();
  window.addEventListener('resize', function () { if (spread() !== wasSpread) { wasSpread = spread(); show(page); } });
  window.addEventListener('popstate', function (ev) { if (ev.state && ev.state.page) show(ev.state.page); });

  Q.bindSettings(function (k) { if (k === 'arSize') show(page); });
  var qp = parseInt(new URLSearchParams(location.search).get('page'), 10);
  show(qp || IWP.store.get('mpage', 1));
})();
