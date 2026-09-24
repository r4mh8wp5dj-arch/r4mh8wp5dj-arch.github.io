(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var SKIN = '#F6EFDF', GLOVE = '#FFFFFF', LINE = 'rgba(10,26,61,0.55)';
  var RED = '#E84D3D', RED_LT = '#FF7A6B', RED_DK = '#9E2A22', INK = '#0A1A3D', IVORY = '#FFF4D6';
  var H = 0.47, LEG = 0.3, BODY = [1.15, 0.5 + LEG, 0.85], BASE = [0.28, 0, 1.78];
  var F, cam, on = false, t0 = 0;

  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function P(w) { return I.project(cam, w[0], w[1], w[2]); }

  function resize() {
    F = I.fit(canvas);
    cam = I.fitCam(I.view(Math.PI / 4 - 0.22, 0.6), F.w, F.h, 2, -0.6, 1.9, 0.04, [1, 0.6, 1]);
    draw(0.8);
  }

  function outlined(ctx, fill, lw) {
    ctx.fillStyle = fill; ctx.fill();
    ctx.lineWidth = lw; ctx.strokeStyle = LINE; ctx.stroke();
  }
  function hose(ctx, a, c, b, w) {
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(c[0], c[1], b[0], b[1]);
    ctx.lineWidth = w * 1.35; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.lineWidth = w; ctx.strokeStyle = SKIN; ctx.stroke();
  }
  function glove(ctx, p, r, ang, lw) {
    ctx.save();
    ctx.translate(p[0], p[1]); ctx.rotate(ang);
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.86, 0, 0, 6.2832); outlined(ctx, GLOVE, lw);
    ctx.beginPath(); ctx.ellipse(-r * 0.62, -r * 0.62, r * 0.36, r * 0.24, -0.9, 0, 6.2832); outlined(ctx, GLOVE, lw);
    ctx.beginPath(); ctx.moveTo(r * 0.2, -r * 0.55); ctx.quadraticCurveTo(r * 0.45, -r * 0.2, r * 0.3, r * 0.2);
    ctx.lineWidth = lw * 0.7; ctx.strokeStyle = 'rgba(10,26,61,0.22)'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.05, r * 0.95, r * 0.55, r * 0.22, 0, 0, 6.2832); outlined(ctx, GLOVE, lw);
    ctx.restore();
  }

  function phoneBase(ctx, c, s) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    ctx.beginPath(); ctx.ellipse(c[0], c[1] + s * 0.02, s * 0.46, s * 0.12, 0, 0, 6.2832); ctx.fill();
    var lw = Math.max(1, s * 0.018), bw = s * 0.4, tw = s * 0.27, y0 = c[1], y1 = c[1] - s * 0.36;
    ctx.beginPath();
    ctx.moveTo(c[0] - bw, y0);
    ctx.bezierCurveTo(c[0] - bw, y0 - s * 0.06, c[0] - tw - s * 0.04, y1 + s * 0.08, c[0] - tw, y1);
    ctx.quadraticCurveTo(c[0], y1 - s * 0.07, c[0] + tw, y1);
    ctx.bezierCurveTo(c[0] + tw + s * 0.04, y1 + s * 0.08, c[0] + bw, y0 - s * 0.06, c[0] + bw, y0);
    ctx.closePath();
    var g = ctx.createLinearGradient(c[0] - bw, y1, c[0] + bw, y0);
    g.addColorStop(0, RED_LT); g.addColorStop(0.55, RED); g.addColorStop(1, RED_DK);
    outlined(ctx, g, lw);
    [-1, 1].forEach(function (k) {
      var x = c[0] + k * tw * 0.78;
      ctx.beginPath();
      ctx.moveTo(x - s * 0.035, y1 + s * 0.01); ctx.lineTo(x - s * 0.025, y1 - s * 0.08);
      ctx.quadraticCurveTo(x, y1 - s * 0.11, x + s * 0.025, y1 - s * 0.08); ctx.lineTo(x + s * 0.035, y1 + s * 0.01);
      ctx.closePath(); outlined(ctx, RED, lw);
    });
    ctx.beginPath(); ctx.moveTo(c[0] - tw * 0.55, y1 - s * 0.02); ctx.quadraticCurveTo(c[0], y1 - s * 0.05, c[0] + tw * 0.55, y1 - s * 0.02);
    ctx.lineWidth = lw * 1.4; ctx.strokeStyle = RED_DK; ctx.stroke();
    var d = [c[0], y0 - s * 0.17], r = s * 0.15;
    ctx.beginPath(); ctx.ellipse(d[0], d[1], r, r * 0.92, 0, 0, 6.2832); outlined(ctx, IVORY, lw);
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI * 0.2 + i * 0.52;
      ctx.beginPath(); ctx.arc(d[0] + Math.cos(a) * r * 0.68, d[1] + Math.sin(a) * r * 0.62, r * 0.12, 0, 6.2832);
      ctx.fillStyle = '#D8C79E'; ctx.fill();
    }
    ctx.beginPath(); ctx.arc(d[0], d[1], r * 0.32, 0, 6.2832); outlined(ctx, RED, lw);
    ctx.beginPath(); ctx.moveTo(d[0] + r * 0.7, d[1] + r * 0.5); ctx.lineTo(d[0] + r * 0.95, d[1] + r * 0.78);
    ctx.lineWidth = lw * 1.5; ctx.strokeStyle = '#B8A57A'; ctx.stroke();
    ctx.restore();
    return [c[0] + bw * 0.86, y0 - s * 0.1];
  }

  function coil(ctx, a, b, s, t) {
    var c = [(a[0] + b[0]) / 2 - s * 0.1, Math.max(a[1], b[1]) + s * 0.5], n = 220, turns = 11, r = s * 0.038;
    function at(u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var u = i / n, p = at(u), q = at(Math.min(1, u + 0.01)), o = at(Math.max(0, u - 0.01));
      var tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      var ph = u * turns * 6.2832 + t * 2, e = Math.min(1, Math.min(u, 1 - u) * 14);
      pts.push([p[0] - ty * Math.cos(ph) * r * e + tx * Math.sin(ph) * r * 0.45 * e, p[1] + tx * Math.cos(ph) * r * e + ty * Math.sin(ph) * r * 0.45 * e, Math.sin(ph)]);
    }
    ctx.lineCap = 'round';
    [[RED_DK, 0.042], [RED, 0.026]].forEach(function (st) {
      ctx.beginPath();
      pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); });
      ctx.lineWidth = Math.max(1, s * st[1]); ctx.strokeStyle = st[0]; ctx.stroke();
    });
    ctx.beginPath();
    for (var k = 1; k < pts.length; k++) if (pts[k][2] > 0.55) { ctx.moveTo(pts[k - 1][0], pts[k - 1][1]); ctx.lineTo(pts[k][0], pts[k][1]); }
    ctx.lineWidth = Math.max(0.6, s * 0.01); ctx.strokeStyle = 'rgba(255,200,190,0.8)'; ctx.stroke();
  }

  function handset(ctx) {
    var lw = 0.018;
    ctx.beginPath();
    ctx.moveTo(-0.5, -0.24);
    ctx.bezierCurveTo(-0.66, -0.12, -0.62, 0.22, -0.4, 0.4);
    ctx.lineTo(-0.3, 0.33);
    ctx.bezierCurveTo(-0.5, 0.18, -0.53, -0.08, -0.42, -0.19);
    ctx.closePath();
    var g = ctx.createLinearGradient(-0.64, 0, -0.4, 0);
    g.addColorStop(0, RED_DK); g.addColorStop(0.45, RED); g.addColorStop(1, RED_LT);
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = LINE; ctx.stroke();
    [[-0.44, -0.24, -0.35], [-0.33, 0.39, 0.95]].forEach(function (cup) {
      ctx.save();
      ctx.translate(cup[0], cup[1]); ctx.rotate(cup[2]);
      ctx.beginPath();
      ctx.moveTo(-0.06, -0.08); ctx.lineTo(0.08, -0.14);
      ctx.quadraticCurveTo(0.13, 0, 0.08, 0.14); ctx.lineTo(-0.06, 0.08); ctx.closePath();
      ctx.fillStyle = RED; ctx.fill(); ctx.lineWidth = lw; ctx.strokeStyle = LINE; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0.09, 0, 0.035, 0.11, 0, 0, 6.2832); ctx.fillStyle = RED_DK; ctx.fill();
      ctx.restore();
    });
    ctx.beginPath(); ctx.moveTo(-0.58, -0.08); ctx.bezierCurveTo(-0.6, 0.06, -0.56, 0.18, -0.48, 0.28);
    ctx.lineWidth = 0.02; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineCap = 'round'; ctx.stroke();
  }

  function draw(t) {
    var ctx = F.ctx, s = cam.s;
    ctx.clearRect(0, 0, F.w, F.h);
    var led = [115, 204, 255];
    if (window.BP.sky) {
      var r = canvas.getBoundingClientRect(), dh = Math.max(1, document.documentElement.scrollHeight);
      led = window.BP.sky.led(window.BP.sky.pageU((window.scrollY + r.top + r.height / 2) / dh));
    }
    I.plate(ctx, cam, { n: 2, led: led, flow: t / 12 });

    var still = I.reduce;
    var talk = still ? 0.45 : 0.5 + 0.5 * Math.sin(t * 10) * Math.max(0, Math.sin(t * 1.25));
    var bob = still ? 0 : Math.sin(t * 2.2) * 0.02;
    var sway = still ? 0 : Math.sin(t * 1.1) * 0.03;
    var body = add(BODY, [0, bob, 0]);
    var foot = P([body[0], 0, body[2]]);
    var lw = Math.max(1, s * 0.018);

    var O = P(add(body, [0, 0, H + 0.002])), UX = P(add(body, [1, 0, H + 0.002])), UY = P(add(body, [0, -1, H + 0.002]));
    var ux = [UX[0] - O[0], UX[1] - O[1]], uy = [UY[0] - O[0], UY[1] - O[1]];
    function faceToScreen(x, y) { return [O[0] + ux[0] * x + uy[0] * y, O[1] + ux[1] * x + uy[1] * y]; }
    function swayed(p) { var cs = Math.cos(sway), sn = Math.sin(sway), dx = p[0] - foot[0], dy = p[1] - foot[1]; return [foot[0] + dx * cs - dy * sn, foot[1] + dx * sn + dy * cs]; }

    var cordFrom = phoneBase(ctx, P(BASE), s);

    ctx.save();
    ctx.translate(foot[0], foot[1]); ctx.rotate(sway); ctx.translate(-foot[0], -foot[1]);

    var bottom = [[-H, -H, -H], [H, -H, -H], [H, -H, H], [-H, -H, H]].map(function (o) { return add(body, o); });
    var fi = 0, pb = bottom.map(P);
    pb.forEach(function (p, i) { if (p[1] > pb[fi][1]) fi = i; });
    [[bottom[fi], bottom[(fi + 1) % 4]], [bottom[fi], bottom[(fi + 3) % 4]]].forEach(function (e) {
      var w = [e[0][0] + (e[1][0] - e[0][0]) * 0.42, e[0][1], e[0][2] + (e[1][2] - e[0][2]) * 0.42];
      var top = P(w), f = P([w[0], 0.02, w[2]]);
      hose(ctx, top, [top[0], (top[1] + f[1]) / 2], [f[0], f[1] - s * 0.05], s * 0.085);
      ctx.beginPath(); ctx.ellipse(f[0] + s * 0.035, f[1] - s * 0.035, s * 0.12, s * 0.065, 0, 0, 6.2832);
      var sg = ctx.createLinearGradient(0, f[1] - s * 0.1, 0, f[1]); sg.addColorStop(0, RED_LT); sg.addColorStop(1, RED_DK);
      outlined(ctx, sg, lw);
      ctx.beginPath(); ctx.ellipse(f[0] + s * 0.06, f[1] - s * 0.06, s * 0.04, s * 0.015, -0.2, 0, 6.2832);
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
    });

    var rs = P(add(body, [H, 0.02, -H * 0.1]));
    var wave = still ? 0.3 : Math.sin(t * 3) * 0.5 + 0.2;
    var rHand = [rs[0] + s * (0.5 + wave * 0.06), rs[1] - s * (0.28 + wave * 0.1)];
    hose(ctx, rs, [rs[0] + s * 0.42, rs[1] + s * 0.16], rHand, s * 0.085);
    glove(ctx, rHand, s * 0.1, 0.5 + wave * 0.4, lw);

    I.cubes(ctx, [{ x: -0.5, y: -0.5, z: -0.5, c: 1, k: 0.94 }], { M: cam.M, s: s, x: P(body)[0], y: P(body)[1], pivot: [0, 0, 0] });

    ctx.save();
    ctx.transform(ux[0], ux[1], uy[0], uy[1], O[0], O[1]);
    var blink = still ? 1 : (t % 3.6 > 3.47 ? 0.12 : 1);
    [-0.17, 0.17].forEach(function (x) {
      ctx.beginPath(); ctx.ellipse(x, -0.1, 0.07, 0.1 * blink, 0, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();
      if (blink > 0.5) { ctx.beginPath(); ctx.arc(x + 0.025, -0.14, 0.024, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill(); }
      ctx.beginPath(); ctx.ellipse(x * 1.45, 0.07, 0.07, 0.035, 0, 0, 6.2832); ctx.fillStyle = 'rgba(255,120,150,0.35)'; ctx.fill();
    });
    ctx.beginPath(); ctx.moveTo(-0.28, -0.26); ctx.quadraticCurveTo(-0.18, -0.31, -0.09, -0.27);
    ctx.moveTo(0.09, -0.27); ctx.quadraticCurveTo(0.18, -0.31, 0.28, -0.26);
    ctx.lineWidth = 0.028; ctx.lineCap = 'round'; ctx.strokeStyle = INK; ctx.stroke();
    var mo = 0.03 + 0.08 * talk;
    ctx.beginPath(); ctx.moveTo(-0.09, 0.12); ctx.quadraticCurveTo(0, 0.12 + mo * 2.2, 0.09, 0.12); ctx.quadraticCurveTo(0, 0.1, -0.09, 0.12);
    ctx.fillStyle = INK; ctx.fill();
    if (talk > 0.4) { ctx.beginPath(); ctx.ellipse(0, 0.12 + mo * 1.3, 0.035, mo * 0.4, 0, 0, 6.2832); ctx.fillStyle = '#E86A7A'; ctx.fill(); }

    var ls = [-0.47, 0.22], grip = [-0.55, 0.06];
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ls[0], ls[1]); ctx.quadraticCurveTo(-0.95, 0.5, grip[0] - 0.02, grip[1] + 0.06);
    ctx.lineWidth = 0.125; ctx.strokeStyle = LINE; ctx.stroke();
    ctx.lineWidth = 0.09; ctx.strokeStyle = SKIN; ctx.stroke();
    handset(ctx);
    ctx.beginPath(); ctx.ellipse(grip[0], grip[1], 0.1, 0.085, -0.4, 0, 6.2832); ctx.fillStyle = GLOVE; ctx.fill();
    ctx.lineWidth = 0.018; ctx.strokeStyle = LINE; ctx.stroke();
    [[-0.5, -0.02], [-0.48, 0.05], [-0.49, 0.12]].forEach(function (f) {
      ctx.beginPath(); ctx.ellipse(f[0], f[1], 0.045, 0.03, 0.2, 0, 6.2832); ctx.fillStyle = GLOVE; ctx.fill(); ctx.lineWidth = 0.014; ctx.strokeStyle = 'rgba(10,26,61,0.4)'; ctx.stroke();
    });
    ctx.restore();
    ctx.restore();

    var mouthEnd = swayed(faceToScreen(-0.36, 0.44));
    coil(ctx, cordFrom, mouthEnd, s, still ? 0 : t);
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
