#!/usr/bin/env python3
"""Ping Bing / Yandex / Seznam / Naver (IndexNow) with every URL in the sitemaps.
Run AFTER deploying:   python3 tools/indexnow.py            (all URLs)
                       python3 tools/indexnow.py --changed  (only URLs whose lastmod is today)
The key file <KEY>.txt must be live at https://islamicworldpro.com/<KEY>.txt
"""
import datetime, glob, json, os, re, sys, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
HOST = 'islamicworldpro.com'
KEY = next(f[:-4] for f in os.listdir('.') if re.fullmatch(r'[0-9a-f]{32}\.txt', f))
today = datetime.date.today().isoformat()
urls = []
for sm in sorted(glob.glob('sitemap-*.xml')):
    for loc, mod in re.findall(r'<loc>(.*?)</loc><lastmod>(.*?)</lastmod>', open(sm).read()):
        if '--changed' not in sys.argv or mod == today:
            urls.append(loc)
print(len(urls), 'URLs')
for i in range(0, len(urls), 10000):
    body = json.dumps({'host': HOST, 'key': KEY, 'keyLocation': f'https://{HOST}/{KEY}.txt', 'urlList': urls[i:i + 10000]}).encode()
    req = urllib.request.Request('https://api.indexnow.org/indexnow', data=body, headers={'Content-Type': 'application/json; charset=utf-8'})
    with urllib.request.urlopen(req, timeout=30) as r:
        print('IndexNow response:', r.status)
