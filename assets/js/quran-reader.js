/* Islamic World Pro — surah reader. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP, Q = window.QCORE;
  var root = document.querySelector('main.qr');
  if (!root || !Q) return;

  var S = +root.dataset.surah, NAME = root.dataset.name, COUNT = +root.dataset.ayahs;
  var main = document.getElementById('qrMain');
  var list = document.getElementById('qrAyahs');
  var shell = document.querySelector('.qr-shell');
  var drawer = document.getElementById('qrDrawer');
  var ayahs = Array.prototype.slice.call(list.querySelectorAll('.ayah'));
  var byA = {};
  ayahs.forEach(function (el) { byA[el.dataset.a] = el; });
  var arOriginal = {};
  var enOriginal = {};
  var currentA = 1;

  /* ---------- per-ayah tools + page marks ---------- */
  var tpl = document.createElement('div');
  tpl.className = 'ayah-tools';
  tpl.innerHTML =
    '<button type="button" data-t="play" aria-label="Play from this ayah"><svg><use href="#i-play"/></svg></button>' +
    '<button type="button" data-t="tafseer" aria-label="Tafseer"><svg><use href="#i-book"/></svg></button>' +
    '<button type="button" data-t="mark" aria-label="Bookmark"><svg><use href="#i-mark"/></svg></button>' +
    '<button type="button" data-t="copy" aria-label="Copy"><svg><use href="#i-copy"/></svg></button>' +
    '<button type="button" data-t="share" aria-label="Share"><svg><use href="#i-share"/></svg></button>';
  var lastPage = null;
  ayahs.forEach(function (el) {
    var t = tpl.cloneNode(true);
    if (Q.isMarked(S + ':' + el.dataset.a)) t.querySelector('[data-t="mark"]').classList.add('on');
    el.insertBefore(t, el.querySelector('.ayah-ar'));
    arOriginal[el.dataset.a] = el.querySelector('.ayah-ar').innerHTML;
    enOriginal[el.dataset.a] = el.querySelector('.ayah-en').textContent;
    if (el.dataset.p !== lastPage) {
      var pm = document.createElement('span');
      pm.className = 'page-mark';
      pm.textContent = 'Page ' + el.dataset.p + ' · Juz ' + el.dataset.j;
      list.insertBefore(pm, el);
      lastPage = el.dataset.p;
    }
  });

  function ayahText(a, which) {
    var el = byA[a];
    if (!el) return '';
    if (which === 'ar') return arOriginal[a].replace(/<span class="ayah-end">.*?<\/span>/, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    var p = el.querySelector('.ayah-' + which);
    return p ? p.textContent : '';
  }

  /* ---------- mode & language ---------- */
  var params = new URLSearchParams(location.search);
  var mode = params.get('mode') || Q.settings.mode;
  var lang = params.get('lang') || Q.settings.lang;
  var tajweed = params.has('tajweed') ? params.get('tajweed') === '1' : Q.settings.tajweed;

  function setPressed(sel, attr, val) {
    document.querySelectorAll(sel).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute(attr) === val); });
  }
  function setMode(m, save) {
    if (['translation', 'reading', 'wbw'].indexOf(m) < 0) m = 'translation';
    mode = m;
    main.dataset.mode = m;
    setPressed('button[data-mode]', 'data-mode', m);
    if (save) { Q.settings.mode = m; Q.save(); }
    if (m === 'wbw') loadWords();
  }
  function setLang(l, save) {
    if (['en', 'ur', 'both'].indexOf(l) < 0) l = 'en';
    lang = l;
    main.dataset.lang = l;
    setPressed('button[data-lang]', 'data-lang', l);
    if (save) { Q.settings.lang = l; Q.save(); }
    if (mode === 'wbw') loadWords();
  }

  /* ---------- tajweed ---------- */
  var legend = null;
  function setTajweed(on, save) {
    tajweed = on;
    setPressed('[data-act="tajweed"]', 'data-act', on ? 'tajweed' : '');
    if (save) { Q.settings.tajweed = on; Q.save(); }
    if (!on) {
      ayahs.forEach(function (el) { el.querySelector('.ayah-ar').innerHTML = arOriginal[el.dataset.a]; });
      if (legend) { legend.remove(); legend = null; }
      return;
    }
    Q.tajweed(S).then(function (tj) {
      if (!tajweed) return;
      ayahs.forEach(function (el) {
        var a = el.dataset.a;
        if (tj[a]) el.querySelector('.ayah-ar').innerHTML = tj[a] + ' <span class="ayah-end">' + Q.arNum(a) + '</span>';
      });
      if (!legend) {
        var wrap = document.createElement('div');
        wrap.innerHTML = Q.legendHTML();
        legend = wrap.firstChild;
        main.insertBefore(legend, main.firstChild);
      }
    }).catch(function () {
      IWP.toast('Tajweed colours need an internet connection');
      tajweed = false;
      setPressed('[data-act="tajweed"]', 'data-act', '');
    });
  }

  /* ---------- word by word ---------- */
  var wordsLang = null, wordsBusy = false;
  function loadWords() {
    var wl = lang === 'ur' ? 'ur' : 'en';
    if (wordsLang === wl || wordsBusy) return;
    wordsBusy = true;
    var note = main.querySelector('.wbw-note');
    if (!note) { note = document.createElement('p'); note.className = 'wbw-note'; main.insertBefore(note, list); }
    note.textContent = 'Loading word-by-word meanings…';
    Q.words(S, wl).then(function (data) {
      ayahs.forEach(function (el) {
        var words = data[el.dataset.a];
        if (!words) return;
        var box = el.querySelector('.ayah-wbw');
        if (!box) { box = document.createElement('div'); box.className = 'ayah-wbw'; el.insertBefore(box, el.querySelector('.ayah-ar')); }
        box.innerHTML = words.map(function (w) {
          if (w.end) return '<span class="w end"><span class="w-ar">' + IWP.esc(Q.arNum(el.dataset.a)) + '</span></span>';
          return '<span class="w" tabindex="0" role="button" data-audio="' + IWP.esc(w.audio || '') + '"><span class="w-ar" lang="ar">' + IWP.esc(w.ar) + '</span>' +
            '<span class="w-lit">' + IWP.esc(w.lit || '') + '</span><span class="w-tr"' + (wl === 'ur' ? ' lang="ur"' : '') + '>' + IWP.esc(w.tr || '') + '</span></span>';
        }).join('');
        el.classList.add('has-wbw');
      });
      wordsLang = wl;
      note.textContent = 'Tap a word to hear it. Meanings: Quran.com word-by-word (' + (wl === 'ur' ? 'Urdu' : 'English') + ').';
    }).catch(function () {
      note.textContent = 'Word-by-word meanings could not load. Check your internet connection and choose Word by word again.';
    }).finally(function () { wordsBusy = false; });
  }
  main.classList.toggle('show-translit', !!Q.settings.translit);
  list.addEventListener('click', function (ev) {
    var w = ev.target.closest('.w[data-audio]');
    if (w) { list.querySelectorAll('.w.on').forEach(function (x) { x.classList.remove('on'); }); w.classList.add('on'); Q.playWord(w.dataset.audio); }
  });

  /* ---------- alternate English translation ---------- */
  var trBusy = false;
  function setTranslation(edition, save) {
    if (save) { Q.settings.translation = edition; Q.save(); }
    if (edition === 'en.sahih') {
      ayahs.forEach(function (el) { el.querySelector('.ayah-en').textContent = enOriginal[el.dataset.a]; });
      return;
    }
    if (trBusy) return;
    trBusy = true;
    Q.translationFor(edition, S).then(function (data) {
      ayahs.forEach(function (el) {
        var t = data[el.dataset.a];
        if (t) el.querySelector('.ayah-en').textContent = t;
      });
    }).catch(function () {
      IWP.toast('That translation could not load. Check your internet connection.');
      var sel = document.querySelector('[data-set="translation"]');
      if (sel) sel.value = 'en.sahih';
      Q.settings.translation = 'en.sahih'; Q.save();
      setTranslation('en.sahih', false);
    }).finally(function () { trBusy = false; });
  }

  /* ---------- tafseer drawer ---------- */
  var drA = null;
  var drSel = document.getElementById('drTafseer');
  Q.fillTafseers(drSel);
  function openTafseer(a) {
    a = Math.max(1, Math.min(COUNT, +a));
    drA = a;
    drawer.hidden = false;
    shell.classList.add('with-drawer');
    document.getElementById('drTitle').textContent = 'Surah ' + NAME + ' · ' + S + ':' + a;
    document.getElementById('drAyah').textContent = ayahText(a, 'ar');
    var body = document.getElementById('drBody');
    var slug = drSel.value;
    body.setAttribute('lang', Q.tafseerLang(slug));
    body.innerHTML = '<p>Loading tafseer…</p>';
    Q.tafseerFor(slug, S, a).then(function (r) {
      if (drA !== a) return;
      if (!r.text) { body.innerHTML = '<p>This tafseer has no commentary for this ayah. Try another tafseer from the list.</p>'; return; }
      body.innerHTML = (r.from !== a ? '<p><em>Explained together with ayah ' + S + ':' + r.from + '.</em></p>' : '') + Q.formatTafseer(r.text);
      body.scrollTop = 0;
    }).catch(function () {
      if (drA === a) body.innerHTML = '<p>Tafseer could not load. Check your internet connection and try again.</p>';
    });
    if (window.innerWidth > 1180) scrollToAyah(a, true);
  }
  function closeTafseer() { drawer.hidden = true; shell.classList.remove('with-drawer'); drA = null; }
  drSel.addEventListener('change', function () { Q.settings.tafseer = drSel.value; Q.save(); if (drA) openTafseer(drA); });

  /* ---------- scrolling helpers ---------- */
  function scrollToAyah(a, soft) {
    var el = byA[a];
    if (!el) return;
    var r = el.getBoundingClientRect();
    var top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--hdr-h'), 10) + 70;
    if (soft && r.top > top && r.bottom < window.innerHeight - 90) return;
    window.scrollTo({ top: window.scrollY + r.top - top - 8, behavior: 'smooth' });
  }

  /* ---------- audio ---------- */
  Q.bindAudioBar();
  var bism = main.querySelector('.qr-bismillah');
  Q.audio.on(function (item, playing) {
    ayahs.forEach(function (el) { el.classList.remove('playing'); });
    if (bism) bism.classList.toggle('playing', !!(item && item.bism));
    if (!item || item.bism) return;
    var el = byA[item.a];
    if (el && item.s === S) {
      el.classList.add('playing');
      if (playing && Q.settings.autoscroll) scrollToAyah(item.a, true);
    }
  });
  function playFrom(a) { Q.audio.play(Q.surahQueue(S, a), 0); }

  /* ---------- toolbar & page clicks ---------- */
  var rail = document.getElementById('qrRail'), scrim = null;
  function toggleRail(open) {
    if (window.innerWidth > 1180) return;
    open = open == null ? !rail.classList.contains('open') : open;
    rail.classList.toggle('open', open);
    if (open) { scrim = document.createElement('div'); scrim.className = 'rail-scrim'; scrim.onclick = function () { toggleRail(false); }; document.body.appendChild(scrim); document.getElementById('railSearch').focus(); }
    else if (scrim) { scrim.remove(); scrim = null; }
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-mode]');
    if (b) { setMode(b.dataset.mode, true); return; }
    b = ev.target.closest('button[data-lang]');
    if (b && b.closest('.qr-toolbar')) { setLang(b.dataset.lang, true); return; }
    b = ev.target.closest('[data-act]');
    if (b) {
      var act = b.dataset.act;
      if (act === 'tajweed') setTajweed(!tajweed, true);
      else if (act === 'playall') {
        if (Q.audio.current() && Q.audio.current().s === S || (Q.audio.current() && Q.audio.current().bism)) Q.audio.toggle();
        else playFrom(b.closest('.qr-hero') ? 1 : currentA);
      }
      else if (act === 'fullscreen') Q.fullscreen(root);
      else if (act === 'rail') toggleRail();
      else if (act === 'close-drawer') closeTafseer();
      else if (act === 'dr-prev' && drA) openTafseer(drA - 1);
      else if (act === 'dr-next' && drA) openTafseer(drA + 1);
      return;
    }
    b = ev.target.closest('.ayah-tools [data-t]');
    if (b) {
      var a = +b.closest('.ayah').dataset.a, key = S + ':' + a;
      handleTool(b.dataset.t, a, key, b);
      return;
    }
    var arP = ev.target.closest('.ayah-ar');
    if (arP && mode === 'reading') {
      var el = arP.closest('.ayah'), aa = +el.dataset.a;
      var show = lang === 'ur' ? ['ur'] : lang === 'both' ? ['en', 'ur'] : ['en'];
      var pop = Q.popover(arP, '<div class="ap-key">Surah ' + IWP.esc(NAME) + ' · ' + S + ':' + aa + '</div>' +
        show.map(function (l) { return '<p class="ap-' + l + '">' + IWP.esc(ayahText(aa, l)) + '</p>'; }).join('') +
        '<div class="ap-actions"><button data-p="play">Play from here</button><button data-p="tafseer">Tafseer</button><button data-p="mark">' + (Q.isMarked(S + ':' + aa) ? 'Remove bookmark' : 'Bookmark') + '</button><button data-p="copy">Copy</button></div>');
      if (pop) pop.onclick = function (e2) {
        var pb = e2.target.closest('[data-p]');
        if (!pb) return;
        handleTool(pb.dataset.p, aa, S + ':' + aa, byA[aa].querySelector('[data-t="mark"]'));
        pop.hidden = true;
      };
    }
  });

  function handleTool(t, a, key, btn) {
    var url = location.origin + location.pathname + '#a' + a;
    if (t === 'play') {
      var cur = Q.audio.current();
      if (cur && cur.s === S && cur.a === a && Q.audio.playing()) Q.audio.toggle(); else playFrom(a);
    } else if (t === 'tafseer') openTafseer(a);
    else if (t === 'mark') { var on = Q.toggleMark(key); var mb = byA[a].querySelector('[data-t="mark"]'); if (mb) mb.classList.toggle('on', on); }
    else if (t === 'copy') IWP.copy(ayahText(a, 'ar') + '\n\n' + ayahText(a, lang === 'ur' ? 'ur' : 'en') + '\n— Qur\'an ' + key + '\n' + url, 'Ayah ' + key + ' copied');
    else if (t === 'share') IWP.share('Qur\'an ' + key, ayahText(a, 'en') + ' — Qur\'an ' + key, url);
  }

  /* ---------- rail search ---------- */
  var rs = document.getElementById('railSearch');
  rs.addEventListener('input', function () {
    var q = rs.value.trim().toLowerCase();
    document.querySelectorAll('#railList a').forEach(function (a) {
      a.parentNode.hidden = q && a.dataset.q.indexOf(q) < 0;
    });
  });
  rs.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter') { var first = document.querySelector('#railList li:not([hidden]) a'); if (first) location.href = first.href; }
  });
  var on = document.querySelector('#railList a.on');
  if (on) on.parentNode.parentNode.scrollTop = on.offsetTop - 120;

  /* ---------- track position (last read) ---------- */
  var saveTimer;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          currentA = +en.target.dataset.a;
          clearTimeout(saveTimer);
          saveTimer = setTimeout(function () { Q.setLast(S, currentA); }, 800);
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    ayahs.forEach(function (el) { io.observe(el); });
  }

  /* ---------- keyboard (desktop) ---------- */
  document.addEventListener('keydown', function (ev) {
    if (ev.target.closest('input,select,textarea') || ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var k = ev.key;
    if (k === ' ') { ev.preventDefault(); if (!Q.audio.toggle()) playFrom(currentA); }
    else if (k === 'j' || k === 'J') { scrollToAyah(Math.min(COUNT, currentA + 1)); }
    else if (k === 'k' || k === 'K') { scrollToAyah(Math.max(1, currentA - 1)); }
    else if (k === 'ArrowRight') { var n = document.querySelector('.qr-pn .next'); if (n) location.href = n.href; }
    else if (k === 'ArrowLeft') { var p = document.querySelector('.qr-pn .prev'); if (p) location.href = p.href; }
    else if (k === 't' || k === 'T') { drawer.hidden ? openTafseer(currentA) : closeTafseer(); }
    else if (k === 'f' || k === 'F') Q.fullscreen(root);
    else if (k === '+' || k === '=') bump(2);
    else if (k === '-') bump(-2);
    else if (k === '/') { ev.preventDefault(); if (window.innerWidth <= 1180) toggleRail(true); rs.focus(); }
    else if (k === 'Escape') { closeTafseer(); toggleRail(false); }
  });
  function bump(d) {
    Q.settings.arSize = Math.max(22, Math.min(60, Q.settings.arSize + d));
    Q.apply(); Q.save();
    var r = document.querySelector('[data-set="arSize"]');
    if (r) { r.value = Q.settings.arSize; r.parentNode.querySelector('output').textContent = r.value + 'px'; }
  }

  /* ---------- init ---------- */
  Q.bindSettings(function (k) {
    if (k === 'translit') main.classList.toggle('show-translit', !!Q.settings.translit);
    if (k === 'tafseer') { drSel.value = Q.settings.tafseer; if (drA) openTafseer(drA); }
    if (k === 'translation') setTranslation(Q.settings.translation, false);
  });
  setMode(mode, false);
  setLang(lang, false);
  if (tajweed) setTajweed(true, false);
  if (Q.settings.translation && Q.settings.translation !== 'en.sahih') setTranslation(Q.settings.translation, false);

  function fromHash() {
    var m = /^#a?(\d+)$/.exec(location.hash);
    if (m && byA[m[1]]) {
      var el = byA[m[1]];
      setTimeout(function () { scrollToAyah(+m[1]); el.classList.remove('target'); void el.offsetWidth; el.classList.add('target'); }, 60);
    }
  }
  window.addEventListener('hashchange', fromHash);
  fromHash();
})();
