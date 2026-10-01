(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var RED = '#E5483A', RED_LT = '#FF7A68', RED_DK = '#B33A2F', IVORY = '#FFF4D6', INK = '#14224E';
  var LIMB = '#2B52B0', BROW = '#1D3F95';
  var F, on = false, t0 = 0;

  function resize() {
    F = I.fit(canvas);
    draw(0.8);
  }

  function sq(ctx, x, y, w, h, r) {
    var o = r * 0.3;
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.bezierCurveTo(x + w - o, y, x + w, y + o, x + w, y + r); ctx.lineTo(x + w, y + h - r);
    ctx.bezierCurveTo(x + w, y + h - o, x + w - o, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h);
    ctx.bezierCurveTo(x + o, y + h, x, y + h - o, x, y + h - r); ctx.lineTo(x, y + r);
    ctx.bezierCurveTo(x, y + o, x + o, y, x + r, y); ctx.closePath();
  }

  function taper(ctx, a, c, b, w0, w1, col) {
    var n = 16, L = [], R = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, v = 1 - u;
      var x = v * v * a[0] + 2 * u * v * c[0] + u * u * b[0], y = v * v * a[1] + 2 * u * v * c[1] + u * u * b[1];
      var dx = 2 * v * (c[0] - a[0]) + 2 * u * (b[0] - c[0]), dy = 2 * v * (c[1] - a[1]) + 2 * u * (b[1] - c[1]);
      var l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = (w0 + (w1 - w0) * u) / 2;
      L.push([x + nx * w, y + ny * w]); R.push([x - nx * w, y - ny * w]);
    }
    ctx.beginPath();
    L.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
    for (var k = R.length - 1; k >= 0; k--) ctx.lineTo(R[k][0], R[k][1]);
    ctx.closePath(); ctx.fillStyle = col; ctx.fill();
    ctx.beginPath(); ctx.arc(a[0], a[1], w0 / 2, 0, 6.2832); ctx.arc(b[0], b[1], w1 / 2, 0, 6.2832); ctx.fill();
  }

  function glove(ctx, x, y, rot, sc, flip) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc * flip, sc);
    ctx.beginPath(); sq(ctx, -3.5, 3.1, 7, 3.2, 1.3); ctx.fillStyle = '#E3EAF8'; ctx.fill();
    var g = ctx.createLinearGradient(0, -5, 0, 4.6);
    g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#D6E0F4');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-4, 1); ctx.bezierCurveTo(-4.6, -3.4, -2.4, -5, 0, -5); ctx.bezierCurveTo(2.4, -5, 4.6, -3.4, 4, 1);
    ctx.bezierCurveTo(3.6, 3.8, 2, 4.6, 0, 4.6); ctx.bezierCurveTo(-2, 4.6, -3.6, 3.8, -4, 1); ctx.closePath(); ctx.fill();
    ctx.save();
    ctx.translate(-3.6, 0.6); ctx.rotate(0.55);
    ctx.beginPath(); sq(ctx, -1.6, -4.4, 3.2, 5.6, 1.6); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(110,130,185,0.6)'; ctx.lineWidth = 0.45; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-0.9, -4.8); ctx.lineTo(-0.9, -2.4); ctx.moveTo(1.5, -4.8); ctx.lineTo(1.5, -2.4); ctx.stroke();
    ctx.restore();
  }

  function shoe(ctx, x, y, dir) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(dir, 1);
    ctx.beginPath();
    ctx.moveTo(-5.4, 4.2); ctx.lineTo(-5.4, 1.2); ctx.bezierCurveTo(-5.4, -1.2, -3.6, -2.2, -2, -2.2);
    ctx.lineTo(1.4, -2.2); ctx.bezierCurveTo(3.2, 1, 6, 1.2, 8, 2.2); ctx.bezierCurveTo(9.2, 2.8, 9.2, 4.2, 9.2, 4.2); ctx.closePath();
    var g = ctx.createLinearGradient(0, -2.2, 0, 4.2); g.addColorStop(0, RED_LT); g.addColorStop(1, RED);
    ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.moveTo(4.6, 1.2); ctx.bezierCurveTo(6.4, 1.6, 8.2, 2.2, 9, 3); ctx.lineTo(9.2, 4.2); ctx.lineTo(5.6, 4.2); ctx.closePath();
    ctx.fillStyle = IVORY; ctx.fill();
    ctx.beginPath(); sq(ctx, -5.8, 3.4, 15.4, 2.6, 1.2); ctx.fillStyle = '#F2E3BD'; ctx.fill();
    ctx.strokeStyle = IVORY; ctx.lineWidth = 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0.4, -0.6); ctx.lineTo(1.4, -1.6); ctx.moveTo(2.2, 0.2); ctx.lineTo(3.2, -0.8); ctx.stroke();
    ctx.restore();
  }

  function softShadow(ctx, x, y, rx, ry, a) {
    ctx.save();
    ctx.translate(x, y); ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  function phone(ctx) {
    softShadow(ctx, 16, 84.4, 17, 3, 0.3);
    ctx.beginPath();
    ctx.moveTo(3.4, 84); ctx.bezierCurveTo(3.8, 79, 5, 74.5, 8.4, 72.6); ctx.bezierCurveTo(12, 70.8, 20, 70.8, 23.6, 72.6);
    ctx.bezierCurveTo(27, 74.5, 28.2, 79, 28.6, 84); ctx.closePath();
    var g = ctx.createLinearGradient(0, 71, 0, 84); g.addColorStop(0, RED_LT); g.addColorStop(0.45, RED); g.addColorStop(1, RED_DK);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 0.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(7, 76.6); ctx.quadraticCurveTo(8, 73.8, 11, 72.8); ctx.stroke();
    ctx.fillStyle = RED_DK;
    ctx.beginPath(); sq(ctx, 8.6, 67.8, 3.6, 4.4, 1.4); ctx.fill();
    ctx.beginPath(); sq(ctx, 19.8, 67.8, 3.6, 4.4, 1.4); ctx.fill();
    ctx.fillStyle = IVORY;
    ctx.beginPath(); ctx.arc(16, 77, 4.9, 0, 6.2832); ctx.fill();
    ctx.fillStyle = RED_DK;
    for (var i = 0; i < 9; i++) {
      var a = -2.6 + i * 0.62;
      ctx.beginPath(); ctx.arc(16 + Math.cos(a) * 3.3, 77 + Math.sin(a) * 3.3, 0.78, 0, 6.2832); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(16, 77, 1.5, 0, 6.2832); ctx.fillStyle = RED; ctx.fill();
    ctx.beginPath(); sq(ctx, 3.4, 82.2, 25.2, 1.8, 0.9); ctx.fillStyle = RED_DK; ctx.fill();
  }

  function cord(ctx, a, b, t) {
    var c = [a[0] - 13, (a[1] + b[1]) / 2 + 5], n = 160, turns = 9, r = 1.9, pts = [];
    function at(u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
    for (var i = 0; i <= n; i++) {
      var u = i / n, p = at(u), q = at(Math.min(1, u + 0.01)), o = at(Math.max(0, u - 0.01));
      var tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      var ph = u * turns * 6.2832 + t * 1.5, e = Math.min(1, Math.min(u, 1 - u) * 10);
      pts.push([p[0] - ty * Math.cos(ph) * r * e + tx * Math.sin(ph) * r * 0.5 * e, p[1] + tx * Math.cos(ph) * r * e + ty * Math.sin(ph) * r * 0.5 * e]);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[RED_DK, 1.5], [RED, 0.95], ['rgba(255,170,150,0.7)', 0.28]].forEach(function (st) {
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1] - (st[1] < 0.5 ? 0.25 : 0)); else ctx.moveTo(p[0], p[1]); });
      ctx.lineWidth = st[1]; ctx.strokeStyle = st[0]; ctx.stroke();
    });
  }

  function handset(ctx) {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(28.4, 37.4); ctx.quadraticCurveTo(17.6, 49.6, 28.4, 61.6);
    ctx.lineWidth = 4.6; ctx.strokeStyle = RED_DK; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(28.4, 37.4); ctx.quadraticCurveTo(17.9, 49.6, 28.4, 61.6);
    ctx.lineWidth = 3.6; ctx.strokeStyle = RED; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(26.4, 40.6); ctx.quadraticCurveTo(21.4, 49.6, 26.4, 58.6);
    ctx.lineWidth = 0.7; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.stroke();
    [[29.4, 36, -0.5], [29.4, 63, 0.5]].forEach(function (c) {
      ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(c[2]);
      ctx.beginPath(); sq(ctx, -5.2, -3.1, 9.6, 6.2, 2.4);
      var g = ctx.createLinearGradient(0, -3.1, 0, 3.1); g.addColorStop(0, RED); g.addColorStop(1, RED_DK);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-3.6, -1.8); ctx.lineTo(1.6, -1.8); ctx.lineWidth = 0.6; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
      ctx.restore();
    });
  }

  function face(ctx, t, still, talk) {
    var blinkPh = still ? 0 : t % 3.7, blink = blinkPh > 3.5 ? 1 - Math.sin((blinkPh - 3.5) / 0.2 * Math.PI) * 0.94 : 1;
    var lx = still ? -0.5 : Math.sin(t * 0.6) * 0.7 - 0.5, ly = still ? 0.2 : Math.cos(t * 0.45) * 0.4 + 0.2;
    [46.4, 61.6].forEach(function (x) {
      ctx.save();
      ctx.beginPath(); ctx.ellipse(x, 47.2, 4.4, 5.5, 0, 0, 6.2832); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ctx.clip();
      ctx.beginPath(); ctx.ellipse(x + lx, 47.8 + ly, 2.8, 3.6, 0, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();
      ctx.beginPath(); ctx.arc(x + lx - 0.9, 46 + ly, 1.2, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.arc(x + lx + 1, 49.6 + ly, 0.55, 0, 6.2832); ctx.fill();
      var lid = (1 - blink) * 11;
      if (lid > 0.1) { ctx.fillStyle = '#4C7FE8'; ctx.fillRect(x - 5, 41.5, 10, lid); }
      ctx.restore();
      ctx.beginPath(); ctx.ellipse(x, 47.2, 4.4, 5.5, 0, 0, 6.2832);
      ctx.lineWidth = 0.55; ctx.strokeStyle = 'rgba(20,34,78,0.7)'; ctx.stroke();
    });
    [[40.2, 56.2], [67.8, 56.2]].forEach(function (p) {
      var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], 4.2);
      g.addColorStop(0, 'rgba(255,140,170,0.6)'); g.addColorStop(1, 'rgba(255,140,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], 4.2, 0, 6.2832); ctx.fill();
    });
    var lift = still ? 0.3 : talk * 0.9;
    ctx.lineCap = 'round'; ctx.strokeStyle = BROW; ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(42, 40.4 - lift * 0.4); ctx.quadraticCurveTo(45.4, 38 - lift, 49.6, 39.4 - lift);
    ctx.moveTo(58.4, 39.4 - lift); ctx.quadraticCurveTo(62.6, 38 - lift, 66, 40.4 - lift * 0.4);
    ctx.stroke();
    var h = 0.3 + 4.2 * talk;
    if (h < 0.9) {
      ctx.beginPath(); ctx.moveTo(49.8, 56); ctx.quadraticCurveTo(54, 59, 58.2, 56);
      ctx.lineWidth = 1.05; ctx.strokeStyle = INK; ctx.stroke();
    } else {
      ctx.save();
      ctx.beginPath(); ctx.moveTo(49.6, 56.1); ctx.quadraticCurveTo(54, 57.3, 58.4, 56.1);
      ctx.bezierCurveTo(58, 56.6 + h * 1.25, 50, 56.6 + h * 1.25, 49.6, 56.1); ctx.closePath();
      ctx.fillStyle = INK; ctx.fill(); ctx.clip();
      ctx.fillStyle = '#F0728A'; ctx.beginPath(); ctx.ellipse(54, 57.2 + h * 1.15, 3.4, h * 0.62, 0, 0, 6.2832); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); sq(ctx, 51.2, 55.9, 5.6, 1.5, 0.7); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(20,34,78,0.55)'; ctx.lineWidth = 0.55;
    ctx.beginPath(); ctx.moveTo(48.7, 55.4); ctx.quadraticCurveTo(48.2, 56.4, 48.9, 57.2);
    ctx.moveTo(59.3, 55.4); ctx.quadraticCurveTo(59.8, 56.4, 59.1, 57.2); ctx.stroke();
  }

  function body(ctx) {
    ctx.save();
    ctx.beginPath(); sq(ctx, 31, 27, 46, 45, 13);
    var g = ctx.createLinearGradient(0, 27, 0, 72);
    g.addColorStop(0, '#6E9DF6'); g.addColorStop(0.3, '#4C7FE8'); g.addColorStop(0.75, '#3A6BD6'); g.addColorStop(1, '#2D58BE');
    ctx.fillStyle = g; ctx.fill();
    ctx.clip();
    var s = ctx.createLinearGradient(31, 0, 77, 0);
    s.addColorStop(0, 'rgba(255,255,255,0.1)'); s.addColorStop(0.55, 'rgba(255,255,255,0)'); s.addColorStop(1, 'rgba(10,20,80,0.2)');
    ctx.fillStyle = s; ctx.fillRect(31, 27, 46, 45);
    ctx.restore();
    ctx.beginPath(); sq(ctx, 33.4, 29.4, 41.2, 40.2, 11);
    ctx.lineWidth = 0.7; ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(38.6, 31.8); ctx.lineTo(54, 31.8);
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.stroke();
  }

  function draw(t) {
    var ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    var k = Math.min(F.w / 98, F.h / 70) * 0.96;
    ctx.save();
    ctx.translate(F.w / 2, F.h / 2); ctx.scale(k, k); ctx.translate(-48, -54.5);

    var still = I.reduce;
    var talk = still ? 0.55 : 0.5 + 0.5 * Math.sin(t * 11) * Math.max(0, Math.sin(t * 1.3));
    var breathe = still ? 0 : Math.sin(t * 2.2);
    var wave = still ? 0.2 : Math.sin(t * 3.2);
    var tilt = still ? 0 : Math.sin(t * 1.1) * 0.012 + talk * 0.008;

    phone(ctx);
    softShadow(ctx, 55, 84.6, 22, 3.4, 0.34);

    taper(ctx, [46, 69], [46.4, 74], [45.6, 79], 5.6, 4.6, LIMB);
    taper(ctx, [62, 69], [61.6, 74], [62.4, 79], 5.6, 4.6, LIMB);
    shoe(ctx, 45.6, 79.6, -1);
    shoe(ctx, 62.4, 79.6, 1);

    ctx.save();
    ctx.translate(54, 72); ctx.rotate(tilt); ctx.scale(1 - breathe * 0.006, 1 + breathe * 0.012); ctx.translate(-54, -72);

    var elbow = [83.4, 53.4], hRa = -1.2 + wave * 0.4, fore = 9.4;
    var hR = [elbow[0] + Math.cos(hRa) * fore, elbow[1] + Math.sin(hRa) * fore];
    taper(ctx, [75.4, 59], [81, 59.6], elbow, 5.4, 4.8, LIMB);
    taper(ctx, elbow, [elbow[0] + Math.cos(hRa) * fore * 0.5 + 0.8, elbow[1] + Math.sin(hRa) * fore * 0.5], hR, 4.8, 4.2, LIMB);

    var hL = [22.2, 49.6];
    taper(ctx, [33.2, 58.6], [25, 63.6], hL, 5.4, 4.4, LIMB);

    body(ctx);
    face(ctx, t, still, talk);
    handset(ctx);
    glove(ctx, hL[0] + 0.2, hL[1], -0.86, 1, 1);
    glove(ctx, hR[0], hR[1], hRa + 1.57, 1, -1);
    ctx.restore();

    cord(ctx, [28.8, 62.6], [27.4, 74.6], still ? 0 : t);
    ctx.restore();
  }

  function frame(now) {
    if (!on) return;
    if (!t0) t0 = now;
    draw((now - t0) / 1000);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  resize();
  if (I.reduce) return;
  I.visible(canvas, function (v) {
    if (v && !on) { on = true; t0 = 0; requestAnimationFrame(frame); }
    else if (!v) on = false;
  });
})();
