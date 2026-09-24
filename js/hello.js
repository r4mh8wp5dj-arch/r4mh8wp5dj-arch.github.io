(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var LIMB = '#F4EEDC', PHONE = '#E84D3D', PHONE_DK = '#A8302A', INK = '#0A1A3D', DIAL = '#FFF4D6';
  var H = 0.47, LEG = 0.3, BODY = [1.15, 0.5 + LEG, 0.85], BASE = [0.3, 0, 1.75];
  var F, cam, on = false, t0 = 0;

  function lerp(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function P(w) { return I.project(cam, w[0], w[1], w[2]); }

  function resize() {
    F = I.fit(canvas);
    cam = I.fitCam(I.view(Math.PI / 4 - 0.22, 0.6), F.w, F.h, 2, -0.6, 1.9, 0.04, [1, 0.6, 1]);
    draw(0.8);
  }

  function limb(ctx, pts, w) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    if (pts.length === 3) ctx.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    else ctx.lineTo(pts[1][0], pts[1][1]);
    ctx.lineWidth = w;
    ctx.lineCap = 'round';
    ctx.strokeStyle = LIMB;
    ctx.stroke();
  }
  function dot(ctx, p, r, col) { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.2832); ctx.fillStyle = col; ctx.fill(); }

  function phoneBase(ctx, c, s) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.ellipse(c[0], c[1] + s * 0.03, s * 0.5, s * 0.14, 0, 0, 6.2832); ctx.fill();
    var bw = s * 0.46, tw = s * 0.32, bh = s * 0.4, y0 = c[1], y1 = c[1] - bh;
    ctx.beginPath();
    ctx.moveTo(c[0] - bw, y0);
    ctx.lineTo(c[0] - tw, y1);
    ctx.quadraticCurveTo(c[0], y1 - s * 0.06, c[0] + tw, y1);
    ctx.lineTo(c[0] + bw, y0);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, y1, 0, y0);
    g.addColorStop(0, '#F26A5B'); g.addColorStop(1, PHONE_DK);
    ctx.fillStyle = g;
    ctx.fill();
    [-1, 1].forEach(function (k) {
      ctx.beginPath(); ctx.ellipse(c[0] + k * tw * 0.72, y1 - s * 0.02, s * 0.07, s * 0.05, 0, 0, 6.2832);
      ctx.fillStyle = PHONE_DK; ctx.fill();
    });
    var d = [c[0], y0 - bh * 0.45], r = s * 0.17;
    dot(ctx, d, r, DIAL);
    for (var i = 0; i < 9; i++) {
      var a = -Math.PI * 0.35 + i * 0.62;
      dot(ctx, [d[0] + Math.cos(a) * r * 0.66, d[1] + Math.sin(a) * r * 0.66], r * 0.13, '#C9B98F');
    }
    dot(ctx, d, r * 0.3, PHONE);
    ctx.restore();
  }

  function cord(ctx, a, b, s, t) {
    var mid = [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + s * 0.35], n = 90, turns = 13, r = s * 0.045;
    ctx.beginPath();
    for (var i = 0; i <= n; i++) {
      var u = i / n, v = 1 - u;
      var x = v * v * a[0] + 2 * v * u * mid[0] + u * u * b[0];
      var y = v * v * a[1] + 2 * v * u * mid[1] + u * u * b[1];
      var ph = u * turns * 6.2832 + t * 1.5, e = Math.sin(Math.PI * u);
      x += Math.cos(ph) * r * e; y += Math.sin(ph) * r * 0.7 * e;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.lineWidth = Math.max(1, s * 0.028);
    ctx.strokeStyle = PHONE_DK;
    ctx.stroke();
  }

  function handset(ctx, ear, mouth, s) {
    var dx = mouth[0] - ear[0], dy = mouth[1] - ear[1], len = Math.hypot(dx, dy), nx = dy / len, ny = -dx / len;
    var ctl = [(ear[0] + mouth[0]) / 2 + nx * s * 0.2, (ear[1] + mouth[1]) / 2 + ny * s * 0.2];
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ear[0], ear[1]); ctx.quadraticCurveTo(ctl[0], ctl[1], mouth[0], mouth[1]);
    ctx.lineWidth = s * 0.15; ctx.strokeStyle = PHONE_DK; ctx.stroke();
    ctx.lineWidth = s * 0.11; ctx.strokeStyle = PHONE; ctx.stroke();
    [ear, mouth].forEach(function (p) {
      ctx.save();
      ctx.translate(p[0], p[1]); ctx.rotate(Math.atan2(dy, dx));
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.1, s * 0.16, 0, 0, 6.2832); ctx.fillStyle = PHONE; ctx.fill();
      ctx.lineWidth = s * 0.025; ctx.strokeStyle = PHONE_DK; ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    return ctl;
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

    var talk = I.reduce ? 0.5 : 0.5 + 0.5 * Math.sin(t * 9) * Math.max(0, Math.sin(t * 1.3));
    var bob = I.reduce ? 0 : Math.sin(t * 2.2) * 0.025;
    var sway = I.reduce ? 0 : Math.sin(t * 1.1) * 0.035;
    var body = add(BODY, [0, bob, 0]);

    var bc = P(BASE);

    var bottom = [[-H, -H, -H], [H, -H, -H], [H, -H, H], [-H, -H, H]].map(function (o) { return add(body, o); });
    var pb = bottom.map(P), front = 0;
    pb.forEach(function (p, i) { if (p[1] > pb[front][1]) front = i; });
    var n1 = bottom[(front + 1) % 4], n2 = bottom[(front + 3) % 4], fw = bottom[front];
    var foot = P([body[0], 0, body[2]]);

    ctx.save();
    ctx.translate(foot[0], foot[1]); ctx.rotate(sway); ctx.translate(-foot[0], -foot[1]);

    [lerp(fw, n1, 0.42), lerp(fw, n2, 0.42)].forEach(function (w) {
      var top = P(w), f = P([w[0], 0.03, w[2]]);
      limb(ctx, [top, [f[0], f[1] - s * 0.04]], s * 0.1);
      ctx.beginPath(); ctx.ellipse(f[0] + s * 0.03, f[1] - s * 0.02, s * 0.11, s * 0.06, 0, 0, 6.2832);
      ctx.fillStyle = PHONE; ctx.fill();
    });

    var mids = [[-H, 0.08, -H], [H, 0.08, -H], [H, 0.08, H], [-H, 0.08, H]].map(function (o) { return P(add(body, o)); });
    var left = mids.reduce(function (a, b) { return b[0] < a[0] ? b : a; });
    var right = mids.reduce(function (a, b) { return b[0] > a[0] ? b : a; });
    var top = P(add(body, [0, H, 0]));

    var ear = [left[0] - s * 0.04, top[1] + s * 0.02], mouth = [left[0] - s * 0.36, left[1] + s * 0.3];

    I.cubes(ctx, [{ x: -0.5, y: -0.5, z: -0.5, c: 1, k: 0.94 }], { M: cam.M, s: s, x: P(body)[0], y: P(body)[1], pivot: [0, 0, 0] });

    var fc = P(add(body, [0, 0.14, H])), side = P(add(body, [0.2, 0.14, H]));
    var ex = side[0] - fc[0], ey = side[1] - fc[1];
    var blink = I.reduce ? 1 : (t % 3.4 > 3.28 ? 0.15 : 1);
    [-1, 1].forEach(function (k) {
      var e = [fc[0] + ex * k, fc[1] + ey * k];
      ctx.beginPath(); ctx.ellipse(e[0], e[1], s * 0.055, s * 0.085 * blink, 0, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();
      if (blink > 0.5) dot(ctx, [e[0] + s * 0.018, e[1] - s * 0.03], s * 0.018, '#FFFFFF');
    });
    var m = P(add(body, [0, -0.14, H]));
    ctx.beginPath(); ctx.ellipse(m[0], m[1], s * 0.07, s * (0.02 + 0.05 * talk), 0, 0, 6.2832); ctx.fillStyle = INK; ctx.fill();

    var wave = I.reduce ? 0 : Math.sin(t * 3.2) * 0.12;
    var rElbow = [right[0] + s * 0.34, right[1] + s * 0.12], rHand = [right[0] + s * 0.5 - wave * s, right[1] - s * 0.22 - Math.abs(wave) * s * 0.4];
    limb(ctx, [right, rElbow, rHand], s * 0.09);
    dot(ctx, rHand, s * 0.085, LIMB);
    ctx.restore();

    ctx.save();
    ctx.translate(foot[0], foot[1]); ctx.rotate(sway); ctx.translate(-foot[0], -foot[1]);
    var ctl = handset(ctx, ear, mouth, s);
    var grip = [(ear[0] + mouth[0]) / 2 * 0.5 + ctl[0] * 0.5, (ear[1] + mouth[1]) / 2 * 0.5 + ctl[1] * 0.5];
    limb(ctx, [left, [left[0] - s * 0.36, left[1] + s * 0.2], grip], s * 0.09);
    dot(ctx, grip, s * 0.085, LIMB);
    ctx.restore();

    phoneBase(ctx, bc, s);
    var cs = Math.cos(sway), sn = Math.sin(sway), mx = mouth[0] - foot[0], my = mouth[1] - foot[1];
    cord(ctx, [bc[0] + s * 0.28, bc[1] - s * 0.22], [foot[0] + mx * cs - my * sn, foot[1] + mx * sn + my * cs], s, I.reduce ? 0 : t);
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
