(function () {
  var KEY = 'bpLang';
  var root = document.documentElement, cur = root.getAttribute('lang') || 'en';
  var alts = {}, defHref = '', canon = document.querySelector('link[rel="canonical"]');
  Array.prototype.forEach.call(document.querySelectorAll('link[rel="alternate"][hreflang]'), function (l) {
    var code = l.getAttribute('hreflang');
    if (code === 'x-default') defHref = l.href; else alts[code] = l.href;
  });
  var def = 'en';
  Object.keys(alts).forEach(function (c) { if (alts[c] === defHref) def = c; });

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  function rel(from, to) {
    var f = from.split('/'), t = to.split('/');
    f.pop();
    var n = 0;
    while (n < f.length && n < t.length - 1 && f[n] === t[n]) n++;
    return '../'.repeat(f.length - n) + t.slice(n).join('/') || './';
  }

  function go(code) {
    if (!canon || !alts[code] || code === cur) return;
    var from = new URL(canon.href).pathname, to = new URL(alts[code]).pathname;
    location.replace(new URL(rel(from, to), location.href).href + location.hash);
  }

  var saved = read(), want = saved;
  if (!want && cur === def) {
    var prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < prefs.length && !want; i++) {
      var code = String(prefs[i]).toLowerCase().split('-')[0];
      if (alts[code]) want = code;
    }
  }
  if (want && want !== cur && alts[want]) { go(want); return; }

  document.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[data-lang]') : null;
    if (a) { write(a.getAttribute('data-lang')); return; }
    Array.prototype.forEach.call(document.querySelectorAll('.lang details[open]'), function (d) { if (!d.contains(e.target)) d.removeAttribute('open'); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    Array.prototype.forEach.call(document.querySelectorAll('.lang details[open]'), function (d) { d.removeAttribute('open'); var s = d.querySelector('summary'); if (s) s.focus(); });
  });
  window.addEventListener('scroll', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.lang details[open]'), function (d) { d.removeAttribute('open'); });
  }, { passive: true });
})();
