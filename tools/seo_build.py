#!/usr/bin/env python3
"""Islamic World Pro — site-wide SEO + polish pass (idempotent).

Run from the site root:
    node tools/city-data.js > /tmp/cities.json
    python3 tools/seo_build.py /tmp/cities.json
    python3 tools/build_sitemap.py
"""
import html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BASE = 'https://islamicworldpro.com'
VER = '20260930j'
THEME_VER = '20260930d'
PREFS_HEAD = '<script>(function(){try{var t=JSON.parse(localStorage.getItem("iwp:site-theme")||"null"),l=JSON.parse(localStorage.getItem("iwp:site-lang")||"null"),h=document.documentElement;if(t&&t!=="classic")h.dataset.theme=t;if(l==="ur")h.dataset.lang="ur";}catch(e){}})();</script>'
SKIP = {'admin.html'}

TITLE_MAX, DESC_MAX = 62, 158


def pages():
    for d, dirs, fs in os.walk('.'):
        dirs[:] = [x for x in dirs if not x.startswith('.') and x not in ('assets', 'tools', 'node_modules')]
        for f in fs:
            if f.endswith('.html'):
                yield os.path.join(d, f)[2:]


def esc(s):
    return html.escape(s, quote=True).replace('&#x27;', '&#x27;')


def word_cut(s, n, ell='…'):
    s = re.sub(r'\s+', ' ', s).strip()
    if len(s) <= n:
        return s
    cut = s[: n - len(ell)]
    cut = cut[: cut.rfind(' ')] if ' ' in cut else cut
    return cut.rstrip(' ,;:—–-(') + ell


def get_meta(s, attr, key):
    m = re.search(r'<meta %s="%s" content="(.*?)">' % (attr, re.escape(key)), s, re.S)
    return html.unescape(m.group(1)) if m else None


def set_meta(s, attr, key, val):
    return re.sub(r'(<meta %s="%s" content=")(.*?)(">)' % (attr, re.escape(key)),
                  lambda m: m.group(1) + esc(val) + m.group(3), s, count=1, flags=re.S)


# ---------------------------------------------------------------- titles / descriptions
def better_title(t, path):
    if len(t) <= 65:
        return t
    m = re.match(r'Prayer Times in (.+?) Today', t)
    if m:
        return f'{m.group(1)} Prayer Times Today – Fajr to Isha & Qibla'
    if t.endswith(' | Islamic World Pro'):
        t2 = t[: -len(' | Islamic World Pro')]
        if len(t2) <= 65:
            return t2
        t = t2
    if path.startswith('hadith/'):
        col, _, book = t.partition(' – ')
        book = re.sub(r'^The Book (of|about|on) (the )?', '', book, flags=re.I)
        if len(col) + 3 + len(book) > TITLE_MAX:
            book = re.sub(r'\s*\(Kitab[^)]*\)', '', book)
        book = book[0].upper() + book[1:] if book else book
        room = TITLE_MAX - len(col) - 3
        return f'{col} – {trim_tail(word_cut(book, room, ""))}'
    return word_cut(t, TITLE_MAX, '')


STOP = {'and', 'of', 'the', 'to', 'in', 'for', 'with', 'a', 'an', 'on', 'during', 'from', 'by', '&', 'or'}


def trim_tail(t):
    w = t.split()
    while w and w[-1].lower().strip('(,') in STOP:
        w.pop()
    t = ' '.join(w)
    if t.count('(') > t.count(')'):
        t = t[: t.rfind('(')].rstrip()
    return t


DESC_OVERRIDE = {
    'blog/how-qibla-direction-is-calculated.html': "How the Qibla direction is calculated as a great-circle bearing to the Ka'bah — and how to find it with a compass, the sun or your phone.",
    'prayer-times.html': 'Accurate Fajr, Dhuhr, Asr, Maghrib and Isha times for your exact location, with a live Qibla compass, monthly timetable and settings for every madhab.',
    'quran.html': "Read all 114 surahs of the Qur'an online free: Uthmani Arabic, Urdu & English translation, tafseer, word-by-word meaning, tajweed colours and audio.",
    'videos.html': 'Watch Islamic World Pro in action: prayer times & Qibla, Hadith & Azkar, Ask Imam AI, Kids Corner, Zakat calculator and more — a free Islamic app.',
    'prayer-times/sarajevo.html': "Today's accurate prayer times in Sarajevo, Bosnia and Herzegovina: Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha, plus Qibla direction and monthly timetable.",
    'quran/al-mumtahanah.html': 'Read Surah Al-Mumtahanah (الممتحنة), She that is to be examined: all 13 ayahs in Uthmani Arabic with English & Urdu translation, tafseer and audio.',
}


