#!/usr/bin/env python3
"""Generate the 'best app' articles from tools/articles_content.py, using an
existing guide page as the layout template, then wire them into /blog and /about.
Idempotent — safe to re-run after editing the content file."""
import html, json, os, re, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT); sys.path.insert(0, 'tools')
from articles_content import ARTICLES, PLAY

BASE = 'https://islamicworldpro.com'
DATE = '2026-09-29'
TPL = open('blog/how-to-pray-salah.html', encoding='utf-8').read()
e = lambda s: html.escape(s, quote=True)

head_end = TPL.index('<section class="cv-auto section-light" style="padding-top:52px;">')
foot_start = TPL.index('<footer class="site-footer">')
HEAD, FOOT = TPL[:head_end], TPL[foot_start:]


def card(a, cls='blog-card reveal'):
    short = a['desc'] if len(a['desc']) < 150 else a['desc'][:147].rsplit(' ', 1)[0] + '…'
    return (f'<a href="/blog/{a["slug"]}" class="{cls}" data-iwp-article>\n'
            f'        <div class="blog-card-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">{a["icon"]}</svg></div>\n'
            f'        <div class="blog-card-body">\n          <span class="blog-card-tag">{e(a["tag"])}</span>\n'
            f'          <h3>{e(a["title"])}</h3>\n          <p>{e(short)}</p>\n        </div>\n      </a>')


