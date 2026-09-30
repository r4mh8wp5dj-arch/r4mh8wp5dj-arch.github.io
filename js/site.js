(function () {
  var I = window.BP && window.BP.iso;
  if (!I) return;

  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

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

  var CP = {
    dawn: ['#4E8AD0', '#6FA0D4', '#A8BCC4', '#7E9C58', '#4E6B30'],
    cumulus: ['#2A4C94', '#4A7FC0', '#8FB8DC', '#E8B77A', '#F2A24E'],
    sunset: ['#47296B', '#D9616B', '#FA944D'],
    twilight: ['#120F2E', '#331F4D', '#573361'],
    deepspace: ['#000000', '#0A1A3D', '#1A0D33']
  };
  function checkpoints() {
    var PW = 128, PH = 80;
    var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
    function lerp(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
    document.querySelectorAll('.cp-art').forEach(function (cv, idx) {
      var theme = cv.getAttribute('data-theme'), R = rng(40 + idx * 7);
      var off = document.createElement('canvas');
      off.width = PW; off.height = PH;
      var g = off.getContext('2d'), img = g.createImageData(PW, PH), D = img.data;
      function put(x, y, c) {
        x = Math.round(x); y = Math.round(y);
        if (x < 0 || y < 0 || x >= PW || y >= PH) return;
        var k = (y * PW + x) * 4;
        D[k] = c[0]; D[k + 1] = c[1]; D[k + 2] = c[2]; D[k + 3] = 255;
      }
      function rect(x, y, w, h, c) { for (var yy = 0; yy < h; yy++) for (var xx = 0; xx < w; xx++) put(x + xx, y + yy, c); }
      function dithered(y0, y1, stops, levels) {
        var cs = stops.map(hex);
        for (var y = y0; y < y1; y++) {
          var t = (y - y0) / Math.max(1, y1 - y0 - 1) * (cs.length - 1);
          for (var x = 0; x < PW; x++) {
            var th = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
            var q = Math.min(levels * (cs.length - 1) - 0.001, t * levels), lo = Math.floor(q), f = q - lo;
            var step = (lo + (f > th ? 1 : 0)) / levels, i = Math.min(cs.length - 2, Math.floor(step));
            put(x, y, lerp(cs[i], cs[i + 1], step - i));
          }
        }
      }
      function disc(cx, cy, r, fn) {
        for (var y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (var x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
          var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
          if (dx * dx + dy * dy <= r * r) { var c = fn(dx / r, dy / r, x, y); if (c) put(x, y, c); }
        }
      }
      function cloud(cx, cy, w, top, mid, shade) {
        var blobs = [], n = 4 + Math.floor(R() * 3);
        for (var i = 0; i < n; i++) {
          var f = i / (n - 1) - 0.5, r = w * (0.16 + (0.5 - Math.abs(f)) * 0.22) * (0.85 + R() * 0.3);
          blobs.push([cx + f * w * 0.78, cy - r * 0.35 + (R() - 0.5) * 2, r]);
        }
        var y0 = Math.floor(cy - w * 0.5), y1 = Math.ceil(cy + w * 0.15);
        for (var y = y0; y <= y1; y++) for (var x = Math.floor(cx - w * 0.6); x <= Math.ceil(cx + w * 0.6); x++) {
          var inside = false;
          if (y > cy + w * 0.08) continue;
          for (var b = 0; b < blobs.length; b++) { var dx = x + 0.5 - blobs[b][0], dy = y + 0.5 - blobs[b][1]; if (dx * dx + dy * dy <= blobs[b][2] * blobs[b][2]) { inside = true; break; } }
          if (!inside) continue;
          var rel = (y - (cy - w * 0.3)) / (w * 0.38);
          var th = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
          put(x, y, rel < 0.35 + th * 0.25 ? top : rel < 0.78 + th * 0.2 ? mid : shade);
        }
      }
      function star(x, y, big, c, dim) {
        put(x, y, c);
        if (big) { put(x - 1, y, dim); put(x + 1, y, dim); put(x, y - 1, dim); put(x, y + 1, dim); }
      }

      if (theme === 'dawn') {
        dithered(0, 60, ['#4E8AD0', '#6FA0D4', '#A8BCC4', '#E8D9B8'], 10);
        disc(96, 50, 7, function (u, v) { return u * u + v * v < 0.45 ? hex('#FFF2CC') : hex('#FFE0A0'); });
        [{ col: '#86A2B0', min: 0.22, max: 0.46, w: [7, 14], win: 0, seed: 7 },
         { col: '#5E7C78', min: 0.16, max: 0.38, w: [6, 12], win: 0.12, seed: 19 },
         { col: '#2F4038', min: 0.1, max: 0.3, w: [5, 11], win: 0.28, seed: 41 }].forEach(function (L) {
          var Rl = rng(L.seed), x = -2, c = hex(L.col);
          while (x < PW) {
            var bw = L.w[0] + Math.floor(Rl() * (L.w[1] - L.w[0])), bh = Math.round(PH * (L.min + Rl() * (L.max - L.min)));
            var top = 62 - bh, sw = bw - 1, st = top;
            rect(x, top, bw - 1, bh + 1, c);
            var steps = Rl() < 0.45 ? 1 + Math.floor(Rl() * 2) : 0;
            for (var k = 0; k < steps; k++) { sw = Math.max(2, Math.round(sw * 0.6)); var sh = Math.max(1, Math.round(sw * 0.5)); st -= sh; rect(x + Math.floor((bw - 1 - sw) / 2), st, sw, sh, c); }
            if (Rl() < 0.25) rect(x + Math.floor((bw - 1) / 2), st - 4, 1, 4, c);
            if (L.win) for (var wy = top + 2; wy < 60; wy += 3) for (var wx = x + 1; wx < x + bw - 2; wx += 2) if (Rl() < L.win) put(wx, wy, Rl() < 0.5 ? hex('#FFD27A') : hex('#FFB020'));
            x += bw + (Rl() < 0.3 ? 1 : 0);
          }
        });
        dithered(62, 80, ['#7E9C58', '#627F44', '#4E6B30'], 6);
        for (var gx = 0; gx < PW; gx += 2) if (R() < 0.4) put(gx, 62, hex('#96B46C'));
      } else if (theme === 'cumulus') {
        dithered(0, 80, ['#2A4C94', '#4A7FC0', '#8FB8DC', '#E8B77A', '#F2A24E'], 12);
        cloud(26, 20, 30, hex('#FFFFFF'), hex('#EEF2F8'), hex('#C6D3E4'));
        cloud(96, 30, 40, hex('#FFFFFF'), hex('#EDF1F7'), hex('#C3D0E2'));
        cloud(46, 52, 48, hex('#FFF8EE'), hex('#F7E6D0'), hex('#E2B889'));
        cloud(112, 68, 34, hex('#FFF1DE'), hex('#F6D7B2'), hex('#E0A56A'));
      } else if (theme === 'sunset') {
        dithered(0, 80, ['#47296B', '#8E3F7C', '#D9616B', '#FA944D', '#FFB35C'], 12);
        disc(64, 83, 26, function () { return hex('#FDB36A'); });
        disc(64, 83, 23.5, function () { return hex('#FFC57A'); });
        disc(64, 83, 21, function (u, v) {
          var d = Math.sqrt(u * u + v * v);
          return d > 0.9 && v < -0.35 ? hex('#FFEDB8') : hex('#FFD978');
        });
      } else if (theme === 'twilight') {
        dithered(0, 80, ['#120F2E', '#331F4D', '#573361'], 12);
        for (var i2 = 0; i2 < 70; i2++) { var big = R() < 0.1; star(Math.floor(R() * PW), Math.floor(R() * 74), big, hex(R() < 0.5 ? '#FFE3B8' : '#E8CFA8'), hex('#8A6E8E')); }
        disc(94, 22, 9, function (u, v) { var dx = u - 0.45, dy = v + 0.25; if (dx * dx + dy * dy < 0.72) return null; return u + v < -0.2 ? hex('#FFF6E0') : hex('#F2DDB0'); });
      } else {
        dithered(0, 80, ['#000000', '#0A1A3D', '#1A0D33'], 12);
        for (var i3 = 0; i3 < 260; i3++) { var bg = R() < 0.07; star(Math.floor(R() * PW), Math.floor(R() * PH), bg, hex(R() < 0.8 ? '#FFFFFF' : '#BFD8FF'), hex('#5B6A9A')); }
        var ring = function (behind) {
          for (var t = 0; t < 360; t++) {
            var a = t / 360 * 6.2832, x = Math.cos(a) * 25, y = Math.sin(a) * 6, rx = x * 0.96 - y * 0.28, ry = x * 0.28 + y * 0.96;
            if ((Math.sin(a) < 0) === behind) { put(40 + rx, 36 + ry, hex('#C8E6FF')); put(40 + rx * 0.9, 36 + ry * 0.9, hex('#7FA6D8')); }
          }
        };
        ring(true);
        disc(40, 36, 13, function (u, v, x, y) {
          var l = -u * 0.6 - v * 0.8, th = (BAYER[(y % 4) * 4 + (x % 4)] + 0.5) / 16;
          var band = Math.floor((v + 1) * 4) % 2 ? 0.08 : 0;
          var k = l + band + (th - 0.5) * 0.35;
          return k > 0.55 ? hex('#B8E6FF') : k > 0.1 ? hex('#73CCFF') : k > -0.35 ? hex('#4A86D8') : k > -0.75 ? hex('#2F55A8') : hex('#1E3276');
        });
        ring(false);
      }
      if (cv.width !== PW || cv.height !== PH) { cv.width = PW; cv.height = PH; }
      cv.getContext('2d').putImageData(img, 0, 0);
      if (!idx) cv.parentNode.parentNode.style.setProperty('--art-h', cv.clientHeight + 'px');
    });
  }

  function draw() { city(); checkpoints(); }
  window.addEventListener('resize', draw);
  draw();

  (function rise() {
    var list = document.querySelector('.checkpoints');
    if (!list) return;
    var cv = document.createElement('canvas'), on = false, last = 0, F = null, M = I.view(Math.PI / 4 - 0.22, 0.6);
    cv.className = 'cp-rise';
    cv.setAttribute('aria-hidden', 'true');
    list.parentNode.insertBefore(cv, list);
    var R = rng(11), bits = [];
    for (var i = 0; i < 14; i++) bits.push({ x: R(), y: R(), s: 7 + R() * 9, v: 0.012 + R() * 0.018, c: Math.floor(R() * 6), a: R() * 6.28, w: 0.3 + R() * 0.6, p: R() * 6.28 });
    function size() {
      if (!cv.offsetParent) { F = null; return; }
      cv.style.top = list.offsetTop + 'px';
      cv.style.height = list.offsetHeight + 'px';
      F = I.fit(cv);
    }
    function paint(dt) {
      if (!F) return;
      var ctx = F.ctx, w = F.w, h = F.h;
      ctx.clearRect(0, 0, w, h);
      bits.forEach(function (b) {
        b.y -= b.v * dt; if (b.y < -0.05) { b.y += 1.1; b.x = R(); }
        b.a += b.w * dt; b.p += dt;
        var y = b.y * h, edge = Math.min(1, Math.min(y, h - y) / 90);
        if (edge <= 0) return;
        ctx.save();
        ctx.globalAlpha = 0.55 * edge;
        I.cubes(ctx, [{ x: 0, y: 0, z: 0, c: b.c, lo: true }], { M: I.mul(M, I.rotY(b.a)), s: b.s, x: 14 + b.x * (w - 28) + Math.sin(b.p) * 6, y: y, pivot: [0.5, 0.5, 0.5] });
        ctx.restore();
      });
    }
    function frame(now) {
      if (!on) return;
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      paint(dt);
      requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () { size(); paint(0); });
    window.addEventListener('load', function () { size(); paint(0); });
    size();
    paint(0);
    if (I.reduce) return;
    I.visible(cv, function (v) {
      if (v && !on) { on = true; last = 0; requestAnimationFrame(frame); }
      else if (!v) on = false;
    });
  })();
})();
