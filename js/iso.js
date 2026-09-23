(function (g) {
  var HEX = ['#E84D3D', '#3D70D9', '#4DB06E', '#F2B03B', '#A854CA', '#2EB5C4'];
  var RGB = HEX.map(function (h) {
    return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)];
  });
  var LIGHT = norm([-0.55, 0.8, 0.5]);
  var cache = {};

  var CORNERS = [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1], [0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]];
  var FACES = [
    { v: [4, 5, 6, 7], n: [0, 1, 0], uv: [4, 5, 7, 6] },
    { v: [0, 3, 2, 1], n: [0, -1, 0], uv: [0, 1, 3, 2] },
    { v: [1, 2, 6, 5], n: [1, 0, 0], uv: [5, 6, 1, 2] },
    { v: [0, 4, 7, 3], n: [-1, 0, 0], uv: [7, 4, 3, 0] },
    { v: [3, 7, 6, 2], n: [0, 0, 1], uv: [7, 6, 3, 2] },
    { v: [0, 1, 5, 4], n: [0, 0, -1], uv: [5, 4, 1, 0] }
  ];
  var RR = (function () {
    function ring(ins, rad, seg) {
      var out = [], lo = ins + rad, hi = 1 - ins - rad;
      [[hi, lo, -0.5], [hi, hi, 0], [lo, hi, 0.5], [lo, lo, 1]].forEach(function (c) {
        for (var i = 0; i <= seg; i++) {
          var a = (c[2] + i / seg * 0.5) * Math.PI;
          out.push([c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad]);
        }
      });
      return out;
    }
    return { outer: ring(0.055, 0.2, 4), inner: ring(0.085, 0.16, 4), face: ring(0.0, 0.1, 3) };
  })();
  function shadeRgb(rgb, k, add) { return rgb.map(function (c) { return Math.max(0, Math.min(255, (c + (add || 0)) * k)); }); }
  function css(c, a) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + (a == null ? 1 : a) + ')'; }

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
      if (it2.custom) { ctx.globalAlpha = 1; it2.custom(ctx); continue; }
      var rgb = it2.rgb || RGB[it2.c];
      var key = it2.rgb ? it2.rgb.join(',') : it2.c;
      ctx.globalAlpha = it2.a == null ? 1 : it2.a;
      for (var f = 0; f < 6; f++) {
        if (!fl[f].vis || (it2.hide && it2.hide[f])) continue;
        var V = FACES[f].v;
        ctx.beginPath();
        ctx.moveTo(pts[V[0]][0], pts[V[0]][1]);
        ctx.lineTo(pts[V[1]][0], pts[V[1]][1]);
        ctx.lineTo(pts[V[2]][0], pts[V[2]][1]);
        ctx.lineTo(pts[V[3]][0], pts[V[3]][1]);
        ctx.closePath();
        if (it2.flat) {
          ctx.fillStyle = 'rgb(' + rgb.join(',') + ')';
          ctx.fill();
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = 1;
          ctx.stroke();
          continue;
        }
        var b = fl[f].b + (it2.f || 0) * 0.9;
        if (s * e.k < 14) {
          ctx.fillStyle = tone(rgb, b, key);
          ctx.fill();
          continue;
        }
        var U = FACES[f].uv, P00 = pts[U[0]], P10 = pts[U[1]], P01 = pts[U[2]], P11 = pts[U[3]];
        var map = function (u, v) {
          return [P00[0] + (P10[0] - P00[0]) * u + (P01[0] - P00[0]) * v + (P11[0] - P10[0] - P01[0] + P00[0]) * u * v,
                  P00[1] + (P10[1] - P00[1]) * u + (P01[1] - P00[1]) * v + (P11[1] - P10[1] - P01[1] + P00[1]) * u * v];
        };
        var lit = Math.min(1.25, b), up = map(0.5, 0), dn = map(0.5, 1);
        var gr = ctx.createLinearGradient(up[0], up[1], dn[0], dn[1]);
        gr.addColorStop(0, css(shadeRgb(rgb, lit, 61)));
        gr.addColorStop(0.5, css(shadeRgb(rgb, lit)));
        gr.addColorStop(1, css(shadeRgb(rgb, lit * 0.66)));
        ctx.beginPath();
        RR.face.forEach(function (q, i) { var m = map(q[0], q[1]); if (i) ctx.lineTo(m[0], m[1]); else ctx.moveTo(m[0], m[1]); });
        ctx.closePath();
        ctx.fillStyle = gr;
        ctx.fill();
        var side = Math.hypot(P10[0] - P00[0], P10[1] - P00[1]) + Math.hypot(P01[0] - P00[0], P01[1] - P00[1]);
        ctx.beginPath();
        RR.outer.forEach(function (q, i) { var m = map(q[0], q[1]); if (i) ctx.lineTo(m[0], m[1]); else ctx.moveTo(m[0], m[1]); });
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.28 * Math.min(1, lit)) + ')';
        ctx.lineWidth = Math.max(0.7, side * 0.5 * 0.028);
        ctx.stroke();
        ctx.beginPath();
        RR.inner.forEach(function (q, i) { var m = map(q[0], q[1]); if (i) ctx.lineTo(m[0], m[1]); else ctx.moveTo(m[0], m[1]); });
        ctx.closePath();
        ctx.strokeStyle = css(shadeRgb(rgb, 0.5 * lit), 0.4);
        ctx.lineWidth = Math.max(0.5, side * 0.5 * 0.012);
        ctx.stroke();
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
    var outer = c + 0.35, open = c + 0.02, rimY = 0.02, botY = -0.5;
    ctx.save();
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.42)';
    ctx.shadowBlur = s * 0.9;
    ctx.shadowOffsetX = 10000 * (ctx.getTransform ? ctx.getTransform().a : 1);
    ctx.translate(-10000, 0);
    path(ctx, cam, rr(outer * 1.02, 0.5, botY - 0.2, c, 6));
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

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

    ring(ctx, cam, o);
    ctx.restore();
  }

  function ringPoints(o) {
    var n = o.n || 4, c = n / 2, open = c + 0.02;
    var pts = rr(open + 0.055, 0.135, 0.004, c, 8), acc = [0];
    for (var i = 1; i <= pts.length; i++) {
      var a = pts[i - 1], b = pts[i % pts.length];
      acc.push(acc[i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]));
    }
    return { pts: pts, acc: acc, len: acc[acc.length - 1] };
  }

  function channelPalette(o) {
    if (o.palette) return o.palette;
    var led = o.led || [115, 204, 255];
    return [0.55, 0.7, 0.85, 1].map(function (k) { return led.map(function (v) { return v * k; }); });
  }

  function ring(ctx, cam, o) {
    var n = o.n || 4, c = n / 2, s = cam.s;
    var gain = o.gain == null ? 1 : o.gain, flow = o.flow || 0;
    var pal = channelPalette(o), R = ringPoints(o);
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    var N = 180, pts = R.pts;
    function at(d) {
      for (var i = 1; i < R.acc.length; i++) {
        if (d <= R.acc[i]) {
          var f = (d - R.acc[i - 1]) / (R.acc[i] - R.acc[i - 1] || 1), a = pts[i - 1], b = pts[i % pts.length];
          return [a[0] + (b[0] - a[0]) * f, a[1], a[2] + (b[2] - a[2]) * f];
        }
      }
      return pts[0];
    }
    function colorAt(pos) {
      var x = ((pos * 12) % 4 + 4) % 4, i = Math.floor(x), f = x - i;
      f = f * f * (3 - 2 * f);
      var a = pal[i], b = pal[(i + 1) % 4];
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f].map(function (v) { return Math.min(255, v * gain); });
    }
    var sp = [];
    for (var k = 0; k <= N; k++) { var w = at(k / N * R.len); sp.push(project(cam, w[0], w[1], w[2])); }
    var avg = [0, 0, 0];
    pal.forEach(function (c2) { avg[0] += c2[0] / 4; avg[1] += c2[1] / 4; avg[2] += c2[2] / 4; });
    avg = avg.map(function (v) { return Math.min(255, v * gain); });
    ctx.lineCap = 'round';
    ctx.beginPath();
    sp.forEach(function (q, i) { if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
    ctx.closePath();
    ctx.strokeStyle = css(avg, 0.55);
    ctx.lineWidth = Math.max(1.4, s * 0.1);
    ctx.shadowColor = css(avg);
    ctx.shadowBlur = Math.max(4, s * 0.4) * Math.min(2, gain);
    ctx.stroke();
    ctx.shadowBlur = 0;
    for (var j = 0; j < N; j++) {
      var c1 = colorAt(j / N + flow);
      ctx.beginPath();
      ctx.moveTo(sp[j][0], sp[j][1]);
      ctx.lineTo(sp[j + 1][0], sp[j + 1][1]);
      ctx.strokeStyle = css(c1);
      ctx.lineWidth = Math.max(1.2, s * 0.085);
      ctx.stroke();
      ctx.strokeStyle = css(c1.map(function (v) { return v + (255 - v) * 0.45; }));
      ctx.lineWidth = Math.max(0.6, s * 0.035);
      ctx.stroke();
    }
    ctx.restore();
  }


  function fitCam(M, w, h, n, y0, y1, pad, pivot) {
    var b = [1e9, -1e9, 1e9, -1e9], lo = -0.4, hi = n + 0.4;
    [lo, hi].forEach(function (x) { [y0, y1].forEach(function (y) { [lo, hi].forEach(function (z) {
      var v = tf(M, x - pivot[0], y - pivot[1], z - pivot[2]);
      b[0] = Math.min(b[0], v[0]); b[1] = Math.max(b[1], v[0]); b[2] = Math.min(b[2], v[1]); b[3] = Math.max(b[3], v[1]);
    }); }); });
    var s = Math.min(w * (1 - pad) / (b[1] - b[0]), h * (1 - pad) / (b[3] - b[2]));
    return { M: M, s: s, x: w / 2 - (b[0] + b[1]) / 2 * s, y: h / 2 + (b[2] + b[3]) / 2 * s, pivot: pivot };
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
    plate: plate, fitCam: fitCam, faces: FACES, rotCells: rotCells, randomShape: randomShape,
    fit: fit, visible: visible,
    reduce: window.matchMedia('(prefers-reduced-motion: reduce)').matches
  };
})(window);
