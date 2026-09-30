/* Islamic World Pro — azkar, duas & tasbih. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP;
  var root = document.querySelector('main.az');
  if (!root) return;
  var CAT = root.dataset.cat, TITLE = root.dataset.title;
  var today = new Date().toISOString().slice(0, 10);
  var buzz = function (ms) { if (navigator.vibrate) navigator.vibrate(ms); };

  document.querySelectorAll('[data-filter]').forEach(function (inp) {
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase();
      document.querySelectorAll(inp.dataset.filter).forEach(function (el) { el.hidden = !!q && el.textContent.toLowerCase().indexOf(q) < 0; });
    });
  });

  /* ---------- tools on each dhikr ---------- */
  function saved() { return IWP.store.get('dsaved', []); }
  var list = Array.prototype.slice.call(document.querySelectorAll('.dhikr'));
  var savedKeys = saved().map(function (s) { return s.k; });
  list.forEach(function (d) {
    var t = d.querySelector('.tools');
    if (!t) return;
    t.innerHTML = (d.dataset.refs ? '<button type="button" data-d="play" aria-label="Listen"><svg><use href="#i-play"/></svg></button>' : '') +
      '<button type="button" data-d="save" aria-label="Save dua"' + (savedKeys.indexOf(d.dataset.key) >= 0 ? ' class="on"' : '') + '><svg><use href="#i-heart"/></svg></button>' +
      '<button type="button" data-d="copy" aria-label="Copy"><svg><use href="#i-copy"/></svg></button>' +
      '<button type="button" data-d="share" aria-label="Share"><svg><use href="#i-share"/></svg></button>';
  });
  function textOf(d) {
    var q = function (s) { var el = d.querySelector(s); return el ? el.textContent : ''; };
    return q('h3') + '\n\n' + q('.d-ar') + '\n' + q('.d-lit') + '\n\n' + q('.d-en') + '\n— ' + q('.d-src');
  }

  var player = new Audio(), playQueue = [], playBtn = null;
  player.addEventListener('ended', function () {
    if (playQueue.length) { player.src = playQueue.shift(); player.play(); }
    else setPlay(null);
  });
  function setPlay(btn) {
    if (playBtn) playBtn.querySelector('use').setAttribute('href', '#i-play');
    playBtn = btn;
    if (btn) btn.querySelector('use').setAttribute('href', '#i-pause');
  }
  function pad(n) { return ('00' + n).slice(-3); }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-d]');
    if (b) {
      var d = b.closest('.dhikr'), url = location.origin + location.pathname + '#' + d.id;
      var act = b.dataset.d;
      if (act === 'copy') IWP.copy(textOf(d) + '\n' + url, 'Copied');
      else if (act === 'share') IWP.share(d.querySelector('h3').textContent, textOf(d), url);
      else if (act === 'save') {
        var s = saved(), i = s.findIndex(function (x) { return x.k === d.dataset.key; });
        if (i >= 0) { s.splice(i, 1); b.classList.remove('on'); IWP.toast('Removed from saved'); }
        else { s.unshift({ k: d.dataset.key, url: location.pathname + '#' + d.id, title: d.querySelector('h3').textContent, ar: d.querySelector('.d-ar').textContent.slice(0, 120) }); b.classList.add('on'); IWP.toast('Saved'); }
        IWP.store.set('dsaved', s.slice(0, 300));
      } else if (act === 'play') {
        if (playBtn === b && !player.paused) { player.pause(); setPlay(null); return; }
        playQueue = d.dataset.refs.split(',').map(function (r) { var p = r.split(':'); return 'https://everyayah.com/data/Alafasy_128kbps/' + pad(p[0]) + pad(p[1]) + '.mp3'; });
        player.src = playQueue.shift();
        player.play().catch(function () { IWP.toast('Recitation could not load'); setPlay(null); });
        setPlay(b);
      }
      return;
    }
    b = ev.target.closest('button[data-view]');
    if (b) { setView(b.dataset.view); return; }
    b = ev.target.closest('[data-act="lit"]');
    if (b) {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', on);
      root.classList.toggle('hide-lit', !on);
      IWP.store.set('azlit', on);
      return;
    }
    b = ev.target.closest('[data-act="reset"]');
    if (b) { state = { date: today, i: 0, c: {} }; saveState(); renderDeck(); IWP.toast('Counts reset'); return; }
    b = ev.target.closest('#tagChips [data-tag]');
    if (b) {
      document.querySelectorAll('#tagChips [data-tag]').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
      list.forEach(function (d) { if (d.dataset.tag) d.hidden = b.dataset.tag !== 'All' && d.dataset.tag !== b.dataset.tag; });
      return;
    }
    b = ev.target.closest('[data-deck]');
    if (b) { move(b.dataset.deck === 'next' ? 1 : -1); return; }
  });

  if (IWP.store.get('azlit', true) === false) {
    root.classList.add('hide-lit');
    var lb = document.querySelector('[data-act="lit"]');
    if (lb) lb.setAttribute('aria-pressed', 'false');
  }

  /* ---------- card deck with tap counter ---------- */
  var deckCard = document.getElementById('deckCard');
  var state = IWP.store.get('azc:' + CAT, null);
  if (!state || state.date !== today) state = { date: today, i: 0, c: {} };
  function saveState() { IWP.store.set('azc:' + CAT, state); }
  function items() { return list.filter(function (d) { return !d.hidden && d.closest('#azList'); }); }

  function setView(v) {
    root.dataset.view = v;
    document.querySelectorAll('button[data-view]').forEach(function (x) { x.setAttribute('aria-pressed', x.dataset.view === v); });
    IWP.store.set('azview', v);
    if (v === 'cards') renderDeck();
  }

  function renderDeck() {
    if (!deckCard) return;
    var all = items();
    if (!all.length) return;
    state.i = Math.max(0, Math.min(all.length - 1, state.i));
    var d = all[state.i], target = +d.dataset.count || 1, n = state.c[d.dataset.key] || 0;
    var pick = function (s) { var el = d.querySelector(s); return el ? el.outerHTML : ''; };
    deckCard.innerHTML = '<div class="deck-top"><span>' + IWP.esc(d.querySelector('h3').textContent) + '</span><span>' + IWP.esc(TITLE) + '</span></div>' +
      pick('.d-ar') + pick('.d-lit') + pick('.d-en') + pick('.d-ur') +
      '<div class="ring' + (n >= target ? ' done' : '') + '" style="--p:' + Math.min(100, n / target * 100) + '"><div><b>' + n + '</b><small>of ' + target + '</small></div></div>' +
      '<p class="deck-hint">' + (n >= target ? 'Complete — tap for the next dhikr' : 'Tap anywhere on the card to count') + '</p>';
    document.getElementById('deckProg').textContent = (state.i + 1) + ' / ' + all.length;
    var done = all.filter(function (x) { return (state.c[x.dataset.key] || 0) >= (+x.dataset.count || 1); }).length;
    document.getElementById('deckBar').style.width = (done / all.length * 100) + '%';
  }
  function tap() {
    var all = items(), d = all[state.i];
    if (!d) return;
    var target = +d.dataset.count || 1, k = d.dataset.key, n = state.c[k] || 0;
    if (n >= target) { move(1); return; }
    state.c[k] = n + 1;
    buzz(12);
    saveState();
    renderDeck();
    if (n + 1 >= target) {
      buzz([30, 40, 30]);
      if (state.i < all.length - 1) setTimeout(function () { move(1); }, 450);
      else IWP.toast('All ' + all.length + ' complete. May Allah accept it.');
    }
  }
  function move(dir) {
    var all = items();
    state.i = Math.max(0, Math.min(all.length - 1, state.i + dir));
    saveState();
    renderDeck();
  }
  if (deckCard) {
    deckCard.addEventListener('click', function (ev) { if (!ev.target.closest('a,button')) tap(); });
    deckCard.addEventListener('keydown', function (ev) { if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); tap(); } });
    var sx = null;
    deckCard.addEventListener('touchstart', function (ev) { sx = ev.touches[0].clientX; }, { passive: true });
    deckCard.addEventListener('touchend', function (ev) {
      if (sx == null) return;
      var dx = ev.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 70) { ev.preventDefault(); move(dx < 0 ? 1 : -1); }
      sx = null;
    });
    document.addEventListener('keydown', function (ev) {
      if (root.dataset.view !== 'cards' || ev.target.closest('input,select,textarea')) return;
      if (ev.key === 'ArrowRight') move(1);
      if (ev.key === 'ArrowLeft') move(-1);
    });
    var v = new URLSearchParams(location.search).get('view') || IWP.store.get('azview', 'list');
    setView(v === 'cards' ? 'cards' : 'list');
  }

  /* ---------- saved duas (hub) ---------- */
  var savedBox = document.getElementById('savedDuas');
  if (savedBox) {
    var s = saved();
    if (s.length) {
      savedBox.innerHTML = '<h2 class="h2x">Saved duas</h2><div class="saved-list" style="margin-bottom:34px">' + s.slice(0, 10).map(function (x) {
        return '<a href="' + IWP.esc(x.url) + '"><strong>' + IWP.esc(x.title) + '</strong><div class="sv-ar" lang="ar">' + IWP.esc(x.ar) + '</div></a>';
      }).join('') + '</div>';
    }
  }

  /* ---------- tasbih ---------- */
  var tBtn = document.getElementById('tBtn');
  if (tBtn) {
    var ts = IWP.store.get('tasbih', {});
    if (ts.date !== today) { ts.today = 0; ts.date = today; }
    ts.count = ts.count || 0; ts.round = ts.round || 1; ts.preset = ts.preset || 0;
    var presets = Array.prototype.slice.call(document.querySelectorAll('#tPresets [data-t]'));
    document.addEventListener('iwp:lang', function () { paint(); });
    function paint() {
      var p = presets[ts.preset] || presets[0];
      presets.forEach(function (x, i) { x.setAttribute('aria-pressed', i === ts.preset); });
      document.getElementById('tAr').textContent = p.dataset.ar;
      document.getElementById('tTarget').textContent = p.dataset.t;
      document.getElementById('tRound').textContent = (window.IWPT || String)('Round ' + ts.round);
      document.getElementById('tToday').textContent = ts.today;
      tBtn.textContent = ts.count;
      var tgt = +p.dataset.t, of = document.getElementById('tOf');
      if (of) of.textContent = 'of ' + tgt;
      var prog = document.getElementById('tProg');
      if (prog) prog.style.strokeDashoffset = (578 * (1 - ts.count / tgt)).toFixed(1);
      IWP.store.set('tasbih', ts);
    }
    /* animated bead string: beads slide along an arc on each count */
    var beadBox = document.getElementById('tBeads'), BEADS = 11, beadEls = [];
    if (beadBox) for (var bi = 0; bi < BEADS; bi++) { var be = document.createElement('i'); beadBox.appendChild(be); beadEls.push(be); }
    var beadShift = 0;
    function placeBeads(anim) {
      var dial = beadBox.parentNode, R = dial.offsetWidth / 2 - 4;
      beadEls.forEach(function (be, k) {
        var a = (-150 + (k - beadShift) * 12) * Math.PI / 180;    // arc around the lower-left of the dial
        be.style.transition = anim ? 'transform .45s cubic-bezier(.34,1.56,.64,1)' : 'none';
        be.style.transform = 'translate(' + (Math.cos(a) * R).toFixed(1) + 'px,' + (Math.sin(a) * -R).toFixed(1) + 'px)';
      });
    }
    function slideBead() {
      beadShift = 1; placeBeads(true);
      setTimeout(function () { beadEls.push(beadEls.shift()); beadShift = 0; placeBeads(false); }, 460);
    }
    function pop() {
      tBtn.classList.remove('t-pop'); void tBtn.offsetWidth; tBtn.classList.add('t-pop');
      var r = document.createElement('span'); r.className = 't-ripple'; tBtn.parentNode.appendChild(r);
      setTimeout(function () { r.remove(); }, 700);
    }
    function burst() {
      var b = document.getElementById('tBurst'); if (!b) return;
      b.innerHTML = '';
      for (var q = 0; q < 14; q++) {
        var sp = document.createElement('i'), ang = q / 14 * 360;
        sp.style.setProperty('--a', ang + 'deg'); sp.style.setProperty('--d', (80 + Math.random() * 40) + 'px');
        b.appendChild(sp);
      }
      b.classList.remove('go'); void b.offsetWidth; b.classList.add('go');
      tBtn.parentNode.classList.add('t-done'); setTimeout(function () { tBtn.parentNode.classList.remove('t-done'); }, 1200);
    }
    placeBeads(false);
    window.addEventListener('resize', function () { placeBeads(false); }, { passive: true });
    tBtn.addEventListener('click', function () {
      var target = +presets[ts.preset].dataset.t;
      ts.count++; ts.today++;
      buzz(10); pop(); slideBead();
      if (ts.count >= target) {
        buzz([40, 50, 40]); IWP.toast('Set of ' + target + ' complete — round ' + ts.round + ' done');
        paint(); burst();
        setTimeout(function () { ts.count = 0; ts.round++; paint(); }, 650);
        return;
      }
      paint();
    });
    presets.forEach(function (b, i) { b.addEventListener('click', function () { ts.preset = i; ts.count = 0; ts.round = 1; paint(); }); });
    document.querySelector('[data-act="t-reset"]').addEventListener('click', function () { ts.count = 0; ts.round = 1; paint(); });
    paint();
  }
})();
