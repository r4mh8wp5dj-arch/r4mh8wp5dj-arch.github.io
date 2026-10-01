(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var BLUE = '#3D70D9', BLUE_LT = 'rgba(255,255,255,0.16)', BLUE_DK = 'rgba(8,20,70,0.14)', LIMB = '#2C54B4';
  var RED = '#E84D3D', RED_DK = '#B53A2E', IVORY = '#FFF4D6', INK = '#0A1A3D', GLOVE = '#FFFFFF';
  var F, on = false, t0 = 0;

  function resize() {
    F = I.fit(canvas);
    draw(0.8);
  }

  function limb(ctx, a, c, b, w, col) {
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
    ctx.lineCap = 'round'; ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
  }
  function hand(ctx, p, ang) {
    ctx.save();
    ctx.translate(p[0], p[1]); ctx.rotate(ang);
    ctx.fillStyle = GLOVE;
    ctx.beginPath(); ctx.arc(0, 0, 4.4, 0, 6.2832); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-3.6, -2.2, 2.1, 1.5, -0.7, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  function phone(ctx) {
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(16, 84.4, 15, 2.2, 0, 0, 6.2832); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 84); ctx.lineTo(5.4, 77); ctx.quadraticCurveTo(7, 71.5, 11, 71);
    ctx.lineTo(21, 71); ctx.quadraticCurveTo(25, 71.5, 26.6, 77); ctx.lineTo(28, 84); ctx.closePath();
    ctx.fillStyle = RED; ctx.fill();
    ctx.beginPath(); ctx.moveTo(4, 84); ctx.lineTo(28, 84); ctx.lineTo(27.4, 81.2); ctx.lineTo(4.6, 81.2); ctx.closePath();
    ctx.fillStyle = RED_DK; ctx.fill();
    ctx.fillStyle = RED_DK;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(9, 67.6, 2.6, 4, 1) : ctx.rect(9, 67.6, 2.6, 4); ctx.fill();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(20.4, 67.6, 2.6, 4, 1) : ctx.rect(20.4, 67.6, 2.6, 4); ctx.fill();
    ctx.beginPath(); ctx.arc(16, 76.6, 4.4, 0, 6.2832); ctx.fillStyle = IVORY; ctx.fill();
    ctx.fillStyle = '#D8C79E';
    for (var i = 0; i < 8; i++) {
      var a = -2.4 + i * 0.62;
      ctx.beginPath(); ctx.arc(16 + Math.cos(a) * 3, 76.6 + Math.sin(a) * 3, 0.7, 0, 6.2832); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(16, 76.6, 1.2, 0, 6.2832); ctx.fillStyle = RED; ctx.fill();
  }

  function cord(ctx, a, b, t) {
    var c = [a[0] - 12, (a[1] + b[1]) / 2 + 4], n = 140, turns = 9, r = 1.7, pts = [];
    function at(u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
    for (var i = 0; i <= n; i++) {
      var u = i / n, p = at(u), q = at(Math.min(1, u + 0.01)), o = at(Math.max(0, u - 0.01));
      var tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      var ph = u * turns * 6.2832 + t * 1.5, e = Math.min(1, Math.min(u, 1 - u) * 10);
      pts.push([p[0] - ty * Math.cos(ph) * r * e + tx * Math.sin(ph) * r * 0.5 * e, p[1] + tx * Math.cos(ph) * r * e + ty * Math.sin(ph) * r * 0.5 * e]);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    [[RED_DK, 1.5], [RED, 0.9]].forEach(function (st) {
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.lineWidth = st[1]; ctx.strokeStyle = st[0]; ctx.stroke();
    });
  }

  function draw(t) {
    var ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    var k = Math.min(F.w / 98, F.h / 70) * 0.96;
    ctx.save();
    ctx.translate(F.w / 2, F.h / 2); ctx.scale(k, k); ctx.translate(-48, -54.5);

    var still = I.reduce;
    var talk = still ? 0.55 : 0.5 + 0.5 * Math.sin(t * 11) * Math.max(0, Math.sin(t * 1.3));
    var bob = still ? 0 : Math.sin(t * 2.2) * 0.55;
    var wave = still ? 0.2 : Math.sin(t * 3.2);
    var blink = still ? 1 : (t % 3.6 > 3.47 ? 0.12 : 1);

    phone(ctx);

    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.beginPath(); ctx.ellipse(54, 84.4, 19, 2.3, 0, 0, 6.2832); ctx.fill();
    [46, 62].forEach(function (x) {
      ctx.beginPath(); ctx.moveTo(x, 69); ctx.lineTo(x, 79.5);
      ctx.lineCap = 'round'; ctx.lineWidth = 5.4; ctx.strokeStyle = LIMB; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + 0.9, 81.6, 5.4, 2.7, 0, 0, 6.2832); ctx.fillStyle = IVORY; ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + 0.9, 82.8, 5.4, 1.5, 0, 0, 3.1416); ctx.fillStyle = '#E3D2A6'; ctx.fill();
    });

    ctx.save();
    ctx.translate(0, bob);

    var shR = [75, 60], hRa = -0.95 + wave * 0.32, armL = 15;
    var hR = [shR[0] + Math.cos(hRa) * armL, shR[1] + Math.sin(hRa) * armL];
    limb(ctx, shR, [shR[0] + Math.cos(hRa + 0.45) * 9, shR[1] + Math.sin(hRa + 0.45) * 9], hR, 4.6, LIMB);

    var hL = [22.4, 49.5];
    limb(ctx, [33, 59], [24, 63], hL, 4.6, LIMB);

    ctx.save();
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(32, 28, 44, 44, 11) : ctx.rect(32, 28, 44, 44);
    ctx.fillStyle = BLUE; ctx.fill();
    ctx.clip();
    ctx.fillStyle = BLUE_LT; ctx.fillRect(32, 28, 44, 9);
    ctx.fillStyle = BLUE_DK; ctx.fillRect(32, 64, 44, 8);
    ctx.restore();

    [46, 62].forEach(function (x) {
      ctx.beginPath(); ctx.ellipse(x, 47.5, 2.3, 3.7 * blink, 0, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();
      if (blink > 0.5) { ctx.beginPath(); ctx.arc(x + 0.8, 46, 0.95, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill(); }
    });
    ctx.fillStyle = 'rgba(255,145,170,0.6)';
    [[41, 55.5], [67, 55.5]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(p[0], p[1], 3, 1.7, 0, 0, 6.2832); ctx.fill(); });
    var lift = still ? 0.4 : talk * 0.9;
    ctx.beginPath();
    ctx.moveTo(43, 41.2 - lift); ctx.quadraticCurveTo(46, 39.6 - lift, 49, 41 - lift);
    ctx.moveTo(59, 41 - lift); ctx.quadraticCurveTo(62, 39.6 - lift, 65, 41.2 - lift);
    ctx.lineWidth = 0.95; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    var mo = 0.7 + 3.3 * talk;
    ctx.beginPath(); ctx.ellipse(54, 56.4 + mo * 0.2, 3.4, mo, 0, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();
    if (mo > 1.8) { ctx.beginPath(); ctx.ellipse(54, 56.4 + mo * 0.75, 2, mo * 0.38, 0, 0, 6.2832); ctx.fillStyle = '#E86A7A'; ctx.fill(); }

    ctx.beginPath(); ctx.moveTo(28.5, 36); ctx.quadraticCurveTo(18.2, 49.5, 28.5, 62);
    ctx.lineWidth = 4.2; ctx.lineCap = 'round'; ctx.strokeStyle = RED; ctx.stroke();
    [[28.8, 36.2, -0.55], [28.8, 61.8, 0.55]].forEach(function (c) {
      ctx.beginPath(); ctx.ellipse(c[0], c[1], 4.1, 2.9, c[2], 0, 6.2832); ctx.fillStyle = RED_DK; ctx.fill();
    });

    hand(ctx, hL, 0.2);
    hand(ctx, hR, hRa + 1.2);
    ctx.restore();

    cord(ctx, [28.2, 62.4 + bob], [26.4, 74.5], still ? 0 : t);
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
