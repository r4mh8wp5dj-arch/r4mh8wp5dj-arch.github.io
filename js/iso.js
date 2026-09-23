(function (g) {
  var HEX = ['#E84D3D', '#3D70D9', '#4DB06E', '#F2B03B', '#A854CA', '#2EB5C4'];
  var RGB = HEX.map(function (h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  });
  var LIGHT = norm([-0.55, 0.8, 0.5]);
  var cache = {};

  var CORNERS = [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]];
  var FACES = [
    { v: [4, 5, 6, 7], n: [0, 1, 0] },
    { v: [0, 3, 2, 1], n: [0, -1, 0] },
    { v: [1, 2, 6, 5], n: [1, 0, 0] },
    { v: [0, 4, 7, 3], n: [-1, 0, 0] },
    { v: [3, 7, 6, 2], n: [0, 0, 1] },
    { v: [0, 1, 5, 4], n: [0, 0, -1] }
  ];

  var SHAPES = {
    single: [[[0, 0, 0]]],
    domino: [[[0, 0, 0], [1, 0, 0]], [[0, 0, 0], [0, 1, 0]]],
    three: [[[0, 0, 0], [1, 0, 0], [2, 0, 0]]],
    ell: [[[0, 0, 0], [1, 0, 0], [0, 0, 1]], [[0, 0, 0], [0, 1, 0], [1, 0, 0]]],
    square: [[[0, 0, 0], [1, 0, 0], [0, 0, 1], [1, 0, 1]]],
    tee: [[[0, 0, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]]]
  };
  var WEIGHTS = [['single', 0.05], ['domino', 0.2], ['three', 0.25], ['ell', 0.25], ['square', 0.15], ['tee', 0.1]];

  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }

  function mul(A, B) {
    var r = new Array(9);
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) {
      r[i * 3 + j] = A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j];
    }
    return r;
  }
  function rotX(a) { var c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }
  function rotY(a) { var c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 1, 0, s, 0, c]; }
  function rotZ(a) { var c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; }
  function view(yaw, elev) { return mul(rotX(elev), rotY(yaw)); }
  function tf(M, x, y, z) {
    return [M[0] * x + M[1] * y + M[2] * z, M[3] * x + M[4] * y + M[5] * z, M[6] * x + M[7] * y + M[8] * z];
  }

  function tone(rgb, b, key) {
    var k = key + '|' + Math.round(b * 60);
    var hit = cache[k];
    if (hit) return hit;
    var out = rgb.map(function (c) {
      return Math.round(b <= 1 ? c * b : c + (255 - c) * Math.min(1, (b - 1) * 1.2));
    });
    return (cache[k] = 'rgb(' + out[0] + ',' + out[1] + ',' + out[2] + ')');
  }

  function faceLight(M) {
    return FACES.map(function (f) {
      var n = tf(M, f.n[0], f.n[1], f.n[2]);
      var d = n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2];
      return { vis: n[2] > 0.001, b: 0.6 + 0.58 * Math.max(0, d), top: f.n[1] === 1 };
    });
  }

  function cubes(ctx, items, cam) {
    var M = cam.M, s = cam.s, ox = cam.x, oy = cam.y, P = cam.pivot || [0, 0, 0];
    var fl = faceLight(M);
    var list = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var k = it.k == null ? 1 : it.k;
      var cx = it.x + 0.5 - P[0], cy = it.y + 0.5 - P[1], cz = it.z + 0.5 - P[2];
      var c = tf(M, cx, cy, cz);
      var sq = it.sq || 0;
      list.push({ it: it, k: k, h: 1 - sq, w: 1 + sq * 0.55, cx: cx, cy: cy, cz: cz, d: c[2] });
    }
    list.sort(function (a, b) { return a.d - b.d; });
    var lw = Math.max(0.6, s * 0.035);
    ctx.lineJoin = 'round';
    for (var n = 0; n < list.length; n++) {
      var e = list[n], it2 = e.it;
      var pts = new Array(8);
      for (var q = 0; q < 8; q++) {
        var C = CORNERS[q];
        var v = tf(M, e.cx + (C[0] - 0.5) * e.k * e.w, e.cy + (C[1] - 0.5) * e.k * e.h - (1 - e.h) * 0.5 * e.k, e.cz + (C[2] - 0.5) * e.k * e.w);
        pts[q] = [ox + v[0] * s, oy - v[1] * s];
      }
      var rgb = it2.rgb || RGB[it2.c];
      var key = it2.rgb ? it2.rgb.join(',') : it2.c;
      ctx.globalAlpha = it2.a == null ? 1 : it2.a;
      for (var f = 0; f < 6; f++) {
        if (!fl[f].vis) continue;
        var V = FACES[f].v;
        ctx.beginPath();
        ctx.moveTo(pts[V[0]][0], pts[V[0]][1]);
        ctx.lineTo(pts[V[1]][0], pts[V[1]][1]);
        ctx.lineTo(pts[V[2]][0], pts[V[2]][1]);
        ctx.lineTo(pts[V[3]][0], pts[V[3]][1]);
        ctx.closePath();
        if (it2.ghost) {
          ctx.strokeStyle = tone(rgb, 1.25, key);
          ctx.lineWidth = lw * 1.4;
          ctx.stroke();
          continue;
        }
        var b = fl[f].b + (it2.f || 0) * 0.9;
        ctx.fillStyle = tone(rgb, b, key);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = lw;
        ctx.stroke();
        if (fl[f].top && s * e.k > 14) {
          var mx = (pts[V[0]][0] + pts[V[2]][0]) / 2, my = (pts[V[0]][1] + pts[V[2]][1]) / 2;
          ctx.beginPath();
          for (var r = 0; r < 4; r++) {
            var px = mx + (pts[V[r]][0] - mx) * 0.72, py = my + (pts[V[r]][1] - my) * 0.72;
            if (r) ctx.lineTo(px, py); else ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.fillStyle = tone(rgb, b + 0.07, key);
          ctx.fill();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function project(cam, x, y, z) {
    var P = cam.pivot || [0, 0, 0];
    var v = tf(cam.M, x - P[0], y - P[1], z - P[2]);
    return [cam.x + v[0] * cam.s, cam.y - v[1] * cam.s, v[2]];
  }

  function unproject(cam, sx, sy, h) {
    var M = cam.M, P = cam.pivot || [0, 0, 0];
    var vx = (sx - cam.x) / cam.s, vy = -(sy - cam.y) / cam.s;
    var t = (h - P[1] - M[1] * vx - M[4] * vy) / M[7];
    return [M[0] * vx + M[3] * vy + M[6] * t + P[0], M[2] * vx + M[5] * vy + M[8] * t + P[2]];
  }

  function poly(ctx, cam, pts) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var p = project(cam, pts[i][0], pts[i][1], pts[i][2]);
      if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    }
    ctx.closePath();
  }

  function rr(half, r, y, c, seg) {
    var pts = [], corners = [[half - r, half - r, 0], [-(half - r), half - r, 0.5], [-(half - r), -(half - r), 1], [half - r, -(half - r), 1.5]];
    corners.forEach(function (k) {
      for (var i = 0; i <= seg; i++) {
        var a = (k[2] + i / seg * 0.5) * Math.PI;
        pts.push([c + k[0] + Math.cos(a) * r, y, c + k[1] + Math.sin(a) * r]);
      }
    });
    return pts;
  }

  function path(ctx, cam, pts, close) {
    ctx.beginPath();
    for (var i = 0; i < pts.length; i++) {
      var p = project(cam, pts[i][0], pts[i][1], pts[i][2]);
      if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]);
    }
    if (close !== false) ctx.closePath();
  }

  var PLATE = [61, 68, 84];
  function shade(rgb, b) { return 'rgb(' + rgb.map(function (c) { return Math.round(Math.min(255, c * b)); }).join(',') + ')'; }

  function plate(ctx, cam, o) {
    o = o || {};
    var n = o.n || 4, c = n / 2, s = cam.s;
    var outer = c + 0.35, open = c + 0.02, rimY = 0.08, botY = -0.5;
    var led = o.led || [115, 204, 255], glow = o.glow == null ? 1 : o.glow;
    ctx.save();
    var sc = project(cam, c, botY - 0.25, c);
    var g = ctx.createRadialGradient(sc[0], sc[1], 0, sc[0], sc[1], outer * s * 1.25);
    g.addColorStop(0, 'rgba(0,0,0,0.32)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(sc[0], sc[1], outer * s * 1.3, outer * s * 0.6, 0, 0, 6.2832);
    ctx.fill();

    var top = rr(outer, 0.16, rimY, c, 5), bot = rr(outer - 0.12, 0.14, botY, c, 5);
    for (var i = 0; i < top.length; i++) {
      var j = (i + 1) % top.length;
      var nx = (top[i][0] + top[j][0]) / 2 - c, nz = (top[i][2] + top[j][2]) / 2 - c;
      var nv = tf(cam.M, nx, 0, nz);
      if (nv[2] <= 0) continue;
      var len = Math.hypot(nv[0], nv[2]) || 1;
      path(ctx, cam, [top[i], top[j], bot[j], bot[i]]);
      ctx.fillStyle = shade(PLATE, 0.62 - 0.18 * nv[0] / len);
      ctx.fill();
      ctx.strokeStyle = ctx.fillStyle;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    path(ctx, cam, top);
    ctx.fillStyle = shade(PLATE, 1.08);
    ctx.fill();
    path(ctx, cam, rr(open, 0.04, rimY, c, 2));
    ctx.fillStyle = '#0D1016';
    ctx.fill();
    path(ctx, cam, [[0, 0, 0], [n, 0, 0], [n, 0, n], [0, 0, n]]);
    ctx.fillStyle = '#181C26';
    ctx.fill();

    var gw = Math.max(0.8, s * 0.05), bw = Math.max(0.6, s * 0.03), ins = 0.06;
    ctx.lineCap = 'round';
    for (var x = 0; x < n; x++) for (var z = 0; z < n; z++) {
      var a = [x + ins, 0, z + ins], b = [x + 1 - ins, 0, z + ins], d = [x + 1 - ins, 0, z + 1 - ins], e = [x + ins, 0, z + 1 - ins];
      path(ctx, cam, [e, a, b], false);
      ctx.strokeStyle = 'rgba(0,0,0,0.38)';
      ctx.lineWidth = bw;
      ctx.stroke();
      path(ctx, cam, [b, d, e], false);
      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = gw;
    for (var k = 1; k < n; k++) {
      path(ctx, cam, [[k, 0, 0], [k, 0, n]], false); ctx.stroke();
      path(ctx, cam, [[0, 0, k], [n, 0, k]], false); ctx.stroke();
    }

    var ring = rr(open + 0.055, 0.135, rimY + 0.002, c, 6);
    var col = 'rgb(' + led.map(Math.round).join(',') + ')';
    var core = 'rgb(' + led.map(function (v) { return Math.round(v + (255 - v) * 0.45); }).join(',') + ')';
    ctx.lineJoin = 'round';
    ctx.shadowColor = col;
    ctx.shadowBlur = Math.max(4, s * 0.45) * glow;
    ctx.strokeStyle = col;
    ctx.lineWidth = Math.max(1.4, s * 0.1);
    path(ctx, cam, ring);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = core;
    ctx.lineWidth = Math.max(0.7, s * 0.045);
    ctx.stroke();
    ctx.restore();
  }

  function rotCells(cells) {
    var r = cells.map(function (c) { return [c[2], c[1], -c[0]]; });
    var mx = Math.min.apply(null, r.map(function (c) { return c[0]; }));
    var mz = Math.min.apply(null, r.map(function (c) { return c[2]; }));
    return r.map(function (c) { return [c[0] - mx, c[1], c[2] - mz]; });
  }

  function randomShape(rand) {
    rand = rand || Math.random;
    var t = rand(), acc = 0, cat = 'tee';
    for (var i = 0; i < WEIGHTS.length; i++) {
      acc += WEIGHTS[i][1];
      if (t < acc) { cat = WEIGHTS[i][0]; break; }
    }
    var bases = SHAPES[cat];
    var cells = bases[Math.floor(rand() * bases.length)];
    var turns = Math.floor(rand() * 4);
    for (var k = 0; k < turns; k++) cells = rotCells(cells);
    return { cat: cat, cells: cells };
  }

  function fit(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h, ctx: ctx };
  }

  function visible(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { cb(e.isIntersecting); });
    }, { rootMargin: '120px' }).observe(el);
  }

  g.BP = g.BP || {};
  g.BP.iso = {
    HEX: HEX, RGB: RGB, SHAPES: SHAPES,
    mul: mul, rotX: rotX, rotY: rotY, rotZ: rotZ, view: view, tf: tf,
    cubes: cubes, project: project, unproject: unproject, poly: poly,
    plate: plate, rotCells: rotCells, randomShape: randomShape,
    fit: fit, visible: visible,
    reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
})(window);
