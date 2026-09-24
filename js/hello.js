(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var FLOOR = [[0, 0, 1], [1, 0, 2], [0, 1, 0], [3, 0, 0], [0, 3, 1]];
  var WAIT = [2, 2, 3], LAND = [1, 2], CYCLE = 5.6, DROP = 2.6, HIT = 2.9, BURST = 3.25, BACK = 4.8;
  var F, cam, on = false, t0 = 0;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function easeOut(t) { return 1 - (1 - t) * (1 - t); }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
  function rgb(c, a) { return 'rgba(' + c.map(Math.round).join(',') + ',' + a + ')'; }

  function resize() {
    F = I.fit(canvas);
    cam = I.fitCam(I.view(Math.PI / 4 - 0.22, 0.6), F.w, F.h, 4, -0.6, 4.2, 0.08, [2, 1, 2]);
    draw(1.4);
  }

  function ghostTile(ctx, x, z, alpha) {
    var col = I.RGB[WAIT[2]], h = 0.395, rad = 0.13, pts = [];
    [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]].forEach(function (k) {
      for (var q = 0; q <= 4; q++) {
        var ang = (k[2] + q / 4) * Math.PI / 2;
        pts.push([x + 0.5 + k[0] * (h - rad) + Math.cos(ang) * rad, 0.018, z + 0.5 + k[1] * (h - rad) + Math.sin(ang) * rad]);
      }
    });
    ctx.save();
    ctx.globalAlpha = alpha;
    I.poly(ctx, cam, pts);
    ctx.fillStyle = rgb(col, 0.12);
    ctx.fill();
    ctx.lineWidth = Math.max(1.2, cam.s * 0.05);
    ctx.strokeStyle = rgb(col, 0.9);
    ctx.stroke();
    ctx.restore();
  }

  function frags(t) {
    var out = [], tau = t - BURST;
    if (tau < 0 || tau > 0.8) return out;
    [[WAIT[0], WAIT[1]], LAND].forEach(function (o, n) {
      var R = rng(11 + n * 7);
      for (var i = 0; i < 8; i++) {
        var a = R() * 6.2832, sp = 0.9 + R() * 1.6, vy = 1.9 + R() * 1.4;
        out.push({ x: o[0] + 0.25 + Math.cos(a) * sp * tau, y: 0.25 + vy * tau - 3.75 * tau * tau, z: o[1] + 0.25 + Math.sin(a) * sp * tau, c: WAIT[2], k: 0.28 * (1 - tau / 0.8), lo: true });
      }
    });
    return out;
  }

  function draw(t) {
    var ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    var led = [115, 204, 255];
    if (window.BP.sky) {
      var r = canvas.getBoundingClientRect(), dh = Math.max(1, document.documentElement.scrollHeight);
      led = window.BP.sky.led(window.BP.sky.pageU((window.scrollY + r.top + r.height / 2) / dh));
    }
    var pulse = t >= BURST ? Math.pow(1 - seg(t, BURST, BURST + 0.9), 2) : 0;
    I.plate(ctx, cam, { led: led, gain: 1 + pulse * 1.2, flow: t / 12 });

    var fadeIn = seg(t, BACK, BACK + 0.6), alive = t < BURST || t >= BACK;
    var glow = t >= HIT && t < BURST ? 0.35 + 0.35 * Math.sin((t - HIT) * 30) : 0;
    var items = FLOOR.map(function (b) { return { x: b[0], y: 0, z: b[1], c: b[2] }; });
    if (alive) items.push({ x: WAIT[0], y: 0, z: WAIT[1], c: WAIT[2], f: glow, k: t >= BACK ? 0.2 + 0.8 * easeOut(fadeIn) : 1 });

    var fall = seg(t, DROP, HIT), hy = 2.1 + (I.reduce ? 0 : Math.sin(t * 2.4) * 0.12);
    var y = t < DROP ? hy : hy * (1 - fall * fall);
    var sq = t >= HIT && t < HIT + 0.16 ? 0.2 * Math.sin(Math.PI * seg(t, HIT, HIT + 0.16)) : 0;
    if (t < DROP) ghostTile(ctx, LAND[0], LAND[1], 1);
    if (t < DROP) items.push({ x: LAND[0], y: 0, z: LAND[1], rgb: I.RGB[WAIT[2]], flat: true, a: 0.32, k: 0.86 });
    if (t < BURST) items.push({ x: LAND[0], y: y, z: LAND[1], c: WAIT[2], f: glow, sq: sq });
    I.cubes(ctx, items.concat(frags(t)), cam);
  }

  function frame(now) {
    if (!on) return;
    if (!t0) t0 = now;
    draw(((now - t0) / 1000) % CYCLE);
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
