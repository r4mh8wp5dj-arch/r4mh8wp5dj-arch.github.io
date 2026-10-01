(function () {
  var I = window.BP && window.BP.iso;
  var nodes = document.querySelectorAll('canvas[data-buddy]');
  if (!I || !nodes.length) return;
  var HEX = { red: '#E84D3D', blue: '#3D70D9', green: '#4DB06E', yellow: '#F2B03B', purple: '#A854C9', cyan: '#2EB5C4' };
  var INK = '#14224E', WHITE = '#FFFFFF', GLOVE = '#C9D6F2', PINK = '#FF8FA8', TONGUE = '#F0728A', IVORY = '#FFF4D6';
  var SHOE = '#E5483A', SHOE_LT = '#FF7A68', SHADOW = 'rgba(8,10,40,0.38)', FPS = 12;
  var g;

  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function mix(h, t, f) {
    var a = rgb(h), b = rgb(t);
    return '#' + [0, 1, 2].map(function (i) { var v = Math.round(a[i] + (b[i] - a[i]) * f); return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  function pal(name) {
    var c = HEX[name];
    return { b0: mix(c, '#ffffff', 0.4), b1: mix(c, '#ffffff', 0.2), b2: c, b3: mix(c, '#000000', 0.16), b4: mix(c, '#000000', 0.3), hi: mix(c, '#ffffff', 0.62), limb: mix(c, '#000000', 0.32) };
  }
  function px(x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function line(x0, y0, x1, y1, w, c) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1), o = Math.floor(w / 2);
    g.fillStyle = c;
    for (var i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, w, w);
  }
  function lerp(a, b, u) { return a + (b - a) * u; }

  function cube(x, y, s, P) {
    var inset = s >= 22 ? [3, 2, 1, 1] : [2, 1, 1], n = inset.length;
    for (var i = 0; i < s; i++) {
      var ins = i < n ? inset[i] : (i >= s - n ? inset[s - 1 - i] : 0), x0 = x + ins, x1 = x + s - 1 - ins;
      var c = i === 0 ? P.b0 : (i === s - 1 ? P.b4 : (i >= s - 3 ? P.b3 : (i < Math.round(s * 0.22) ? P.b1 : P.b2)));
      rect(x0, y + i, x1 - x0 + 1, 1, c);
      if (i > 0 && i < s - 2) { px(x0, y + i, P.b1); px(x1, y + i, P.b3); }
    }
    rect(x + 3 + (s > 20 ? 1 : 0), y + 2, Math.max(3, Math.round(s * 0.24)), 1, P.hi);
    px(x + 2 + (s > 20 ? 1 : 0), y + 3, P.hi);
  }
  function eye(x, y, h, blink, style) {
    if (style === 'happy') { px(x - 1, y + 2, INK); px(x, y + 1, INK); px(x + 1, y + 1, INK); px(x + 2, y + 2, INK); return; }
    if (blink) { rect(x, y + h - 1, 2, 1, INK); return; }
    rect(x, y, 2, h, INK); px(x, y, WHITE);
  }
  function mouth(x, y, kind) {
    if (kind === 0) { rect(x, y + 1, 4, 1, INK); px(x - 1, y, INK); px(x + 4, y, INK); }
    else if (kind === 1) { rect(x, y, 4, 3, INK); rect(x + 1, y + 2, 2, 1, TONGUE); rect(x + 1, y, 2, 1, WHITE); }
    else if (kind === 2) { rect(x + 1, y, 2, 3, INK); }
    else if (kind === 3) { rect(x, y, 4, 2, INK); rect(x + 1, y, 2, 1, WHITE); }
    else { rect(x - 1, y, 6, 1, INK); rect(x, y + 1, 4, 2, INK); rect(x + 1, y + 2, 2, 1, TONGUE); }
  }
  function cheek(x, y) { rect(x, y, 3, 2, PINK); }
  function glove(x, y) { rect(x - 2, y - 2, 4, 4, WHITE); rect(x - 2, y + 1, 4, 1, GLOVE); px(x - 2, y - 2, GLOVE); }
  function shoe(x, y) { rect(x - 1, y, 6, 2, SHOE); rect(x - 1, y + 2, 6, 1, IVORY); px(x, y, SHOE_LT); }
  function shadow(cx, y, w) { g.fillStyle = SHADOW; g.fillRect(Math.round(cx - w / 2), y, w, 1); g.fillRect(Math.round(cx - w / 2) + 2, y + 1, w - 4, 1); }
  function spark(x, y, c) { px(x, y, c); px(x - 1, y, 'rgba(255,255,255,0.55)'); px(x + 1, y, 'rgba(255,255,255,0.55)'); px(x, y - 1, 'rgba(255,255,255,0.55)'); px(x, y + 1, 'rgba(255,255,255,0.55)'); }
  function miniCube(x, y, c) {
    rect(x, y, 6, 6, c); rect(x, y, 6, 1, mix(c, '#ffffff', 0.45)); rect(x, y + 5, 6, 1, mix(c, '#000000', 0.3));
    px(x, y, 'rgba(0,0,0,0)'); px(x + 1, y + 1, mix(c, '#ffffff', 0.45)); rect(x + 5, y + 1, 1, 4, mix(c, '#000000', 0.18));
  }

  var SHAPES = {
    single: { S: 12, cells: [[0, 0]], face: 0 },
    domino: { S: 10, cells: [[0, 0], [1, 0]], face: 0 },
    ell: { S: 10, cells: [[0, 0], [0, 1], [1, 1]], face: 1 }
  };
  function dims(sh) {
    var cols = 0, rows = 0;
    sh.cells.forEach(function (c) { cols = Math.max(cols, c[0] + 1); rows = Math.max(rows, c[1] + 1); });
    return { cols: cols, rows: rows, W: cols * sh.S, H: rows * sh.S };
  }

  function crit(P, f, pose, bx, sy, sh, o) {
    o = o || {};
    var S = sh.S, d = dims(sh), Wb = d.W, Hb = d.H, rows = d.rows, sit = pose === 'sit', lean = o.lean || 0;
    var hop = pose === 'hop' ? [0, 2, 4, 4, 3, 1, 0, 0][f % 8] : 0, legH = pose === 'crouch' ? 2 : 4;
    var by = sit ? sy - Hb : sy - Hb - legH - 3 - hop, blink = f % 40 >= 38;
    var bb = bx + lean, rx = bb + Wb, sh0 = by + (rows - 1) * S + Math.round(S * 0.66), Lh, Rh;
    if (o.hands) { var hh = o.hands(rx, sh0); Lh = hh[0]; Rh = hh[1]; }
    else if (pose === 'wave') { Lh = [bb - 2, sh0 + 5]; Rh = [rx + 2 + [0, 1, 2, 1][Math.floor(f / 2) % 4], by + 1]; }
    else if (pose === 'hop' || pose === 'air') { Lh = [bb - 3, by + 1]; Rh = [rx + 3, by + 1]; }
    else if (sit) { Lh = [bb - 1, sh0 + 4]; Rh = [rx + 1, sh0 + 4]; }
    else { Lh = [bb - 2, sh0 + 5]; Rh = [rx + 2, sh0 + 5]; }
    line(bb + 1, sh0, Lh[0], Lh[1], 2, P.limb); line(rx - 2, sh0, Rh[0], Rh[1], 2, P.limb);
    var bottom = sh.cells.filter(function (c) { return c[1] === rows - 1; }).map(function (c) { return c[0]; });
    var c0 = Math.min.apply(null, bottom), c1 = Math.max.apply(null, bottom);
    var legs = [bx + c0 * S + 2, bx + c1 * S + S - 4];
    if (sit) {
      var sw = Math.floor(f / 4) % 2;
      legs.forEach(function (lx0, i) {
        var lx = lx0 + (i ? 1 - sw : sw);
        rect(lx, sy, 2, 4, P.limb); rect(lx - 1, sy + 4, 4, 2, SHOE); rect(lx - 1, sy + 6, 4, 1, IVORY); px(lx - 1, sy + 4, SHOE_LT);
      });
    } else {
      legs.forEach(function (lx) {
        rect(lx, by + Hb, 2, legH, P.limb); rect(lx - 1, by + Hb + legH, 4, 2, SHOE); rect(lx - 1, by + Hb + legH + 2, 4, 1, IVORY); px(lx - 1, by + Hb + legH, SHOE_LT);
      });
    }
    sh.cells.forEach(function (c) { cube(bb + c[0] * S, by + c[1] * S, S, P); });
    var fc = sh.cells.filter(function (c) { return c[1] === sh.face; }).map(function (c) { return c[0]; });
    var fmin = Math.min.apply(null, fc), fmax = Math.max.apply(null, fc), fw = (fmax - fmin + 1) * S;
    var cx = bb + fmin * S + fw / 2, ft = by + sh.face * S, dx = Math.max(2, Math.round(fw * 0.2)), ey = ft + Math.round(S * 0.33);
    var lo = pose === 'look' ? [0, 0, 1, 1, 0, 0, -1, -1][Math.floor(f / 6) % 8] : 0, happy = pose === 'hop' || pose === 'air' ? 'happy' : null;
    if (o.strain) {
      rect(cx - dx - 1, ey + 1, 2, 1, INK); rect(cx + dx - 1, ey + 1, 2, 1, INK);
      rect(cx - 2, ft + Math.round(S * 0.66), 4, 2, INK); rect(cx - 2, ft + Math.round(S * 0.66), 4, 1, WHITE);
    } else {
      eye(cx - dx - 1 + lo, ey, 3, blink, happy); eye(cx + dx - 1 + lo, ey, 3, blink, happy);
      mouth(cx - 2, ft + Math.round(S * 0.66), pose === 'wave' ? [3, 1][Math.floor(f / 3) % 2] : (pose === 'hop' || pose === 'air' ? 4 : 0));
    }
    rect(Math.max(bb + fmin * S + 1, cx - dx - 3), ft + Math.round(S * 0.58), 2, 1, PINK);
    rect(Math.min(bb + fmax * S + S - 3, cx + dx + 1), ft + Math.round(S * 0.58), 2, 1, PINK);
    glove(Lh[0], Lh[1]); glove(Rh[0], Rh[1]);
    return { by: by, rx: rx, sh0: sh0 };
  }

  function jetKid(P, f, bx, by) {
    var up = Math.floor(f / 4) % 2;
    line(bx + 1, by + 8, bx - 4, by + 1 + up, 2, P.limb); line(bx + 10, by + 8, bx + 16, by + 2 - up, 2, P.limb);
    [bx - 3, bx + 13].forEach(function (tx, i) {
      rect(tx, by + 2, 3, 8, '#D5DCEE'); rect(tx, by + 2, 1, 8, '#F3F6FC'); rect(tx + 2, by + 2, 1, 8, '#8E9BB8'); rect(tx, by + 1, 3, 1, '#8E9BB8');
      var fh = (f + i) % 2 ? 6 : 4;
      rect(tx, by + 10, 3, fh, '#FF8A3D'); rect(tx, by + 10, 3, fh - 2, '#FFD25A');
    });
    var kk = Math.floor(f / 3) % 2;
    [bx + 2 + kk, bx + 8 - kk].forEach(function (lx) {
      rect(lx, by + 12, 2, 4, P.limb); rect(lx - 1, by + 16, 4, 2, SHOE); rect(lx - 1, by + 18, 4, 1, IVORY);
    });
    cube(bx, by, 12, P);
    eye(bx + 3, by + 4, 3, false, 'happy'); eye(bx + 7, by + 4, 3, false, 'happy');
    rect(bx + 1, by + 7, 2, 1, PINK); rect(bx + 9, by + 7, 2, 1, PINK);
    mouth(bx + 4, by + 8, 4);
    glove(bx - 4, by + 1 + up); glove(bx + 16, by + 2 - up);
  }

  var KIDS = [
    { at: 0.1, pat: 0.16, color: 'green', pose: 'wave', off: 0, phone: true },
    { at: 0.46, pat: 0.7, color: 'cyan', pose: 'sit', off: 3, phone: true },
    { at: 0.84, pat: 0.5, color: 'red', pose: 'hop', off: 1, phone: false }
  ];

  var SCENES = {
    kid: function (canvas) {
      var P = pal(canvas.getAttribute('data-color') || 'blue'), pose = canvas.getAttribute('data-pose') || 'stand', sh = SHAPES[canvas.getAttribute('data-shape') || 'single'], d = dims(sh);
      var sit = pose === 'sit', w = d.W + 12, h = sit ? d.H + 13 : d.H + 16, sy = sit ? d.H + 6 : h;
      return { w: w, h: h, still: 1.2, draw: function (f) { crit(P, f, pose, 6, sy, sh); } };
    },
    push: {
      w: 54, h: 28, still: 0.55,
      draw: function (f) {
        var P = pal('yellow'), B = pal('green'), ph = f % 20, strain = ph >= 2 && ph < 12;
        var lean = strain ? (ph < 5 ? 1 : 2) : 0, shove = strain && ph >= 6 && ph < 10 ? 1 : 0;
        cube(33 + shove, 12, 16, B);
        crit(P, f, 'stand', 10, 28, SHAPES.single, { lean: lean, strain: strain, hands: function (rx, sh0) { return [[rx + 1, sh0 + 3], [rx + 2, sh0 - 1]]; } });
        if (strain) {
          var dy = Math.floor((ph % 6) / 2);
          px(21 + lean, 9 + dy, '#9FD8FF'); px(21 + lean, 10 + dy, '#9FD8FF');
          for (var i = 0; i < 3; i++) { var dx = (ph * 2 + i * 4) % 9; rect(8 - dx, 25 - i, 2, 1, 'rgba(255,255,255,' + (0.6 - dx * 0.05).toFixed(2) + ')'); }
        }
      }
    },
    ready: {
      w: 60, h: 30, still: 0.4,
      draw: function (f) {
        var P = pal('blue'), jit = f % 2, bx = 36 + jit, sy = 30, by = sy - 20;
        for (var i = 0; i < 8; i++) {
          var x = bx - 4 - i * 3, hgt = [12, 11, 10, 8, 7, 5, 4, 2][i] + (((f + i * 2) % 3) - 1);
          rect(x, sy - hgt, 3, hgt, '#FF6B1A'); rect(x + 1, sy - hgt + 2, 2, hgt - 2, '#FF8A3D'); rect(x + 1, sy - hgt + 4, 1, Math.max(0, hgt - 4), '#FFD25A'); px(x + 1, sy - hgt - 1 - (f + i) % 2, '#FF8A3D');
        }
        line(bx + 1, by + 9, bx - 5, by + 9, 2, P.limb); line(bx + 1, by + 9, bx - 3, by + 12, 2, P.limb);
        for (var yy = -5; yy <= 5; yy++) for (var xx = -5; xx <= 5; xx++) {
          if (xx * xx + yy * yy > 25) continue;
          var a = Math.atan2(yy, xx) + f * 1.1, c = Math.floor(a / 1.5708) % 2 === 0 ? '#E5483A' : '#FFF4D6';
          px(bx + 6 + xx, sy - 6 + yy, c);
        }
        cube(bx, by, 12, P);
        rect(bx + 3, by + 4, 2, 3, INK); rect(bx + 8, by + 4, 2, 3, INK); px(bx + 3, by + 4, WHITE); px(bx + 8, by + 4, WHITE);
        rect(bx + 2, by + 2, 3, 1, INK); px(bx + 5, by + 3, INK); rect(bx + 7, by + 2, 3, 1, INK); px(bx + 6, by + 3, INK);
        rect(bx + 1, by + 7, 2, 1, PINK); rect(bx + 10, by + 7, 2, 1, PINK);
        mouth(bx + 5, by + 8, 4);
        glove(bx - 5, by + 9); glove(bx - 3, by + 12);
        if (f % 6 < 2) { spark(bx + 17, by + 2, '#FFD25A'); }
      }
    },
    jump: {
      dyn: true, still: 0.4,
      draw: function (f, W, H, canvas, k) {
        var steps = document.querySelectorAll('.steps article');
        if (steps.length < 3 || canvas.clientWidth < 700) return;
        var cr = canvas.getBoundingClientRect(), xs = [].map.call(steps, function (a) { var r = a.getBoundingClientRect(); return (r.left + r.width / 2 - cr.left) / k; });
        var t = f / FPS % 5.7, P = pal('green'), sy = H, i, x, y = 0, pose = 'wave';
        if (t < 1.2) { i = 0; if (t > 1.05) pose = 'crouch'; x = xs[0]; }
        else if (t < 1.8) { var u = (t - 1.2) / 0.6; x = lerp(xs[0], xs[1], u); y = 4 * 13 * u * (1 - u); pose = 'air'; }
        else if (t < 3.0) { x = xs[1]; if (t > 2.85) pose = 'crouch'; }
        else if (t < 3.6) { var u2 = (t - 3.0) / 0.6; x = lerp(xs[1], xs[2], u2); y = 4 * 13 * u2 * (1 - u2); pose = 'air'; }
        else if (t < 4.8) { x = xs[2]; if (t > 4.65) pose = 'crouch'; }
        else { var u3 = (t - 4.8) / 0.9; x = lerp(xs[2], xs[0], u3); y = 4 * 22 * u3 * (1 - u3); pose = 'air'; }
        crit(P, f, pose, Math.round(x) - 10, sy - Math.round(y), SHAPES.ell);
      }
    },
    roofs: {
      dyn: true, still: 2.5,
      draw: function (f, W, H, canvas, k) {
        var roofs = window.BP && window.BP.roofs;
        if (!roofs || !roofs.list.length) return;
        var cw = canvas.clientWidth, ch = canvas.clientHeight, narrow = cw < 700, used = [];
        KIDS.forEach(function (c) {
          if (narrow && !c.phone) return;
          var target = (narrow ? c.pat : c.at) * cw, best = null;
          roofs.list.forEach(function (r) {
            if (r.mast || r.w < 30 || used.indexOf(r) >= 0) return;
            var d = Math.abs(r.cx - target);
            if (!best || d < best.d) best = { r: r, d: d };
          });
          if (!best) return;
          used.push(best.r);
          crit(pal(c.color), f + c.off * 5, c.pose, Math.round(best.r.cx / k) - 6, Math.round((ch - (roofs.h - best.r.top)) / k), SHAPES.single);
        });
      }
    },
    climb: {
      dyn: true, still: 3,
      draw: function (f, W, H) {
        var t = f / FPS, vertical = H > W * 1.1, cyc = vertical ? 14 : 8, P = pal('purple');
        function at(tt) {
          var u = (tt % cyc) / cyc, side = Math.floor(tt / cyc) % 2;
          if (vertical) return { u: u, x: (side ? 12 : W - 12) + Math.sin(u * 18) * 1, y: lerp(H - 20, 14, u) };
          return { u: u, x: lerp(W * 0.3, W * 0.9, u), y: lerp(H - 18, 16, u * u * (3 - 2 * u)) + Math.sin(u * 20) * 1.4 };
        }
        var n = Math.floor(t / cyc), p = at(t);
        for (var i = 1; i <= 7; i++) {
          var tt = t - i * 0.1;
          if (tt < 0 || Math.floor(tt / cyc) !== n) continue;
          var q = at(tt);
          g.globalAlpha = Math.max(0.08, 0.6 - i * 0.08);
          rect(q.x - 1 + (i % 2) * 2, q.y + 11 + i % 3, 2, 2, i < 3 ? '#FFD25A' : '#FFFFFF');
        }
        var a = Math.ceil(Math.min(1, p.u / 0.1, (1 - p.u) / 0.1) * 4) / 4;
        if (a <= 0) { g.globalAlpha = 1; return; }
        g.globalAlpha = a;
        jetKid(P, f, Math.round(p.x) - 6, Math.round(p.y) - 10);
        g.globalAlpha = 1;
      }
    },
    shield: {
      w: 72, h: 60, still: 2.2,
      draw: function (f) {
        var P = pal('purple'), x0 = 8, y0 = 10, blink = f % 40 >= 38;
        shadow(x0 + 18, 58, 40);
        [x0 + 8, x0 + 26].forEach(function (lx) { rect(lx, y0 + 34, 3, 9, P.limb); shoe(lx - 1, y0 + 43); });
        var wave = Math.floor(f / 12) % 6 === 0, wy = Math.floor(f / 3) % 2;
        if (wave) line(x0 + 1, y0 + 22, x0 - 8, y0 + 8 + wy * 3, 3, P.limb);
        else line(x0 + 1, y0 + 22, x0 - 4, y0 + 30, 3, P.limb);
        var sy = y0 + 12 + [0, 0, -1, -1, 0, 0, 1, 1][Math.floor(f / 3) % 8], sx = x0 + 46;
        line(x0 + 35, y0 + 24, sx, y0 + 24, 3, P.limb);
        [[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (c) { cube(x0 + c[0] * 18, y0 + c[1] * 18, 18, P); });
        eye(x0 + 8, y0 + 5, 3, blink); eye(x0 + 26, y0 + 5, 3, blink);
        cheek(x0 + 3, y0 + 9); cheek(x0 + 31, y0 + 9);
        var shine = f % 36, glint = shine < 10;
        mouth(x0 + 16, y0 + 11, glint ? 1 : 0);
        var widths = [14, 14, 14, 14, 14, 14, 12, 12, 12, 10, 10, 8, 8, 6, 6, 4, 2];
        widths.forEach(function (w, i) { rect(sx + (14 - w) / 2, sy + i, w, 1, IVORY); });
        widths.forEach(function (w, i) { if (i > 0 && w > 2) rect(sx + (14 - (w - 2)) / 2, sy + i, w - 2, 1, i > 10 ? '#2F5BC0' : '#3D70D9'); });
        [[4, 7], [5, 8], [6, 9], [7, 8], [8, 7], [9, 6], [10, 5]].forEach(function (c) { px(sx + c[0], sy + c[1], WHITE); px(sx + c[0], sy + c[1] + 1, WHITE); });
        if (glint) {
          for (var yy = 1; yy < widths.length - 1; yy++) for (var xx = 1; xx < 13; xx++) {
            var lo = (14 - widths[yy]) / 2 + 1, hi = 14 - lo - 1;
            if (Math.abs(xx + yy - shine * 2.4) < 1.6 && xx >= lo && xx <= hi) px(sx + xx, sy + yy, 'rgba(255,255,255,0.6)');
          }
          if (shine > 5) spark(sx + 16, sy - 3, WHITE);
        }
        glove(sx, y0 + 24);
        if (wave) glove(x0 - 8, y0 + 8 + wy * 3); else glove(x0 - 4, y0 + 30);
      }
    }
  };

  function setup(canvas) {
    var def = SCENES[canvas.getAttribute('data-buddy')];
    if (!def) return;
    if (typeof def === 'function') def = def(canvas);
    var off = document.createElement('canvas');
    var og = off.getContext('2d'), main = null, last = -1, on = false, t0 = 0, k = 3, cssW = 1, cssH = 1;
    if (!def.dyn) {
      var kk = parseFloat(getComputedStyle(canvas).getPropertyValue('--k')) || 3;
      canvas.style.width = def.w * kk + 'px'; canvas.style.height = def.h * kk + 'px';
    }
    function measure() {
      var r = canvas.getBoundingClientRect();
      cssW = Math.max(1, r.width); cssH = Math.max(1, r.height);
      if (def.dyn) {
        k = parseFloat(getComputedStyle(canvas).getPropertyValue('--k')) || 3;
        def.w = Math.max(1, Math.ceil(cssW / k)); def.h = Math.max(1, Math.ceil(cssH / k));
      }
      off.width = def.w; off.height = def.h;
    }
    function render(t) {
      if (!main) return;
      var f = Math.floor(t * FPS);
      if (f === last) return;
      last = f;
      g = og;
      og.setTransform(1, 0, 0, 1, 0, 0);
      og.globalAlpha = 1;
      og.clearRect(0, 0, def.w, def.h);
      def.draw(f, def.w, def.h, canvas, k);
      var cw = canvas.width, ch = canvas.height;
      main.setTransform(1, 0, 0, 1, 0, 0);
      main.clearRect(0, 0, cw, ch);
      main.imageSmoothingEnabled = false;
      if (def.dyn) {
        var s = cw / cssW * k;
        main.drawImage(off, 0, 0, def.w * s, def.h * s);
      } else {
        var m = Math.max(1, Math.floor(Math.min(cw / def.w, ch / def.h)));
        main.drawImage(off, Math.floor((cw - def.w * m) / 2), Math.floor((ch - def.h * m) / 2), def.w * m, def.h * m);
      }
    }
    function resize() {
      main = I.fit(canvas).ctx;
      measure();
      last = -1;
      render(I.reduce || !on ? def.still : (performance.now() - t0) / 1000);
    }
    function loop(now) {
      if (!on) return;
      if (!t0) t0 = now;
      render((now - t0) / 1000);
      requestAnimationFrame(loop);
    }
    window.addEventListener('resize', resize);
    resize();
    if (I.reduce) return;
    I.visible(canvas, function (v) {
      if (v && !on) { on = true; t0 = 0; requestAnimationFrame(loop); }
      else if (!v) on = false;
    });
  }

  Array.prototype.forEach.call(nodes, setup);
})();
