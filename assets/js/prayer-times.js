/* Islamic World Pro — prayer times & qibla. © 2026 Aurevia Solution. All rights reserved.
   Astronomical calculation runs entirely in the browser; no location leaves the device
   except for the optional city search (Open-Meteo) and place name lookup (BigDataCloud). */
(function (global) {
  'use strict';

  /* ================= engine ================= */
  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var sin = function (d) { return Math.sin(d * D2R); }, cos = function (d) { return Math.cos(d * D2R); }, tan = function (d) { return Math.tan(d * D2R); };
  var asin = function (x) { return Math.asin(x) * R2D; }, acos = function (x) { return Math.acos(x) * R2D; };
  var atan2 = function (y, x) { return Math.atan2(y, x) * R2D; }, acot = function (x) { return Math.atan(1 / x) * R2D; };
  var fix = function (a, b) { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  var fixHour = function (h) { return fix(h, 24); };

  var METHODS = {
    Qatar: { name: 'Qatar Awqaf', fajr: 18, isha: '90 min' },
    Makkah: { name: 'Umm al-Qura, Makkah', fajr: 18.5, isha: '90 min' },
    Dubai: { name: 'Dubai (IACAD)', fajr: 18.2, isha: 18.2 },
    Kuwait: { name: 'Kuwait', fajr: 18, isha: 17.5 },
    Karachi: { name: 'University of Islamic Sciences, Karachi', fajr: 18, isha: 18 },
    MWL: { name: 'Muslim World League', fajr: 18, isha: 17 },
    Egypt: { name: 'Egyptian General Authority of Survey', fajr: 19.5, isha: 17.5 },
    ISNA: { name: 'Islamic Society of North America', fajr: 15, isha: 15 },
    Moonsighting: { name: 'Moonsighting Committee (18°)', fajr: 18, isha: 18 },
    Turkey: { name: 'Diyanet, Turkey', fajr: 18, isha: 17 },
    Singapore: { name: 'MUIS, Singapore', fajr: 20, isha: 18 },
    JAKIM: { name: 'JAKIM, Malaysia', fajr: 20, isha: 18 },
    Kemenag: { name: 'Kemenag, Indonesia', fajr: 20, isha: 18 },
    France: { name: 'UOIF, France (12°)', fajr: 12, isha: 12 },
    Tehran: { name: 'Institute of Geophysics, Tehran', fajr: 17.7, isha: 14, maghrib: 4.5, midnight: 'Jafari' }
  };
  var COUNTRY_METHOD = { QA: 'Qatar', SA: 'Makkah', AE: 'Dubai', KW: 'Kuwait', BH: 'Makkah', OM: 'Makkah', YE: 'Makkah', PK: 'Karachi', IN: 'Karachi', BD: 'Karachi', AF: 'Karachi', EG: 'Egypt', SD: 'Egypt', LY: 'Egypt', JO: 'MWL', US: 'ISNA', CA: 'ISNA', GB: 'MWL', TR: 'Turkey', SG: 'Singapore', MY: 'JAKIM', ID: 'Kemenag', FR: 'France', IR: 'Tehran' };
  var HANAFI = { PK: 1, IN: 1, BD: 1, AF: 1, TR: 1 };

  function julian(y, m, d) {
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5;
  }
  function sunPos(jd) {
    var D = jd - 2451545.0;
    var g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    var L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    var RA = atan2(cos(e) * sin(L), cos(L)) / 15;
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - fixHour(RA) };
  }

  /**
   * compute(date{y,m,d}, lat, lng, tzHours, opts) -> hours (local, decimal) for
   * fajr, sunrise, dhuhr, asr, sunset, maghrib, isha, midnight, lastThird
   */
  function compute(date, lat, lng, tz, opts) {
    var M = METHODS[opts.method] || METHODS.MWL;
    var jd = julian(date.y, date.m, date.d) - lng / (15 * 24);
    var midDay = function (t) { return fixHour(12 - sunPos(jd + t).eqt); };
    var angleTime = function (angle, t, ccw) {
      var decl = sunPos(jd + t).decl, noon = midDay(t);
      var T = acos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
      return noon + (ccw ? -T : T);
    };
    var asrTime = function (factor, t) {
      var decl = sunPos(jd + t).decl;
      return angleTime(-acot(factor + tan(Math.abs(lat - decl))), t);
    };
    var isMin = function (v) { return typeof v === 'string'; };
    var num = function (v) { return parseFloat(v); };
    var riseSet = 0.833;
    var t = { fajr: 5, sunrise: 6, dhuhr: 12, asr: 13, sunset: 18, maghrib: 18, isha: 18 };
    for (var it = 0; it < 2; it++) {
      var p = {}; for (var k in t) p[k] = t[k] / 24;
      t = {
        fajr: angleTime(M.fajr, p.fajr, true),
        sunrise: angleTime(riseSet, p.sunrise, true),
        dhuhr: midDay(p.dhuhr),
        asr: asrTime(opts.asr === 'hanafi' ? 2 : 1, p.asr),
        sunset: angleTime(riseSet, p.sunset),
        maghrib: M.maghrib ? angleTime(M.maghrib, p.maghrib) : angleTime(riseSet, p.maghrib),
        isha: isMin(M.isha) ? 18 : angleTime(M.isha, p.isha)
      };
    }
    var adj = tz - lng / 15;
    for (var k2 in t) t[k2] += adj;
    if (isMin(M.isha)) t.isha = t.maghrib + num(M.isha) / 60;
    // high latitudes: keep Fajr/Isha within a portion of the night
    var night = fixHour(t.sunrise - t.sunset);
    var portion = function (angle) {
      if (opts.highLat === 'seventh') return night / 7;
      if (opts.highLat === 'middle') return night / 2;
      return angle / 60 * night;
    };
    var fp = portion(M.fajr);
    if (isNaN(t.fajr) || fixHour(t.sunrise - t.fajr) > fp) t.fajr = t.sunrise - fp;
    if (!isMin(M.isha)) {
      var ip = portion(M.isha);
      if (isNaN(t.isha) || fixHour(t.isha - t.sunset) > ip) t.isha = t.sunset + ip;
    }
    t.dhuhr += 1 / 60; // a minute after zenith, as most timetables do
    var a = opts.adjust || {};
    ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k3) { t[k3] += (+a[k3] || 0) / 60; });
    t.midnight = M.midnight === 'Jafari' ? t.sunset + fixHour(t.fajr - t.sunset) / 2 : t.sunset + night / 2;
    t.lastThird = t.sunset + night * 2 / 3;
    return t;
  }

  function tzOffset(tz, instant) {
    try {
      var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
      var p = {}; f.formatToParts(instant).forEach(function (x) { p[x.type] = x.value; });
      return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - Math.floor(instant.getTime() / 1000) * 1000) / 3600000;
    } catch (e) { return -instant.getTimezoneOffset() / 60; }
  }
  function dateIn(tz, instant) {
    try {
      var p = {}; new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(instant).forEach(function (x) { p[x.type] = x.value; });
      return { y: +p.year, m: +p.month, d: +p.day };
    } catch (e) { return { y: instant.getFullYear(), m: instant.getMonth() + 1, d: instant.getDate() }; }
  }
  function qibla(lat, lng) {
    var kLat = 21.4225, kLng = 39.8262;
    var b = atan2(sin(kLng - lng), cos(lat) * tan(kLat) - sin(lat) * cos(kLng - lng));
    var dLat = (kLat - lat) * D2R, dLng = (kLng - lng) * D2R;
    var h = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(lat * D2R) * Math.cos(kLat * D2R) * Math.pow(Math.sin(dLng / 2), 2);
    return { bearing: fix(b, 360), km: 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) };
  }

  var ENGINE = { compute: compute, tzOffset: tzOffset, dateIn: dateIn, qibla: qibla, METHODS: METHODS, COUNTRY_METHOD: COUNTRY_METHOD, HANAFI: HANAFI };
  global.PTENGINE = ENGINE;
  if (typeof module !== 'undefined') module.exports = ENGINE;
  if (typeof document === 'undefined') return;

  /* ================= page ================= */
  var IWP = global.IWP;
  var root = document.querySelector('main.pt');
  if (!root) return;
  var CITIES = global.PT_CITIES || [];
  var PRAYERS = [['fajr', 'Fajr', 'الفجر'], ['sunrise', 'Sunrise', 'الشروق'], ['dhuhr', 'Dhuhr', 'الظهر'], ['asr', 'Asr', 'العصر'], ['maghrib', 'Maghrib', 'المغرب'], ['isha', 'Isha', 'العشاء']];
  var ICONS = {
    fajr: '<path d="M3 17h18M6 17a6 6 0 0 1 12 0M12 5v3M4.2 9.2l1.4 1.4M19.8 9.2l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    sunrise: '<path d="M3 18h18M7 18a5 5 0 0 1 10 0M12 4v5M9 7l3-3 3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    dhuhr: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    asr: '<circle cx="15" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 20h18M5 20l5-7 3 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    maghrib: '<path d="M3 17h18M7 17a5 5 0 0 1 10 0M12 9V4M9 7l3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    isha: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'
  };

  var fixedCity = root.dataset.city ? JSON.parse(root.dataset.city) : null;
  var S = Object.assign({ methodAuto: true, method: 'MWL', asr: 'auto', highLat: 'angle', adjust: {}, h24: false }, IWP.store.get('pt:set', {}));
  var loc = fixedCity || IWP.store.get('pt:loc', null) || guessLocation();

  function guessLocation() {
    var tz = '';
    try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}
    var c = CITIES.find(function (x) { return x.tz === tz; }) || CITIES.find(function (x) { return x.slug === 'makkah'; }) || { name: 'Makkah', country: 'Saudi Arabia', cc: 'SA', lat: 21.3891, lng: 39.8579, tz: 'Asia/Riyadh' };
    return Object.assign({ guessed: true }, c);
  }
  function method() { return S.methodAuto ? (COUNTRY_METHOD[loc.cc] || 'MWL') : S.method; }
  function asrMode() { return S.asr === 'auto' ? (HANAFI[loc.cc] ? 'hanafi' : 'standard') : S.asr; }
  function opts() { return { method: method(), asr: asrMode(), highLat: S.highLat, adjust: S.adjust }; }
  function saveSet() { IWP.store.set('pt:set', S); }

  function fmt(h) {
    if (isNaN(h)) return '—';
    var mins = Math.round(fixHour(h) * 60) % 1440, H = Math.floor(mins / 60), m = mins % 60;
    if (S.h24) return ('0' + H).slice(-2) + ':' + ('0' + m).slice(-2);
    return ((H % 12) || 12) + ':' + ('0' + m).slice(-2) + (H < 12 ? ' AM' : ' PM');
  }
  function instant(date, hours) {
    var guess = Date.UTC(date.y, date.m - 1, date.d, 12);
    var off = tzOffset(loc.tz, new Date(guess));
    return Date.UTC(date.y, date.m - 1, date.d) + (hours - off) * 3600000;
  }
  function addDays(date, n) {
    var t = new Date(Date.UTC(date.y, date.m - 1, date.d + n));
    return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
  }
  function timesFor(date) {
    var off = tzOffset(loc.tz, new Date(Date.UTC(date.y, date.m - 1, date.d, 12)));
    return compute(date, loc.lat, loc.lng, off, opts());
  }
  function hijri(date, style) {
    try {
      return new Intl.DateTimeFormat((style === 'ar' ? 'ar-SA' : 'en-GB') + '-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
        .format(new Date(Date.UTC(date.y, date.m - 1, date.d, 12)));
    } catch (e) { return ''; }
  }

  var $ = function (id) { return document.getElementById(id); };
  var today, times, tomorrow;

  function render() {
    today = dateIn(loc.tz, new Date());
    times = timesFor(today);
    tomorrow = timesFor(addDays(today, 1));
    $('ptPlace').textContent = loc.name + (loc.country ? ', ' + loc.country : '');
    $('ptGreg').textContent = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(today.y, today.m - 1, today.d, 12)));
    $('ptHijri').textContent = hijri(today, 'en');
    $('ptHijriAr').textContent = hijri(today, 'ar');
    $('ptList').innerHTML = PRAYERS.map(function (p) {
      return '<div class="pt-row' + (p[0] === 'sunrise' ? ' sun' : '') + '" data-p="' + p[0] + '"><span class="ic"><svg viewBox="0 0 24 24">' + ICONS[p[0]] + '</svg></span>' +
        '<span><strong>' + p[1] + '</strong><span lang="ar">' + p[2] + '</span></span><time>' + fmt(times[p[0]]) + '</time></div>';
    }).join('');
    $('ptMidnight').textContent = fmt(times.midnight);
    $('ptThird').textContent = fmt(times.lastThird);
    $('ptSunset').textContent = fmt(times.sunset);
    $('ptMethodNote').textContent = METHODS[method()].name + ' · Asr ' + (asrMode() === 'hanafi' ? 'Hanafi' : 'Standard (Shafi‘i, Maliki, Hanbali)') + ' · ' + loc.tz;
    renderQibla();
    renderTable();
    syncForm();
    tick();
    if (!fixedCity) {
      document.title = 'Prayer Times in ' + loc.name + ' Today – Fajr, Dhuhr, Asr, Maghrib, Isha';
    }
  }

  function tick() {
    if (!times) return;
    var now = Date.now(), list = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    var next = null, prev = null;
    for (var i = 0; i < list.length; i++) {
      var at = instant(today, times[list[i]]);
      if (at > now) { next = { k: list[i], at: at }; prev = i ? { k: list[i - 1], at: instant(today, times[list[i - 1]]) } : { k: 'isha', at: instant(addDays(today, -1), timesFor(addDays(today, -1)).isha) }; break; }
    }
    if (!next) {
      next = { k: 'fajr', at: instant(addDays(today, 1), tomorrow.fajr) };
      prev = { k: 'isha', at: instant(today, times.isha) };
    }
    if (dateIn(loc.tz, new Date()).d !== today.d) { render(); return; }
    var left = Math.max(0, next.at - now), hh = Math.floor(left / 3600000), mm = Math.floor(left % 3600000 / 60000), ss = Math.floor(left % 60000 / 1000);
    var name = PRAYERS.find(function (p) { return p[0] === next.k; });
    $('nxName').textContent = name[1];
    $('nxTime').textContent = fmt(next.k === 'fajr' && next.at > instant(today, times.isha) ? tomorrow.fajr : times[next.k]);
    $('nxLeft').textContent = (hh ? hh + ':' + ('0' + mm).slice(-2) : mm) + ':' + ('0' + ss).slice(-2);
    var span = next.at - prev.at;
    $('nxRing').style.setProperty('--p', Math.min(100, Math.max(0, (1 - left / span) * 100)).toFixed(1));
    document.querySelectorAll('.pt-row').forEach(function (r) {
      var k = r.dataset.p;
      r.classList.toggle('now', k === prev.k && prev.at <= now && next.k !== 'fajr' || (k === 'isha' && next.k === 'fajr' && now >= instant(today, times.isha)));
      r.classList.toggle('passed', instant(today, times[k]) < now && !r.classList.contains('now'));
    });
    if (notifyOn && left < 1000 && !notified[next.k + today.d]) {
      notified[next.k + today.d] = 1;
      try { new Notification('Time for ' + name[1], { body: 'It is now ' + name[1] + ' in ' + loc.name + '.', icon: '/assets/img/brand/logo-192.png' }); } catch (e) {}
    }
  }
  setInterval(tick, 1000);
  var notifyOn = false, notified = {};

  /* qibla */
  var heading = null;
  function renderQibla() {
    var q = qibla(loc.lat, loc.lng);
    var dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    $('qDeg').textContent = Math.round(q.bearing) + '° ' + dirs[Math.round(q.bearing / 22.5) % 16];
    $('qDist').textContent = Math.round(q.km).toLocaleString() + ' km (' + Math.round(q.km * 0.621371).toLocaleString() + ' mi) to the Ka‘bah';
    $('qNeedle').style.transform = 'rotate(' + q.bearing + 'deg)';
    $('qDial').style.transform = heading == null ? '' : 'rotate(' + (-heading) + 'deg)';
  }
  function onOrient(ev) {
    var h = ev.webkitCompassHeading != null ? ev.webkitCompassHeading : (ev.absolute && ev.alpha != null ? 360 - ev.alpha : null);
    if (h == null) return;
    heading = h;
    $('qDial').style.transform = 'rotate(' + (-heading) + 'deg)';
  }
  $('qCompass').addEventListener('click', function () {
    var start = function () {
      window.addEventListener('deviceorientationabsolute', onOrient);
      window.addEventListener('deviceorientation', onOrient);
      IWP.toast('Hold your phone flat. The Ka‘bah marker points to the Qibla.');
    };
    if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
      DeviceOrientationEvent.requestPermission().then(function (r) { if (r === 'granted') start(); else IWP.toast('Compass permission was not given'); });
    } else if ('ondeviceorientationabsolute' in window || 'ondeviceorientation' in window) start();
    else IWP.toast('This device has no compass. Use the bearing shown from true north.');
  });

  /* monthly timetable */
  var tableMonth = null;
  function renderTable() {
    if (!tableMonth) tableMonth = { y: today.y, m: today.m };
    var days = new Date(Date.UTC(tableMonth.y, tableMonth.m, 0)).getUTCDate();
    $('ttTitle').textContent = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(tableMonth.y, tableMonth.m - 1, 1)));
    var rows = '';
    for (var d = 1; d <= days; d++) {
      var dt = { y: tableMonth.y, m: tableMonth.m, d: d }, t = timesFor(dt);
      var isToday = dt.y === today.y && dt.m === today.m && dt.d === today.d;
      var h = '';
      try { h = new Intl.DateTimeFormat('en-GB-u-ca-islamic-umalqura', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(dt.y, dt.m - 1, d, 12))); } catch (e) {}
      rows += '<tr' + (isToday ? ' class="today"' : '') + '><td>' + new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(dt.y, dt.m - 1, d, 12))) + '<span class="h">' + h + '</span></td>' +
        PRAYERS.map(function (p) { return '<td>' + fmt(t[p[0]]) + '</td>'; }).join('') + '</tr>';
    }
    $('ttBody').innerHTML = rows;
  }
  $('ttPrev').addEventListener('click', function () { tableMonth.m--; if (tableMonth.m < 1) { tableMonth.m = 12; tableMonth.y--; } renderTable(); });
  $('ttNext').addEventListener('click', function () { tableMonth.m++; if (tableMonth.m > 12) { tableMonth.m = 1; tableMonth.y++; } renderTable(); });
  $('ttPrint').addEventListener('click', function () { window.print(); });

  /* settings form */
  var form = $('ptForm');
  var msel = form.method;
  msel.add(new Option('Automatic for this country', 'auto'));
  Object.keys(METHODS).forEach(function (k) { msel.add(new Option(METHODS[k].name, k)); });
  function syncForm() {
    msel.value = S.methodAuto ? 'auto' : S.method;
    form.asr.value = S.asr;
    form.highLat.value = S.highLat;
    form.h24.checked = !!S.h24;
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k) { form['adj_' + k].value = S.adjust[k] || 0; });
  }
  form.addEventListener('input', function () {
    S.methodAuto = msel.value === 'auto';
    if (!S.methodAuto) S.method = msel.value;
    S.asr = form.asr.value;
    S.highLat = form.highLat.value;
    S.h24 = form.h24.checked;
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(function (k) { S.adjust[k] = Math.max(-30, Math.min(30, parseInt(form['adj_' + k].value, 10) || 0)); });
    saveSet();
    render();
  });

  /* location: GPS + search */
  function setLoc(l) {
    loc = l;
    if (!fixedCity) IWP.store.set('pt:loc', l);
    tableMonth = null;
    render();
  }
  var gps = $('ptGps');
  if (gps) gps.addEventListener('click', function () {
    if (!navigator.geolocation) { IWP.toast('Location is not available in this browser'); return; }
    gps.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      gps.disabled = false;
      var lat = +pos.coords.latitude.toFixed(4), lng = +pos.coords.longitude.toFixed(4);
      var tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      var base = { name: 'Your location', country: '', cc: '', lat: lat, lng: lng, tz: tz };
      setLoc(base);
      IWP.fetchJSON('https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=' + lat + '&longitude=' + lng + '&localityLanguage=en').then(function (r) {
        setLoc(Object.assign(base, { name: r.city || r.locality || 'Your location', country: r.countryName || '', cc: r.countryCode || '' }));
      }).catch(function () {});
    }, function () { gps.disabled = false; IWP.toast('Allow location access, or search for your city'); }, { timeout: 12000, maximumAge: 600000 });
  });
  var sInput = $('ptSearch'), sugg = $('ptSugg'), sTimer;
  if (sInput) {
    sInput.addEventListener('input', function () {
      clearTimeout(sTimer);
      var q = sInput.value.trim();
      if (q.length < 2) { sugg.hidden = true; return; }
      sTimer = setTimeout(function () {
        IWP.fetchJSON('https://geocoding-api.open-meteo.com/v1/search?count=6&language=en&format=json&name=' + encodeURIComponent(q)).then(function (r) {
          var res = r.results || [];
          if (!res.length) { sugg.innerHTML = '<button type="button" disabled>No places found</button>'; sugg.hidden = false; return; }
          sugg.innerHTML = res.map(function (x, i) {
            return '<button type="button" data-i="' + i + '">' + IWP.esc(x.name) + ' <small>' + IWP.esc([x.admin1, x.country].filter(Boolean).join(', ')) + '</small></button>';
          }).join('');
          sugg.hidden = false;
          sugg.onclick = function (ev) {
            var b = ev.target.closest('[data-i]');
            if (!b) return;
            var x = res[+b.dataset.i];
            sugg.hidden = true; sInput.value = '';
            setLoc({ name: x.name, country: x.country || '', cc: x.country_code || '', lat: x.latitude, lng: x.longitude, tz: x.timezone || 'UTC' });
          };
        }).catch(function () { sugg.innerHTML = '<button type="button" disabled>Search needs an internet connection</button>'; sugg.hidden = false; });
      }, 280);
    });
    document.addEventListener('click', function (ev) { if (!ev.target.closest('.pt-search')) sugg.hidden = true; });
  }

  var alertAudio = null;
  var pb = $('ptAlertPreview');
  if (pb) pb.addEventListener('click', function () {
    if (!alertAudio) alertAudio = new Audio('/assets/audio/adhan-alert.mp3');
    if (!alertAudio.paused) { alertAudio.pause(); alertAudio.currentTime = 0; pb.textContent = '🔊 Preview alert sound'; return; }
    alertAudio.play().catch(function () { IWP.toast('Could not play the alert sound'); });
    pb.textContent = '⏸ Playing…';
    alertAudio.onended = function () { pb.textContent = '🔊 Preview alert sound'; };
  });

  var nb = $('ptNotify');
  if (nb) nb.addEventListener('click', function () {
    if (!('Notification' in window)) { IWP.toast('Notifications are not supported in this browser'); return; }
    Notification.requestPermission().then(function (p) {
      notifyOn = p === 'granted';
      nb.setAttribute('aria-pressed', notifyOn);
      IWP.toast(notifyOn ? 'You will be notified while this tab stays open' : 'Notifications are blocked for this site');
    });
  });

  render();
})(typeof window !== 'undefined' ? window : globalThis);
