(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var F, cam, cells = [], falling = null, clock = 0, last = 0;
  var order = [[0, 0, 1], [1, 0, 0], [0, 1, 2], [1, 1, 3], [0, 0, 5], [1, 0, 4], [1, 1, 1], [0, 1, 0], [0, 0, 3], [1, 1, 5]];
  var idx = 0;

  function resize() {
    F = I.fit(canvas);
    var s = Math.min(F.w / 3.6, F.h / 7.4);
    cam = { M: I.view(Math.PI / 4 - 0.2, 0.6), s: s, x: F.w / 2, y: F.h * 0.55, pivot: [1, 2.6, 1] };
    draw();
  }
  function height(x, z) {
    var h = 0;
    cells.forEach(function (c) { if (c.x === x && c.z === z) h = Math.max(h, c.y + 1); });
    return h;
  }
  function next() {
    if (cells.length >= 10) { cells = []; }
    var o = order[idx++ % order.length];
    falling = { x: o[0], z: o[1], c: o[2], y: 7, v: 0, to: height(o[0], o[1]) };
  }
  function draw() {
    var ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    I.pitBack(ctx, cam, { w: 2, d: 2, h: 5 });
    var items = cells.map(function (c) { return { x: c.x, y: c.y, z: c.z, c: c.c, f: c.f || 0 }; });
    if (falling) items.push({ x: falling.x, y: falling.y, z: falling.z, c: falling.c });
    I.cubes(ctx, items, cam);
    I.pitFront(ctx, cam, { w: 2, d: 2, h: 5 });
  }
  function frame(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    clock += dt;
    if (!falling && clock > 0.6) { clock = 0; next(); }
    if (falling) {
      falling.v += 30 * dt;
      falling.y -= falling.v * dt;
      if (falling.y <= falling.to) {
        cells.push({ x: falling.x, y: falling.to, z: falling.z, c: falling.c });
        falling = null;
        clock = 0;
      }
    }
    draw();
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', resize);
  resize();
  if (I.reduce) { order.slice(0, 6).forEach(function (o) { cells.push({ x: o[0], z: o[1], c: o[2], y: height(o[0], o[1]) }); }); draw(); return; }
  requestAnimationFrame(frame);
})();
