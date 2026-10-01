(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.querySelector('.stack-art');
  if (!I || !canvas) return;
  var W = 76, H = 52, LOOP = 9;
  var C = {
    b0: '#7BA5FA', b1: '#5B8DF0', b2: '#3D70D9', b3: '#2F5BC0', b4: '#2548A0', hi: '#A9C6FF',
    limb: '#2B52B0', ink: '#14224E', brow: '#1D3F95', white: '#FFFFFF', glove: '#C9D6F2',
    red: '#E5483A', redLt: '#FF7A68', redDk: '#B33A2F', redDd: '#8C2B24',
    ivory: '#FFF4D6', ivoryDk: '#E3D2A6', pink: '#FF8FA8', tongue: '#F0728A', ring: '#FFD25A',
    shadow: 'rgba(8,10,40,0.38)'
  };
  var off = document.createElement('canvas');
  off.width = W; off.height = H;
  var g = off.getContext('2d');
  var main = null, lastFrame = -1, on = false, t0 = 0;

  function px(x, y, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), 1, 1); }
  function rect(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
  function line(x0, y0, x1, y1, w, c) {
    var n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1), o = Math.floor(w / 2);
    g.fillStyle = c;
    for (var i = 0; i <= n; i++) g.fillRect(Math.round(x0 + (x1 - x0) * i / n) - o, Math.round(y0 + (y1 - y0) * i / n) - o, w, w);
  }
  function quad(a, c, b, u) { var v = 1 - u; return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]]; }

  function glove(x, y) {
    rect(x - 2, y - 2, 4, 4, C.white);
    rect(x - 2, y + 1, 4, 1, C.glove);
    px(x - 2, y - 2, C.glove);
  }

  function phone(dx) {
    rect(32, 62, 0, 0, C.shadow);
    g.fillStyle = C.shadow;
    g.fillRect(2 + dx, 62, 26, 1); g.fillRect(4 + dx, 63, 22, 1);
    rect(9 + dx, 49, 3, 3, C.redDk); rect(19 + dx, 49, 3, 3, C.redDk);
    var rows = [[10, 20], [8, 22], [7, 23], [6, 24], [5, 25], [5, 25], [5, 25], [5, 25], [5, 25]];
    rows.forEach(function (r, i) {
      var y = 52 + i;
      rect(r[0] + dx, y, r[1] - r[0] + 1, 1, i < 3 ? C.redLt : C.red);
      px(r[1] + dx, y, C.redDk);
      if (i > 3) px(r[1] - 1 + dx, y, C.redDk);
    });
    rect(4 + dx, 61, 23, 1, C.redDk); rect(3 + dx, 61, 1, 1, C.redDd); rect(27 + dx, 61, 1, 1, C.redDd);
    for (var yy = -4; yy <= 4; yy++) for (var xx = -4; xx <= 4; xx++) {
      var d = xx * xx + yy * yy;
      if (d <= 17) px(15 + xx + dx, 57 + yy, d >= 13 ? C.ivoryDk : C.ivory);
    }
    [[0, -3], [2, -2], [3, 0], [2, 2], [0, 3], [-2, 2], [-3, 0], [-2, -2]].forEach(function (p) { px(15 + p[0] + dx, 57 + p[1], C.redDk); });
    rect(14 + dx, 56, 2, 2, C.red);
  }

  function handset(cx, cy, ang, hop) {
    var L = 16, d = [Math.cos(ang), Math.sin(ang)], k = ang / 1.5708;
    var A = [cx - d[0] * L / 2, cy - d[1] * L / 2 - hop], B = [cx + d[0] * L / 2, cy + d[1] * L / 2 - hop];
    var M = [(A[0] + B[0]) / 2 - 2 * k, (A[1] + B[1]) / 2 - 2 * (1 - k)];
    line(A[0], A[1], M[0], M[1], 3, C.red); line(M[0], M[1], B[0], B[1], 3, C.red);
    line(A[0] + 1, A[1] + 1, M[0] + 1, M[1] + 1, 1, C.redDk); line(M[0] + 1, M[1] + 1, B[0] + 1, B[1] + 1, 1, C.redDk);
    line(A[0] - 1, A[1] - 1, M[0] - 1, M[1] - 1, 1, C.redLt); line(M[0] - 1, M[1] - 1, B[0] - 1, B[1] - 1, 1, C.redLt);
    [A, B].forEach(function (e) {
      rect(e[0] - 2, e[1] - 2, 5, 4, C.redDk); rect(e[0] - 2, e[1] - 2, 5, 1, C.red); px(e[0] - 2, e[1] - 2, C.redLt);
    });
    return B;
  }

  function cord(a, b) {
    var c = [Math.min(a[0], b[0]) - 4, (a[1] + b[1]) / 2 + 2], prev = a, idx = 0, acc = 0;
    for (var i = 1; i <= 120; i++) {
      var p = quad(a, c, b, i / 120), q = quad(a, c, b, Math.min(1, (i + 1) / 120));
      acc += Math.hypot(p[0] - prev[0], p[1] - prev[1]); prev = p;
      if (acc < 1) continue;
      acc = 0;
      var tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1, o = idx % 2 ? 1 : -1;
      rect(p[0] - ty / tl * o, p[1] + tx / tl * o, 2, 2, idx % 2 ? C.red : C.redDk);
      idx++;
    }
  }

  function body(by, mood, eyeBlink, mouth, hop) {
    var rows = [3, 2, 1, 1];
    for (var i = 0; i < 28; i++) {
      var inset = i < 4 ? rows[i] : (i > 23 ? rows[27 - i] : 0), y = 20 + by + i, x0 = 36 + inset, x1 = 63 - inset;
      var c = i === 0 ? C.b0 : (i === 27 ? C.b4 : (i === 26 ? C.b3 : (i > 20 ? C.b3 : C.b2)));
      if (i > 0 && i < 6) c = C.b1;
      if (i >= 6 && i <= 20) c = C.b2;
      rect(x0, y, x1 - x0 + 1, 1, c);
      if (i > 0 && i < 26) { px(x0, y, C.b1); px(x1, y, C.b3); }
    }
    rect(40, 22 + by, 6, 1, C.hi); rect(39, 23 + by, 1, 2, C.hi);
    var ey = 30 + by;
    [43, 55].forEach(function (x) {
      if (eyeBlink) { rect(x, ey + 3, 2, 1, C.ink); }
      else if (mood === 'wow') { rect(x, ey - 1, 2, 5, C.ink); px(x, ey - 1, C.white); }
      else { rect(x, ey, 2, 4, C.ink); px(x, ey, C.white); }
    });
    if (mood === 'wow') { rect(42, 27 + by, 3, 1, C.brow); rect(55, 27 + by, 3, 1, C.brow); }
    rect(39, 36 + by, 3, 2, C.pink); rect(58, 36 + by, 3, 2, C.pink);
    var my = 37 + by;
    if (mouth === 0) { rect(48, my + 1, 4, 1, C.ink); px(47, my, C.ink); px(52, my, C.ink); }
    else if (mouth === 1) { rect(48, my, 4, 3, C.ink); rect(49, my + 2, 2, 1, C.tongue); rect(49, my, 2, 1, C.white); }
    else if (mouth === 2) { rect(49, my, 2, 3, C.ink); px(49, my + 2, C.tongue); }
    else { rect(48, my, 4, 2, C.ink); rect(49, my, 2, 1, C.white); }
  }

  function pose(u) {
    var steps = [
      { c: [15, 47], a: 0, h: 0 },
      { c: [15, 44], a: 0.2, h: 0 },
      { c: [21, 40], a: 0.78, h: 0 },
      { c: [27, 35], a: 1.25, h: 0 },
      { c: [30, 33], a: 1.5708, h: 0 }
    ];
    var i;
    if (u < 1.8) return { s: steps[0], ph: 'ring', held: false };
    if (u < 2.0) i = 1; else if (u < 2.2) i = 2; else if (u < 2.4) i = 3; else if (u < 7.2) i = 4;
    else if (u < 7.4) i = 3; else if (u < 7.6) i = 2; else if (u < 7.8) i = 1; else return { s: steps[0], ph: 'idle', held: false };
    return { s: steps[i], ph: i === 4 ? 'talk' : 'move', held: true };
  }

  function frame(t) {
    var f = Math.floor(t * 12), u = (f / 12) % LOOP, st = pose(u);
    var ringing = st.ph === 'ring', talk = st.ph === 'talk';
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, W, H);
    g.setTransform(1, 0, 0, 1, -1, -14);
    var shake = ringing ? (f % 2 ? 1 : -1) : 0;
    var by = ringing ? (f % 4 < 2 ? -1 : 0) : (talk ? (f % 6 < 3 ? 0 : 0) : 0);
    if (ringing && f % 2) by = -1;

    phone(shake);
    var hop = ringing && f % 2 ? 1 : 0;

    g.fillStyle = C.shadow;
    g.fillRect(34, 62, 32, 1); g.fillRect(36, 63, 28, 1);
    rect(41, 46, 5, 12, C.limb); rect(54, 46, 5, 12, C.limb);
    [[38, 58, 9, 3], [53, 58, 9, 3]].forEach(function (s, i) {
      rect(s[0] + 1 + (i ? 0 : 1), s[1], s[2] - 2, 1, C.red); rect(s[0], s[1] + 1, s[2], 2, C.red);
      rect(s[0], s[1] + 3, s[2] + 1, 1, C.ivory); px(s[0] + 2 + (i ? 4 : 0), s[1] + 1, C.redLt);
    });

    var hand = st.held ? [st.s.c[0] - 3, st.s.c[1] + 1] : [33, 50];
    var hs = st.held && st.ph === 'talk' ? [28, 34] : hand;
    line(37, 42 + by, hs[0] + 1, hs[1] + by, 3, C.limb);
    var wave = talk && u > 3.0 && u < 6.6;
    var hp = [[70, 25], [72, 26], [70, 27], [68, 26]][Math.floor(f / 3) % 4];
    if (wave) { line(62, 41 + by, 67, 36 + by, 3, C.limb); line(67, 36 + by, hp[0], hp[1] + by, 3, C.limb); }
    else if (ringing) { line(62, 41 + by, 66, 33 + by, 3, C.limb); line(66, 33 + by, 69, 26 + by, 3, C.limb); }
    else line(62, 42 + by, 66, 50, 3, C.limb);

    var blink = !ringing && (f % 40) >= 37;
    var mood = ringing ? 'wow' : 'calm';
    var mouth = ringing ? 2 : (talk ? [1, 3, 0, 1, 2, 3, 1, 0][Math.floor(f / 2) % 8] : 0);
    body(by, mood, blink, mouth);

    var hx = handset(st.s.c[0], st.s.c[1], st.s.a, hop);
    cord([hx[0], hx[1] + 2], [26 + shake, 57]);

    if (st.held) glove(Math.round(hs[0]), Math.round(hs[1]) + by);
    else glove(33, 50);
    if (wave) glove(hp[0], hp[1] + by);
    else if (ringing) glove(69, 26 + by);
    else glove(66, 50);

    if (ringing) {
      var A = f % 4 < 2;
      var lines = A ? [[6, 44, 3, 41], [24, 44, 27, 41], [15, 43, 15, 40]] : [[7, 41, 4, 38], [23, 41, 26, 38], [12, 42, 11, 39], [18, 42, 19, 39]];
      lines.forEach(function (l) { line(l[0] + shake, l[1], l[2] + shake, l[3], 1, C.ring); });
    }
  }

  function render(t) {
    if (!main) return;
    var f = Math.floor(t * 12);
    if (f === lastFrame) return;
    lastFrame = f;
    frame(t);
    var cw = canvas.width, ch = canvas.height, k = Math.max(1, Math.floor(Math.min(cw / W, ch / H)));
    main.setTransform(1, 0, 0, 1, 0, 0);
    main.clearRect(0, 0, cw, ch);
    main.imageSmoothingEnabled = false;
    main.drawImage(off, Math.floor((cw - W * k) / 2), Math.floor((ch - H * k) / 2), W * k, H * k);
  }

  function resize() {
    var fit = I.fit(canvas);
    main = fit.ctx;
    lastFrame = -1;
    render(I.reduce ? 4 : (on ? (performance.now() - t0) / 1000 : 4));
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
})();
