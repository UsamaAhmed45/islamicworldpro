/* Islamic World Pro — hadith library. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP;
  var root = document.querySelector('main.hd');
  if (!root) return;
  var main = document.getElementById('hdMain');
  var SHORT = root.dataset.short, TITLE = root.dataset.title;

  /* generic in-page filter */
  document.querySelectorAll('[data-filter]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      document.querySelectorAll(inp.dataset.filter).forEach(function (el) {
        el.hidden = !!q && el.textContent.toLowerCase().indexOf(q) < 0;
      });
    });
  });

  function saved() { return IWP.store.get('hsaved', []); }
  function keyOf(card) { return root.dataset.book + ':' + card.dataset.n; }

  var TOOLS = '<button type="button" data-h="save" aria-label="Save hadith"><svg><use href="#i-heart"/></svg></button>' +
    '<button type="button" data-h="copy" aria-label="Copy hadith"><svg><use href="#i-copy"/></svg></button>' +
    '<button type="button" data-h="share" aria-label="Share hadith"><svg><use href="#i-share"/></svg></button>';
  function decorate(scope) {
    var keys = saved().map(function (s) { return s.k; });
    scope.querySelectorAll('.hcard .tools:empty').forEach(function (t) {
      t.innerHTML = TOOLS;
      var card = t.closest('.hcard');
      if (keys.indexOf(keyOf(card)) >= 0) t.querySelector('[data-h="save"]').classList.add('on');
    });
  }
  if (main) decorate(main);

  function cardText(card) {
    var ar = card.querySelector('.h-ar'), n = card.querySelector('.h-narr'), en = card.querySelector('.h-en');
    return (ar ? ar.textContent + '\n\n' : '') + (n ? n.textContent + ' ' : '') + (en ? en.textContent : '') + '\n— ' + TITLE + ' ' + card.dataset.n;
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('button[data-show]');
    if (b && main) {
      main.dataset.show = b.dataset.show;
      document.querySelectorAll('button[data-show]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      IWP.store.set('hshow', b.dataset.show);
      return;
    }
    b = ev.target.closest('[data-act="hd-rail"]');
    if (b) { document.getElementById('hdRail').classList.toggle('open'); return; }
    b = ev.target.closest('[data-h]');
    if (b) {
      var card = b.closest('.hcard'), url = location.origin + location.pathname + '#h' + card.dataset.n;
      if (b.dataset.h === 'copy') IWP.copy(cardText(card) + '\n' + url, 'Hadith copied');
      if (b.dataset.h === 'share') IWP.share(TITLE + ' ' + card.dataset.n, cardText(card), url);
      if (b.dataset.h === 'save') {
        var list = saved(), k = keyOf(card), i = list.findIndex(function (s) { return s.k === k; });
        if (i >= 0) { list.splice(i, 1); b.classList.remove('on'); IWP.toast('Removed from saved'); }
        else {
          var en = card.querySelector('.h-en');
          list.unshift({ k: k, url: location.pathname + '#h' + card.dataset.n, title: TITLE + ' ' + card.dataset.n, text: en ? en.textContent.slice(0, 180) : '' });
          b.classList.add('on'); IWP.toast('Saved');
        }
        IWP.store.set('hsaved', list.slice(0, 300));
      }
      return;
    }
    b = ev.target.closest('#loadMore button');
    if (b) loadAll(b);
  });

  var pref = IWP.store.get('hshow', null);
  if (pref && main) { var pb = document.querySelector('button[data-show="' + pref + '"]'); if (pb) pb.click(); }

  function clean(s) { return String(s || '').replace(/[\u200e\u200f]/g, '').replace(/\s*\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim(); }

  function loadAll(btn) {
    btn.disabled = true;
    btn.textContent = 'Loading…';
    var cards = main.querySelectorAll('.hcard');
    var lastN = +cards[cards.length - 1].dataset.n;
    IWP.fetchJSON(btn.dataset.src).then(function (j) {
      var html = (j.hadiths || []).filter(function (h) { return h.idInBook > lastN; }).map(function (h) {
        var en = h.english || {};
        return '<article class="hcard" id="h' + h.idInBook + '" data-n="' + h.idInBook + '"><div class="hcard-top"><a class="hnum" href="#h' + h.idInBook + '">' + IWP.esc(SHORT + ' ' + h.idInBook) + '</a><div class="tools"></div></div>' +
          '<p class="h-ar" lang="ar" dir="rtl">' + IWP.esc(clean(h.arabic)) + '</p>' +
          (en.narrator ? '<p class="h-narr">' + IWP.esc(clean(en.narrator)) + '</p>' : '') +
          '<p class="h-en">' + IWP.esc(clean(en.text)) + '</p></article>';
      }).join('');
      var wrap = document.getElementById('loadMore');
      wrap.insertAdjacentHTML('beforebegin', html);
      wrap.remove();
      decorate(main);
      if (/^#h\d+$/.test(location.hash)) { var t = document.querySelector(location.hash); if (t) t.scrollIntoView(); }
    }).catch(function () {
      btn.disabled = false;
      btn.textContent = 'Could not load. Tap to try again';
    });
  }
  if (/^#h\d+$/.test(location.hash) && !document.querySelector(location.hash)) {
    var lm = document.querySelector('#loadMore button');
    if (lm) loadAll(lm);
  }

  /* hub: saved list + lookup by number */
  var savedBox = document.getElementById('savedHadith');
  if (savedBox) {
    var list = saved();
    if (list.length) {
      savedBox.innerHTML = '<h2 class="h2x">Saved hadith</h2><div class="saved-list" style="margin-bottom:40px">' + list.slice(0, 12).map(function (s) {
        return '<a href="' + IWP.esc(s.url) + '"><strong>' + IWP.esc(s.title) + '</strong><br><small>' + IWP.esc(s.text) + '…</small></a>';
      }).join('') + '</div>';
    }
  }
  var form = document.getElementById('lookupForm');
  if (form) {
    var out = document.getElementById('lookupOut');
    var BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/';
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var book = form.book.value, num = parseInt(form.num.value, 10), lang = form.lang.value;
      var name = form.book.options[form.book.selectedIndex].text;
      out.innerHTML = '<p class="empty">Loading ' + IWP.esc(name) + ' ' + num + '…</p>';
      Promise.all([
        IWP.fetchJSON(BASE + lang + '-' + book + '/' + num + '.json'),
        IWP.fetchJSON(BASE + 'ara-' + book + '/' + num + '.json').catch(function () { return null; })
      ]).then(function (r) {
        var h = r[0].hadiths && r[0].hadiths[0], a = r[1] && r[1].hadiths && r[1].hadiths[0];
        if (!h || !h.text || !h.text.trim()) {
          out.innerHTML = '<p class="empty">' + IWP.esc(name) + ' ' + num + ' has no translated text in this edition (it is a chapter heading or chain only). Try the next number.</p>';
          return;
        }
        var ur = lang === 'urd';
        out.innerHTML = '<article class="hcard" style="margin:0"><div class="hcard-top"><span class="hnum">' + IWP.esc(name) + ' ' + h.hadithnumber + '</span></div>' +
          (a ? '<p class="h-ar" lang="ar" dir="rtl">' + IWP.esc(a.text) + '</p>' : '') +
          '<p class="' + (ur ? 'h-ur' : 'h-en') + '"' + (ur ? ' lang="ur" dir="rtl"' : '') + '>' + IWP.esc(h.text) + '</p>' +
          (h.grades && h.grades.length ? '<p class="h-grade">Grading: ' + h.grades.map(function (g) { return IWP.esc(g.name + ' — ' + g.grade); }).join(' · ') + '</p>' : '') +
          '</article>';
      }).catch(function () {
        out.innerHTML = '<p class="empty">' + IWP.esc(name) + ' ' + num + ' was not found, or you are offline. Check the number and try again.</p>';
      });
    });
  }
})();
