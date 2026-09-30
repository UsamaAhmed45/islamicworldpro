/* Islamic World Pro — theme & language preferences (like the app).
   Themes: classic (default) · night · light · sky · terracotta
   Languages: English · اردو (interface text; Qur'an/Hadith pages keep their own
   translation toggles). Saved in this browser only.
   © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  var KEY_T = 'iwp:site-theme', KEY_L = 'iwp:site-lang';
  function get(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var THEMES = [
    ['classic', 'Classic', 'کلاسک', '#082a1d'],
    ['night', 'Night', 'رات', '#06150e'],
    ['light', 'Light', 'روشن', '#f6efdc'],
    ['sky', 'Sky', 'آسمانی', '#0b2340'],
    ['terracotta', 'Terracotta', 'ٹیراکوٹا', '#3a1a12']
  ];

  /* ------------------------------------------------------------ Urdu strings */
  var UR = {
    // navigation
    'Home': 'ہوم', "Qur'an": 'قرآن', 'Hadith': 'حدیث', 'Azkar': 'اذکار', 'Duas': 'دعائیں', 'Prayer Times': 'نماز کے اوقات',
    '99 Names': '۹۹ نام', 'Features': 'خصوصیات', 'Guides': 'رہنمائی', 'About': 'ہمارے بارے میں', 'Download': 'ڈاؤن لوڈ',
    'the app': 'ایپ',
    // footer
    'Read': 'پڑھیں', 'Tools': 'ٹولز', 'Company': 'ادارہ', 'Legal': 'قانونی',
    'Mushaf pages': 'مصحف کے صفحات', 'Hadith library': 'حدیث لائبریری', '99 Names of Allah': 'اللہ کے ۹۹ نام',
    'Prayer times': 'نماز کے اوقات', 'Qibla direction': 'قبلہ کی سمت', 'Tasbih counter': 'تسبیح کاؤنٹر', 'All features': 'تمام خصوصیات',
    'Daily posts': 'روزانہ پوسٹس', 'FAQ': 'عام سوالات', 'Videos': 'ویڈیوز', 'Privacy policy': 'پرائیویسی پالیسی', 'Contact us': 'رابطہ کریں',
    'Made with care for the Ummah 🌙': 'اُمت کے لیے محبت سے تیار کیا گیا 🌙',
    "A calm, all-in-one companion for Qur'an, Azkar, Hadith and daily worship — free, offline and without ads.":
      'قرآن، اذکار، حدیث اور روزمرہ عبادت کے لیے ایک پُرسکون، مکمل ساتھی — مفت، آف لائن اور اشتہارات کے بغیر۔',
    // hero
    'Free · Ad-free · Works offline': 'مفت · بغیر اشتہار · آف لائن',
    "Islamic World Pro brings the Qur'an, prayer times, Qibla, Hadith, Azkar and duas into one calm, premium app — plus Hifz Mode, which listens as you recite and checks your memorisation word by word.":
      'اسلامک ورلڈ پرو قرآن، نماز کے اوقات، قبلہ، حدیث، اذکار اور دعائیں ایک پُرسکون، شاندار ایپ میں لاتی ہے — ساتھ میں حفظ موڈ، جو آپ کی تلاوت سن کر لفظ بہ لفظ آپ کا حفظ چیک کرتا ہے۔',
    'Read Qur\'an online': 'قرآن آن لائن پڑھیں',
    "Offline Qur'an & tafseer": 'آف لائن قرآن اور تفسیر', 'Prayer times, Adhan & Qibla': 'نماز کے اوقات، اذان اور قبلہ',
    'Hifz Mode with voice checking': 'آواز سے جانچ کے ساتھ حفظ موڈ', 'Bukhari, Muslim & more': 'بخاری، مسلم اور مزید',
    'Android · English & Urdu · No account, no tracking': 'اینڈرائیڈ · انگریزی اور اردو · نہ اکاؤنٹ، نہ ٹریکنگ',
    'Adhan alerts': 'اذان الرٹس', 'On time, every prayer': 'ہر نماز، وقت پر', '114 Surahs': '۱۱۴ سورتیں',
    'Offline, with tafseer': 'آف لائن، تفسیر کے ساتھ', 'Qibla': 'قبلہ', 'Live compass': 'لائیو کمپاس',
    // prayer card
    'Next Prayer': 'اگلی نماز', 'Today': 'آج', 'Next prayer': 'اگلی نماز', 'Starts in': 'باقی وقت',
    'Full timetable & Qibla compass →': 'مکمل اوقات اور قبلہ کمپاس ←', 'Change location': 'مقام تبدیل کریں',
    'Fajr': 'فجر', 'Dhuhr': 'ظہر', 'Asr': 'عصر', 'Maghrib': 'مغرب', 'Isha': 'عشاء',
    // stats
    'Surahs, offline': 'سورتیں، آف لائن', 'Hadith collections': 'حدیث کے مجموعے', 'Names of Allah': 'اللہ کے نام', 'Ads, ever': 'اشتہارات، کبھی نہیں',
    // today + tiles
    'Free on this website': 'اس ویب سائٹ پر مفت', 'Start right here — no download needed': 'یہیں سے شروع کریں — ڈاؤن لوڈ کی ضرورت نہیں',
    "Read the Qur'an, check today's prayer times and find the Qibla on any phone or computer.": 'کسی بھی فون یا کمپیوٹر پر قرآن پڑھیں، آج کے نماز کے اوقات دیکھیں اور قبلہ معلوم کریں۔',
    'Share': 'شیئر کریں', 'More daily posts': 'مزید روزانہ پوسٹس',
    '114 surahs · Urdu & English': '۱۱۴ سورتیں · اردو اور انگریزی', 'Live for your location': 'آپ کے مقام کے مطابق',
    'Compass to the Ka‘bah': 'کعبہ کی طرف کمپاس', 'Bukhari, Muslim & more': 'بخاری، مسلم اور مزید', 'Morning, evening & more': 'صبح، شام اور مزید',
    'Hajj & Umrah': 'حج و عمرہ', 'Step-by-step duas': 'قدم بہ قدم دعائیں', 'Asma-ul-Husna': 'اسماء الحسنیٰ', 'Tasbih': 'تسبیح', 'Digital counter': 'ڈیجیٹل کاؤنٹر',
    // section heads
    'Discover the app': 'ایپ دریافت کریں', 'Seven companions, one app': 'سات ساتھی، ایک ایپ',
    'Guides': 'رہنمائی', 'Choosing the right Islamic app': 'صحیح اسلامی ایپ کا انتخاب',
    'Honest checklists for Qur\'an, prayer-time and all-in-one Muslim apps.': 'قرآن، نماز کے اوقات اور مکمل مسلم ایپس کے لیے دیانت دار چیک لسٹس۔',
    'All guides →': 'تمام رہنمائیاں ←', 'Get the app': 'ایپ حاصل کریں', 'Download Islamic World Pro': 'اسلامک ورلڈ پرو ڈاؤن لوڈ کریں',
    'Get it on Google Play': 'گوگل پلے سے حاصل کریں',
    // prefs panel
    'Theme': 'تھیم', 'Language': 'زبان'
  };
  var HERO_H1_UR = 'روزمرہ مسلم زندگی کے لیے <span class="text-gold">بہترین اسلامی ایپ</span>';

  var SEL = [
    '.slide-tab .ml', '.slide-tab', '.nav-cta', '.nav-cta .cta-long', '.nav-feature span',
    '.site-footer h5', '.site-footer .footer-grid a:not(.brand):not(.ft-play)', '.ft-about', '.footer-bottom span:last-child',
    '.hero-chip', '.hero-v3 .lead', '.hero-v3 .btn-glass', '.hero-proof li', '.hero-meta', '.hv-chip b', '.hv-chip small',
    '.hp-toggle button', '.hp-label', '.hp-count small', '.hp-more', '.hp-loc-btn', '.hp-line small',
    '.iwp-stats span', '.qa-t strong', '.qa-t small', '#tdShare', '.today-actions a',
    '.section-head .eyebrow', '.section-head h2', '.section-head p', '.home-guides .btn', '.ip-title',
    // inner pages (heroes, section titles, cards, controls)
    '.eyebrow', 'h1', 'h2', 'h3', '.lead', '.page-hero p', '.hub-hero p', '.pt-hero p', '.qr-hero p', '.section-head p',
    '.btn', '.btn span', '.mode-card strong', '.mode-card span', '.feature-card h3', '.feature-card p', 'main label',
    '.pill', '.filter-chips button', '.seg button', '.cta-band h2', '.cta-band p', '.nx-label', '.nx-time', '.night-win small',
    '.install-card p', '.badge', '.value-card h3', '.value-card p', 'nav[aria-label="Breadcrumb"] a', 'nav[aria-label="Breadcrumb"] span:not([aria-hidden]):not(.sep)',
    '.expanding-card-label', '.expanding-card-desc', '.swipe-stack-hint', 'li.small-muted', 'p.small-muted', '.qh-popular', '.today-type', '.today-tr',
    '.cat strong', '.cat small', '.cat .count', '.book strong', '.book small', '.t-chips button', '.tasbih button', '.pt-note', '.tb-btn',
    '.nm-hint', '.nd-hint', '.nd-nav button', '.daily-post-type', '.daily-post-translation', '.daily-post-source', '.today-src', '#hpGreg', '#ptGreg', 'span.small-muted', '.empty', '.skip-link',
    '.section-dark p', '.cta-band .btn', '.hp-cta p', 'p', 'small', '.attrib a', '.swipe-card p', '.expanding-card-title'
  ].join(',');
  var NOT = '.site-header .nav-links a.slide-tab .ico, .iwp-prefs, .iwp-prefs-inline, [lang="ar"], .arabic, .ar, .b-ar, .nm-ar, #nxName, #hpName, #hpTime, #heroTitle, .hero-play, #hpLine';
  function norm(t) { return t.replace(/\s+/g, ' ').trim(); }
  var PAT = [
    [/^(\d[\d,]*) adhkar$/, '$1 اذکار'], [/^1 dhikr$/, '۱ ذکر'],
    [/^([\d,]+) hadith · (\d+) books$/, '$1 احادیث · $2 کتب'], [/^([\d,]+) hadith$/, '$1 احادیث'],
    [/^Round (\d+)$/, 'دور $1'], [/^([\d,]+) km \(([\d,]+) mi\) to the Ka‘bah$/, 'کعبہ تک $1 کلومیٹر ($2 میل)'], [/^(\d+) ayahs$/, '$1 آیات']
  ];
  function tr(en) {
    var v = UR[en] || UR[norm(en)];
    if (v) return v;
    for (var i = 0; i < PAT.length; i++) if (PAT[i][0].test(en)) return en.replace(PAT[i][0], PAT[i][1]);
    var MO = { January: 'جنوری', February: 'فروری', March: 'مارچ', April: 'اپریل', May: 'مئی', June: 'جون', July: 'جولائی', August: 'اگست', September: 'ستمبر', October: 'اکتوبر', November: 'نومبر', December: 'دسمبر',
      Monday: 'پیر', Tuesday: 'منگل', Wednesday: 'بدھ', Thursday: 'جمعرات', Friday: 'جمعہ', Saturday: 'ہفتہ', Sunday: 'اتوار' };
    if (/^(?:(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),? )?\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December) \d{4}$/.test(en))
      return en.replace(/[A-Za-z]+/g, function (w) { return MO[w] || w; }).replace(',', '،');
    var m = en.match(/^(.*\D) (\d[\d:]*)$/);   // "Qur'an 94:6", "Sahih al-Bukhari 6018"
    if (m && UR[m[1]]) return UR[m[1]] + ' ' + m[2];
    return null;
  }

  function textNodeOnly(el) {
    // translate the element's own text (keep child icons / badges intact)
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3 && n.nodeValue.trim()) return n;
    }
    return null;
  }
  // a sentence that continues in other (untranslated) words — e.g. "built by <b>Aurevia</b> with one goal…" —
  // is left in English rather than half-translated
  var LAT = /[A-Za-z]{3,}/;
  function mixed(el, tn) {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n === tn) continue;
      if (n.nodeType === 3) { if (LAT.test(n.nodeValue)) return true; continue; }
      if (n.nodeType !== 1 || n.hasAttribute('data-i18n') || n.getAttribute('aria-hidden') === 'true' || n.tagName === 'svg' || n.tagName === 'SVG' || n.matches(SEL)) continue;
      if (LAT.test(n.textContent)) return true;
    }
    return false;
  }
  function translateOne(el, lang) {
      if (el.closest(NOT) || el.dataset.enKey) return;
      var tn = textNodeOnly(el);
      if (!tn) return;
      var raw = tn.nodeValue, cur = norm(raw);
      // text changed by the page since we last looked → that is the new English
      if (el.dataset.en == null || (cur !== el.dataset.en && cur !== el.dataset.ur)) el.dataset.en = cur;
      var en = el.dataset.en, ur = lang === 'ur' && !mixed(el, tn) ? tr(en) : null;
      var lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
      if (ur) { el.dataset.ur = ur; if (cur !== ur) tn.nodeValue = lead + ur + trail; el.setAttribute('data-i18n', ''); }
      else if (el.hasAttribute('data-i18n')) { if (cur !== en) tn.nodeValue = lead + en + trail; el.removeAttribute('data-i18n'); }
    }
  // "Round 1 · target 33 · today 0" — the connecting words sit between live numbers
  var META = { '· target': '· ہدف', '· today': '· آج' };
  function translateMeta(lang) {
    d.querySelectorAll('.t-meta').forEach(function (p) {
      p.childNodes.forEach(function (n) {
        if (n.nodeType !== 3) return;
        if (n.__en == null) n.__en = n.nodeValue;
        var k = n.__en.trim();
        n.nodeValue = lang === 'ur' && META[k] ? n.__en.replace(k, META[k]) : n.__en;
      });
    });
  }
  function translateHtml(lang) {
    var H = window.IWP_UR_HTML || {};
    d.querySelectorAll('main p, section p').forEach(function (p) {
      if (p.dataset.enHtml == null) {
        var key = norm(p.textContent);
        if (!H[key]) return;
        p.dataset.enHtml = p.innerHTML; p.dataset.enKey = key;
      }
      if (lang === 'ur' && H[p.dataset.enKey]) { p.innerHTML = H[p.dataset.enKey]; p.setAttribute('data-i18n', ''); }
      else { p.innerHTML = p.dataset.enHtml; p.removeAttribute('data-i18n'); }
    });
  }
  function translateIn(scope, lang) {
    if (scope.nodeType === 1 && scope.matches && scope.matches(SEL)) translateOne(scope, lang);
    scope.querySelectorAll(SEL).forEach(function (el) { translateOne(el, lang); });
  }
  // content that pages render later (daily posts, lists, dialogs) is translated as it appears
  var mo = null, pend = [], timer = 0;
  function watch(lang) {
    if (lang !== 'ur') { if (mo) { mo.disconnect(); mo = null; } return; }
    if (mo || !window.MutationObserver) return;
    mo = new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) for (var k = 0; k < list[i].addedNodes.length; k++) {
        var n = list[i].addedNodes[k]; if (n.nodeType === 1) pend.push(n); else if (n.nodeType === 3 && n.parentElement) pend.push(n.parentElement);
      }
      if (!timer && pend.length) timer = setTimeout(function () {
        timer = 0; var batch = pend; pend = [];
        if (root.dataset.lang !== 'ur') return;
        batch.forEach(function (n) { if (n.isConnected) translateIn(n, 'ur'); });
      }, 120);
    });
    mo.observe(d.body, { childList: true, subtree: true });
  }
  function applyLang(lang) {
    root.dataset.lang = lang;
    root.setAttribute('lang', lang === 'ur' ? 'ur' : 'en');
    if (lang === 'ur' && !window.IWP_UR_MORE) { loadMore(); }
    translateIn(d, lang);
    translateMeta(lang);
    translateHtml(lang);
    watch(lang);
    var h1 = d.getElementById('heroTitle');
    if (h1) {
      if (h1.dataset.enHtml == null) h1.dataset.enHtml = h1.innerHTML;
      if (lang === 'ur') { h1.innerHTML = HERO_H1_UR; h1.setAttribute('data-i18n', ''); }
      else { h1.innerHTML = h1.dataset.enHtml; h1.removeAttribute('data-i18n'); }
    }
    d.querySelectorAll('.hero-play span').forEach(function (s) {
      if (s.dataset.enHtml == null) s.dataset.enHtml = s.innerHTML;
      if (lang === 'ur') { s.innerHTML = 'گوگل پلے سے حاصل کریں'; s.setAttribute('data-i18n', ''); }
      else { s.innerHTML = s.dataset.enHtml; s.removeAttribute('data-i18n'); }
    });
    paintPanels();
    try { d.dispatchEvent(new CustomEvent('iwp:lang', { detail: lang })); } catch (e) {}
    // nav highlight and other measured layouts re-measure for the new text widths
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 60);
  }
  var moreLoading = false;
  function loadMore() {
    if (moreLoading) return; moreLoading = true;
    var s = d.createElement('script');
    s.src = '/assets/js/i18n-ur.js?v=20260930e'; s.async = true;
    s.onload = function () {
      var m = window.IWP_UR_MORE || {};
      for (var k in m) if (!UR[k]) UR[k] = m[k];
      if (root.dataset.lang === 'ur') applyLang('ur');
    };
    d.head.appendChild(s);
  }
  // for page scripts that write text on the fly (prayer countdowns etc.)
  window.IWPLANG = function () { return root.dataset.lang === 'ur' ? 'ur' : 'en'; };
  window.IWPT = function (s) { return root.dataset.lang === 'ur' && tr(s) ? tr(s) : s; };

  function applyTheme(t) {
    if (!THEMES.some(function (x) { return x[0] === t; })) t = 'classic';
    if (t === 'classic') delete root.dataset.theme; else root.dataset.theme = t;
    var meta = d.querySelector('meta[name="theme-color"]');
    var c = THEMES.filter(function (x) { return x[0] === t; })[0][3];
    if (meta) meta.setAttribute('content', c);
    if (window.IWPBF && window.IWPBF.setColors) {
      if (t === 'light') window.IWPBF.setColors('#1b5e20', '#c79b3b'); else window.IWPBF.setColors('#FAF3DF', '#D4AF37');
    }
    paintPanels();
  }

  /* ------------------------------------------------------------ UI */
  // header control: a live swatch of the current theme + the language, with a small chevron
  var PAL = '<span class="ipb-sw ip-sw" aria-hidden="true"></span><span class="ipb-lang">EN</span>' +
    '<svg class="ipb-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  function panelHTML() {
    var lang = get(KEY_L, 'en');
    return '<h6 class="ip-title">Theme</h6><div class="ip-themes" role="group" aria-label="Theme">' +
      THEMES.map(function (t) {
        return '<button type="button" class="ip-theme" data-theme-pick="' + t[0] + '" aria-pressed="false"><span class="ip-sw ' + t[0] + '"></span><span>' + (lang === 'ur' ? t[2] : t[1]) + '</span></button>';
      }).join('') + '</div>' +
      '<h6 class="ip-title">Language</h6><div class="ip-langs" role="group" aria-label="Language">' +
      '<button type="button" class="ip-lang" data-lang-pick="en" lang="en" aria-pressed="false">English</button>' +
      '<button type="button" class="ip-lang" data-lang-pick="ur" lang="ur" aria-pressed="false">اردو</button></div>';
  }
  var panel = null, btn = null, inline = null;
  function paintPanels() {
    var t = get(KEY_T, 'classic'), l = get(KEY_L, 'en');
    d.querySelectorAll('.ipb-sw').forEach(function (sw) { sw.className = 'ipb-sw ip-sw ' + t; });
    d.querySelectorAll('.ipb-lang').forEach(function (x) { x.textContent = l === 'ur' ? 'اردو' : 'EN'; x.lang = l; });
    d.querySelectorAll('[data-theme-pick]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.themePick === t); });
    d.querySelectorAll('[data-lang-pick]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.langPick === l); });
    d.querySelectorAll('.ip-theme span:last-child').forEach(function (s, i) {
      var th = THEMES[i % THEMES.length]; s.textContent = l === 'ur' ? th[2] : th[1];
    });
    d.querySelectorAll('.ip-title').forEach(function (h) {
      var en = h.dataset.en || h.textContent; h.dataset.en = en;
      h.textContent = l === 'ur' && UR[en] ? UR[en] : en;
    });
  }
  function build() {
    var nav = d.querySelector('.site-header .nav');
    if (nav && !d.querySelector('.iwp-prefs-btn')) {
      btn = d.createElement('button');
      btn.type = 'button'; btn.className = 'iwp-prefs-btn'; btn.setAttribute('aria-label', 'Theme and language');
      btn.setAttribute('aria-expanded', 'false'); btn.innerHTML = PAL;
      nav.appendChild(btn);
      panel = d.createElement('div');
      panel.className = 'iwp-prefs'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-label', 'Theme and language');
      panel.innerHTML = panelHTML();
      d.body.appendChild(panel);
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = !panel.classList.contains('open');
        panel.classList.toggle('open', open); btn.setAttribute('aria-expanded', open);
      });
      d.addEventListener('click', function (e) {
        if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      });
      d.addEventListener('keydown', function (e) { if (e.key === 'Escape') panel.classList.remove('open'); });
      var sy = 0; window.addEventListener('scroll', function () { if (!panel.classList.contains('open')) { sy = scrollY; return; } if (Math.abs(scrollY - sy) > 60) { panel.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); } }, { passive: true });
      btn.addEventListener('click', function () { sy = scrollY; });
    }
    var links = d.querySelector('.nav-links');
    if (links && !links.querySelector('.iwp-prefs-inline')) {
      inline = d.createElement('div');
      inline.className = 'iwp-prefs-inline'; inline.innerHTML = panelHTML();
      var foot = links.querySelector('.nav-menu-foot');
      links.insertBefore(inline, foot || null);
    }
    d.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-theme-pick]');
      if (t) {
        var id = t.dataset.themePick;
        if (id === get(KEY_T, 'classic')) return;
        set(KEY_T, id);
        reveal(e, function () { applyTheme(id); }, true);
        return;
      }
      var l = e.target.closest && e.target.closest('[data-lang-pick]');
      if (l) {
        var lg = l.dataset.langPick;
        if (lg === get(KEY_L, 'en')) return;
        set(KEY_L, lg);
        reveal(e, function () { applyLang(lg); }, false);
      }
    });
  }

  /* theme: a soft circular reveal from the swatch you tapped; language: a quick cross-fade.
     Falls back to an instant switch where View Transitions or motion aren't available. */
  function reveal(e, fn, circle) {
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!d.startViewTransition || reduce) { fn(); return; }
    var x = e.clientX || innerWidth / 2, y = e.clientY || 80;
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    if (circle) root.classList.add('vt-theme');
    var vt;
    try { vt = d.startViewTransition(fn); } catch (err) { fn(); root.classList.remove('vt-theme'); return; }
    if (circle) {
      vt.ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 650, easing: 'cubic-bezier(.45,0,.2,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
    }
    vt.finished.then(function () { root.classList.remove('vt-theme'); }, function () { root.classList.remove('vt-theme'); });
  }

  function init() {
    build();
    applyTheme(get(KEY_T, 'classic'));
    if (get(KEY_L, 'en') === 'ur') applyLang('ur'); else paintPanels();
    // other tabs
    window.addEventListener('storage', function (e) {
      if (e.key === KEY_T) applyTheme(get(KEY_T, 'classic'));
      if (e.key === KEY_L) applyLang(get(KEY_L, 'en'));
    });
  }
  // wait one frame so polish.js has added the menu icons / footer layout first
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', function () { setTimeout(init, 0); });
  else setTimeout(init, 0);
})();