def better_desc(dsc, path):
    if path in DESC_OVERRIDE:
        return DESC_OVERRIDE[path]
    dsc = re.sub(r'\s+', ' ', dsc).replace(':  (', ': (').replace(' ()', '').strip()
    dsc = dsc.replace(' authentic adhkar and duas with Arabic text, transliteration, English meaning, repetition counts and references.',
                      ' authentic adhkar and duas with Arabic, transliteration, English meaning and references.')
    dsc = re.sub(r'\b1 authentic adhkar and duas\b', '1 authentic dua', dsc)
    if len(dsc) <= 165:
        return dsc
    # Hadith chapter: keep the factual lead, then a clean quote excerpt
    m = re.match(r'(.+? with English translation\.)\s*(.*)$', dsc)
    if m and path.startswith('hadith/'):
        lead, quote = m.group(1), m.group(2).strip().strip('"“”').replace('"', "'").replace('“', '‘').replace('”', '’')
        if len(lead) > DESC_MAX:
            lead = re.sub(r' \([^)]*[\u0600-\u06FF][^)]*\)', '', lead)
            lead = re.sub(r': The Book (of|about) (the )?', ': ', lead)
            lead = lead.replace(' in Arabic with English translation.', ', Arabic with English.')
        room = DESC_MAX - len(lead) - 3
        if room > 30 and quote:
            return f'{lead} “{word_cut(quote, room, "…")}”'.replace('…”', '…”')
        return word_cut(lead, DESC_MAX)
    # Otherwise: end on a full sentence if one fits, else on a word
    cut = dsc[:DESC_MAX]
    ends = [m.end() - 1 for m in re.finditer(r'(?<=\w{3})[.!?](?= [A-Z“"])', cut)]
    ends = [e for e in ends if e > 100 and cut[:e].count('(') == cut[:e].count(')')]
    if ends:
        return cut[: ends[-1] + 1]
    return word_cut(dsc, DESC_MAX)


def fix_meta(s, path):
    m = re.search(r'<title>(.*?)</title>', s, re.S)
    if m:
        t = html.unescape(m.group(1)).strip()
        nt = better_title(t, path)
        if nt != t:
            s = s.replace(m.group(0), '<title>' + esc(nt) + '</title>', 1)
            for a, k in (('property', 'og:title'), ('name', 'twitter:title')):
                if get_meta(s, a, k) is not None:
                    s = set_meta(s, a, k, nt)
    dsc = get_meta(s, 'name', 'description')
    if dsc:
        nd = better_desc(dsc, path)
        if nd != dsc:
            s = set_meta(s, 'name', 'description', nd)
            for a, k in (('property', 'og:description'), ('name', 'twitter:description')):
                if get_meta(s, a, k) is not None:
                    s = set_meta(s, a, k, nd)
    return s


# ---------------------------------------------------------------- polish assets
def add_polish(s):
    if 'polish.css' not in s:
        links = list(re.finditer(r'<link rel="stylesheet" href="/?assets/css/[^"]+">', s))
        if links:
            last = links[-1]
            s = s[: last.end()] + f'\n<link rel="stylesheet" href="/assets/css/polish.css?v={VER}">' + s[last.end():]
    else:
        s = re.sub(r'polish\.css\?v=\w+', f'polish.css?v={VER}', s)
    if 'polish.js' not in s:
        s = s.replace('</body>', f'<script defer src="/assets/js/polish.js?v={VER}"></script>\n</body>', 1)
    else:
        s = re.sub(r'polish\.js\?v=\w+', f'polish.js?v={VER}', s)
    # site themes + English/Urdu switch (same as the app)
    if 'iwp:site-theme' not in s:
        s = s.replace('<meta charset="UTF-8">', '<meta charset="UTF-8">\n' + PREFS_HEAD, 1)
    if 'themes.css' not in s:
        s = re.sub(r'(<link rel="stylesheet" href="/assets/css/polish\.css\?v=\w+">)', r'\1\n<link rel="stylesheet" href="/assets/css/themes.css?v=' + THEME_VER + '">', s, count=1)
    if 'prefs.js' not in s:
        s = s.replace('</body>', f'<script defer src="/assets/js/prefs.js?v=20260930c"></script>\n</body>', 1)
    return s


# ---------------------------------------------------------------- city pages
MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
          'October', 'November', 'December']


