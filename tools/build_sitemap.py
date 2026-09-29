#!/usr/bin/env python3
"""Build /sitemap.xml (a sitemap index) plus one child sitemap per section.

- Only indexable pages are listed (pages with a noindex robots meta are skipped).
- <loc> always equals the page's own <link rel="canonical">, so Search Console
  never sees a sitemap URL that disagrees with the canonical.
- <lastmod> is the page's last git commit date, or today if the file has
  uncommitted changes — so it only moves when content really changes.
Run from anywhere:  python3 tools/build_sitemap.py
"""
import datetime, os, re, subprocess
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
BASE = 'https://islamicworldpro.com'
TODAY = datetime.date.today().isoformat()

SECTIONS = [  # (sitemap file, predicate on relative path)
    ('sitemap-pages.xml', lambda p: '/' not in p),
    ('sitemap-quran.xml', lambda p: p.startswith('quran/')),
    ('sitemap-hadith.xml', lambda p: p.startswith('hadith/')),
    ('sitemap-prayer-times.xml', lambda p: p.startswith('prayer-times/')),
    ('sitemap-azkar.xml', lambda p: p.startswith('azkar/')),
    ('sitemap-guides.xml', lambda p: p.startswith('blog/')),
]


def git(*a):
    try:
        return subprocess.run(['git', *a], capture_output=True, text=True, check=True).stdout
    except Exception:
        return ''


dirty = set(git('status', '--porcelain', '--untracked-files=all').replace('"', '').split('\n'))
dirty = {l[3:].strip() for l in dirty if l.strip()}

# one git call for all last-commit dates
dates = {}
cur = None
for line in git('log', '--format=@%cs', '--name-only').splitlines():
    if line.startswith('@'):
        cur = line[1:]
    elif line and line not in dates:
        dates[line] = cur


def lastmod(p):
    if p in dirty or p not in dates:
        return TODAY
    return dates[p]


entries = []
for d, dirs, fs in os.walk('.'):
    dirs[:] = [x for x in dirs if not x.startswith('.') and x not in ('assets', 'tools', 'node_modules')]
    for f in fs:
        if not f.endswith('.html'):
            continue
        p = os.path.join(d, f)[2:]
        s = open(p, encoding='utf-8', errors='ignore').read(20000)
        rob = re.search(r'<meta name="robots" content="([^"]*)"', s)
        if rob and 'noindex' in rob.group(1).lower():
            continue
        can = re.search(r'<link rel="canonical" href="([^"]+)"', s)
        if not can or not can.group(1).startswith(BASE):
            continue
        entries.append((p, can.group(1), lastmod(p)))


def sort_key(e):
    p = e[0]
    n = re.match(r'.*/(\d+)-', p)
    return (p.count('/'), p.split('/')[0], os.path.dirname(p), int(n.group(1)) if n else 0, p)


written = []
for fname, pred in SECTIONS:
    rows = sorted([e for e in entries if pred(e[0])], key=sort_key)
    if not rows:
        continue
    if fname == 'sitemap-pages.xml':  # homepage first
        rows.sort(key=lambda e: e[0] != 'index.html')
    body = ''.join(f'  <url><loc>{escape(u)}</loc><lastmod>{m}</lastmod></url>\n' for _, u, m in rows)
    open(fname, 'w', encoding='utf-8').write(
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + '</urlset>\n')
    written.append((fname, max(m for *_, m in rows), len(rows)))

idx = ''.join(f'  <sitemap><loc>{BASE}/{f}</loc><lastmod>{m}</lastmod></sitemap>\n' for f, m, _ in written)
open('sitemap.xml', 'w', encoding='utf-8').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + idx + '</sitemapindex>\n')

for f, m, n in written:
    print(f'{f:28s} {n:4d} urls  lastmod {m}')
print('total', sum(n for *_, n in written))
