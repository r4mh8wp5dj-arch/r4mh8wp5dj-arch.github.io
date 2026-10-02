(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc a'));
  var heads = Array.prototype.slice.call(document.querySelectorAll('.prose h2[id]'));
  if (!links.length || !heads.length) return;
  var map = {}, queued = false, cur = null;
  links.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
  function mark() {
    queued = false;
    var doc = document.documentElement, line = window.innerHeight * 0.3, pick = heads[0];
    heads.forEach(function (h) { if (h.getBoundingClientRect().top <= line) pick = h; });
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) pick = heads[heads.length - 1];
    var a = map[pick.id];
    if (!a || a === cur) return;
    links.forEach(function (l) { l.classList.remove('here'); });
    a.classList.add('here');
    cur = a;
  }
  function ask() { if (!queued) { queued = true; requestAnimationFrame(mark); } }
  window.addEventListener('scroll', ask, { passive: true });
  window.addEventListener('resize', ask);
  mark();
})();
