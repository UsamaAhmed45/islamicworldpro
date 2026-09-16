/* Islamic World Pro — homepage prayer-times widget. © 2026 Aurevia Solution. All rights reserved.
   Uses the same PTENGINE + saved location as the full /prayer-times page,
   so a location set on one carries over to the other. */
(function () {
  'use strict';
  var card = document.getElementById('hpCard');
  if (!card || !window.PTENGINE || !window.IWP) return;
  var E = window.PTENGINE, IWP = window.IWP;
  var PRAYERS = [['fajr', 'Fajr'], ['dhuhr', 'Dhuhr'], ['asr', 'Asr'], ['maghrib', 'Maghrib'], ['isha', 'Isha']];

  var CITIES = window.PT_CITIES || [];
  function guessLocation() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var c = CITIES.find(function (x) { return x.tz === tz; });
    if (c) return Object.assign({ guessed: true }, c);
    return { name: 'Makkah', country: 'Saudi Arabia', cc: 'SA', lat: 21.3891, lng: 39.8579, tz: 'Asia/Riyadh', guessed: true };
  }
  var loc = IWP.store.get('pt:loc', null) || guessLocation();

  function opts() {
    var method = E.COUNTRY_METHOD[loc.cc] || 'MWL';
    var asr = E.HANAFI[loc.cc] ? 'hanafi' : 'standard';
    return { method: method, asr: asr, highLat: 'angle', adjust: {} };
  }
  function fmt(h) {
    if (isNaN(h)) return '—';
    var mins = Math.round(((h % 24) + 24) % 24 * 60), H = Math.floor(mins / 60), m = mins % 60;
    return ((H % 12) || 12) + ':' + ('0' + m).slice(-2) + (H < 12 ? ' AM' : ' PM');
  }
  function instant(date, hours) {
    var off = E.tzOffset(loc.tz, new Date(Date.UTC(date.y, date.m - 1, date.d, 12)));
    return Date.UTC(date.y, date.m - 1, date.d) + (hours - off) * 3600000;
  }
  function addDays(date, n) {
    var t = new Date(Date.UTC(date.y, date.m - 1, date.d + n));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }
  function timesFor(date) {
    var off = E.tzOffset(loc.tz, new Date(Date.UTC(date.y, date.m - 1, date.d, 12)));
    return E.compute(date, loc.lat, loc.lng, off, opts());
  }

  function hijri(date) {
    try {
      return new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(date.y, date.m - 1, date.d, 12)));
    } catch (e) { return ''; }
  }
  function greg(date) {
    return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(Date.UTC(date.y, date.m - 1, date.d, 12)));
  }

  var $ = function (id) { return document.getElementById(id); };
  var today, times, tomorrow;

  function render() {
    today = E.dateIn(loc.tz, new Date());
    times = timesFor(today);
    tomorrow = timesFor(addDays(today, 1));
    var placeEl = $('hpPlace');
    if (placeEl) placeEl.textContent = loc.name + (loc.country ? ', ' + loc.country : '');
    var gregEl = $('hpGreg'), hijriEl = $('hpHijri');
    if (gregEl) gregEl.textContent = greg(today);
    if (hijriEl) hijriEl.textContent = hijri(today);
    var today3 = $('hpToday');
    if (today3) {
      today3.innerHTML = PRAYERS.map(function (p) {
        return '<div><small>' + p[1] + '</small><b>' + fmt(times[p[0]]) + '</b></div>';
      }).join('');
    }
    tick();
  }

  function tick() {
    if (!times) return;
    var now = Date.now(), list = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    var next = null, prevAt = instant(addDays(today, -1), 0);
    for (var i = 0; i < list.length; i++) {
      var at = instant(today, times[list[i]]);
      if (at > now) { next = { k: list[i], at: at }; prevAt = i ? instant(today, times[list[i - 1]]) : instant(addDays(today, -1), timesFor(addDays(today, -1)).isha); break; }
    }
    if (!next) { next = { k: 'fajr', at: instant(addDays(today, 1), tomorrow.fajr) }; prevAt = instant(today, times.isha); }
    if (E.dateIn(loc.tz, new Date()).d !== today.d) { render(); return; }
    var label = PRAYERS.concat([['fajr', 'Fajr']]).find(function (p) { return p[0] === next.k; });
    var nameEl = $('hpName'), timeEl = $('hpTime'), ring = $('hpRing');    var left = Math.max(0, next.at - now);
    var hh = Math.floor(left / 3600000), mm = Math.floor(left % 3600000 / 60000);
    if (nameEl) nameEl.textContent = label[1];
    if (timeEl) timeEl.textContent = 'at ' + fmt(next.k === 'fajr' && next.at > instant(today, times.isha || 0) ? tomorrow.fajr : times[next.k]) + ' · in ' + (hh ? hh + 'h ' : '') + mm + 'm';
    if (ring) ring.style.setProperty('--p', Math.min(100, Math.max(0, (1 - left / (next.at - prevAt)) * 100)).toFixed(1));
  }
  setInterval(tick, 30000);

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('#hpToggle button');
    if (!b || b.getAttribute('aria-pressed') === 'true') return;
    document.querySelectorAll('#hpToggle button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
    var mode = b.dataset.hp, showEl = $('hp' + (mode === 'today' ? 'Today' : 'Next')), hideEl = $('hp' + (mode === 'today' ? 'Next' : 'Today'));
    hideEl.classList.add('hp-anim');
    setTimeout(function () {
      hideEl.hidden = true;
      hideEl.classList.remove('hp-anim');
      showEl.hidden = false;
      showEl.classList.add('hp-anim');
      requestAnimationFrame(function () { requestAnimationFrame(function () { showEl.classList.remove('hp-anim'); }); });
    }, 180);
    IWP.store.set('hp:view', mode);
  });
  var savedView = IWP.store.get('hp:view', 'next');
  if (savedView === 'today') {
    var tb = document.querySelector('#hpToggle [data-hp="today"]');
    if (tb) tb.click();
  }

  render();
})();
