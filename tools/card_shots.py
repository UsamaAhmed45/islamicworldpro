#!/usr/bin/env python3
"""Put a real app-screenshot thumbnail (assets/img/cards/<slug>.webp) on every
guide card that links to /blog/<slug>. Keeps the icon as a small gold badge.
Idempotent — run after build_articles.py."""
import html, os, re
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
have = {f[:-5] for f in os.listdir('assets/img/cards') if f.endswith('.webp')}
CARD = re.compile(r'(<a href="/blog/([a-z0-9-]+)" class="blog-card[^"]*"[^>]*>\s*)<div class="blog-card-img">(<svg.*?</svg>)</div>(\s*<div class="blog-card-body">\s*<span class="blog-card-tag">.*?</span>\s*<h3>(.*?)</h3>)', re.S)

def sub(m):
    slug = m.group(2)
    if slug not in have:
        return m.group(0)
    alt = html.unescape(m.group(5))
    return (f'{m.group(1)}<div class="blog-card-img has-shot"><img src="/assets/img/cards/{slug}.webp" width="800" height="450" '
            f'loading="lazy" decoding="async" alt="{html.escape(alt, quote=True)} — Islamic World Pro app screenshot">'
            f'<span class="bc-badge" aria-hidden="true">{m.group(3)}</span></div>{m.group(4)}')

n = 0
for d, dirs, fs in os.walk('.'):
    dirs[:] = [x for x in dirs if not x.startswith('.') and x != 'assets']
    for f in fs:
        if f.endswith('.html'):
            p = os.path.join(d, f); s = open(p, encoding='utf-8').read()
            t = CARD.sub(sub, s)
            if t != s:
                open(p, 'w', encoding='utf-8').write(t); n += 1
print('pages with screenshot cards:', n)
