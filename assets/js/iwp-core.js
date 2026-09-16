/* Islamic World Pro — shared helpers. © 2026 Aurevia Solution. All rights reserved. */
(function () {
  'use strict';
  var IWP = window.IWP = window.IWP || {};

  IWP.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem('iwp:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set: function (k, v) {
      try { localStorage.setItem('iwp:' + k, JSON.stringify(v)); return true; } catch (e) { return false; }
    }
  };

  IWP.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  var toastTimer;
  IWP.toast = function (msg) {
    var t = document.getElementById('toast');
    if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  };

  IWP.copy = function (text, done) {
    var ok = function () { IWP.toast(done || 'Copied'); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); ok(); } catch (e) { IWP.toast('Select the text to copy it'); }
      ta.remove();
    }
  };

  IWP.share = function (title, text, url) {
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function () {});
    } else {
      IWP.copy(text + '\n' + url, 'Copied with link');
    }
  };

  IWP.fetchJSON = function (url, opts) {
    return fetch(url, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  };

  // Keep sticky toolbars flush under the (variable height) site header.
  function setHeaderHeight() {
    var h = document.querySelector('.site-header');
    if (h) document.documentElement.style.setProperty('--hdr-h', h.offsetHeight + 'px');
  }
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setHeaderHeight);

  // Reader colour theme is shared by every reading page.
  var theme = IWP.store.get('rtheme', null);
  if (theme) document.documentElement.setAttribute('data-rtheme', theme);

  // Offline cache for pages you have visited (see /sw.js).
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }

  // Desktop / mobile install (Windows, macOS, ChromeOS, Android).
  var deferred = null;
  window.addEventListener('beforeinstallprompt', function (ev) {
    ev.preventDefault();
    deferred = ev;
    document.querySelectorAll('[data-install]').forEach(function (b) { b.hidden = false; });
  });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-install]');
    if (!b) return;
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.finally(function () { deferred = null; });
    } else {
      IWP.toast(/Mac/.test(navigator.platform) ? 'In Safari choose File › Add to Dock' : 'Use “Install app” in your browser menu');
    }
  });
})();
