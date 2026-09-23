(function () {
  var I = window.BP && window.BP.iso;
  if (!I) return;
  var reduce = I.reduce;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function progress(el, start, span) {
    var r = el.getBoundingClientRect(), vh = window.innerHeight;
    return clamp((vh * start - r.top) / (r.height * span + vh * 0.0001), 0, 1);
  }
  function center(cells) {
    var c = [0, 0, 0];
    cells.forEach(function (p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
    return c.map(function (v) { return v / cells.length + 0.5; });
  }

  (function rain() {
    var back = document.querySelector('.rain-back'), front = document.querySelector('.rain-front');
    if (!back) return;
    var hero = back.parentNode, A, B, pieces = [], mx = 0.5, my = 0.5, tmx = 0.5, tmy = 0.5, on = true, last = 0;

    function make(initial) {
      var sh = I.randomShape();
      var z = Math.pow(Math.random(), 1.6);
      if (Math.random() < 0.05) z = 0.9 + Math.random() * 0.1;
      var s = 7 + z * z * 46;
      return {
        cells: sh.cells, piv: center(sh.cells), c: Math.floor(Math.random() * 6), z: z, s: s,
        x: Math.random() * A.w, y: initial ? Math.random() * A.h * 1.1 - A.h * 0.1 : -s * 4,
        v: 14 + z * 70, yaw: Math.random() * 6.28, ys: (Math.random() - 0.5) * 0.9,
        roll: (Math.random() - 0.5) * 0.9, rs: (Math.random() - 0.5) * 0.4
      };
    }
    function resize() {
      A = I.fit(back);
      B = I.fit(front);
      var n = Math.round(clamp(A.w * A.h / 24000, 18, 60));
      pieces = [];
      for (var i = 0; i < n; i++) pieces.push(make(true));
    }
    function paint(ctx, list, w, h) {
      ctx.clearRect(0, 0, w, h);
      list.forEach(function (p) {
        var M = I.mul(I.rotX(0.5), I.mul(I.rotZ(p.roll), I.rotY(p.yaw)));
        var items = p.cells.map(function (c) { return { x: c[0], y: c[1], z: c[2], c: p.c, a: 0.3 + p.z * 0.7 }; });
        I.cubes(ctx, items, { M: M, s: p.s, x: p.x + (mx - 0.5) * p.z * -60, y: p.y + (my - 0.5) * p.z * -30, pivot: p.piv });
      });
    }
    function frame(now) {
      if (!on) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      mx += (tmx - mx) * Math.min(1, dt * 3);
      my += (tmy - my) * Math.min(1, dt * 3);
      for (var i = 0; i < pieces.length; i++) {
        var p = pieces[i];
        p.y += p.v * dt; p.yaw += p.ys * dt; p.roll += p.rs * dt * 0.3;
        if (p.y > A.h + p.s * 4) pieces[i] = make(false);
      }
      pieces.sort(function (a, b) { return a.z - b.z; });
      paint(A.ctx, pieces.filter(function (p) { return p.z < 0.88; }), A.w, A.h);
      paint(B.ctx, pieces.filter(function (p) { return p.z >= 0.88; }), B.w, B.h);
      requestAnimationFrame(frame);
    }
    hero.addEventListener('pointermove', function (e) {
      tmx = e.clientX / window.innerWidth;
      tmy = e.clientY / window.innerHeight;
    });
    window.addEventListener('resize', resize);
    resize();
    if (reduce) { paint(A.ctx, pieces.filter(function (p) { return p.z < 0.88; }), A.w, A.h); return; }
    I.visible(hero, function (v) {
      if (v && !on) { on = true; last = 0; requestAnimationFrame(frame); } else if (!v) on = false;
    });
    requestAnimationFrame(frame);
  })();

  (function chrono() {
    var canvas = document.getElementById('drop-canvas');
    if (!canvas) return;
    var stage = canvas.parentNode, labels = stage.querySelectorAll('.cue'), F, cam;
    var base = [
      [0, 0, 0, 1], [1, 0, 0, 2], [2, 0, 0, 0], [3, 0, 0, 1],
      [0, 0, 1, 2], [1, 0, 1, 0], [2, 0, 1, 1], [3, 0, 1, 3],
      [0, 0, 2, 3], [1, 0, 2, 1], [2, 0, 2, 3], [3, 0, 2, 0],
      [0, 0, 3, 0], [1, 0, 3, 2], [2, 0, 3, 1], [3, 0, 3, 2],
      [3, 1, 2, 3], [0, 1, 0, 2], [3, 1, 0, 2], [0, 1, 3, 1]
    ];
    var T = [[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]];
    var shapes = [T, I.rotCells(T), I.rotCells(I.rotCells(T))];
    var N = 7, land = { x: 0, y: 1, z: 1 }, from = { x: -10, y: 9.5, z: 1 };
    var frames = [];
    for (var i = 0; i < N; i++) {
      var t = i / (N - 1);
      frames.push({
        x: from.x + (land.x - from.x) * (1 - Math.pow(1 - t, 1.6)),
        y: from.y + (land.y - from.y) * Math.pow(t, 1.35),
        z: from.z + (land.z - from.z) * t,
        cells: i < 2 ? shapes[0] : i < 4 ? shapes[1] : shapes[2]
      });
    }
    var shown = -1;

    function resize() {
      F = I.fit(canvas);
      var M = I.view(Math.PI / 4 - 0.2, 0.55), P = [2, 1.5, 2], pts = [];
      [0, 4].forEach(function (x) { [0, 3].forEach(function (y) { [0, 4].forEach(function (z) { pts.push([x, y, z]); }); }); });
      frames.forEach(function (f) { f.cells.forEach(function (c) { pts.push([f.x + c[0], f.y + c[1] + 2.2, f.z + c[2]]); pts.push([f.x + c[0] + 1, f.y + c[1], f.z + c[2] + 1]); }); });
      var b = [1e9, -1e9, 1e9, -1e9];
      pts.forEach(function (q) {
        var v = I.tf(M, q[0] - P[0], q[1] - P[1], q[2] - P[2]);
        b[0] = Math.min(b[0], v[0]); b[1] = Math.max(b[1], v[0]); b[2] = Math.min(b[2], v[1]); b[3] = Math.max(b[3], v[1]);
      });
      var s = Math.min(F.w * 0.96 / (b[1] - b[0]), F.h * 0.96 / (b[3] - b[2]));
      cam = { M: M, s: s, x: F.w / 2 - (b[0] + b[1]) / 2 * s, y: F.h / 2 + (b[2] + b[3]) / 2 * s, pivot: P };
      place();
      shown = -1;
    }
    function place() {
      [0, 3, 6].forEach(function (fi, k) {
        var f = frames[fi], c = center(f.cells);
        var p = k === 2 ? I.project(cam, 4.3, 3.6, 0) : I.project(cam, f.x + c[0], f.y + c[1] + 1.2, f.z + c[2]);
        labels[k].style.left = (p[0] / F.w * 100) + '%';
        labels[k].style.top = (p[1] / F.h * 100) + '%';
      });
    }
    function draw(n, now) {
      var ctx = F.ctx;
      ctx.clearRect(0, 0, F.w, F.h);
      I.pitBack(ctx, cam, { h: 3 });
      var items = base.map(function (b) { return { x: b[0], y: b[1], z: b[2], c: b[3] }; });
      var landed = n >= N;
      var glow = landed ? 0.3 + 0.3 * Math.sin(now / 140) : 0;
      if (landed) {
        var lc = frames[N - 1].cells.map(function (c) { return [land.x + c[0], land.y + c[1], land.z + c[2]]; });
        items.forEach(function (it) {
          if (it.c !== 3) return;
          lc.forEach(function (c) {
            if (Math.abs(c[0] - it.x) + Math.abs(c[1] - it.y) + Math.abs(c[2] - it.z) === 1) it.f = glow;
          });
        });
        lc.forEach(function (c) { items.push({ x: c[0], y: c[1], z: c[2], c: 3, f: glow }); });
      }
      I.cubes(ctx, items, cam);
      I.pitFront(ctx, cam, { h: 3, glow: 8 });
      var ghosts = [];
      for (var i = 0; i < Math.min(n, N - 1); i++) {
        var f = frames[i];
        f.cells.forEach(function (c) {
          ghosts.push({ x: f.x + c[0], y: f.y + c[1], z: f.z + c[2], c: 3, a: 0.16 + 0.5 * (i / (N - 1)) });
        });
      }
      I.cubes(ctx, ghosts, cam);
    }
    function frame(now) {
      var n = Math.round(progress(stage, 0.9, 0.75) * N);
      if (n !== shown || n >= N) {
        if (n !== shown) {
          labels.forEach(function (l, k) { l.classList.toggle('in', n > [0, 3, 6][k]); });
          shown = n;
        }
        draw(n, now);
      }
      if (on) requestAnimationFrame(frame);
    }
    var on = false;
    window.addEventListener('resize', resize);
    resize();
    if (reduce) { draw(N, 0); labels.forEach(function (l) { l.classList.add('in'); }); return; }
    I.visible(stage, function (v) {
      if (v && !on) { on = true; requestAnimationFrame(frame); } else if (!v) on = false;
    });
  })();

  (function roster() {
    document.querySelectorAll('canvas[data-shape]').forEach(function (cv) {
      var name = cv.getAttribute('data-shape'), c = +cv.getAttribute('data-c');
      var cells = I.SHAPES[name][0];
      function draw() {
        var F = I.fit(cv);
        var s = Math.min(F.w, F.h) / 4.2;
        I.cubes(F.ctx, cells.map(function (p) { return { x: p[0], y: p[1], z: p[2], c: c }; }),
          { M: I.view(Math.PI / 4 - 0.2, 0.6), s: s, x: F.w / 2, y: F.h / 2, pivot: center(cells) });
      }
      draw();
      window.addEventListener('resize', draw);
    });
  })();

  (function streak() {
    var svg = document.getElementById('streak-svg');
    if (!svg) return;
    var box = svg.closest('.curve'), ns = 'http://www.w3.org/2000/svg';
    var X0 = 70, X1 = 960, Y0 = 380, Y1 = 40, MINS = 1, MAXS = 24, LO = 1.0, HI = 2.5;
    function mult(k) { return Math.min(2.4, 2.4 - 1.5 * Math.pow(0.8, k)); }
    function px(k) { return X0 + (X1 - X0) * (k - MINS) / (MAXS - MINS); }
    function py(m) { return Y0 - (Y0 - Y1) * (m - LO) / (HI - LO); }
    function el(tag, attrs, parent) {
      var e = document.createElementNS(ns, tag);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e);
      return e;
    }
    [1.5, 2].forEach(function (m) {
      el('line', { x1: X0, x2: X1, y1: py(m), y2: py(m), class: 'grid' });
      el('text', { x: X0 - 14, y: py(m) + 5, class: 'ax', 'text-anchor': 'end' }).textContent = '×' + m.toFixed(1);
    });
    el('line', { x1: X0, x2: X1, y1: py(2.4), y2: py(2.4), class: 'cap' });
    el('text', { x: X0 + 4, y: py(2.4) - 14, class: 'ax cap-t' }).textContent = 'CAP ×2.40';
    [6, 12, 18].forEach(function (k) {
      el('line', { x1: px(k), x2: px(k), y1: Y0, y2: py(mult(k)), class: 'mile' });
      el('text', { x: px(k), y: Y0 + 30, class: 'ax', 'text-anchor': 'middle' }).textContent = k;
    });
    el('line', { x1: X0, x2: X1, y1: Y0, y2: Y0, class: 'base' });
    el('text', { x: X0, y: Y0 + 30, class: 'ax', 'text-anchor': 'middle' }).textContent = '1';
    el('text', { x: X1, y: Y0 + 30, class: 'ax', 'text-anchor': 'end' }).textContent = 'STREAK';
    var d = '';
    for (var s = MINS; s <= MAXS; s += 0.25) d += (s > MINS ? 'L' : 'M') + px(s).toFixed(1) + ' ' + py(mult(s)).toFixed(1);
    el('path', { d: d, class: 'track' });
    var live = el('path', { d: d, class: 'live' });
    var len = live.getTotalLength();
    live.style.strokeDasharray = len;
    for (var k = MINS; k <= MAXS; k++) {
      el('rect', { x: px(k) - 4, y: py(mult(k)) - 4, width: 8, height: 8, class: 'dot', 'data-k': k, transform: 'rotate(45 ' + px(k) + ' ' + py(mult(k)) + ')' });
    }
    var dots = svg.querySelectorAll('.dot');
    var head = el('g', { class: 'head' });
    el('circle', { r: 26, class: 'halo' }, head);
    el('path', { d: 'M0 -30 C 10 -18 16 -10 14 2 C 13 12 7 18 0 18 C -7 18 -13 12 -14 2 C -15 -8 -8 -12 -6 -20 C -2 -14 0 -12 2 -12 C 2 -18 0 -24 0 -30 Z', class: 'fl-o' }, head);
    el('path', { d: 'M0 -12 C 6 -6 8 0 7 5 C 6 11 3 13 0 13 C -3 13 -6 11 -7 5 C -7 0 -3 -4 0 -12 Z', class: 'fl-i' }, head);
    var rs = document.getElementById('streak-n'), rm = document.getElementById('streak-m');
    var ticking = false;
    function update() {
      ticking = false;
      var p = reduce ? 1 : progress(box, 0.85, 0.9);
      var sv = MINS + p * (MAXS - MINS);
      var m = mult(sv);
      live.style.strokeDashoffset = len * (1 - p);
      head.setAttribute('transform', 'translate(' + px(sv) + ' ' + py(m) + ') scale(' + (0.7 + 0.5 * (m - 0.9) / 1.5) + ')');
      var k = Math.floor(sv);
      rs.textContent = k;
      rm.textContent = '×' + mult(k).toFixed(2);
      dots.forEach(function (dt) { dt.classList.toggle('on', +dt.getAttribute('data-k') <= k); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  (function pressure() {
    var sec = document.getElementById('pressure');
    if (!sec) return;
    var canvas = sec.querySelector('canvas'), col = document.getElementById('press-col'), ns = 'http://www.w3.org/2000/svg';
    var e = 10, dx = e * Math.cos(Math.PI / 6), dy = e / 2, segs = [];
    col.setAttribute('viewBox', (-dx - 2) + ' ' + (-dy - 3) + ' ' + (2 * dx + 4) + ' ' + (8 * e + 2 * dy + 6));
    for (var i = 0; i < 8; i++) {
      var y = (7 - i) * e, g = document.createElementNS(ns, 'g');
      [[0, y, dx, y + dy, 0, y + 2 * dy, -dx, y + dy], [-dx, y + dy, 0, y + 2 * dy, 0, y + e + dy, -dx, y + e], [0, y + 2 * dy, dx, y + dy, dx, y + e, 0, y + e + dy]]
        .forEach(function (pts, k) {
          var p = document.createElementNS(ns, 'polygon');
          p.setAttribute('points', pts.join(' '));
          p.setAttribute('class', ['t', 'l', 'r'][k]);
          g.appendChild(p);
        });
      col.appendChild(g);
      segs.push(g);
    }
    var rows = [], seed = 11, grid = {};
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    for (var r = 0; r < 6; r++) {
      var row = [];
      for (var x = 0; x < 4; x++) for (var z = 0; z < 4; z++) {
        if (r === 5 && (x + z) % 3 !== 0) continue;
        var bad = [grid[x + ',' + (r - 1) + ',' + z], grid[(x - 1) + ',' + r + ',' + z], grid[x + ',' + r + ',' + (z - 1)]];
        var opts = [0, 1, 2, 3].filter(function (c) { return bad.indexOf(c) < 0; });
        var c = opts[Math.floor(rnd() * opts.length)];
        grid[x + ',' + r + ',' + z] = c;
        row.push([x, z, c]);
      }
      rows.push(row);
    }
    var F, cam, lastKey = '';
    function resize() {
      F = I.fit(canvas);
      var s = Math.min(F.w / 6.6, F.h / 10.5);
      cam = { M: I.view(Math.PI / 4 - 0.22, 0.6), s: s, x: F.w / 2, y: F.h * 0.52, pivot: [2, 4, 2] };
      lastKey = '';
      update();
    }
    function update() {
      var rr = sec.getBoundingClientRect();
      var p = reduce ? 0.4 : clamp(-rr.top / Math.max(1, rr.height - window.innerHeight), 0, 1);
      var c = Math.min(23.999, p * 24);
      var k = Math.floor(c / 8), frac = c - 8 * k;
      var lift = k === 0 ? 0 : k - 1 + smooth(frac / 0.9);
      var filled = Math.floor(frac);
      var key = filled + '|' + lift.toFixed(3);
      if (key === lastKey) return;
      lastKey = key;
      segs.forEach(function (g, i) { g.classList.toggle('on', i < filled); });
      col.classList.toggle('hot', filled >= 6);
      sec.classList.toggle('pulse', k > 0 && frac < 0.9);
      var items = [];
      rows.forEach(function (row, j) {
        var y = j - 3 + lift;
        if (y <= -1) return;
        row.forEach(function (b) {
          items.push({ x: b[0], y: y, z: b[1], c: b[2], a: y < 0 ? y + 1 : 1 });
        });
      });
      var ctx = F.ctx;
      ctx.clearRect(0, 0, F.w, F.h);
      I.pitBack(ctx, cam, { danger: 6 });
      I.cubes(ctx, items, cam);
      I.pitFront(ctx, cam, {});
    }
    var ticking = false;
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { ticking = false; update(); }); } }, { passive: true });
    window.addEventListener('resize', resize);
    resize();
  })();

  (function city() {
    var canvas = document.querySelector('.city');
    if (!canvas) return;
    function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
    function draw() {
      var F = I.fit(canvas), ctx = F.ctx, w = F.w, h = F.h;
      ctx.clearRect(0, 0, w, h);
      var layers = [
        { col: 'rgba(120,150,150,0.45)', min: 0.25, max: 0.55, bw: [40, 90], win: 0, seed: 7 },
        { col: 'rgba(58,86,70,0.8)', min: 0.18, max: 0.72, bw: [34, 80], win: 0.08, seed: 19 },
        { col: '#1c2a22', min: 0.12, max: 0.6, bw: [28, 70], win: 0.22, seed: 41 }
      ];
      layers.forEach(function (L) {
        var R = rnd(L.seed), x = -10;
        while (x < w + 10) {
          var bw = L.bw[0] + R() * (L.bw[1] - L.bw[0]);
          var bh = h * (L.min + R() * (L.max - L.min));
          var top = h - bh;
          ctx.fillStyle = L.col;
          ctx.fillRect(x, top, bw - 3, bh);
          var steps = R() < 0.45 ? 1 + Math.floor(R() * 3) : 0;
          var sw = bw - 3, st = top;
          for (var s = 0; s < steps; s++) {
            sw *= 0.62; st -= sw * 0.55;
            ctx.fillRect(x + (bw - 3 - sw) / 2, st, sw, sw * 0.55 + 1);
          }
          if (R() < 0.2) ctx.fillRect(x + (bw - 3) / 2 - 1, st - 22, 2, 22);
          if (L.win) {
            var cell = 9;
            for (var wy = top + 10; wy < h - 8; wy += cell + 4) {
              for (var wx = x + 7; wx < x + bw - 12; wx += cell + 3) {
                if (R() < L.win) {
                  ctx.fillStyle = R() < 0.5 ? 'rgba(255,210,122,0.85)' : 'rgba(255,176,32,0.6)';
                  ctx.fillRect(wx, wy, cell - 3, cell - 2);
                }
              }
            }
            ctx.fillStyle = L.col;
          }
          x += bw + R() * 8;
        }
      });
    }
    window.addEventListener('resize', draw);
    draw();
  })();
})();