def compass(b):
    pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
    return pts[int((b + 11.25) // 22.5) % 16]


def hm12(t):
    h, m = map(int, t.split(':'))
    return f'{(h % 12) or 12}:{m:02d} {"AM" if h < 12 else "PM"}'


def dur(mins):
    return f'{mins // 60}h {mins % 60:02d}m'


def city_block(c):
    n, ctry = c['name'], c['country']
    mi = round(c['qiblaKm'] * 0.621371)
    asr = 'Hanafi (later Asr)' if c['asr'] == 'hanafi' else 'Standard – Shafi‘i, Maliki, Hanbali'
    isha = f"{c['ishaRule']} after Maghrib" if isinstance(c['ishaRule'], str) else f"sun {c['ishaRule']}° below the horizon"
    fajrs = [r[0] for r in c['months']]
    ishas = [r[5] for r in c['months']]
    e_f, l_f = min(fajrs), max(fajrs)
    e_fm, l_fm = MONTHS[fajrs.index(e_f)], MONTHS[fajrs.index(l_f)]
    rows = ''.join(
        f'<tr><th scope="row">{MONTHS[i][:3]}</th>' + ''.join(f'<td>{hm12(t)}</td>' for t in r) + '</tr>'
        for i, r in enumerate(c['months']))
    near = ''.join(
        f'<a href="/prayer-times/{o["slug"]}">{esc(o["name"])} <small>{o["km"]:,} km</small></a>' for o in c['near'])
    same = [o for o in c['near'] if o['country'] == ctry]
    same_txt = (' Nearby, ' + ', '.join(o['name'] for o in same[:3]) + ' follow the same national method.') if same else ''
    return f'''<!-- iwp:city-facts -->
<section class="city-facts section-light" id="about-{c['slug']}">
  <div class="wide">
    <div class="section-head" style="text-align:left;max-width:none;">
      <span class="eyebrow">{esc(n)} at a glance</span>
      <h2>How prayer times are calculated in {esc(n)}</h2>
    </div>
    <div class="cf-grid">
      <div class="cf-card"><small>Calculation method</small><b>{esc(c['methodName'])}</b><span>Fajr at {c['fajrAngle']}° · Isha {esc(isha)}</span></div>
      <div class="cf-card"><small>Asr juristic school</small><b>{'Hanafi' if c['asr'] == 'hanafi' else 'Standard'}</b><span>{esc(asr)}</span></div>
      <div class="cf-card"><small>Qibla direction</small><b>{c['qibla']}° {compass(c['qibla'])}</b><span>{c['qiblaKm']:,} km ({mi:,} mi) to the Ka‘bah</span></div>
      <div class="cf-card"><small>Time zone</small><b>{esc(c['tz'].replace('_', ' '))}</b><span>{c['lat']:.4f}°, {c['lng']:.4f}°</span></div>
    </div>
    <div class="cf-copy">
      <p>Prayer times in {esc(n)}, {esc(ctry)} are worked out from the position of the sun over the city’s coordinates ({c['lat']:.4f}°, {c['lng']:.4f}°). By default this page uses the <strong>{esc(c['methodName'])}</strong> method — Fajr begins when the sun is {c['fajrAngle']}° below the horizon and Isha {esc(isha)} — with the <strong>{'Hanafi' if c['asr'] == 'hanafi' else 'standard'}</strong> Asr rule.{esc(same_txt)}</p>
      <p>Across the year, Fajr in {esc(n)} is earliest around {e_fm} (about {hm12(e_f)}) and latest around {l_fm} (about {hm12(l_f)}). Daylight ranges from roughly {dur(c['dayMin'])} in the shortest days to {dur(c['dayMax'])} in the longest, which is why Isha moves between {hm12(min(ishas))} and {hm12(max(ishas))}.</p>
      <p>To face the Qibla from {esc(n)}, turn to <strong>{c['qibla']}° from true north ({compass(c['qibla'])})</strong>. The Ka‘bah in Makkah is {c['qiblaKm']:,} km away along the shortest great-circle path.</p>
    </div>
    <h3 style="margin:34px 0 12px;font-size:1.2rem;">{esc(n)} prayer times through the year</h3>
    <p class="pt-note" style="margin:0 0 12px;">Typical times on the 15th of each month ({esc(c['methodName'])}). For today’s exact times, see the timetable above.</p>
    <div class="cf-year-wrap"><table class="cf-year"><thead><tr><th>Month</th><th>Fajr</th><th>Sunrise</th><th>Dhuhr</th><th>Asr</th><th>Maghrib</th><th>Isha</th></tr></thead><tbody>{rows}</tbody></table></div>
    <h3 style="margin:38px 0 4px;font-size:1.2rem;">Prayer times in nearby cities</h3>
    <nav class="cf-near" aria-label="Nearby cities">{near}<a href="/prayer-times">All cities →</a></nav>
  </div>
</section>
<!-- /iwp:city-facts -->
'''


def city_faq(c):
    n = c['name']
    return [
        (f'What time is Fajr in {n} today?',
         f"Fajr in {n} changes daily with the sun. This page shows today's exact time, calculated for {n}'s coordinates ({c['lat']}, {c['lng']})."),
        (f'Which calculation method is used for {n}?',
         f"By default {c['methodName']} (Fajr at {c['fajrAngle']}°), the method used across {c['country']}. You can change it under Calculation settings on this page."),
        (f'What is the Qibla direction in {n}?',
         f"The Qibla from {n} is {c['qibla']}° from true north ({compass(c['qibla'])}), {c['qiblaKm']:,} km to the Ka‘bah in Makkah."),
        ('Is this the same time as my local mosque?',
         'It should be very close. If your mosque adds a short buffer, use the manual minute adjustment in Calculation settings to match it exactly.'),
    ]


def patch_city(s, c):
    s = re.sub(r'<!-- iwp:city-facts -->.*?<!-- /iwp:city-facts -->\n?', '', s, flags=re.S)
    anchor = '<section class="cv-auto section-light" id="faq">'
    if anchor in s:
        s = s.replace(anchor, city_block(c) + anchor, 1)
    # rebuild FAQ accordion with real answers
    faq = city_faq(c)
    items = ''.join(
        f'''      <div class="accordion-item{' open' if i == 0 else ''}">
        <button class="accordion-q"><span>{esc(q)}</span><span class="plus">+</span></button>
        <div class="accordion-a"><div class="accordion-a-inner">{esc(a)}</div></div>
      </div>
''' for i, (q, a) in enumerate(faq))
    s = re.sub(r'(<section class="cv-auto section-light" id="faq">.*?<div class="accordion">\n)(.*?)(    </div>\n  </div>\n</section>)',
               lambda m: m.group(1) + items + m.group(3), s, count=1, flags=re.S)
    # FAQPage JSON-LD
    s = re.sub(r'<script type="application/ld\+json" data-iwp="faq">.*?</script>\n?', '', s, flags=re.S)
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]}
    s = s.replace('</head>', '<script type="application/ld+json" data-iwp="faq">' + json.dumps(ld, ensure_ascii=False) + '</script>\n</head>', 1)
    return s


