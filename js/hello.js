(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var BASE = [[0, 0, 2], [1, 0, 1], [0, 1, 0]], WAVER = [1, 1, 3], CYCLE = 4.2;
  var F, cam, on = false, t0 = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function backOut(t) { var c = 1.7; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; }

  function resize() {
    F = I.fit(canvas);
    cam = I.fitCam(I.view(Math.PI / 4 - 0.2, 0.6), F.w, F.h, 2, -1.7, 3.4, 0.1, [1, 1, 1]);
    cam.x -= F.w * 0.08;
    cam.y += F.h * 0.04;
    draw(1.1);
  }

  function bubble(ctx, anchor, k, alpha) {
    if (k <= 0 || alpha <= 0) return;
    var s = cam.s, w = s * 1.25, h = s * 0.78, r = h * 0.32;
    var cx = anchor[0] + s * 0.95, cy = anchor[1] - s * 0.95;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(anchor[0], anchor[1]);
    ctx.scale(k, k);
    ctx.translate(-anchor[0], -anchor[1]);
    ctx.shadowColor = 'rgba(4,8,24,0.35)';
    ctx.shadowBlur = s * 0.25;
    ctx.shadowOffsetY = s * 0.06;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + r, cy - h / 2);
    ctx.arcTo(cx + w / 2, cy - h / 2, cx + w / 2, cy + h / 2, r);
    ctx.arcTo(cx + w / 2, cy + h / 2, cx - w / 2, cy + h / 2, r);
    ctx.lineTo(cx - w * 0.12, cy + h / 2);
    ctx.lineTo(anchor[0] + s * 0.08, anchor[1] - s * 0.05);
    ctx.lineTo(cx - w * 0.34, cy + h / 2);
    ctx.arcTo(cx - w / 2, cy + h / 2, cx - w / 2, cy - h / 2, r);
    ctx.arcTo(cx - w / 2, cy - h / 2, cx + w / 2, cy - h / 2, r);
    ctx.closePath();
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#0A1A3D';
    ctx.font = '700 ' + Math.round(s * 0.46) + 'px Nippo';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Hi!', cx, cy + s * 0.03);
    ctx.restore();
  }

  function draw(t) {
    var ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    var led = [207, 120, 230];
    if (window.BP.sky) {
      var r = canvas.getBoundingClientRect(), dh = Math.max(1, document.documentElement.scrollHeight);
      led = window.BP.sky.led(window.BP.sky.pageU((window.scrollY + r.top + r.height / 2) / dh));
    }
    I.plate(ctx, cam, { n: 2, led: led });
    I.cubes(ctx, BASE.map(function (b) { return { x: b[0], y: 0, z: b[1], c: b[2] }; }), cam);

    var hop = seg(t, 0, 0.36), lift = Math.sin(Math.PI * hop) * 0.32;
    var wave = seg(t, 0.36, 1.76), env = Math.sin(Math.PI * wave);
    var angle = 0.2 * Math.sin(wave * Math.PI * 4) * env;
    var sq = t > 0.36 && t < 0.5 ? 0.12 * Math.sin(Math.PI * seg(t, 0.36, 0.5)) : 0;
    var base = I.project(cam, WAVER[0] + 0.5, lift, WAVER[1] + 0.5);
    ctx.save();
    ctx.translate(base[0], base[1]);
    ctx.rotate(angle);
    ctx.translate(-base[0], -base[1]);
    I.cubes(ctx, [{ x: WAVER[0], y: lift, z: WAVER[1], c: WAVER[2], sq: sq }], cam);
    ctx.restore();

    var top = I.project(cam, WAVER[0] + 0.5, 1.05 + lift, WAVER[1] + 0.5);
    var pop = seg(t, 0.3, 0.56), fade = 1 - seg(t, 3.4, 3.8);
    bubble(ctx, top, pop > 0 ? backOut(pop) : 0, fade);
  }

  function frame(now) {
    if (!on) return;
    if (!t0) t0 = now;
    draw(((now - t0) / 1000) % CYCLE);
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (!on) draw(1.1); });
  resize();
  if (I.reduce) return;
  I.visible(canvas, function (v) {
    if (v && !on) { on = true; t0 = 0; requestAnimationFrame(frame); }
    else if (!v) on = false;
  });
})();
