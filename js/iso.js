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
      list.push({ it: it, k: k, cx: cx, cy: cy, cz: cz, d: c[2] });
    }
    list.sort(function (a, b) { return a.d - b.d; });
    var lw = Math.max(0.6, s * 0.035);
    ctx.lineJoin = 'round';
    for (var n = 0; n < list.length; n++) {
      var e = list[n], it2 = e.it;
      var pts = new Array(8);
      for (var q = 0; q < 8; q++) {
        var C = CORNERS[q];
        var v = tf(M, e.cx + (C[0] - 0.5) * e.k, e.cy + (C[1] - 0.5) * e.k, e.cz + (C[2] - 0.5) * e.k);
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

  function walls(cam, w, d, h) {
    return [
      { n: [1, 0, 0], p: [[0, 0, 0], [0, 0, d], [0, h, d], [0, h, 0]] },
      { n: [-1, 0, 0], p: [[w, 0, 0], [w, 0, d], [w, h, d], [w, h, 0]] },
      { n: [0, 0, 1], p: [[0, 0, 0], [w, 0, 0], [w, h, 0], [0, h, 0]] },
      { n: [0, 0, -1], p: [[0, 0, d], [w, 0, d], [w, h, d], [0, h, d]] }
    ].map(function (wl) {
      wl.back = tf(cam.M, wl.n[0], wl.n[1], wl.n[2])[2] > 0;
      return wl;
    });
  }

  function pitBack(ctx, cam, o) {
    var w = o.w || 4, d = o.d || 4, h = o.h || 8;
    ctx.save();
    for (var x = 0; x < w; x++) for (var z = 0; z < d; z++) {
      poly(ctx, cam, [[x, 0, z], [x + 1, 0, z], [x + 1, 0, z + 1], [x, 0, z + 1]]);
      ctx.fillStyle = (x + z) % 2 ? 'rgba(46,34,24,0.78)' : 'rgba(58,44,31,0.78)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(242,140,107,0.16)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    walls(cam, w, d, h).forEach(function (wl) {
      if (!wl.back) return;
      poly(ctx, cam, wl.p);
      ctx.fillStyle = 'rgba(92,71,51,0.2)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (var y = 1; y < h; y++) {
        var a = wl.p[0], b = wl.p[1];
        poly(ctx, cam, [[a[0], y, a[2]], [b[0], y, b[2]]]);
        ctx.stroke();
      }
      if (o.danger) {
        var a2 = wl.p[0], b2 = wl.p[1];
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(255,77,94,0.45)';
        poly(ctx, cam, [[a2[0], o.danger, a2[2]], [b2[0], o.danger, b2[2]]]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    ctx.restore();
  }

  function pitFront(ctx, cam, o) {
    var w = o.w || 4, d = o.d || 4, h = o.h || 8;
    ctx.save();
    walls(cam, w, d, h).forEach(function (wl) {
      if (wl.back) return;
      poly(ctx, cam, wl.p);
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fill();
    });
    var rim = [[0, h, 0], [w, h, 0], [w, h, d], [0, h, d]];
    ctx.strokeStyle = 'rgba(242,140,107,0.95)';
    ctx.shadowColor = 'rgba(242,140,107,0.8)';
    ctx.shadowBlur = o.glow == null ? 12 : o.glow;
    ctx.lineWidth = Math.max(1.5, cam.s * 0.06);
    poly(ctx, cam, rim);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.lineWidth = Math.max(1, cam.s * 0.03);
    ctx.strokeStyle = 'rgba(242,140,107,0.45)';
    [[0, 0], [w, 0], [w, d], [0, d]].forEach(function (c) {
      poly(ctx, cam, [[c[0], 0, c[1]], [c[0], h, c[1]]]);
      ctx.stroke();
    });
    poly(ctx, cam, [[0, 0, 0], [w, 0, 0], [w, 0, d], [0, 0, d]]);
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
    pitBack: pitBack, pitFront: pitFront, rotCells: rotCells, randomShape: randomShape,
    fit: fit, visible: visible,
    reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
})(window);
