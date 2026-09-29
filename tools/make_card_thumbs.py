#!/usr/bin/env python3
"""Build 800x450 guide-card thumbnails from real app screenshots (landscape
screens are resized; portrait phone shots are set on an emerald backdrop)."""
import os
from PIL import Image, ImageFilter, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'assets/img'); OUT = os.path.join(IMG, 'cards')
W, H = 800, 450
MAP = {
    'best-islamic-app': 'screens/screen-01-app-overview.webp',
    'best-app-for-muslims': 'composite_06.webp',
    'best-quran-app': 'screens/screen-02-quran-companion.webp',
    'best-quran-memorization-app': 'hifz-uthmani-mushaf.webp',
    'best-prayer-times-app': 'screens/screen-07-prayer-qibla.webp',
    'islamic-app-without-ads': 'screens/screen-04-wallpapers-widgets.webp',
    'best-islamic-app-in-urdu': 'tarjuma-tafseer-urdu.webp',
    'how-to-calculate-zakat': 'screens/screen-06-zakat-jummah-mode.webp',
    'tahajjud-prayer-guide': 'marketing-daily.webp',
    '99-names-of-allah': 'marketing_08.webp',
    'how-to-pray-salah': 'composite_04.webp',
    'how-to-perform-wudu': 'composite_05.webp',
    'how-qibla-direction-is-calculated': 'gallery-prayer.webp',
}

def backdrop():
    bg = Image.new('RGB', (W, H), '#082a1d')
    d = ImageDraw.Draw(bg)
    for r in range(420, 0, -6):  # soft gold glow top-right
        a = int(38 * (1 - r / 420))
        d.ellipse((W - 160 - r, -120 - r, W - 160 + r, -120 + r), fill=(8 + a, 42 + a // 2, 29))
    return bg

def make(slug, src):
    im = Image.open(os.path.join(IMG, src)).convert('RGB')
    if im.width / im.height > 1.3:  # landscape screen: cover-crop to 16:9
        s = max(W / im.width, H / im.height)
        im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
        x = (im.width - W) // 2; y = (im.height - H) // 2
        out = im.crop((x, y, x + W, y + H))
    else:  # portrait: blurred fill + sharp phone in the middle
        out = backdrop()
        blur = im.resize((W, round(im.height * W / im.width))).filter(ImageFilter.GaussianBlur(28))
        blur = blur.crop((0, (blur.height - H) // 2, W, (blur.height - H) // 2 + H))
        out = Image.blend(out, blur, .35)
        ph = im.resize((round(im.width * (H - 40) / im.height), H - 40), Image.LANCZOS)
        sh = Image.new('RGBA', (ph.width + 40, ph.height + 40), (0, 0, 0, 0))
        ImageDraw.Draw(sh).rounded_rectangle((20, 26, ph.width + 20, ph.height + 26), 22, fill=(0, 0, 0, 150))
        sh = sh.filter(ImageFilter.GaussianBlur(12))
        px = (W - ph.width) // 2
        out.paste(sh, (px - 20, 20 - 20), sh)
        mask = Image.new('L', ph.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, *ph.size), 18, fill=255)
        out.paste(ph, (px, 20), mask)
    out.save(os.path.join(OUT, slug + '.webp'), 'WEBP', quality=78, method=6)

os.makedirs(OUT, exist_ok=True)
for k, v in MAP.items():
    make(k, v)
print('thumbs:', len(MAP))
