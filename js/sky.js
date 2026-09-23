(function () {
  var STOPS = [
    [0.00, '#000000'], [0.07, '#0A1A3D'], [0.15, '#1A0D33'],
    [0.23, '#120F2E'], [0.31, '#331F4D'], [0.39, '#573361'],
    [0.45, '#47296B'], [0.53, '#D9616B'], [0.61, '#FA944D'],
    [0.68, '#E8B77A'], [0.76, '#8FB8DC'], [0.84, '#6FA0D4'],
    [0.9, '#A8BCC4'], [0.96, '#7E9C58'], [1.00, '#4E6B30']
  ];
  var SKIES = [[0, 'Deep Space'], [0.2, 'Twilight'], [0.42, 'Sunset'], [0.64, 'Cumulus'], [0.82, 'Dawn']];

  var root = document.documentElement;
  var range = (root.getAttribute('data-sky') || '0 1').split(' ').map(Number);
  var R0 = range[0], R1 = range[1];

  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  var PTS = STOPS.map(function (s) { return [s[0], rgb(s[1])]; });

  function colorAt(t) {
    t = R0 + (R1 - R0) * Math.max(0, Math.min(1, t));
    for (var i = 1; i < PTS.length; i++) {
      if (t <= PTS[i][0]) {
        var a = PTS[i - 1], b = PTS[i], f = (t - a[0]) / (b[0] - a[0] || 1);
        return [0, 1, 2].map(function (k) { return a[1][k] + (b[1][k] - a[1][k]) * f; });
      }
    }
    return PTS[PTS.length - 1][1];
  }
  function lum(c) {
    var l = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }

  var grad = [];
  for (var i = 0; i <= 40; i++) {
    var c = colorAt(i / 40);
    grad.push('rgb(' + c.map(Math.round).join(',') + ') ' + (i * 2.5) + '%');
  }
  root.style.background = 'linear-gradient(to bottom,' + grad.join(',') + ')';

  window.BP = window.BP || {};
  window.BP.sky = { colorAt: colorAt, lum: lum };

  document.addEventListener('DOMContentLoaded', function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canvas = document.createElement('canvas');
    canvas.className = 'stars';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var inks = Array.prototype.slice.call(document.querySelectorAll('[data-ink]'));
    var label = document.querySelector('.sky-now b');
    var bar = document.querySelector('.bar');
    var W = 0, H = 0, docH = 1, stars = [], last = 0, sy = 0, dirty = true;

    function seed() {
      var n = Math.max(300, Math.min(2400, Math.round(W * H / 700)));
      stars = [];
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.12;
        stars.push({
          x: Math.random() * W,
          y: Math.pow(Math.random(), 1.4) * H,
          r: big ? 1.1 + Math.random() * 0.7 : 0.45 + Math.random() * 0.35,
          a: big ? 0.75 + Math.random() * 0.25 : 0.35 + Math.random() * 0.35,
          v: 0.2 + Math.random() * 0.3,
          p: Math.random() * 6.28,
          f: 0.5 + Math.random() * 1.4,
          k: Math.random()
        });
      }
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      docH = Math.max(1, document.documentElement.scrollHeight);
      seed();
      dirty = true;
      onScroll();
    }

    function darkAt(screenY) {
      var L = lum(colorAt((sy + screenY) / docH));
      if (L >= 0.09) return 0;
      if (L <= 0.012) return 1;
      if (L <= 0.05) return 0.55 - (L - 0.012) / 0.038 * 0.2;
      return 0.35 * (0.09 - L) / 0.04;
    }

    function draw(now) {
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      ctx.clearRect(0, 0, W, H);
      var bands = [];
      for (var b = 0; b <= 10; b++) bands.push(darkAt(H * b / 10));
      if (Math.max.apply(null, bands) <= 0.01) return;
      ctx.fillStyle = '#fff';
      var tt = now / 1000;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduce) {
          s.x += 0.94 * s.v * dt; s.y += 0.34 * s.v * dt;
          if (s.x > W + 2) s.x -= W + 4;
          if (s.y > H + 2) s.y -= H + 4;
        }
        var band = bands[Math.max(0, Math.min(10, Math.round(s.y / H * 10)))];
        if (s.k > band) continue;
        var tw = reduce ? 1 : 0.7 + 0.3 * Math.sin(s.p + tt * s.f);
        ctx.globalAlpha = s.a * tw * Math.min(1, (band - s.k) * 10);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    var lastY = 0;
    function onScroll() {
      sy = window.scrollY;
      if (bar && Math.abs(sy - lastY) > 6) {
        bar.classList.toggle('hide', sy > lastY && sy > 160 && !bar.contains(document.activeElement));
        lastY = sy;
      }
      for (var i = 0; i < inks.length; i++) {
        var r = inks[i].getBoundingClientRect();
        var mid = sy + r.top + r.height / 2;
        var L = lum(colorAt(mid / docH));
        inks[i].classList.toggle('on-light', L > 0.26);
      }
      if (bar) bar.classList.toggle('on-light', lum(colorAt((sy + 34) / docH)) > 0.26);
      if (label) {
        var t = (sy + H / 2) / docH, name = SKIES[0][1];
        for (var k = 0; k < SKIES.length; k++) if (t >= SKIES[k][0]) name = SKIES[k][1];
        if (label.textContent !== name) {
          label.parentNode.classList.remove('swap');
          void label.offsetWidth;
          label.textContent = name;
          label.parentNode.classList.add('swap');
        }
        var L2 = lum(colorAt((sy + H - 40) / docH));
        label.parentNode.classList.toggle('on-light', L2 > 0.26);
      }
      if (reduce) draw(performance.now());
    }

    function loop(now) {
      if (now - last > 30 || dirty) { dirty = false; draw(now); }
      requestAnimationFrame(loop);
    }

    var reveal = document.querySelectorAll('.rv');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.18 });
      reveal.forEach(function (el) { io.observe(el); });
    } else {
      reveal.forEach(function (el) { el.classList.add('in'); });
    }

    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();
    if (!reduce) requestAnimationFrame(loop);
  });
})();
