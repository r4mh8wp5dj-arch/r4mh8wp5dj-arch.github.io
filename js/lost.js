(function () {
  var I = window.BP && window.BP.iso, cv = document.querySelector('.lost-art');
  if (!I || !cv) return;
  var DIM = [[5, 30, 72], [10, 40, 92], [15, 50, 107], [23, 62, 120]];
  function draw() {
    var F = I.fit(cv), ctx = F.ctx;
    ctx.clearRect(0, 0, F.w, F.h);
    var cam = I.fitCam(I.view(Math.PI / 4 - 0.22, 0.6), F.w, F.h, 5.4, -0.6, 0.6, 0.06, [2.7, 0, 2.7]);
    I.plate(ctx, cam, { palette: DIM, flow: 0.08 });
    var bx = 5.05, bz = 3.55, pc = I.project(cam, bx, -0.5, bz);
    var g = ctx.createRadialGradient(pc[0], pc[1] + cam.s * 0.1, 0, pc[0], pc[1] + cam.s * 0.1, cam.s * 0.8);
    g.addColorStop(0, 'rgba(0,0,0,0.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(pc[0], pc[1] + cam.s * 0.1, cam.s * 0.8, cam.s * 0.34, 0, 0, 6.2832);
    ctx.fill();
    var p = I.project(cam, bx, -0.03, bz);
    I.cubes(ctx, [{ x: -0.5, y: -0.5, z: -0.5, c: 3, k: 0.94 }], { M: I.mul(cam.M, I.mul(I.rotY(0.42), I.rotZ(0.08))), s: cam.s, x: p[0], y: p[1], pivot: [0, 0, 0] });
  }
  window.addEventListener('resize', draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  draw();
})();
