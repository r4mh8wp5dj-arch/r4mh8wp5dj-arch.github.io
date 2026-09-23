(function () {
  var SKY = window.BP && window.BP.sky, rail = document.querySelector('.rail');
  if (!SKY || !rail) return;
  var mark = rail.querySelector('.rail-mark'), line = rail.querySelector('.rail-line');
  var stops = [].slice.call(rail.querySelectorAll('.rail-stop'));
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lineH = 0, docH = 1, active = -1, ticking = false;

  function measure() {
    lineH = line.offsetHeight;
    docH = Math.max(1, document.documentElement.scrollHeight);
    update();
  }

  var city = document.querySelector('.city');
  function update() {
    ticking = false;
    if (city) {
      var rr = rail.getBoundingClientRect();
      rail.classList.toggle('is-away', city.getBoundingClientRect().top < rr.bottom + 24);
    }
    var vh = window.innerHeight, u = SKY.pageU((window.scrollY + vh / 2) / docH);
    var k = 4 - Math.max(0, Math.min(4, Math.floor(u * 5)));
    var u0 = SKY.pageU((vh / 2) / docH), u1 = SKY.pageU((docH - vh / 2) / docH);
    var f = reduce ? k / 4 : Math.max(0, Math.min(1, (u0 - u) / Math.max(0.001, u0 - u1)));
    mark.style.transform = 'translate3d(0,' + (f * lineH).toFixed(1) + 'px,0)';
    rail.classList.toggle('on-light', SKY.lum(SKY.colorAt((window.scrollY + rail.getBoundingClientRect().top + rail.offsetHeight / 2) / docH)) > 0.26);
    if (k !== active) {
      active = k;
      stops.forEach(function (s, i) { s.classList.toggle('is-on', i === k); });
    }
  }

  var idleTimer = 0, hero = document.querySelector('.hero');
  function wake() {
    rail.classList.remove('is-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { rail.classList.add('is-idle'); }, 2500);
    if (hero) rail.classList.toggle('is-hero', window.scrollY < hero.offsetHeight * 0.6);
  }
  window.addEventListener('scroll', function () {
    wake();
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  wake();
  window.addEventListener('resize', function () { requestAnimationFrame(measure); });
  window.addEventListener('load', measure);
  measure();
})();
