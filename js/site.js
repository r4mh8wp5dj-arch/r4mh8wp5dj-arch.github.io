(function () {
  var I = window.BP && window.BP.iso;
  if (!I) return;

  var GLYPHS = {
    drop: [[0, 0, 0, 1], [1, 0, 0, 2], [2, 0, 0, 5], [1, 2.8, 0, 0], [2, 2.8, 0, 0]],
    match: [[0, 0, 0, 1], [1, 0, 0, 3], [2, 0, 0, 3], [0, 1, 0, 2]],
    chain: [[0, 0, 0, 2], [1, 0, 0, 5], [0, 1, 0, 1], [1, 1, 0, 3], [1, 2.4, 0, 3]]
  };

  function glyphs() {
    document.querySelectorAll('canvas[data-glyph]').forEach(function (cv) {
      var kind = cv.getAttribute('data-glyph'), cells = GLYPHS[kind];
      var F = I.fit(cv);
      var s = Math.min(F.w / 4.6, F.h / 4.4);
      var cx = 0, cy = 0, cz = 0;
      cells.forEach(function (c) { cx += c[0]; cy += c[1]; cz += c[2]; });
      var n = cells.length;
      I.cubes(F.ctx, cells.map(function (c) {
        return { x: c[0], y: c[1], z: c[2], c: c[3], f: kind === 'match' && c[3] === 3 ? 0.25 : 0 };
      }), { M: I.view(Math.PI / 4 - 0.2, 0.55), s: s, x: F.w / 2, y: F.h / 2, pivot: [cx / n + 0.5, cy / n + 0.5, cz / n + 0.5] });
    });
  }

  function city() {
    var canvas = document.querySelector('.city');
    if (!canvas) return;
    function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    var F = I.fit(canvas), ctx = F.ctx, w = F.w, h = F.h;
    ctx.clearRect(0, 0, w, h);
    [
      { col: 'rgba(120,150,150,0.45)', min: 0.3, max: 0.6, bw: [40, 90], win: 0, seed: 7 },
      { col: 'rgba(58,86,70,0.8)', min: 0.2, max: 0.75, bw: [34, 80], win: 0.08, seed: 19 },
      { col: '#1c2a22', min: 0.14, max: 0.6, bw: [28, 70], win: 0.22, seed: 41 }
    ].forEach(function (L) {
      var R = rnd(L.seed), x = -10;
      while (x < w + 10) {
        var bw = L.bw[0] + R() * (L.bw[1] - L.bw[0]);
        var bh = h * (L.min + R() * (L.max - L.min));
        var top = h - bh, sw = bw - 3, st = top;
        ctx.fillStyle = L.col;
        ctx.fillRect(x, top, bw - 3, bh);
        var steps = R() < 0.45 ? 1 + Math.floor(R() * 3) : 0;
        for (var s = 0; s < steps; s++) {
          sw *= 0.62; st -= sw * 0.55;
          ctx.fillRect(x + (bw - 3 - sw) / 2, st, sw, sw * 0.55 + 1);
        }
        if (R() < 0.2) ctx.fillRect(x + (bw - 3) / 2 - 1, st - 22, 2, 22);
        if (L.win) {
          for (var wy = top + 10; wy < h - 8; wy += 13) {
            for (var wx = x + 7; wx < x + bw - 12; wx += 12) {
              if (R() < L.win) {
                ctx.fillStyle = R() < 0.5 ? 'rgba(255,210,122,0.85)' : 'rgba(255,176,32,0.6)';
                ctx.fillRect(wx, wy, 6, 7);
              }
            }
          }
        }
        x += bw + R() * 8;
      }
    });
  }


  var SKIES = [
    ['#4E8AD0', '#6FA0D4', '#A8BCC4', '#7E9C58', '#4E6B30'],
    ['#2A4C94', '#4A7FC0', '#8FB8DC', '#E8B77A', '#F2A24E'],
    ['#47296B', '#D9616B', '#FA944D'],
    ['#120F2E', '#331F4D', '#573361'],
    ['#000000', '#0A1A3D', '#1A0D33']
  ];
  var STAR_DENSITY = [0, 0, 0.04, 0.45, 1];

  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function sample(stops, t) {
    var x = t * (stops.length - 1), i = Math.min(stops.length - 2, Math.floor(x)), f = x - i;
    return window.BP.sky.mix(hex(stops[i]), hex(stops[i + 1]), f);
  }
  function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function across(u, vals) {
    var p = u * vals.length - 0.5, i = Math.floor(p), f = p - i;
    if (i < 0) return [vals[0], vals[0], 0];
    if (i >= vals.length - 1) return [vals[vals.length - 1], vals[vals.length - 1], 0];
    return [vals[i], vals[i + 1], ease(f)];
  }

  function pano() {
    var cv = document.querySelector('.pano-sky');
    if (!cv) return;
    var F = I.fit(cv), ctx = F.ctx;
    var mix = window.BP.sky.mix, lw = 320, lh = 96, off = document.createElement('canvas');
    off.width = lw; off.height = lh;
    var octx = off.getContext('2d'), img = octx.createImageData(lw, lh);
    for (var x = 0; x < lw; x++) {
      var m = across((x + 0.5) / lw, SKIES);
      for (var y = 0; y < lh; y++) {
        var t = y / (lh - 1), c = mix(sample(m[0], t), sample(m[1], t), m[2]), k = (y * lw + x) * 4, dn = (Math.random() - 0.5) * 2;
        img.data[k] = c[0] + dn;
        img.data[k + 1] = c[1] + dn;
        img.data[k + 2] = c[2] + dn;
        img.data[k + 3] = 255;
      }
    }
    octx.putImageData(img, 0, 0);
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, F.w, F.h, 18); else ctx.rect(0, 0, F.w, F.h);
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(off, 0, 0, F.w, F.h);
    var seed = 5;
    function R() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var n = Math.round(F.w * F.h / 60);
    ctx.fillStyle = '#fff';
    for (var i = 0; i < n; i++) {
      var sx = R() * F.w, sy = Math.pow(R(), 1.3) * F.h, big = R() < 0.12, r = R();
      var d = across(sx / F.w, STAR_DENSITY), dens = d[0] + (d[1] - d[0]) * d[2];
      if (r > dens) continue;
      ctx.globalAlpha = (big ? 0.85 : 0.45 + R() * 0.35) * (1 - sy / F.h * 0.5);
      ctx.beginPath();
      ctx.arc(sx, sy, big ? 1.2 + R() * 0.6 : 0.5 + R() * 0.4, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  (function rain() {
    var cv = document.querySelector('.rain');
    if (!cv) return;
    var zone = cv.parentNode, A, pieces = [], on = false, last = 0, mx = 0.5, tmx = 0.5;
    function make(initial) {
      var sh = I.randomShape(), z = Math.pow(Math.random(), 1.5), cells = sh.cells, c = [0, 0, 0];
      cells.forEach(function (p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
      return {
        cells: cells, piv: c.map(function (v) { return v / cells.length + 0.5; }),
        c: Math.floor(Math.random() * 6), z: z, s: 7 + z * z * 34,
        x: Math.random() * A.w, y: initial ? Math.random() * A.h * 1.1 - A.h * 0.1 : -60,
        v: 12 + z * 55, yaw: Math.random() * 6.28, ys: (Math.random() - 0.5) * 0.8,
        roll: (Math.random() - 0.5) * 0.9, rs: (Math.random() - 0.5) * 0.3
      };
    }
    function resize() {
      A = I.fit(cv);
      var n = Math.round(Math.max(14, Math.min(36, A.w * A.h / 36000)));
      pieces = [];
      for (var i = 0; i < n; i++) pieces.push(make(true));
      paint();
    }
    function paint() {
      A.ctx.clearRect(0, 0, A.w, A.h);
      var sky = window.BP.sky, docH = Math.max(1, document.documentElement.scrollHeight), sy = window.scrollY;
      pieces.forEach(function (p) {
        var M = I.mul(I.rotX(0.5), I.mul(I.rotZ(p.roll), I.rotY(p.yaw)));
        var bg = sky.colorAt((sy + Math.max(0, Math.min(A.h, p.y))) / docH);
        var fog = 0.72 - p.z * 0.62;
        var rgb = sky.mix(I.RGB[p.c], bg, fog).map(function (v) { return Math.round(v / 6) * 6; });
        I.cubes(A.ctx, p.cells.map(function (c) { return { x: c[0], y: c[1], z: c[2], rgb: rgb }; }),
          { M: M, s: p.s, x: p.x + (mx - 0.5) * p.z * -40, y: p.y, pivot: p.piv });
      });
    }
    function frame(now) {
      if (!on) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      mx += (tmx - mx) * Math.min(1, dt * 3);
      pieces.forEach(function (p, i) {
        p.y += p.v * dt; p.yaw += p.ys * dt; p.roll += p.rs * dt * 0.3;
        if (p.y > A.h + 80) pieces[i] = make(false);
      });
      pieces.sort(function (a, b) { return a.z - b.z; });
      paint();
      requestAnimationFrame(frame);
    }
    window.addEventListener('pointermove', function (e) { tmx = e.clientX / window.innerWidth; });
    window.addEventListener('resize', resize);
    resize();
    if (I.reduce) return;
    I.visible(zone, function (v) {
      if (v && !on) { on = true; last = 0; requestAnimationFrame(frame); } else if (!v) on = false;
    });
  })();

  function draw() { glyphs(); city(); pano(); }
  window.addEventListener('resize', draw);
  draw();
})();
