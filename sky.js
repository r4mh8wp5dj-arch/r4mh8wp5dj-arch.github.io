(function () {
  var layers = Array.prototype.slice.call(document.querySelectorAll('.sky-layer'));
  var canvas = document.getElementById('stars');
  if (!canvas || !layers.length) return;
  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ANGLE = 0.32;
  var DX = Math.cos(ANGLE), DY = Math.sin(ANGLE);
  var W = 0, H = 0, stars = [], starAlpha = 1, ticking = false, last = 0;

  function seed() {
    var n = Math.max(260, Math.min(1400, Math.round(W * H / 300)));
    stars = [];
    for (var i = 0; i < n; i++) {
      var big = Math.random() < 0.2;
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: big ? 1.3 + Math.random() * 0.9 : 0.5 + Math.random() * 0.5,
        a: big ? 0.65 + Math.random() * 0.35 : 0.35 + Math.random() * 0.3,
        v: 0.2 + Math.random() * 0.3,
        tw: Math.random() < 0.7,
        p: Math.random() * Math.PI * 2,
        f: (Math.PI * 2) / (4 + Math.random() * 8)
      });
    }
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
    draw(performance.now(), true);
  }

  function smooth(x) { return x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); }

  function update() {
    ticking = false;
    var max = document.documentElement.scrollHeight - H;
    var p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    var t = p * (layers.length - 1), i = Math.floor(t), f = t - i;
    for (var k = 0; k < layers.length; k++) {
      layers[k].style.opacity = k === i ? 1 - f : k === i + 1 ? f : 0;
    }
    starAlpha = 1 - smooth((p - 0.16) / 0.34);
  }

  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }

  function draw(now, force) {
    var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    if (!force && now - last < 33) return;
    last = now;
    ctx.clearRect(0, 0, W, H);
    if (starAlpha <= 0.005) return;
    ctx.fillStyle = '#fff';
    var s, i, al, tt = now / 1000;
    for (i = 0; i < stars.length; i++) {
      s = stars[i];
      if (!reduce) {
        s.x += DX * s.v * dt; s.y += DY * s.v * dt;
        if (s.x > W + 2) s.x -= W + 4; if (s.y > H + 2) s.y -= H + 4;
      }
      al = s.a * (s.tw && !reduce ? 0.72 + 0.28 * Math.sin(s.p + tt * s.f) : 1) * starAlpha;
      ctx.globalAlpha = al;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function loop(now) {
    draw(now, false);
    requestAnimationFrame(loop);
  }

  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });
  resize();
  update();
  if (!reduce) requestAnimationFrame(loop);
})();
