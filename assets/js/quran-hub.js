/* Islamic World Pro — Qur'an index. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP, Q = window.QCORE, META = window.QMETA;
  var form = document.getElementById('qhSearch');
  if (!form || !META) return;
  var input = document.getElementById('qhInput');
  var results = document.getElementById('qhResults');
  var cards = Array.prototype.slice.call(document.querySelectorAll('#idxSurah .sc'));
  var place = 'all';

  function url(s, a) { return '/quran/' + META[s - 1][2] + (a ? '#a' + a : ''); }

  function filterCards(q) {
    q = (q || '').toLowerCase().trim();
    var shown = 0;
    cards.forEach(function (c) {
      var ok = (!q || c.dataset.q.indexOf(q) >= 0) && (place === 'all' || c.dataset.place === place);
      c.hidden = !ok;
      if (ok) shown++;
    });
    return shown;
  }

  function parseRef(q) {
    var m = /^\s*(\d{1,3})\s*[:.\s]\s*(\d{1,3})\s*$/.exec(q);
    if (m) {
      var s = +m[1], a = +m[2];
      if (s >= 1 && s <= 114 && a >= 1 && a <= META[s - 1][5]) return { s: s, a: a };
    }
    m = /^\s*(\d{1,3})\s*$/.exec(q);
    if (m && +m[1] >= 1 && +m[1] <= 114) return { s: +m[1] };
    return null;
  }

  input.addEventListener('input', function () {
    var q = input.value;
    if (parseRef(q)) return;
    var n = filterCards(q);
    if (q.trim().length > 1) showTab('surah');
    results.hidden = true;
    if (n === 0 && q.trim().length > 2) {
      results.hidden = false;
      results.innerHTML = '<p class="empty">No surah matches “' + IWP.esc(q) + '”. Press Enter to search inside the ayahs.</p>';
    }
  });

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    run(input.value);
  });

  function run(q) {
    q = (q || '').trim();
    if (!q) return;
    var ref = parseRef(q);
    if (ref) { location.href = url(ref.s, ref.a); return; }
    var n = filterCards(q);
    if (n === 1) { var only = cards.find(function (c) { return !c.hidden; }); location.href = only.querySelector('a').href; return; }
    if (n > 1) { showTab('surah'); document.getElementById('idxSurah').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    searchAyahs(q);
  }

  function searchAyahs(q) {
    var urdu = /[\u0600-\u06ff]/.test(q);
    var ed = urdu ? 'ur.jalandhry' : 'en.sahih';
    results.hidden = false;
    results.innerHTML = '<p class="empty">Searching the Qur\'an for “' + IWP.esc(q) + '”…</p>';
    IWP.fetchJSON('https://api.alquran.cloud/v1/search/' + encodeURIComponent(q) + '/all/' + ed).then(function (j) {
      var ms = (j.data && j.data.matches) || [];
      if (!ms.length) throw new Error('none');
      var re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      results.innerHTML = '<h3>' + j.data.count + ' ayah' + (j.data.count === 1 ? '' : 's') + ' mention “' + IWP.esc(q) + '”</h3><ol>' +
        ms.slice(0, 60).map(function (m) {
          var s = m.surah.number, a = m.numberInSurah;
          return '<li><a href="' + url(s, a) + '"><span class="rk">Surah ' + IWP.esc(META[s - 1][1]) + ' · ' + s + ':' + a + '</span><p' + (urdu ? ' dir="rtl" lang="ur" style="font-family:var(--urdu);line-height:2.2"' : '') + '>' + IWP.esc(m.text).replace(re, '<mark>$1</mark>') + '</p></a></li>';
        }).join('') + '</ol>';
    }).catch(function (err) {
      results.innerHTML = err.message === 'none'
        ? '<p class="empty">No ayahs found for “' + IWP.esc(q) + '”. Try a single word such as patience, mercy or parents.</p>'
        : '<p class="empty">Ayah search needs an internet connection. Surah names and references like 2:255 still work offline.</p>';
    });
  }

  /* tabs */
  var tabs = document.querySelectorAll('[data-idx]');
  function showTab(name) {
    tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.idx === name); });
    document.getElementById('idxSurah').hidden = name !== 'surah';
    document.getElementById('idxJuz').hidden = name !== 'juz';
    document.getElementById('idxSaved').hidden = name !== 'saved';
    document.getElementById('placeFilter').hidden = name !== 'surah';
    if (name === 'saved') renderSaved();
  }
  tabs.forEach(function (t) { t.addEventListener('click', function () { showTab(t.dataset.idx); }); });
  document.querySelectorAll('#placeFilter [data-place]').forEach(function (b) {
    b.addEventListener('click', function () {
      place = b.dataset.place;
      document.querySelectorAll('#placeFilter [data-place]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      filterCards(input.value);
    });
  });

  function renderSaved() {
    var box = document.getElementById('idxSaved'), bm = Q.bookmarks();
    if (!bm.length) { box.innerHTML = '<p class="empty">Bookmarked ayahs appear here. Tap the bookmark icon on any ayah while reading.</p>'; return; }
    box.innerHTML = '<div class="saved-list">' + bm.map(function (b) {
      var p = b.k.split(':'), m = META[p[0] - 1];
      return '<a href="' + url(+p[0], +p[1]) + '"><strong>Surah ' + IWP.esc(m[1]) + ' · ' + b.k + '</strong><br><small>Saved ' + new Date(b.t).toLocaleDateString() + '</small></a>';
    }).join('') + '</div>';
  }

  /* continue reading */
  var last = IWP.store.get('qlast', null);
  if (last && META[last.s - 1]) {
    var c = document.getElementById('qhContinue'), m = META[last.s - 1];
    c.hidden = false;
    c.innerHTML = '<div><small>Continue reading</small><strong>Surah ' + IWP.esc(m[1]) + ' · ayah ' + last.a + '</strong><small>' + IWP.esc(m[3]) + ' · ' + m[5] + ' ayahs</small></div>' +
      '<a class="btn btn-gold btn-sm" href="' + url(last.s, last.a) + '">Resume</a>';
  }

  var q0 = new URLSearchParams(location.search).get('q');
  if (q0) { input.value = q0; run(q0); }
  var legacy = parseInt(new URLSearchParams(location.search).get('surah'), 10);
  if (legacy >= 1 && legacy <= 114) location.replace(url(legacy));
})();