# ---------------------------------------------------------------- homepage hero
def patch_home(s):
    if 'data-iwp="hero-v2"' in s or 'hero-v3' in s:
        return s
    cta = re.search(r'\n        <div class="hero-cta" style="margin-top:16px;margin-bottom:20px;">.*?\n        </div>', s, re.S)
    h1 = re.search(r'\n        <h1 style="margin-top:14px;">The best Islamic app for everyday Muslim life</h1>', s)
    lead = re.search(r'\n        <p class="lead">Islamic World Pro brings.*?</p>', s, re.S)
    if not (cta and h1 and lead):
        print('! homepage hero markup not found; skipped'); return s
    cta_html = cta.group(0).replace('style="margin-top:16px;margin-bottom:20px;"', 'style="margin:26px 0 22px;" data-iwp="hero-v2"')
    cta_html = cta_html.replace('class="hero-cta"', 'class="hero-cta iwp-enter iwp-enter-4"')
    new_h1 = '\n        <h1 class="iwp-enter iwp-enter-2" style="margin-top:14px;">The best Islamic app for <span class="text-gold">everyday Muslim life</span></h1>'
    new_lead = lead.group(0).replace('<p class="lead">', '<p class="lead iwp-enter iwp-enter-3">')
    s = s.replace(cta.group(0), '', 1)
    s = s.replace(h1.group(0), new_h1, 1)
    s = s.replace(lead.group(0), new_lead + cta_html, 1)
    return s


def main():
    cities = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
    changed = 0
    for p in pages():
        if p in SKIP:
            continue
        s0 = s = open(p, encoding='utf-8').read()
        s = add_polish(s)
        if p != '404.html':
            s = fix_meta(s, p)
        if p.startswith('prayer-times/'):
            slug = os.path.basename(p)[:-5]
            if slug in cities:
                s = patch_city(s, cities[slug])
        if p == 'index.html':
            s = patch_home(s)
        if s != s0:
            open(p, 'w', encoding='utf-8').write(s); changed += 1
    print('pages changed:', changed)


if __name__ == '__main__':
    main()
