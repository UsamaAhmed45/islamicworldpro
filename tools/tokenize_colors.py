#!/usr/bin/env python3
"""One-off: replace hard-coded brand greens / light surfaces in the CSS with
theme tokens so assets/css/themes.css can re-colour the whole site."""
import re, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = ['assets/css/style.css', 'assets/css/islamic.css', 'assets/css/polish.css', 'assets/css/names.css']
HEX = {
  '#051a11': 'var(--t-xd)', '#051b12': 'var(--t-xd)', '#06200f': 'var(--t-xd)', '#07241a': 'var(--t-xd)',
  '#082a1d': 'var(--t-dk)', '#0a3121': 'var(--t-dk)', '#0b3524': 'var(--t-dk)', '#0c3524': 'var(--t-dk)', '#0b2a1d': 'var(--t-dk)',
  '#0f3d29': 'var(--t-md)', '#0c3a27': 'var(--t-md)', '#15573a': 'var(--t-lt)', '#062417': 'var(--t-xd)',
}
RGB_DK = ['8,42,29', '10,44,31', '7,22,15', '5,32,23', '4,26,19', '4,20,12', '4,18,11', '3,14,9', '6,20,13', '5,27,18', '12,36,26']
RGB = {k: 'var(--t-dk-rgb)' for k in RGB_DK}
RGB.update({'22,71,45': 'var(--t-md-rgb)', '31,138,91': 'var(--t-acc-rgb)', '63,174,114': 'var(--t-acc-rgb)',
            '243,234,210': 'var(--c-on-dk-rgb)', '250,243,223': 'var(--c-on-dk2-rgb)'})
SURF = {'#fff': 'var(--s-card)', '#ffffff': 'var(--s-card)', '#fffdf6': 'var(--s-card2)', '#fffdf7': 'var(--s-card2)',
        '#fdfaf1': 'var(--s-card2)', '#f6eed8': 'var(--s-card3)', '#f7f0dd': 'var(--s-card3)'}
def rgba(m):
    key = re.sub(r'\s', '', m.group(1))
    return 'rgba(' + RGB[key] + ',' + m.group(2) + ')' if key in RGB else m.group(0)
def surf(m):
    decl = m.group(0)
    return re.sub(r'#(?:ffffff|fff|fffdf6|fffdf7|fdfaf1|f6eed8|f7f0dd)\b', lambda x: SURF[x.group(0).lower()], decl, flags=re.I)
n = 0
for f in FILES:
    p = os.path.join(ROOT, f); s = open(p).read(); o = s
    out = []
    for line in s.split('\n'):
        if re.match(r'\s*--(t-|c-on|s-card)', line):   # never rewrite the token definitions themselves
            out.append(line); continue
        line = re.sub(r'rgba\(\s*(\d+\s*,\s*\d+\s*,\s*\d+)\s*,\s*([^)]+)\)', rgba, line)
        for h, v in HEX.items():
            line = re.sub(re.escape(h) + r'\b', v, line, flags=re.I)
        line = re.sub(r'background(?:-color)?\s*:[^;}]*', surf, line)
        out.append(line)
    s = '\n'.join(out)
    if s != o: open(p, 'w').write(s); n += 1
print('files tokenised:', n)
