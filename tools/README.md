# SEO build tools

Run from the site root after editing pages:

    node tools/city-data.js > /tmp/cities.json      # prayer-time city facts
    python3 tools/seo_build.py /tmp/cities.json     # titles, descriptions, city content, polish assets
    python3 tools/build_sitemap.py                  # sitemap index + section sitemaps

After deploying to Vercel:

    python3 tools/indexnow.py --changed             # ping Bing/Yandex with changed URLs
