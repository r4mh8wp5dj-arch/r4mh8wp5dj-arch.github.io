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

  function draw() { glyphs(); city(); }
  window.addEventListener('resize', draw);
  draw();
})();
