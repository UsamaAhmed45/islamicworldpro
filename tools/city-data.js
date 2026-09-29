// Build-time: compute evergreen per-city facts for static SEO content. Run: node tools/city-data.js > /tmp/cities.json
global.window = global; require('../assets/js/pt-cities.js');
const E = require('../assets/js/prayer-times.js');
const C = global.PT_CITIES, YEAR = 2026;
const hm = h => { h = ((h % 24) + 24) % 24; let H = Math.floor(h), M = Math.round((h - H) * 60); if (M === 60) { H = (H + 1) % 24; M = 0; } return String(H).padStart(2, '0') + ':' + String(M).padStart(2, '0'); };
const dist = (a, b) => { const R = Math.PI / 180, dl = (b.lat - a.lat) * R, dg = (b.lng - a.lng) * R; const h = Math.sin(dl / 2) ** 2 + Math.cos(a.lat * R) * Math.cos(b.lat * R) * Math.sin(dg / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); };
const out = {};
for (const c of C) {
  const method = E.COUNTRY_METHOD[c.cc] || 'MWL', asr = E.HANAFI[c.cc] ? 'hanafi' : 'standard';
  const months = []; let dayMin = 99, dayMax = 0;
  for (let m = 1; m <= 12; m++) {
    const off = E.tzOffset(c.tz, new Date(Date.UTC(YEAR, m - 1, 15, 12)));
    const t = E.compute({ y: YEAR, m, d: 15 }, c.lat, c.lng, off, { method, asr, highLat: 'angle', adjust: {} });
    const len = t.sunset - t.sunrise; dayMin = Math.min(dayMin, len); dayMax = Math.max(dayMax, len);
    months.push(['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map(k => hm(t[k])));
  }
  const q = E.qibla(c.lat, c.lng);
  const near = C.filter(o => o.slug !== c.slug).map(o => ({ slug: o.slug, name: o.name, country: o.country, km: Math.round(dist(c, o)) })).sort((a, b) => a.km - b.km).slice(0, 6);
  out[c.slug] = { ...c, method, methodName: E.METHODS[method].name, fajrAngle: E.METHODS[method].fajr, ishaRule: E.METHODS[method].isha, asr, qibla: Math.round(q.bearing * 10) / 10, qiblaKm: Math.round(q.km), months, dayMin: Math.round(dayMin * 60), dayMax: Math.round(dayMax * 60), near };
}
process.stdout.write(JSON.stringify(out));
