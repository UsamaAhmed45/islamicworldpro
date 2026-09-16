/* Islamic World Pro — Qur'an engine. © 2026 Aurevia Solution. All rights reserved.
   Data: Qur'an text is generated into the pages. Live extras:
   - Recitation: EveryAyah (everyayah.com), fallback Islamic Network CDN
   - Tafseer: spa5k/tafsir_api via jsDelivr
   - Tajweed markup: AlQuran Cloud (Tanzil tajweed text)
   - Word by word: Quran.com API v4 */
(function () {
  'use strict';
  var IWP = window.IWP;
  var Q = window.QCORE = {};
  var META = window.QMETA || [];

  Q.meta = function (n) { return META[n - 1]; }; // [n,name,slug,en,ar,ayahs,place,firstPage,g0,ur]
  Q.pad = function (n) { return ('00' + n).slice(-3); };
  Q.arNum = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };

  Q.RECITERS = [
    ['Alafasy_128kbps', 'Mishary Rashid Alafasy'],
    ['Abdul_Basit_Murattal_192kbps', 'Abdul Basit (Murattal)'],
    ['Abdurrahmaan_As-Sudais_192kbps', 'Abdur-Rahman as-Sudais'],
    ['Husary_128kbps', 'Mahmoud Khalil al-Husary'],
    ['Minshawy_Murattal_128kbps', 'Muhammad Siddiq al-Minshawi'],
    ['MaherAlMuaiqly128kbps', 'Maher al-Muaiqly'],
    ['Saood_ash-Shuraym_128kbps', "Sa'ud ash-Shuraym"],
    ['Ghamadi_40kbps', "Sa'ad al-Ghamdi"],
    ['Abu_Bakr_Ash-Shaatree_128kbps', 'Abu Bakr ash-Shatri'],
    ['Yasser_Ad-Dussary_128kbps', 'Yasser ad-Dossari']
  ];

  Q.TRANSLATIONS = [
    ['en.sahih', 'Saheeh International', 'en'],
    ['en-yusufali', 'Abdullah Yusuf Ali (1938)', 'en'],
    ['en-pickthall', 'M. M. Pickthall (1930)', 'en'],
    ['en-shakir', 'M. H. Shakir (1968)', 'en']
  ];

  Q.TAFSEERS = [
    ['en-tafisr-ibn-kathir', 'Ibn Kathir — English', 'en'],
    ['en-tafsir-maarif-ul-quran', "Ma'ariful Qur'an — English", 'en'],
    ['ur-tafseer-ibn-e-kaseer', 'تفسیر ابن کثیر — اردو', 'ur'],
    ['ur-tafsir-bayan-ul-quran', 'بیان القرآن (ڈاکٹر اسرار احمد) — اردو', 'ur'],
    ['en-al-jalalayn', 'Al-Jalalayn — English', 'en'],
    ['en-tafsir-al-mukhtasar', 'Al-Mukhtasar — English', 'en'],
    ['ar-tafsir-muyassar', 'التفسير الميسر — العربية', 'ar'],
    ['ar-tafsir-ibn-kathir', 'تفسير ابن كثير — العربية', 'ar'],
    ['ar-tafseer-al-saddi', 'تفسير السعدي — العربية', 'ar']
  ];

  var DEFAULTS = { arSize: 34, trSize: 17, rtheme: 'paper', reciter: 'Alafasy_128kbps', tafseer: 'en-tafisr-ibn-kathir', translation: 'en.sahih', autoscroll: true, translit: false, mode: 'translation', lang: 'en', tajweed: false };
  Q.settings = Object.assign({}, DEFAULTS, IWP.store.get('qset', {}));
  if (window.innerWidth < 620 && !IWP.store.get('qset', {}).arSize) Q.settings.arSize = 28;
  Q.save = function () { IWP.store.set('qset', Q.settings); };
  Q.apply = function () {
    var r = document.documentElement.style;
    r.setProperty('--ar-size', Q.settings.arSize + 'px');
    r.setProperty('--tr-size', Q.settings.trSize + 'px');
    document.documentElement.setAttribute('data-rtheme', Q.settings.rtheme);
    IWP.store.set('rtheme', Q.settings.rtheme);
  };
  Q.apply();

  /* ---------- settings popover ---------- */
  Q.bindSettings = function (onChange) {
    var pop = document.getElementById('qrSettings');
    if (!pop) return;
    pop.querySelectorAll('select[data-set="reciter"], #auReciter').forEach(fillReciters);
    var tsel = pop.querySelector('select[data-set="tafseer"]');
    if (tsel) fillTafseers(tsel);
    var trsel = pop.querySelector('select[data-set="translation"]');
    if (trsel) fillTranslations(trsel);
    pop.querySelectorAll('[data-set]').forEach(function (el) {
      var k = el.getAttribute('data-set');
      if (el.type === 'checkbox') el.checked = !!Q.settings[k]; else el.value = Q.settings[k];
      var out = el.parentNode.querySelector('output');
      if (out) out.textContent = el.value + 'px';
      el.addEventListener('input', function () {
        Q.settings[k] = el.type === 'checkbox' ? el.checked : (el.type === 'range' ? +el.value : el.value);
        if (out) out.textContent = el.value + 'px';
        Q.apply(); Q.save();
        if (k === 'reciter') syncReciterSelects();
        onChange && onChange(k);
      });
    });
    pop.querySelectorAll('[data-theme]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.theme === Q.settings.rtheme);
      b.addEventListener('click', function () {
        Q.settings.rtheme = b.dataset.theme; Q.apply(); Q.save();
        pop.querySelectorAll('[data-theme]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      });
    });
    document.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-act="settings"]');
      if (t) { pop.hidden = !pop.hidden; t.setAttribute('aria-expanded', !pop.hidden); return; }
      if (ev.target.closest('[data-act="close-settings"]') || (!pop.hidden && !ev.target.closest('#qrSettings'))) pop.hidden = true;
    });
  };

  function fillReciters(sel) {
    if (!sel || sel.options.length) return;
    Q.RECITERS.forEach(function (r) { sel.add(new Option(r[1], r[0])); });
    sel.value = Q.settings.reciter;
  }
  Q.fillReciters = fillReciters;
  function syncReciterSelects() {
    document.querySelectorAll('select[data-set="reciter"], #auReciter').forEach(function (s) { s.value = Q.settings.reciter; });
  }
  function fillTafseers(sel) {
    if (sel.options.length) return;
    Q.TAFSEERS.forEach(function (t) { sel.add(new Option(t[1], t[0])); });
    sel.value = Q.settings.tafseer;
  }
  Q.fillTafseers = fillTafseers;

  function fillTranslations(sel) {
    if (!sel || sel.options.length) return;
    Q.TRANSLATIONS.forEach(function (t) { sel.add(new Option(t[1], t[0])); });
    sel.value = Q.settings.translation;
  }
  Q.fillTranslations = fillTranslations;

  /* ---------- alternate English translations (bundled with the app, served locally) ---------- */
  var trCache = {};
  Q.translationFor = function (edition, surah) {
    if (edition === 'en.sahih') return Promise.resolve(null); // baked into the page already
    var key = edition + '/' + surah;
    if (trCache[key]) return Promise.resolve(trCache[key]);
    return IWP.fetchJSON('/assets/data/quran/tr/' + edition + '/' + surah + '.json').then(function (j) { trCache[key] = j; return j; });
  };

  Q.fullscreen = function (el) {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(function () { IWP.toast('Full screen is not available here'); });
  };

  /* ---------- bookmarks & last read ---------- */
  Q.bookmarks = function () { return IWP.store.get('qbm', []); };
  Q.isMarked = function (k) { return Q.bookmarks().some(function (b) { return b.k === k; }); };
  Q.toggleMark = function (k) {
    var list = Q.bookmarks(), i = list.findIndex(function (b) { return b.k === k; });
    if (i >= 0) { list.splice(i, 1); IWP.toast('Bookmark removed'); }
    else { list.unshift({ k: k, t: Date.now() }); IWP.toast('Bookmarked ' + k); }
    IWP.store.set('qbm', list.slice(0, 300));
    return i < 0;
  };
  Q.setLast = function (s, a) { IWP.store.set('qlast', { s: s, a: a, t: Date.now() }); };

  /* ---------- audio ---------- */
  var audio = new Audio();
  audio.preload = 'auto';
  var A = Q.audio = { queue: [], i: -1, repeat: false, speed: 1, listeners: [] };
  var SPEEDS = [1, 1.25, 1.5, 0.75];

  A.on = function (fn) { A.listeners.push(fn); };
  function emit() { var cur = A.queue[A.i]; A.listeners.forEach(function (fn) { fn(cur, !audio.paused); }); updateBar(); }

  function srcFor(item, fallback) {
    if (fallback) {
      var m = Q.meta(item.s);
      return 'https://cdn.islamic.network/quran/audio/128/ar.alafasy/' + (m[8] + item.a) + '.mp3';
    }
    return 'https://everyayah.com/data/' + Q.settings.reciter + '/' + Q.pad(item.s) + Q.pad(item.a) + '.mp3';
  }

  A.play = function (queue, start) {
    A.queue = queue; A.i = start || 0; load();
  };
  function load(fallback) {
    var item = A.queue[A.i];
    if (!item) { A.stop(); return; }
    audio.src = srcFor(item, fallback);
    audio.playbackRate = A.speed;
    audio.dataset.fallback = fallback ? '1' : '';
    audio.play().catch(function (err) {
      if (err && err.name === 'NotAllowedError') { emit(); return; }
    });
    showBar(true);
    media(item);
    emit();
  }
  audio.addEventListener('error', function () {
    if (!audio.dataset.fallback) load(true);
    else { IWP.toast('Recitation could not load. Check your connection.'); emit(); }
  });
  audio.addEventListener('ended', function () {
    if (A.repeat && !A.queue[A.i].bism) { audio.currentTime = 0; audio.play(); return; }
    if (A.i < A.queue.length - 1) { A.i++; load(); } else A.stop();
  });
  audio.addEventListener('play', emit);
  audio.addEventListener('pause', emit);
  audio.addEventListener('timeupdate', function () {
    var bar = document.getElementById('auBar');
    if (bar && audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + '%';
  });
  A.toggle = function () { if (!A.queue.length) return false; if (audio.paused) audio.play(); else audio.pause(); return true; };
  A.next = function () { if (A.i < A.queue.length - 1) { A.i++; load(); } };
  A.prev = function () { if (A.i > 0) { A.i--; load(); } };
  A.stop = function () { audio.pause(); A.queue = []; A.i = -1; showBar(false); emit(); };
  A.playing = function () { return !audio.paused && A.i >= 0; };
  A.current = function () { return A.queue[A.i]; };

  function showBar(on) {
    var bar = document.getElementById('qrAudio');
    if (!bar) return;
    bar.hidden = !on;
    document.body.classList.toggle('has-audio', on);
  }
  function updateBar() {
    var now = document.getElementById('auNow'), cur = A.queue[A.i];
    if (now && cur) {
      var m = Q.meta(cur.s);
      now.textContent = cur.bism ? 'Bismillah' : ('Surah ' + m[1] + ' · ' + cur.s + ':' + cur.a);
    }
    var t = document.querySelector('[data-au="toggle"] use');
    if (t) t.setAttribute('href', audio.paused ? '#i-play' : '#i-pause');
    document.querySelectorAll('[data-act="playall"],[data-act="playpage"]').forEach(function (b) {
      var u = b.querySelector('use'), span = b.querySelector('span');
      var on = !audio.paused && A.i >= 0;
      b.classList.toggle('on', on);
      if (u) u.setAttribute('href', on ? '#i-pause' : '#i-play');
      if (span && b.classList.contains('tb-play')) span.textContent = on ? 'Pause' : (b.dataset.act === 'playpage' ? 'Listen to page' : 'Listen');
    });
  }
  function media(item) {
    if (!('mediaSession' in navigator)) return;
    var m = Q.meta(item.s), r = Q.RECITERS.find(function (x) { return x[0] === Q.settings.reciter; });
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: 'Surah ' + m[1] + ' ' + item.s + ':' + item.a, artist: r ? r[1] : '', album: 'Islamic World Pro', artwork: [{ src: '/assets/img/brand/logo-512.png', sizes: '512x512', type: 'image/png' }] });
      navigator.mediaSession.setActionHandler('play', function () { audio.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { audio.pause(); });
      navigator.mediaSession.setActionHandler('nexttrack', A.next);
      navigator.mediaSession.setActionHandler('previoustrack', A.prev);
    } catch (e) {}
  }
  Q.bindAudioBar = function () {
    var bar = document.getElementById('qrAudio');
    if (!bar) return;
    var rs = document.getElementById('auReciter');
    fillReciters(rs);
    rs.addEventListener('change', function () {
      Q.settings.reciter = rs.value; Q.save(); syncReciterSelects();
      if (A.i >= 0) load();
    });
    bar.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-au]');
      if (!b) return;
      var k = b.dataset.au;
      if (k === 'toggle') A.toggle();
      else if (k === 'next') A.next();
      else if (k === 'prev') A.prev();
      else if (k === 'close') A.stop();
      else if (k === 'repeat') { A.repeat = !A.repeat; b.setAttribute('aria-pressed', A.repeat); IWP.toast(A.repeat ? 'Repeating this ayah' : 'Repeat off'); }
      else if (k === 'speed') { A.speed = SPEEDS[(SPEEDS.indexOf(A.speed) + 1) % SPEEDS.length]; audio.playbackRate = A.speed; b.textContent = A.speed + '×'; }
    });
  };
  Q.surahQueue = function (s, fromAyah) {
    var m = Q.meta(s), q = [];
    fromAyah = fromAyah || 1;
    if (fromAyah === 1 && s !== 1 && s !== 9) q.push({ s: 1, a: 1, bism: true, forS: s });
    for (var a = fromAyah; a <= m[5]; a++) q.push({ s: s, a: a });
    return q;
  };

  /* ---------- tafseer ---------- */
  var tafCache = {};
  Q.tafseer = function (slug, s, a) {
    var key = slug + '/' + s + '/' + a;
    if (tafCache[key]) return Promise.resolve(tafCache[key]);
    return IWP.fetchJSON('https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir/' + slug + '/' + s + '/' + a + '.json')
      .then(function (j) { tafCache[key] = (j && j.text) || ''; return tafCache[key]; });
  };
  // Some tafseers explain a group of ayahs once; walk back to find the shared commentary.
  Q.tafseerFor = function (slug, s, a) {
    function tryAt(x, hops) {
      return Q.tafseer(slug, s, x).then(function (t) {
        if (t && t.trim()) return { text: t, from: x };
        if (x > 1 && hops < 12) return tryAt(x - 1, hops + 1);
        return { text: '', from: a };
      });
    }
    return tryAt(a, 0);
  };
  Q.tafseerLang = function (slug) { var t = Q.TAFSEERS.find(function (x) { return x[0] === slug; }); return t ? t[2] : 'en'; };
  Q.formatTafseer = function (text) {
    return text.split(/\n{1,}/).map(function (p) { return p.trim(); }).filter(Boolean)
      .map(function (p) { return '<p>' + IWP.esc(p) + '</p>'; }).join('');
  };

  /* ---------- tajweed ---------- */
  var tjCache = {};
  Q.tajweed = function (s) {
    if (tjCache[s]) return Promise.resolve(tjCache[s]);
    return IWP.fetchJSON('https://api.alquran.cloud/v1/surah/' + s + '/quran-tajweed').then(function (j) {
      var out = {};
      j.data.ayahs.forEach(function (ay) {
        var segs = parseTajweed(ay.text);
        if (ay.numberInSurah === 1 && s !== 1 && s !== 9) segs = dropWords(segs, 4);
        out[ay.numberInSurah] = segs.map(function (g) {
          return g.c ? '<span class="tj-' + g.c + '">' + IWP.esc(g.t) + '</span>' : IWP.esc(g.t);
        }).join('');
      });
      tjCache[s] = out;
      return out;
    });
  };
  function parseTajweed(raw) {
    var re = /\[([a-z])(?::\d+)?\[([^\]]*)\]/g, segs = [], last = 0, m;
    while ((m = re.exec(raw))) {
      if (m.index > last) segs.push({ t: raw.slice(last, m.index) });
      segs.push({ c: m[1], t: m[2] });
      last = re.lastIndex;
    }
    if (last < raw.length) segs.push({ t: raw.slice(last) });
    return segs;
  }
  function dropWords(segs, n) {
    var spaces = 0, out = [];
    for (var i = 0; i < segs.length; i++) {
      if (spaces >= n) { out.push(segs[i]); continue; }
      var t = segs[i].t, keep = '';
      for (var j = 0; j < t.length; j++) {
        if (spaces >= n) { keep = t.slice(j); break; }
        if (t[j] === ' ') spaces++;
      }
      if (keep) out.push({ c: segs[i].c, t: keep });
    }
    return out;
  }
  Q.TJ_LEGEND = [['h', 'Hamzat al-wasl, silent'], ['n', 'Madd 2'], ['p', 'Madd 2/4/6'], ['o', 'Madd 4/5'], ['m', 'Madd 6'], ['q', 'Qalqalah'], ['c', 'Ikhfa'], ['f', 'Ikhfa shafawi'], ['w', 'Idgham shafawi'], ['i', 'Iqlab'], ['a', 'Idgham with ghunnah'], ['u', 'Idgham without ghunnah'], ['g', 'Ghunnah']];
  Q.legendHTML = function () {
    return '<div class="tj-legend">' + Q.TJ_LEGEND.map(function (l) { return '<span class="tj-' + l[0] + '"><i></i><em style="font-style:normal;color:var(--ink-soft)">' + l[1] + '</em></span>'; }).join('') + '</div>';
  };

  /* ---------- word by word ---------- */
  var wbwCache = {};
  Q.words = function (s, lang) {
    var key = s + lang;
    if (wbwCache[key]) return Promise.resolve(wbwCache[key]);
    var per = 50, pages = Math.ceil(Q.meta(s)[5] / per), jobs = [];
    for (var p = 1; p <= pages; p++) {
      jobs.push(IWP.fetchJSON('https://api.quran.com/api/v4/verses/by_chapter/' + s + '?language=' + lang + '&words=true&word_fields=text_uthmani&word_translation_language=' + lang + '&per_page=' + per + '&page=' + p));
    }
    return Promise.all(jobs).then(function (res) {
      var out = {};
      res.forEach(function (r) {
        r.verses.forEach(function (v) {
          out[v.verse_number] = v.words.map(function (w) {
            return { ar: w.text_uthmani, tr: w.translation && w.translation.text, lit: w.transliteration && w.transliteration.text, end: w.char_type_name === 'end', audio: w.audio_url };
          });
        });
      });
      wbwCache[key] = out;
      return out;
    });
  };
  var wordAudio = new Audio();
  Q.playWord = function (url) {
    if (!url) return;
    wordAudio.src = 'https://audio.qurancdn.com/' + url;
    wordAudio.play().catch(function () {});
  };

  /* ---------- floating popover ---------- */
  Q.popover = function (anchor, html) {
    var pop = document.getElementById('ayahPop');
    if (!pop) return null;
    pop.innerHTML = html;
    pop.hidden = false;
    var r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
    var left = Math.min(Math.max(12, r.left + r.width / 2 - pw / 2), window.innerWidth - pw - 12);
    var top = r.bottom + 10;
    if (top + ph > window.innerHeight - 12) top = Math.max(12, r.top - ph - 10);
    pop.style.left = left + 'px';
    pop.style.top = top + 'px';
    return pop;
  };
  document.addEventListener('click', function (ev) {
    var pop = document.getElementById('ayahPop');
    if (pop && !pop.hidden && !ev.target.closest('#ayahPop') && !ev.target.closest('.ayah-ar,.v')) pop.hidden = true;
  });
  window.addEventListener('scroll', function () { var pop = document.getElementById('ayahPop'); if (pop) pop.hidden = true; }, { passive: true });
})();
