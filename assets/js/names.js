/* Islamic World Pro — Asma-ul-Husna & Asma-un-Nabi. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP;
  var grids = { husna: document.getElementById('gridHusna'), nabi: document.getElementById('gridNabi') };
  if (!grids.husna) return;
  var set = 'husna', idx = 0;
  var dlg = document.getElementById('nmDialog');
  var search = document.getElementById('nmSearch');

  function cards(s) { return Array.prototype.slice.call(grids[s || set].querySelectorAll('.nm-card')); }
  function field(card, cls) { var el = card.querySelector(cls); return el ? el.textContent : ''; }

  function showSet(s) {
    set = s;
    grids.husna.hidden = s !== 'husna';
    grids.nabi.hidden = s !== 'nabi';
    document.querySelectorAll('[data-tabset]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tabset === s); });
    document.getElementById('nmHeading').textContent = s === 'husna' ? 'Asma-ul-Husna — the 99 names' : 'Names and titles of the Prophet Muhammad ﷺ';
    document.getElementById('nmMedal').textContent = s === 'husna' ? 'ٱللَّه' : 'مُحَمَّد ﷺ';
    document.getElementById('quiz').hidden = true;
    search.value = '';
    filter();
    history.replaceState(null, '', s === 'nabi' ? '#asma-un-nabi' : location.pathname);
  }

  function filter() {
    var q = search.value.trim().toLowerCase();
    cards().forEach(function (c) { c.parentNode.hidden = !!q && c.dataset.q.indexOf(q) < 0 && c.querySelector('.nm-ar').textContent.indexOf(q) < 0; });
  }
  search.addEventListener('input', filter);

  function open(i) {
    var list = cards();
    idx = (i + list.length) % list.length;
    var c = list[idx];
    document.getElementById('ndAr').textContent = field(c, '.nm-ar');
    document.getElementById('ndT').textContent = field(c, 'strong');
    document.getElementById('ndEn').textContent = field(c, '.nm-en');
    document.getElementById('ndUr').textContent = field(c, '.nm-ur');
    document.getElementById('ndSrc').textContent = field(c, '.nm-src');
    document.getElementById('ndN').textContent = (idx + 1) + ' / ' + list.length;
    if (!dlg.open) { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
  }

  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tabset]');
    if (b) { showSet(b.dataset.tabset); return; }
    b = ev.target.closest('.nm-card');
    if (b) { open(+b.dataset.i); return; }
    b = ev.target.closest('[data-act]');
    if (!b) { if (ev.target === dlg) dlg.close(); return; }
    if (b.dataset.act === 'close') dlg.close();
    if (b.dataset.act === 'nd-prev') open(idx - 1);
    if (b.dataset.act === 'nd-next') open(idx + 1);
    if (b.dataset.act === 'quiz') startQuiz();
  });
  dlg.addEventListener('keydown', function (ev) {
    if (ev.key === 'ArrowRight') open(idx + 1);
    if (ev.key === 'ArrowLeft') open(idx - 1);
  });

  /* practise: pick the meaning */
  var quiz = document.getElementById('quiz'), score = 0, asked = 0;
  function startQuiz() { score = 0; asked = 0; quiz.hidden = false; next(); quiz.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  function next() {
    var list = cards(), pick = list[Math.floor(Math.random() * list.length)];
    var opts = [pick];
    while (opts.length < 4) {
      var o = list[Math.floor(Math.random() * list.length)];
      if (opts.indexOf(o) < 0) opts.push(o);
    }
    opts.sort(function () { return Math.random() - .5; });
    var best = IWP.store.get('nmbest:' + set, 0);
    quiz.innerHTML = '<div class="deck-top"><span>Question ' + (asked + 1) + ' of 10 · score ' + score + '</span><span>Best ' + best + '/10 · <button type="button" class="icon-btn" data-q="close" aria-label="Close practise" style="width:28px;height:28px">✕</button></span></div>' +
      '<p class="quiz-q" lang="ar">' + IWP.esc(field(pick, '.nm-ar')) + '</p><div class="quiz-opts">' +
      opts.map(function (o) { return '<button type="button" data-ok="' + (o === pick) + '">' + IWP.esc(field(o, 'strong') + ' — ' + field(o, '.nm-en')) + '</button>'; }).join('') + '</div>';
  }
  quiz.addEventListener('click', function (ev) {
    if (ev.target.closest('[data-q="close"]')) { quiz.hidden = true; return; }
    var b = ev.target.closest('[data-ok]');
    if (!b || quiz.dataset.lock) return;
    quiz.dataset.lock = '1';
    var ok = b.dataset.ok === 'true';
    if (ok) score++;
    b.classList.add(ok ? 'right' : 'wrong');
    if (!ok) quiz.querySelector('[data-ok="true"]').classList.add('right');
    asked++;
    setTimeout(function () {
      delete quiz.dataset.lock;
      if (asked < 10) { next(); return; }
      var key = 'nmbest:' + set, best = Math.max(score, IWP.store.get(key, 0));
      IWP.store.set(key, best);
      quiz.innerHTML = '<p class="quiz-q" style="font-family:var(--font-display);font-size:1.6rem">' + score + ' / 10</p><p style="text-align:center">Best so far: ' + best + ' / 10</p><div class="quiz-opts"><button type="button" data-again>Practise again</button><button type="button" data-q="close">Done</button></div>';
      quiz.querySelector('[data-again]').onclick = startQuiz;
    }, ok ? 650 : 1400);
  });

  if (location.hash === '#asma-un-nabi') showSet('nabi');

  /* full recitation of the 99 names */
  var playBtn = document.getElementById('nmPlayAll');
  if (playBtn) {
    var recitation = null;
    playBtn.addEventListener('click', function () {
      if (!recitation) recitation = new Audio('/assets/audio/asma-ul-husna-full.mp3');
      if (!recitation.paused) { recitation.pause(); playBtn.textContent = '▶ Play all 99 names'; return; }
      recitation.play().catch(function () { IWP.toast('Could not play the recitation'); });
      playBtn.textContent = '⏸ Pause recitation';
      recitation.onended = function () { playBtn.textContent = '▶ Play all 99 names'; };
      recitation.onpause = function () { if (recitation.currentTime > 0 && !recitation.ended) playBtn.textContent = '▶ Resume recitation'; };
    });
  }
})();