def page(a):
    url = f'{BASE}/blog/{a["slug"]}'
    h = HEAD
    h = re.sub(r'<title>.*?</title>', f'<title>{e(a["seo_title"])}</title>', h)
    for attr, key, val in [('name', 'description', a['desc']), ('name', 'keywords', a['keywords']),
                           ('property', 'og:url', url), ('property', 'og:title', a['seo_title']),
                           ('property', 'og:description', a['desc']), ('name', 'twitter:title', a['seo_title']),
                           ('name', 'twitter:description', a['desc'])]:
        h = re.sub(r'(<meta %s="%s" content=")[^"]*(">)' % (attr, re.escape(key)), lambda m: m.group(1) + e(val) + m.group(2), h)
    h = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{url}">', h)
    h = h.replace('<meta property="og:type" content="article">',
                  f'<meta property="og:type" content="article">\n<meta property="article:published_time" content="{DATE}">\n<meta property="article:modified_time" content="{DATE}">')
    h = re.sub(r'<script type="application/ld\+json".*?</script>\s*', '', h, flags=re.S)
    ld = [
        {"@context": "https://schema.org", "@type": "Article", "headline": a['title'], "description": a['desc'],
         "datePublished": DATE, "dateModified": DATE, "inLanguage": "en",
         "author": {"@type": "Organization", "name": "Aurevia Solution", "url": f"{BASE}/about"},
         "publisher": {"@type": "Organization", "name": "Islamic World Pro",
                       "logo": {"@type": "ImageObject", "url": f"{BASE}/assets/img/brand/logo-512.png"}},
         "image": f"{BASE}/assets/img/video-poster.webp", "mainEntityOfPage": url,
         "about": {"@type": "MobileApplication", "name": "Islamic World Pro", "operatingSystem": "Android",
                   "applicationCategory": "LifestyleApplication", "installUrl": PLAY,
                   "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}}},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Home", "item": f"{BASE}/"},
            {"@type": "ListItem", "position": 2, "name": "Guides", "item": f"{BASE}/blog"},
            {"@type": "ListItem", "position": 3, "name": a['title'], "item": url}]},
        {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
            {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": ans}} for q, ans in a['faq']]},
    ]
    h = h.replace('</head>', ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>\n' for x in ld) + '</head>')

    related = [x for x in ARTICLES if x['slug'] != a['slug']][:3]
    rel_html = ''.join(card(x, 'blog-card') for x in related)
    faq_items = ''.join(f'''      <div class="accordion-item{' open' if i == 0 else ''}">
        <button class="accordion-q"><span>{e(q)}</span><span class="plus">+</span></button>
        <div class="accordion-a"><div class="accordion-a-inner">{e(ans)}</div></div>
      </div>
''' for i, (q, ans) in enumerate(a['faq']))
    body = f'''<section class="cv-auto section-light" style="padding-top:52px;">
  <div class="container article-shell">
    <nav class="crumbs crumbs-light" aria-label="Breadcrumb" style="margin-bottom:18px;"><a href="/">Home</a><span class="sep">/</span><a href="/blog">Guides</a><span class="sep">/</span><span aria-current="page">{e(a["tag"])}</span></nav>
    <span class="eyebrow">{e(a["tag"])}</span>
    <h1 style="margin-top:14px;">{e(a["title"])}</h1>
    <div class="article-meta"><span>Islamic World Pro</span><span>·</span><span>Aurevia Solution</span><span>·</span><time datetime="{DATE}">29 September 2026</time><span>·</span><span>{a["minutes"]} min read</span></div>
    <div class="article-body" style="margin-top:30px;">
      <p class="article-lead">{e(a["lead"])}</p>
{a["body"].strip()}
      <div class="article-cta">
        <h3 style="color:var(--gold-300);margin-top:0;">Try Islamic World Pro — free, no ads</h3>
        <p>Qur'an with Tajweed and tafseer, prayer times with Adhan, Qibla, Hadith, Azkar, Hifz Mode and more — all in one offline app.</p>
        <a href="{PLAY}" class="btn btn-gold" target="_blank" rel="noopener">Get it on Google Play</a>
      </div>
    </div>
  </div>
</section>
<section class="cv-auto section-light" id="faq">
  <div class="container">
    <div class="section-head">
      <h2>Frequently asked questions</h2>
    </div>
    <div class="accordion">
{faq_items}    </div>
  </div>
</section>
<section class="cv-auto section-panel">
  <div class="container">
    <div class="section-head"><span class="eyebrow" style="justify-content:center;">Keep reading</span><h2>Related guides</h2></div>
    <div class="blog-grid">{rel_html}</div>
  </div>
</section>
'''
    return h + body + FOOT


def section_html(cls):
    return ''.join(card(a, cls) for a in ARTICLES)


def main():
    for a in ARTICLES:
        open(f'blog/{a["slug"]}.html', 'w', encoding='utf-8').write(page(a))

    # /blog hub: an "App guides" block above the existing guides
    s = open('blog.html', encoding='utf-8').read()
    s = re.sub(r'<!-- iwp:app-guides -->.*?<!-- /iwp:app-guides -->\n?', '', s, flags=re.S)
    block = f'''<!-- iwp:app-guides -->
<section class="section-light" style="padding-bottom:0;">
  <div class="container">
    <div class="section-head"><span class="eyebrow" style="justify-content:center;">Choosing an app</span><h2>Guides to the best Islamic apps</h2>
      <p>What to look for in a Qur'an, prayer-times, Hifz or all-in-one Muslim app — with honest checklists you can use for any app.</p></div>
    <div class="blog-grid">{section_html('blog-card reveal')}</div>
  </div>
</section>
<!-- /iwp:app-guides -->
'''
    anchor = '<section class="cv-auto section-light">\n  <div class="container">\n    <div class="blog-grid">'
    assert anchor in s, 'blog grid anchor missing'
    s = s.replace(anchor, block + anchor, 1)
    # CollectionPage hasPart
    def add_parts(m):
        j = json.loads(m.group(1))
        if j.get('@type') == 'CollectionPage':
            parts = [p for p in j.get('hasPart', []) if not any(p.get('url', '').endswith('/' + a['slug']) for a in ARTICLES)]
            j['hasPart'] = [{"@type": "Article", "headline": a['title'], "url": f"{BASE}/blog/{a['slug']}"} for a in ARTICLES] + parts
            return '<script type="application/ld+json">' + json.dumps(j, ensure_ascii=False) + '</script>'
        return m.group(0)
    s = re.sub(r'<script type="application/ld\+json">(.*?)</script>', add_parts, s, flags=re.S)
    open('blog.html', 'w', encoding='utf-8').write(s)

    # /about: articles section before "Follow Islamic World Pro"
    s = open('about.html', encoding='utf-8').read()
    s = re.sub(r'<!-- iwp:about-articles -->.*?<!-- /iwp:about-articles -->\n?', '', s, flags=re.S)
    block = f'''<!-- iwp:about-articles -->
<section class="cv-auto section-light" id="articles">
  <div class="container">
    <div class="section-head">
      <span class="eyebrow" style="justify-content:center;">Articles &amp; guides</span>
      <h2>Why Muslims choose Islamic World Pro</h2>
      <p>In-depth articles on what makes the best Islamic app — and how we built Islamic World Pro to meet that standard, free and without ads.</p>
    </div>
    <div class="blog-grid">{section_html('blog-card reveal')}</div>
    <p style="text-align:center;margin-top:30px;"><a href="/blog" class="btn btn-line-dark">All Islamic guides →</a></p>
  </div>
</section>
<!-- /iwp:about-articles -->
'''
    j = s.index('Follow Islamic World Pro')
    k = s.rfind('<section', 0, j)
    s = s[:k] + block + s[k:]
    open('about.html', 'w', encoding='utf-8').write(s)
    print('articles:', len(ARTICLES))


if __name__ == '__main__':
    main()
