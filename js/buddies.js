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
    ell: { S: 10, cells: [[0, 0], [0, 1], [1, 1]], face: 1 },
    boulder: { S: 12, cells: [[0, 0], [1, 0], [0, 1], [1, 1]], face: 0 }
  };
  function dims(sh) {
    var cols = 0, rows = 0;
    sh.cells.forEach(function (c) { cols = Math.max(cols, c[0] + 1); rows = Math.max(rows, c[1] + 1); });
    return { cols: cols, rows: rows, W: cols * sh.S, H: rows * sh.S };
  }

  function crit(P, f, pose, bx, sy, sh, o) {
    o = o || {};
    var S = sh.S, d = dims(sh), Wb = d.W, Hb = d.H, rows = d.rows, hang = pose === 'hang', sit = pose === 'sit' || hang, lean = o.lean || 0;
    var hop = pose === 'hop' ? [0, 2, 4, 4, 3, 1, 0, 0][f % 8] : 0, legH = o.legH != null ? o.legH : (pose === 'crouch' ? 2 : 4);
    var bottom = sh.cells.filter(function (c) { return c[1] === rows - 1; }).map(function (c) { return c[0]; });
    var c0 = Math.min.apply(null, bottom), c1 = Math.max.apply(null, bottom);
    var legs = [bx + c0 * S + 2, bx + c1 * S + S - 4], gnd = null;
    if (o.ground && !sit) { gnd = legs.map(function (lx) { return Math.min(o.ground(lx - 1), o.ground(lx + 2)); }); sy = Math.min(gnd[0], gnd[1]); legH = 4; }
    var by = sit ? sy - Hb : sy - Hb - legH - 3 - hop, blink = f % 40 >= 38;
    var bb = bx + lean, rx = bb + Wb, sh0 = by + (rows - 1) * S + Math.round(S * 0.66), Lh, Rh;
    if (o.hands) { var hh = o.hands(rx, sh0, by, bb); Lh = hh[0]; Rh = hh[1]; }
    else if (pose === 'wave') { Lh = [bb - 2, sh0 + 5]; Rh = [rx + 2 + [0, 1, 2, 1][Math.floor(f / 2) % 4], by + 1]; }
    else if (pose === 'hop' || pose === 'air' || hang) { Lh = [bb - 3, by + 1]; Rh = [rx + 3, by + 1]; }
    else if (sit) { Lh = [bb - 1, sh0 + 4]; Rh = [rx + 1, sh0 + 4]; }
    else { Lh = [bb - 2, sh0 + 5]; Rh = [rx + 2, sh0 + 5]; }
    line(bb + 1, sh0, Lh[0], Lh[1], 2, P.limb); line(rx - 2, sh0, Rh[0], Rh[1], 2, P.limb);
    if (sit) {
      var sw = pose === 'sit' ? Math.floor(f / 4) % 2 : 0;
      legs.forEach(function (lx0, i) {
        var lx = lx0 + (i ? 1 - sw : sw);
        rect(lx, sy, 2, 4, P.limb); rect(lx - 1, sy + 4, 4, 2, SHOE); rect(lx - 1, sy + 6, 4, 1, IVORY); px(lx - 1, sy + 4, SHOE_LT);
      });
    } else {
      legs.forEach(function (lx, i) {
        var ll = gnd ? gnd[i] - 3 - (by + Hb) : legH;
        rect(lx, by + Hb, 2, ll, P.limb); rect(lx - 1, by + Hb + ll, 4, 2, SHOE); rect(lx - 1, by + Hb + ll + 2, 4, 1, IVORY); px(lx - 1, by + Hb + ll, SHOE_LT);
      });
    }
    sh.cells.forEach(function (c) { cube(bb + c[0] * S, by + c[1] * S, S, P); });
    var fc = sh.cells.filter(function (c) { return c[1] === sh.face; }).map(function (c) { return c[0]; });
    var fmin = Math.min.apply(null, fc), fmax = Math.max.apply(null, fc), fw = (fmax - fmin + 1) * S;
    var cx = bb + fmin * S + fw / 2, ft = by + sh.face * S, dx = Math.max(2, Math.round(fw * 0.2)), ey = ft + Math.round(S * 0.33);
    var lo = o.lo != null ? o.lo : pose === 'look' ? [0, 0, 1, 1, 0, 0, -1, -1][Math.floor(f / 6) % 8] : 0, happy = pose === 'hop' || pose === 'air' || hang ? 'happy' : null;
    if (o.strain) {
      rect(cx - dx - 1, ey + 1, 2, 1, INK); rect(cx + dx - 1, ey + 1, 2, 1, INK);
      rect(cx - 2, ft + Math.round(S * 0.66), 4, 2, INK); rect(cx - 2, ft + Math.round(S * 0.66), 4, 1, WHITE);
    } else {
      eye(cx - dx - 1 + lo, ey, 3, blink, happy); eye(cx + dx - 1 + lo, ey, 3, blink, happy);
      mouth(cx - 2, ft + Math.round(S * 0.66), o.mouth != null ? o.mouth : (pose === 'wave' ? [3, 1][Math.floor(f / 3) % 2] : (pose === 'hop' || pose === 'air' || hang ? 4 : 0)));
    }
    rect(Math.max(bb + fmin * S + 1, cx - dx - 3), ft + Math.round(S * 0.58), 2, 1, PINK);
    rect(Math.min(bb + fmax * S + S - 3, cx + dx + 1), ft + Math.round(S * 0.58), 2, 1, PINK);
    glove(Lh[0], Lh[1]); glove(Rh[0], Rh[1]);
    return { by: by, rx: rx, sh0: sh0, bb: bb };
  }

  function slant(x, y, s, P, sk) {
    var inset = [2, 1, 1];
    for (var i = 0; i < s; i++) {
      var ins = i < 3 ? inset[i] : (i >= s - 3 ? inset[s - 1 - i] : 0), off = Math.floor((s - 1 - i) / sk), x0 = x + ins + off, x1 = x + s - 1 - ins + off;
      var c = i === 0 ? P.b0 : (i === s - 1 ? P.b4 : (i >= s - 3 ? P.b3 : (i < 3 ? P.b1 : P.b2)));
      rect(x0, y + i, x1 - x0 + 1, 1, c);
      if (i > 0 && i < s - 2) { px(x0, y + i, P.b1); px(x1, y + i, P.b3); }
    }
    rect(x + 4 + Math.floor((s - 3) / sk), y + 2, 3, 1, P.hi);
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

  function rnd(n) { var v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); }
  function ease(u) { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); }

  function burstFx(x, y, col, s, n, seed, G) {
    if (s < 0 || s > 0.85) return;
    if (s < 0.17) {
      rect(x - 5, y - 1, 10, 2, 'rgba(255,255,255,0.75)'); rect(x - 1, y - 5, 2, 10, 'rgba(255,255,255,0.75)');
      spark(x - 7, y - 5, '#FFD25A'); spark(x + 7, y - 5, '#FFD25A');
    }
    for (var i = 0; i < n; i++) {
      var a = rnd(seed + i * 3) * 6.2832, sp = 12 + rnd(seed + i * 3 + 1) * 22, vy = 22 + rnd(seed + i * 3 + 2) * 16, life = 0.5 + rnd(seed + i * 7) * 0.3;
      if (s > life) continue;
      var fx = x + Math.cos(a) * sp * s, fy = Math.min(G - 3, y - vy * s + 90 * s * s), sz = s / life < 0.55 ? 3 : 2;
      rect(fx - 1, fy - 1, sz, sz, col); px(fx - 1, fy - 1, mix(col, '#ffffff', 0.5));
    }
  }

  function pairAt(cx, by, e) {
    var cy = lerp(by - 1, by - 8, e);
    return { lx: lerp(cx - 18, cx - 6, e), rx: lerp(cx + 12, cx, e), y: cy };
  }

  function act(idx, tt, cx, rx, sh0, by, G) {
    var rest = [[cx - 12, sh0 + 5], [rx + 2, sh0 + 5]], hands = [rest[0], rest[1]], fn = [], c, e, rb = 0, p;
    function raise(q, b) { return [[lerp(q.lx + 3, rest[0][0], b), lerp(q.y + 8, rest[0][1], b)], [lerp(q.rx + 3, rest[1][0], b), lerp(q.y + 8, rest[1][1], b)]]; }
    function pair(q, col) { miniCube(Math.round(q.lx), Math.round(q.y), col); miniCube(Math.round(q.rx), Math.round(q.y), col); }
    if (idx === 0) {
      c = tt % 4.8;
      var hx = rx + 1, red = HEX.red;
      if (c < 1.2 || c >= 4.2) {
        hands[1] = [rx + 4, by + 4];
        fn.push(function () { miniCube(hx, by - 4, red); if (c >= 4.2 && c < 4.5) spark(hx + 3, by - 8, WHITE); });
      } else {
        var s = c - 1.2, d = (G - 6) - (by - 4), tf = Math.sqrt(2 * d / 260);
        hands[1] = [rx + 4, lerp(by + 4, sh0 + 5, ease(s / 0.4))];
        fn.push(function () {
          if (s < tf) miniCube(hx, Math.round(by - 4 + 130 * s * s), red);
          else if (c < 2.9 || (c < 3.3 && Math.floor(c * 12) % 2 === 0)) {
            if (s - tf < 0.17) { rect(hx - 1, G - 4, 8, 4, red); rect(hx - 1, G - 4, 8, 1, mix(red, '#ffffff', 0.45)); rect(hx - 1, G - 1, 8, 1, mix(red, '#000000', 0.3)); }
            else miniCube(hx, G - 6, red);
          }
        });
      }
    } else if (idx === 1) {
      c = tt % 4.8;
      e = c < 0.6 ? 0 : c < 1.3 ? ease((c - 0.6) / 0.7) : c < 3 ? 1 : c < 3.7 ? 1 - ease((c - 3) / 0.7) : 0;
      p = pairAt(cx, by, e); hands = raise(p, 0);
      fn.push(function () {
        pair(p, HEX.yellow);
        if (e === 1) {
          var pulse = Math.floor(c * 6) % 2;
          rect(Math.round(p.lx) - 1, Math.round(p.y) - 1 - pulse, 14, 1, 'rgba(255,255,255,0.7)');
          if (c < 1.45) rect(cx - 3, Math.round(p.y) + 1, 6, 4, 'rgba(255,255,255,0.8)');
          spark(cx + (pulse ? -7 : 7), Math.round(p.y) - 3, '#FFD25A');
        }
      });
    } else {
      c = tt % 6;
      e = c < 0.5 ? 0 : c < 1.2 ? ease((c - 0.5) / 0.7) : c < 5.2 ? 1 : 0;
      rb = c < 3.1 ? 0 : c < 3.6 ? ease((c - 3.1) / 0.5) : c < 5.2 ? 1 : c < 5.6 ? 1 - ease((c - 5.2) / 0.4) : 0;
      p = pairAt(cx, by, e); hands = raise(p, rb);
      var tf2 = Math.sqrt(2 * Math.max(1, by) / 300), mid = pairAt(cx, by, 1);
      fn.push(function () {
        if (c < 1.2 || c >= 5.5) { pair(p, HEX.yellow); if (c >= 5.5 && c < 5.8) spark(cx, by - 12, WHITE); }
        if (c >= 1.2 && c < 1.2 + 0.85) burstFx(cx, by - 5, HEX.yellow, c - 1.2, 8, 11, G);
        if (c >= 1.7 && c < 2.4) {
          var u = c - 1.7, y = u < tf2 ? -8 + 150 * u * u : mid.y;
          g.globalAlpha = Math.max(0, Math.min(1, (y + 6) / 14));
          pair({ lx: mid.lx, rx: mid.rx, y: Math.min(mid.y, y) }, HEX.blue);
          g.globalAlpha = 1;
        }
        if (c >= 2.4 && c < 2.4 + 0.85) burstFx(cx, by - 5, HEX.blue, c - 2.4, 11, 29, G);
      });
    }
    return { hands: hands, draw: function () { fn.forEach(function (d) { d(); }); } };
  }

  function hopperPhone(f, W, H, canvas, xs) {
    var mid = W / 2, idx = 0, st = canvas._ph, bx = Math.round(mid) - 10, P = pal('green');
    xs.forEach(function (x, i) { if (Math.abs(x - mid) < Math.abs(xs[idx] - mid)) idx = i; });
    if (!st) st = canvas._ph = { idx: idx, h: 0, t0: f, land: -99, fr: -1, hs: -1, was: false };
    var mv = !I.reduce && performance.now() - (canvas._mv || -1e9) < 180, arc = [6, 12, 14, 10, 5];
    if (st.fr !== f) {
      st.fr = f;
      if (mv && !st.was && st.hs < 0) st.hs = f;
      st.was = mv;
      var pv = st.h;
      st.h = 0;
      if (st.hs >= 0) {
        var hi = f - st.hs;
        if (hi < arc.length) st.h = arc[hi]; else st.hs = -1;
      }
      if (pv > 0 && st.h === 0) { st.land = f; st.t0 = f; }
      if (st.idx !== idx) { st.idx = idx; if (st.h === 0) st.t0 = f; }
    }
    if (st.h > 0) {
      crit(P, f, 'air', bx, H - st.h, SHAPES.ell, { legH: st.h >= 12 ? (f % 2 ? 6 : 3) : 5 });
      return;
    }
    var lf = f - st.land;
    if (lf >= 0 && lf < 4) {
      for (var d = 0; d < 3; d++) {
        g.globalAlpha = Math.max(0, 0.7 - lf * 0.18);
        rect(bx + 10 - 8 - d * 3 - lf * 3, H - 1 - d % 2, 2, 1 + (d % 2), '#E8E0F0'); rect(bx + 10 + 8 + d * 3 + lf * 3, H - 1 - d % 2, 2, 1 + (d % 2), '#E8E0F0');
      }
      g.globalAlpha = 1;
    }
    var tt = (f - st.t0) / FPS, fx = null;
    crit(P, f, 'wave', bx, H, SHAPES.ell, { hands: function (rx, sh0, by, bb) { fx = act(st.idx, tt, bb + 10, rx, sh0, by, H); return fx.hands; } });
    if (fx) fx.draw();
  }

  var KIDS = [
    { at: 0.1, pat: 0.27, color: 'green', pose: 'wave', off: 0, phone: true },
    { at: 0.46, pat: 0.93, color: 'cyan', pose: 'sit', off: 3, phone: true },
    { at: 0.84, pat: 0.5, color: 'red', pose: 'hop', off: 1, phone: true }
  ];

  var SCENES = {
    kid: function (canvas) {
      var P = pal(canvas.getAttribute('data-color') || 'blue'), pose = canvas.getAttribute('data-pose') || 'stand', sh = SHAPES[canvas.getAttribute('data-shape') || 'single'], d = dims(sh);
      var sit = pose === 'sit', w = d.W + 12, h = sit ? d.H + 13 : d.H + 16, sy = sit ? d.H + 6 : h;
      var def = { w: w, h: h, still: 1.2, draw: function (f) { crit(P, f, pose, 6, sy, sh); } };
      var title = canvas.parentNode && canvas.parentNode.classList.contains('title') ? canvas.parentNode : null;
      if (title) {
        var place = function () {
          var span = title.querySelector('span'), tn = span && span.firstChild;
          if (!tn || !tn.length) return;
          var r = document.createRange(), box = title.getBoundingClientRect(), cs = getComputedStyle(span);
          r.setStart(tn, tn.length - 1); r.setEnd(tn, tn.length);
          var b = r.getBoundingClientRect(), cx = document.createElement('canvas').getContext('2d');
          cx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
          var ch = tn.data.charAt(tn.length - 1), m = cx.measureText(cs.textTransform === 'uppercase' ? ch.toUpperCase() : ch), kr = canvas.getBoundingClientRect();
          var inkTop = b.top + m.fontBoundingBoxAscent - m.actualBoundingBoxAscent, inkMid = b.left + (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
          canvas.style.right = 'auto'; canvas.style.bottom = 'auto';
          canvas.style.left = Math.round(inkMid - box.left - kr.width / 2) + 'px';
          canvas.style.top = Math.round(inkTop - box.top - kr.height + 1) + 'px';
        };
        def.init = function () {
          place();
          window.addEventListener('resize', place);
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
        };
      }
      return def;
    },
    sisyphus: {
      w: 96, h: 46, still: 3,
      draw: function (f) {
        var t = (f / FPS) % 10.4, Y = pal('yellow'), G = pal('green');
        function ys(x) { return x >= 76 ? 21 : 45 - 2 * Math.floor(Math.max(0, x - 4) / 6); }
        for (var x = 0; x < 96; x++) {
          var top = ys(x);
          rect(x, top, 1, 46 - top, '#5B4752'); rect(x, top, 1, 2, '#8A7482');
          if (x > 3 && x < 76 && (x - 4) % 6 === 0) rect(x, top, 1, 46 - top, '#46363F');
          if ((x * 7 + top) % 5 === 0) px(x, top + 4 + x % 3, '#46363F');
        }
        rect(89, 4, 1, 17, '#EDE6D6'); rect(90, 4, 5, 3, '#E5483A'); rect(90, 7, 3, 1, '#E5483A'); px(89, 3, '#FFD25A');
        var p, phase, lean = 1;
        if (t < 7) { phase = 'push'; p = Math.max(0, t / 7 + 0.03 * Math.sin(t * 5.2)); lean = Math.sin(t * 5.2) > 0 ? 2 : 1; }
        else if (t < 8.1) { phase = 'top'; p = 1 + 0.01 * Math.sin(t * 30); lean = 2; }
        else if (t < 9.5) { phase = 'slip'; var u = (t - 8.1) / 1.4; p = 1 - u * u; lean = 0; }
        else { phase = 'rest'; p = 0; lean = 0; }
        var xbl = lerp(26, 58, Math.min(1, p)), bxk = Math.round(xbl) - 23 - lean, yb = ys(Math.round(xbl) + 12), sy = ys(bxk + 10);
        SHAPES.boulder.cells.forEach(function (c) { cube(Math.round(xbl) + c[0] * 12, yb - 24 + c[1] * 12, 12, G); });
        var opts = { lean: lean, ground: ys, strain: phase === 'push' || phase === 'top', hands: function (rx, sh0) { return [[rx + 1, sh0 + 3], [rx + 2, sh0 - 1]]; } };
        if (phase === 'slip') opts.mouth = 2;
        crit(Y, f, 'stand', bxk, sy, SHAPES.domino, opts);
        if (phase === 'push' || phase === 'top') {
          var dy = Math.floor((f % 6) / 2);
          px(bxk + 21 + lean, sy - 17 + dy, '#9FD8FF'); px(bxk + 21 + lean, sy - 16 + dy, '#9FD8FF');
          for (var i = 0; i < 3; i++) { var dd = (f * 2 + i * 4) % 9; rect(bxk - 2 - dd, sy - 1 - i, 2, 1, 'rgba(255,255,255,' + (0.6 - dd * 0.06).toFixed(2) + ')'); }
        }
        if (phase === 'slip') {
          for (var j = 0; j < 4; j++) { var du = (f + j * 2) % 8; rect(bxk + 22 + du, sy - 1 - (du >> 1) - j, 2, 1, 'rgba(255,255,255,' + (0.7 - du * 0.07).toFixed(2) + ')'); }
        }
      }
    },
    ready: {
      w: 64, h: 34, still: 0.4,
      draw: function (f) {
        var P = pal('blue'), sy = 34, burst = f % 18 < 4, bx = 34 + (f % 2), by = sy - 22;
        var base = burst ? [9, 9, 8, 7, 6, 5, 3, 2, 1] : [6, 6, 5, 4, 3, 3, 2, 1, 1];
        for (var i = 0; i < 9; i++) {
          var x = bx + 1 - i * 3, h = base[i] + ((f + i) % 3 === 0 ? 1 : 0), fy = sy - 7 - Math.floor(h / 2) + 3;
          rect(x, fy, 3, h, '#FF6B1A'); rect(x + 1, fy + 1, 2, Math.max(0, h - 1), '#FF8A3D'); rect(x + 1, fy + 3, 1, Math.max(0, h - 3), '#FFD25A'); px(x + 1, fy - 1, '#FF8A3D');
        }
        [0, 1, 2].forEach(function (k) { rect(bx - 12 - ((f * 3 + k * 5) % 9), by + 2 + k * 4, 7, 1, 'rgba(255,255,255,0.45)'); });
        var ph = Math.floor(f / 3) % 2, sf = [bx + 12, by + 10], sb = [bx + 3, by + 10];
        var poseF = [[4, 1, 7, -3], [1, 3, -1, 7]], poseB = [[-3, 1, -6, 5], [2, 3, 5, 7]];
        var ap = poseF[ph], bp = poseB[ph];
        var fa = [sf[0], sf[1], sf[0] + ap[0], sf[1] + ap[1], sf[0] + ap[2], sf[1] + ap[3]];
        var ba = [sb[0], sb[1], sb[0] + bp[0], sb[1] + bp[1], sb[0] + bp[2], sb[1] + bp[3]];
        for (var yy = -5; yy <= 5; yy++) for (var xx = -5; xx <= 5; xx++) {
          if (xx * xx + yy * yy > 25) continue;
          var a = Math.atan2(yy, xx) + f * 1.1;
          px(bx + 8 + xx, sy - 6 + yy, Math.floor(a / 1.5708) % 2 === 0 ? '#E5483A' : '#FFF4D6');
        }
        slant(bx, by, 12, P, 4);
        rect(bx + 5, by + 5, 2, 3, INK); rect(bx + 9, by + 5, 2, 3, INK); px(bx + 5, by + 5, WHITE); px(bx + 9, by + 5, WHITE);
        px(bx + 4, by + 3, INK); px(bx + 5, by + 3, INK); px(bx + 6, by + 4, INK); px(bx + 11, by + 3, INK); px(bx + 10, by + 3, INK); px(bx + 9, by + 4, INK);
        rect(bx + 3, by + 8, 2, 1, PINK); rect(bx + 11, by + 8, 2, 1, PINK);
        mouth(bx + 6, by + 9, 4);
        line(ba[0], ba[1], ba[2], ba[3], 2, P.limb); line(ba[2], ba[3], ba[4], ba[5], 2, P.limb);
        line(fa[0], fa[1], fa[2], fa[3], 2, P.limb); line(fa[2], fa[3], fa[4], fa[5], 2, P.limb);
        glove(ba[4], ba[5]); glove(fa[4], fa[5]);
        if (f % 6 < 2) spark(bx + 25, by + 2, '#FFD25A');
      }
    },
    jump: {
      dyn: true, still: 0.5,
      init: function (canvas) {
        var box = document.querySelector('.steps');
        if (box) box.addEventListener('scroll', function () { if (I.reduce) canvas.dispatchEvent(new Event('refresh')); else canvas._mv = performance.now(); }, { passive: true });
      },
      draw: function (f, W, H, canvas, k) {
        var steps = document.querySelectorAll('.steps article');
        if (steps.length < 3) return;
        var cr = canvas.getBoundingClientRect(), xs = [].map.call(steps, function (a) { var r = a.getBoundingClientRect(); return (r.left + r.width / 2 - cr.left) / k; });
        if (canvas.clientWidth < 700) { hopperPhone(f, W, H, canvas, xs); return; }
        var hops = [[0, 1, 0.62, 13], [1, 2, 0.62, 13], [2, 0, 0.95, 22]], P = pal('green'), t = f / FPS, tot = 0;
        hops.forEach(function (h) { tot += 0.9 + 0.25 + h[2] + 0.2; });
        t = t % tot;
        var acc = 0, sy = H, pose = 'wave', x = xs[0], y = 0, legH = 4, cur = 0, ph = 'stand', u = 0, tl = 0, pos = xs[0];
        for (cur = 0; cur < 3; cur++) {
          var h = hops[cur], seg = [0.9, 0.25, h[2], 0.2], names = ['stand', 'crouch', 'fly', 'land'], k0 = 0;
          for (k0 = 0; k0 < 4; k0++) { if (t < acc + seg[k0]) { ph = names[k0]; tl = t - acc; u = tl / seg[k0]; break; } acc += seg[k0]; }
          if (k0 < 4) break;
        }
        var hp = hops[Math.min(cur, 2)], x0 = xs[hp[0]], x1 = xs[hp[1]];
        if (ph === 'stand') { x = x0; pose = 'wave'; }
        else if (ph === 'crouch') { x = x0; pose = 'crouch'; }
        else if (ph === 'fly') {
          x = lerp(x0, x1, u * (2 - u) * 0.5 + u * 0.5); y = 4 * hp[3] * u * (1 - u); pose = 'air'; legH = u < 0.4 ? 6 : (u < 0.6 ? 3 : 5);
          for (var i = 1; i <= 4; i++) {
            var uu = u - i * 0.07;
            if (uu <= 0) continue;
            g.globalAlpha = 0.55 - i * 0.1;
            rect(Math.round(lerp(x0, x1, uu * (2 - uu) * 0.5 + uu * 0.5)) - 1, sy - Math.round(4 * hp[3] * uu * (1 - uu)) - 12 + i, 2, 2, '#FFFFFF');
          }
          g.globalAlpha = 1;
        } else { x = x1; pose = 'crouch'; }
        if (ph === 'land' || (ph === 'stand' && tl < 0.2 && cur > 0)) {
          var lu = ph === 'land' ? u : 0.5 + tl / 0.4, lx = ph === 'land' ? x1 : x0;
          for (var d = 0; d < 3; d++) {
            g.globalAlpha = Math.max(0, 0.7 - lu * 0.6);
            rect(Math.round(lx - 6 - d * 3 - lu * 5), sy - 1 - d % 2, 2, 1 + (d % 2), '#E8E0F0'); rect(Math.round(lx + 6 + d * 3 + lu * 5), sy - 1 - d % 2, 2, 1 + (d % 2), '#E8E0F0');
          }
          g.globalAlpha = 1;
        }
        if (ph === 'crouch' && cur >= 0 && tl < 0.1) { spark(Math.round(x), sy - 6, '#FFD25A'); }
        crit(P, f, pose, Math.round(x) - 10, sy - Math.round(y), SHAPES.ell, { legH: legH });
      }
    },
    point: function (canvas) {
      var down = canvas.getAttribute('data-dir') === 'down', P = pal('red'), sh = SHAPES.domino, d = dims(sh), sy = d.H + 8;
      var def = {
        w: d.W + (down ? 12 : 18), h: sy + 9, still: 1,
        draw: function (f) {
          var tap = Math.floor(f / 3) % 2;
          crit(P, f, 'sit', 6, sy, sh, {
            lo: 1,
            hands: function (rx, sh0, by, bb) {
              return down ? [[bb - 1, sh0 + 4], [rx + 2, sh0 + 7 + tap]] : [[bb - 1, sh0 + 4], [rx + 8 + tap, sh0 - 1]];
            }
          });
        }
      };
      if (!down) {
        def.init = function () {
          var bar = canvas.parentNode, btn = bar.querySelector('.bar-get');
          if (!btn) return;
          function place() {
            var kk = parseFloat(getComputedStyle(canvas).getPropertyValue('--k')) || 3, br = bar.getBoundingClientRect(), r = btn.getBoundingClientRect();
            canvas.style.left = Math.round(r.left - br.left - def.w * kk - 2) + 'px';
            canvas.style.top = Math.round(bar.offsetHeight - sy * kk) + 'px';
          }
          place();
          window.addEventListener('resize', place);
          if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
        };
      }
      return def;
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
            if (r.mast || r.w < (narrow ? 10 : 30) || used.indexOf(r) >= 0) return;
            var d = Math.abs(r.cx - target);
            if (!best || d < best.d) best = { r: r, d: d };
          });
          if (!best) return;
          used.push(best.r);
          var rx0 = Math.round(best.r.cx / k) - 6, ry = Math.round((ch - (roofs.h - best.r.top)) / k);
          if (best.r.w / k < 16) rect(rx0 - 2, ry, 16, 3, '#1c2a22');
          crit(pal(c.color), f + c.off * 5, c.pose, rx0, ry, SHAPES.single);
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
    canvas.addEventListener('refresh', function () { last = -1; render(I.reduce || !on ? def.still : (performance.now() - t0) / 1000); });
    function loop(now) {
      if (!on) return;
      if (!t0) t0 = now;
      render((now - t0) / 1000);
      requestAnimationFrame(loop);
    }
    window.addEventListener('resize', resize);
    resize();
    if (def.init) def.init(canvas);
    if (I.reduce) return;
    I.visible(canvas, function (v) {
      if (v && !on) { on = true; t0 = 0; requestAnimationFrame(loop); }
      else if (!v) on = false;
    });
  }

  Array.prototype.forEach.call(nodes, setup);
})();
