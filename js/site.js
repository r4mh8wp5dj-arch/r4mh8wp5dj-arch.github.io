(function () {
  var I = window.BP && window.BP.iso, SKY = window.BP && window.BP.sky;
  if (!I) return;

  function ease(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function seg(t, a, b) { return Math.max(0, Math.min(1, (t - a) / (b - a))); }
  function centroid(cells) {
    var c = [0, 0, 0];
    cells.forEach(function (p) { c[0] += p[0]; c[1] += p[1]; c[2] += p[2]; });
    return c.map(function (v) { return v / cells.length + 0.5; });
  }
  function ledFor(el) {
    if (!SKY) return [115, 204, 255];
    var r = el.getBoundingClientRect(), dh = Math.max(1, document.documentElement.scrollHeight);
    return SKY.led(SKY.pageU((window.scrollY + r.top + r.height / 2) / dh));
  }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function squash(t, a, b, amt) { return t > a && t < b ? amt * Math.sin(Math.PI * seg(t, a, b)) : 0; }
  function flash(t, a, b) { return t > a && t < b ? 0.35 + 0.35 * Math.sin((t - a) * 30) : 0; }

  function frags(origins, t0, t, seed) {
    var out = [], R = rng(seed), tau = t - t0;
    if (tau < 0 || tau > 0.85 || I.reduce) return out;
    origins.forEach(function (o) {
      for (var i = 0; i < 7; i++) {
        var vx = (R() - 0.5) * 5, vz = (R() - 0.5) * 5, vy = 2.5 + R() * 3.5;
        out.push({ x: o[0] + vx * tau, y: o[1] + vy * tau - 7 * tau * tau, z: o[2] + vz * tau, c: o[3], k: Math.max(0.02, 0.3 * (1 - tau / 0.85)) });
      }
    });
    return out;
  }
  function hover(t, until) { return t < until ? Math.sin(t * 6) * 0.08 : 0; }

  var SCENES = {
    drop: {
      dur: 3.6, key: 2.4,
      base: [[0, 0, 0, 1], [1, 0, 0, 2], [2, 0, 0, 1], [3, 0, 0, 5], [0, 0, 1, 5], [3, 0, 1, 2], [0, 0, 2, 2], [1, 0, 3, 5], [3, 0, 3, 1]],
      draw: function (d, t) {
        var L = [[0, 0, 0], [1, 0, 0], [0, 0, 1]], Lr = I.rotCells(L);
        var items = this.base.map(function (b) { return { x: b[0], y: b[1], z: b[2], c: b[3] }; });
        if (t >= 1.95) {
          var sq = squash(t, 1.95, 2.25, 0.22);
          Lr.forEach(function (c) { items.push({ x: 1 + c[0], y: c[1], z: 1 + c[2], c: 0, sq: sq }); });
          d.cubes(items);
          return;
        }
        d.cubes(items);
        var ax = ease(seg(t, 0.6, 1.0)), turn = ease(seg(t, 1.1, 1.5)), fall = seg(t, 1.6, 1.95);
        var y = 2.6 - 2.6 * fall * fall + hover(t, 0.6);
        var c0 = centroid(L), c1 = centroid(Lr);
        var at = [ax + c0[0] + (c1[0] - c0[0]) * turn, y + 0.5, 1 + c0[2] + (c1[2] - c0[2]) * turn];
        d.piece(L.map(function (c) { return { x: c[0], y: c[1], z: c[2], c: 0 }; }), c0, at, -Math.PI / 2 * turn);
      }
    },
    match: {
      dur: 3.4, key: 1.25,
      base: [[0, 0, 0, 1], [1, 0, 0, 5], [3, 0, 0, 2], [0, 0, 1, 2], [2, 0, 1, 3], [3, 0, 1, 1], [0, 0, 3, 5], [2, 0, 3, 2], [3, 0, 3, 5]],
      draw: function (d, t) {
        var burst = 1.45, fall = seg(t, 0.5, 0.85), f = flash(t, 1.05, burst);
        var items = [];
        this.base.forEach(function (b) {
          var hit = b[0] === 2 && b[2] === 1;
          if (hit && t >= burst) return;
          items.push({ x: b[0], y: b[1], z: b[2], c: b[3], f: hit ? f : 0 });
        });
        if (t < burst) items.push({ x: 1, y: 2.6 - 2.6 * fall * fall + hover(t, 0.5), z: 1, c: 3, f: f, sq: squash(t, 0.85, 1.05, 0.22) });
        d.cubes(items.concat(frags([[1, 0, 1, 3], [2, 0, 1, 3]], burst, t, 7)));
      }
    },
    chain: {
      dur: 4.2, key: 2.05,
      base: [[0, 0, 0, 3], [3, 0, 0, 2], [0, 0, 1, 5], [1, 0, 1, 0], [2, 0, 1, 1], [3, 0, 1, 5], [0, 0, 3, 2], [2, 0, 3, 5], [3, 0, 3, 3]],
      draw: function (d, t) {
        var b1 = 1.3, b2 = 2.2, fall = seg(t, 0.45, 0.8), f1 = flash(t, 1.0, b1), f2 = flash(t, 1.9, b2);
        var bf = seg(t, 1.45, 1.75), items = [];
        this.base.forEach(function (b) {
          var red = b[0] === 1 && b[2] === 1, blue = b[0] === 2 && b[2] === 1;
          if ((red && t >= b1) || (blue && t >= b2)) return;
          items.push({ x: b[0], y: b[1], z: b[2], c: b[3], f: red ? f1 : blue ? f2 : 0 });
        });
        if (t < b1) items.push({ x: 1, y: 2.6 - 2.6 * fall * fall + hover(t, 0.45), z: 0, c: 0, f: f1, sq: squash(t, 0.8, 1.0, 0.22) });
        if (t < b2) items.push({ x: 1, y: t < 1.45 ? 1 : 1 - bf * bf, z: 1, c: 1, f: f2, sq: squash(t, 1.75, 1.9, 0.16) });
        d.cubes(items.concat(frags([[1, 0, 0, 0], [1, 0, 1, 0]], b1, t, 3), frags([[1, 0, 1, 1], [2, 0, 1, 1]], b2, t, 11)));
        if (t >= b2) d.popup('×2', [1.6, 1.3 + seg(t, b2, b2 + 1.2) * 1.2, 1.2], 1 - seg(t, b2 + 0.9, b2 + 1.5));
      }
    }
  };

  function scene(cv) {
    var def = SCENES[cv.getAttribute('data-scene')];
    if (!def) return;
    var F, cam, led, on = false, t0 = 0;
    function resize() {
      F = I.fit(cv);
      cam = I.fitCam(I.view(Math.PI / 4 - 0.2, 0.6), F.w, F.h, 4, -0.6, 3.7, 0.06, [2, 1, 2]);
      led = ledFor(cv);
    }
    var api = {
      cubes: function (items) { I.cubes(F.ctx, items, cam); },
      piece: function (cells, pivot, at, angle) {
        var p = I.project(cam, at[0], at[1], at[2]);
        I.cubes(F.ctx, cells, { M: I.mul(cam.M, I.rotY(angle)), s: cam.s, x: p[0], y: p[1], pivot: pivot });
      },
      popup: function (text, at, alpha) {
        var p = I.project(cam, at[0], at[1], at[2]), ctx = F.ctx;
        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.font = '700 ' + Math.round(cam.s * 0.85) + 'px Nippo';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillText(text, p[0], p[1] + 2);
        ctx.fillStyle = '#F4B942';
        ctx.fillText(text, p[0], p[1]);
        ctx.restore();
      }
    };
    function draw(t) {
      F.ctx.clearRect(0, 0, F.w, F.h);
      var ch = { led: led, flow: t / 12 };
      I.plate(F.ctx, cam, ch);
      def.draw(api, t);
      I.plateFront(F.ctx, cam, ch);
      cv.style.opacity = I.reduce ? 1 : (seg(t, 0, 0.2) * (1 - seg(t, def.dur - 0.3, def.dur))).toFixed(3);
    }
    function frame(now) {
      if (!on) return;
      if (!t0) t0 = now;
      draw(((now - t0) / 1000) % def.dur);
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () { resize(); if (I.reduce || !on) draw(def.key); });
    resize();
    draw(def.key);
    cv.style.opacity = 1;
    if (I.reduce) return;
    I.visible(cv, function (v) {
      if (v && !on) { on = true; t0 = 0; requestAnimationFrame(frame); } else if (!v) on = false;
    });
  }

  function pano() {
    var cv = document.querySelector('.pano-sky');
    if (!cv || !SKY) return;
    var F = I.fit(cv), ctx = F.ctx;
    var lw = 720, lh = 2, off = document.createElement('canvas');
    off.width = lw; off.height = lh;
    var octx = off.getContext('2d'), img = octx.createImageData(lw, lh), R = rng(9);
    for (var x = 0; x < lw; x++) {
      var c = SKY.stripColor((x + 0.5) / lw);
      for (var y = 0; y < lh; y++) {
        var k = (y * lw + x) * 4, dn = (R() - 0.5) * 1.5;
        img.data[k] = c[0] + dn; img.data[k + 1] = c[1] + dn; img.data[k + 2] = c[2] + dn; img.data[k + 3] = 255;
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
    var n = Math.round(F.w * F.h / 55), S = rng(5);
    for (var i = 0; i < n; i++) {
      var sx = S() * F.w, sy = S() * F.h, big = S() < 0.1, r = S(), a = S(), rad = S();
      var uu = sx / F.w, dens = SKY.starDensity(uu);
      if (r > dens) continue;
      ctx.fillStyle = '#fff';
      ctx.globalAlpha = (big ? 1 : 0.35 + a * 0.65) * SKY.starAlpha(uu) * Math.min(1, (dens - r) * 14);
      ctx.beginPath();
      ctx.arc(sx, sy, big ? 1.1 + rad * 0.6 : 0.45 + rad * 0.4, 0, 6.2832);
      ctx.fill();
    }
    ctx.restore();
  }

  function city() {
    var canvas = document.querySelector('.city');
    if (!canvas) return;
    var F = I.fit(canvas), ctx = F.ctx, w = F.w, h = F.h;
    ctx.clearRect(0, 0, w, h);
    [
      { col: 'rgba(120,150,150,0.45)', min: 0.3, max: 0.6, bw: [40, 90], win: 0, seed: 7 },
      { col: 'rgba(58,86,70,0.8)', min: 0.2, max: 0.75, bw: [34, 80], win: 0.08, seed: 19 },
      { col: '#1c2a22', min: 0.14, max: 0.6, bw: [28, 70], win: 0.22, seed: 41 }
    ].forEach(function (L) {
      var R = rng(L.seed), x = -10;
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

  document.querySelectorAll('canvas[data-scene]').forEach(scene);
  function draw() { city(); pano(); }
  window.addEventListener('resize', draw);
  draw();
})();
