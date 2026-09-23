(function () {
  var I = window.BP && window.BP.iso;
  var canvas = document.getElementById('pit');
  if (!I || !canvas) return;

  var W = 4, D = 4, H = 8, TOP = H + 4, COLORS = 4, PRESSURE_MAX = 8;
  var YAW = Math.PI / 4 - 0.22, ELEV = 0.6;
  var cam = { M: I.view(YAW, ELEV), s: 40, x: 0, y: 0, pivot: [2, 4.6, 2] };
  var ctx, cw = 0, ch = 0;

  var elScore = document.getElementById('hud-score');
  var elMult = document.getElementById('hud-mult');
  var elFlame = document.querySelector('.hud-flame');
  var elPress = document.getElementById('hud-pressure');
  var elOver = document.querySelector('.pit-over');
  var elPops = document.querySelector('.pit-pops');
  var wrap = canvas.parentNode;

  var grid, piece, phase, fallY, fallV, score, streak, pressure, pending, nextId, aim, particles, flashIds, timers, bob = 0;
  var reduce = I.reduce, mode = 'bot', lastInput = 0, plan = null, planT = 0, shown = 0, wipeT = 0, ledPulse = 0, ledColor = [115, 204, 255];

  function empty() {
    var g = [];
    for (var x = 0; x < W; x++) {
      g[x] = [];
      for (var y = 0; y < TOP; y++) { g[x][y] = []; for (var z = 0; z < D; z++) g[x][y][z] = null; }
    }
    return g;
  }

  function each(fn) {
    for (var x = 0; x < W; x++) for (var y = 0; y < TOP; y++) for (var z = 0; z < D; z++) {
      var b = grid[x][y][z];
      if (b) fn(b, x, y, z);
    }
  }

  function colH(x, z) {
    for (var y = TOP - 1; y >= 0; y--) if (grid[x][y][z]) return y + 1;
    return 0;
  }

  function block(c, y) { return { c: c, id: nextId++, vy: y, vel: 0, a: 1 }; }

  function noClusterFill(cells) {
    cells.forEach(function (p) {
      var bad = {};
      [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (d) {
        var x = p[0] + d[0], y = p[1] + d[1], z = p[2] + d[2];
        if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= TOP) return;
        var n = grid[x][y][z];
        if (n) bad[n.c] = 1;
      });
      var opts = [];
      for (var c = 0; c < COLORS; c++) if (!bad[c]) opts.push(c);
      if (!opts.length) opts = [0, 1, 2, 3];
      var b = block(opts[Math.floor(Math.random() * opts.length)], p[1]);
      b.a = 0;
      grid[p[0]][p[1]][p[2]] = b;
    });
  }

  function later(ms, fn) { timers.push(setTimeout(fn, ms)); }

  function reset() {
    (timers || []).forEach(clearTimeout);
    timers = [];
    grid = empty();
    nextId = 1; score = 0; streak = 0; pressure = 0; pending = 0;
    particles = []; flashIds = {};
    aim = { x: 1, z: 1 };
    var cells = [];
    for (var x = 0; x < W; x++) for (var z = 0; z < D; z++) cells.push([x, 0, z]);
    noClusterFill(cells);
    elOver.hidden = true;
    wrap.classList.remove('is-over');
    shown = 0;
    elScore.textContent = '0';
    hud();
    spawn(true);
  }

  function spawn(first) {
    if (!first) {
      pressure += 1;
      if (pressure >= PRESSURE_MAX) {
        pressure = 0;
        insertLayer();
        if (overflow()) { hud(); return mode === 'bot' ? wipe() : gameOver(); }
      }
    }
    var sh = I.randomShape();
    piece = { cells: sh.cells, c: Math.floor(Math.random() * COLORS) };
    clampAim();
    phase = 'aim';
    plan = mode === 'bot' ? choose() : null;
    planT = 0;
    hud();
  }

  function insertLayer() {
    var hs = [];
    for (var x = 0; x < W; x++) {
      hs[x] = [];
      for (var z = 0; z < D; z++) hs[x][z] = colH(x, z);
    }
    var old = grid, cells = [];
    grid = empty();
    for (var x2 = 0; x2 < W; x2++) for (var y = 0; y < TOP; y++) for (var z2 = 0; z2 < D; z2++) {
      var b = old[x2][y][z2];
      if (!b) continue;
      if (hs[x2][z2] >= H || y + 1 >= TOP) grid[x2][y][z2] = b;
      else grid[x2][y + 1][z2] = b;
    }
    for (var x3 = 0; x3 < W; x3++) for (var z3 = 0; z3 < D; z3++) {
      if (hs[x3][z3] < H) cells.push([x3, 0, z3]);
    }
    noClusterFill(cells);
    cells.forEach(function (p) { grid[p[0]][0][p[2]].vy = -1; });
    wrap.classList.remove('lift');
    void wrap.offsetWidth;
    wrap.classList.add('lift');
  }

  function overflow() {
    var o = false;
    each(function (b, x, y) { if (y >= H) o = true; });
    return o;
  }

  function extent() {
    var mx = 0, mz = 0;
    piece.cells.forEach(function (c) { mx = Math.max(mx, c[0]); mz = Math.max(mz, c[2]); });
    return [mx, mz];
  }

  function clampAim() {
    if (!piece) return;
    var e = extent();
    aim.x = Math.max(0, Math.min(W - 1 - e[0], aim.x));
    aim.z = Math.max(0, Math.min(D - 1 - e[1], aim.z));
  }

  function landing() {
    var base = 0;
    piece.cells.forEach(function (c) { base = Math.max(base, colH(aim.x + c[0], aim.z + c[2]) - c[1]); });
    return base;
  }

  function turn() {
    if (phase !== 'aim') return;
    piece.cells = I.rotCells(piece.cells);
    clampAim();
  }

  function drop() {
    if (phase !== 'aim') return;
    phase = 'fall';
    fallY = Math.min(H + 0.7, Math.max(3, maxHeight() + 2.6));
    fallV = 4;
  }

  function lock() {
    var y0 = landing(), ids = {};
    piece.cells.forEach(function (c) {
      var b = block(piece.c, y0 + c[1]);
      grid[aim.x + c[0]][y0 + c[1]][aim.z + c[2]] = b;
      ids[b.id] = 1;
    });
    piece = null;
    compact();
    bumpPit(0.35);
    var groups = groupsFor(ids, true);
    if (!groups.length) {
      streak = 0;
      hud();
      phase = 'wait';
      later(90, next);
    } else {
      phase = 'resolve';
      mark(groups);
      later(120, function () { resolve(ids, true, 1); });
    }
  }

  function maxHeight() {
    var m = 0;
    for (var x = 0; x < W; x++) for (var z = 0; z < D; z++) m = Math.max(m, colH(x, z));
    return m;
  }

  function next() {
    if (mode === 'bot' && (overflow() || maxHeight() >= 6)) return wipe();
    if (overflow()) return gameOver();
    spawn(false);
  }

  function wipe() {
    phase = 'wipe';
    piece = null;
    plan = null;
    wipeT = 0;
  }

  function evaluate(cells, ax, az) {
    var base = 0, temp = {}, placed = [], ok = true;
    cells.forEach(function (c) { base = Math.max(base, colH(ax + c[0], az + c[2]) - c[1]); });
    cells.forEach(function (c, i) {
      var y = base + c[1];
      if (y >= TOP) { ok = false; return; }
      var id = -1 - i;
      grid[ax + c[0]][y][az + c[2]] = { c: piece.c, id: id, vy: y, vel: 0, a: 1 };
      temp[id] = 1;
      placed.push([ax + c[0], y, az + c[2]]);
    });
    var hits = 0;
    if (ok) groupsFor(temp, true).forEach(function (g) { hits += g.length; });
    var top = 0;
    placed.forEach(function (p) { top = Math.max(top, p[1] + 1); });
    placed.forEach(function (p) { grid[p[0]][p[1]][p[2]] = null; });
    if (!ok) return -1e9;
    return hits * 10 + (hits ? 6 : 0) - top * 1.6 - base * 0.8 + Math.random() * 2.5;
  }

  function choose() {
    var best = null, cells = piece.cells;
    for (var r = 0; r < 4; r++) {
      var mx = 0, mz = 0;
      cells.forEach(function (c) { mx = Math.max(mx, c[0]); mz = Math.max(mz, c[2]); });
      for (var ax = 0; ax <= W - 1 - mx; ax++) for (var az = 0; az <= D - 1 - mz; az++) {
        var v = evaluate(cells, ax, az);
        if (!best || v > best.v) best = { v: v, r: r, x: ax, z: az };
      }
      cells = I.rotCells(cells);
    }
    return best;
  }

  function botStep(dt) {
    if (!plan || phase !== 'aim') return;
    planT += dt;
    var beat = reduce ? 0.42 : 0.14;
    if (planT < (reduce ? 0.9 : 0.45)) return;
    if (planT - (plan.last || 0) < beat) return;
    plan.last = planT;
    if (plan.r > 0) { turn(); plan.r--; return; }
    if (aim.x !== plan.x) { aim.x += aim.x < plan.x ? 1 : -1; clampAim(); return; }
    if (aim.z !== plan.z) { aim.z += aim.z < plan.z ? 1 : -1; clampAim(); return; }
    if (!plan.hold) { plan.hold = true; return; }
    drop();
  }

  function takeOver() {
    lastInput = performance.now();
    if (mode === 'bot') { mode = 'user'; plan = null; }
  }

  function compact() {
    for (var x = 0; x < W; x++) for (var z = 0; z < D; z++) {
      var stack = [];
      for (var y = 0; y < TOP; y++) if (grid[x][y][z]) stack.push(grid[x][y][z]);
      for (var y2 = 0; y2 < TOP; y2++) grid[x][y2][z] = stack[y2] || null;
    }
  }

  function pairs() {
    var set = {};
    each(function (b, x, y, z) {
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]].forEach(function (d) {
        var X = x + d[0], Y = y + d[1], Z = z + d[2];
        if (X >= W || Y >= TOP || Z >= D) return;
        var n = grid[X][Y][Z];
        if (n && n.c === b.c) set[Math.min(b.id, n.id) + '-' + Math.max(b.id, n.id)] = [b.id, n.id];
      });
    });
    return set;
  }

  function groupsFor(trigger, external) {
    var seen = {}, out = [];
    each(function (b, x, y, z) {
      if (seen[b.id]) return;
      var q = [[x, y, z]], g = [];
      seen[b.id] = 1;
      while (q.length) {
        var p = q.pop();
        g.push(p);
        [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (d) {
          var X = p[0] + d[0], Y = p[1] + d[1], Z = p[2] + d[2];
          if (X < 0 || X >= W || Y < 0 || Y >= TOP || Z < 0 || Z >= D) return;
          var n = grid[X][Y][Z];
          if (n && !seen[n.id] && n.c === b.c) { seen[n.id] = 1; q.push([X, Y, Z]); }
        });
      }
      if (g.length < 2) return;
      var hit = false, outside = false;
      g.forEach(function (p) {
        if (trigger[grid[p[0]][p[1]][p[2]].id]) hit = true; else outside = true;
      });
      if (hit && (!external || outside)) out.push(g);
    });
    return out;
  }

  function mark(groups) {
    groups.forEach(function (g) { g.forEach(function (p) { flashIds[grid[p[0]][p[1]][p[2]].id] = performance.now(); }); });
  }

  function sizeValue(n) {
    var t = { 2: 1.5, 3: 3, 4: 4.5, 5: 6.5, 6: 9, 7: 12, 8: 16 };
    if (t[n]) return t[n];
    var m = n - 8;
    return 16 + 4 * m + m * (m + 1) / 2;
  }
  function chainValue(s) {
    var t = { 1: 1, 2: 2.5, 3: 4.5, 4: 7, 5: 10.5, 6: 15 };
    if (t[s]) return t[s];
    var m = s - 6;
    return 15 + 4.5 * m + m * (m + 1) / 2;
  }
  function multiplier(k) { return Math.min(2.4, 2.4 - 1.5 * Math.pow(0.8, k)); }

  function resolve(trigger, external, chain) {
    var groups = groupsFor(trigger, external);
    if (!groups.length) {
      if (pending > 0) {
        streak += 1;
        var inc = Math.round(pending * multiplier(streak) * 6);
        score += inc;
        pop('+' + inc, 'pts');
        pending = 0;
      }
      hud();
      phase = 'wait';
      later(60, next);
      return;
    }
    var sum = [0, 0, 0], cnt = 0;
    groups.forEach(function (g) {
      pending += sizeValue(g.length) * chainValue(chain);
      g.forEach(function (p) {
        var b = grid[p[0]][p[1]][p[2]];
        burst(p[0], b.vy, p[2], b.c);
        sum[0] += p[0]; sum[1] += p[1]; sum[2] += p[2]; cnt++;
        grid[p[0]][p[1]][p[2]] = null;
        delete flashIds[b.id];
      });
    });
    if (chain >= 2) pop('Chain ×' + chain, 'chain', sum.map(function (v) { return v / cnt; }));
    bumpPit(0.6 + chain * 0.25);
    ledPulse = Math.min(1.6, ledPulse + 0.6 + chain * 0.3);
    later(200, function () {
      var before = pairs();
      compact();
      var after = pairs(), fresh = {};
      Object.keys(after).forEach(function (k) {
        if (!before[k]) { fresh[after[k][0]] = 1; fresh[after[k][1]] = 1; }
      });
      settle(function () {
        var g2 = groupsFor(fresh, false);
        if (g2.length) mark(g2);
        later(120, function () { resolve(fresh, false, chain + 1); });
      });
    });
  }

  function settle(fn) {
    var busy = false;
    each(function (b, x, y) { if (Math.abs(b.vy - y) > 0.02) busy = true; });
    if (busy) later(30, function () { settle(fn); });
    else fn();
  }

  function gameOver() {
    phase = 'over';
    piece = null;
    elOver.hidden = false;
    elOver.querySelector('b').textContent = score;
    wrap.classList.add('is-over');
  }

  var shake = 0;
  function bumpPit(k) { if (!reduce) shake = Math.min(1.4, shake + k); }

  function burst(x, y, z, c) {
    if (reduce) return;
    var p = I.project(cam, x + 0.5, y + 0.5, z + 0.5);
    for (var i = 0; i < 10; i++) {
      var a = Math.random() * 6.28, sp = 60 + Math.random() * 180;
      particles.push({ x: p[0], y: p[1], vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, c: I.HEX[c], t: 0, life: 0.5 + Math.random() * 0.4, r: 2 + Math.random() * 4 });
    }
  }

  function pop(text, kind, at) {
    var el = document.createElement('span');
    el.className = 'pop pop-' + kind;
    el.textContent = text;
    var p = at ? I.project(cam, at[0] + 0.5, at[1] + 0.5, at[2] + 0.5) : [cw / 2, ch * 0.3];
    el.style.left = (p[0] / cw * 100) + '%';
    el.style.top = (p[1] / ch * 100) + '%';
    elPops.appendChild(el);
    setTimeout(function () { el.remove(); }, 1400);
  }

  var segs = [];
  (function buildPressure() {
    var ns = 'http://www.w3.org/2000/svg';
    var e = 10, dx = e * Math.cos(Math.PI / 6), dy = e / 2;
    elPress.setAttribute('viewBox', (-dx - 2) + ' ' + (-dy - 3) + ' ' + (2 * dx + 4) + ' ' + (PRESSURE_MAX * e + 2 * dy + 6));
    for (var i = 0; i < PRESSURE_MAX; i++) {
      var y = (PRESSURE_MAX - 1 - i) * e;
      var g = document.createElementNS(ns, 'g');
      var faces = [
        [0, y, dx, y + dy, 0, y + 2 * dy, -dx, y + dy],
        [-dx, y + dy, 0, y + 2 * dy, 0, y + e + dy, -dx, y + e],
        [0, y + 2 * dy, dx, y + dy, dx, y + e, 0, y + e + dy]
      ];
      ['t', 'l', 'r'].forEach(function (cls, k) {
        var p = document.createElementNS(ns, 'polygon');
        p.setAttribute('points', faces[k].join(' '));
        p.setAttribute('class', cls);
        g.appendChild(p);
      });
      elPress.appendChild(g);
      segs.push(g);
    }
  })();

  function hud() {
    var m = multiplier(streak);
    elMult.textContent = '×' + m.toFixed(2);
    elFlame.classList.toggle('on', streak > 0);
    elFlame.style.setProperty('--heat', streak > 0 ? ((m - 0.9) / 1.5).toFixed(3) : 0);
    segs.forEach(function (g, i) { g.classList.toggle('on', i < pressure); });
    elPress.classList.toggle('hot', pressure / PRESSURE_MAX >= 0.75);
  }

  function aimFrom(sx, sy) {
    if (!piece || phase !== 'aim') return;
    var hit = null;
    for (var h = H + 0.5; h >= 0; h -= 0.08) {
      var p = I.unproject(cam, sx, sy, h);
      var X = Math.floor(p[0]), Z = Math.floor(p[1]);
      if (X < 0 || X >= W || Z < 0 || Z >= D) continue;
      if (colH(X, Z) >= h) { hit = [X, Z]; break; }
    }
    if (!hit) {
      var f = I.unproject(cam, sx, sy, 0);
      if (f[0] < -1.5 || f[0] > W + 1.5 || f[1] < -1.5 || f[1] > D + 1.5) return;
      hit = [Math.max(0, Math.min(W - 1, Math.floor(f[0]))), Math.max(0, Math.min(D - 1, Math.floor(f[1])))];
    }
    var e = extent();
    aim.x = hit[0] - Math.floor(e[0] / 2);
    aim.z = hit[1] - Math.floor(e[1] / 2);
    clampAim();
  }

  function local(ev) {
    var r = canvas.getBoundingClientRect();
    return [ev.clientX - r.left, ev.clientY - r.top];
  }

  var down = null;
  canvas.addEventListener('pointermove', function (ev) {
    takeOver();
    if (ev.pointerType === 'mouse' || down) { var p = local(ev); aimFrom(p[0], p[1]); }
    if (down) down.moved += Math.abs(ev.movementX || 0) + Math.abs(ev.movementY || 0);
  });
  canvas.addEventListener('pointerdown', function (ev) {
    takeOver();
    down = { t: performance.now(), moved: 0, type: ev.pointerType, btn: ev.button };
    if (ev.pointerType !== 'mouse') { canvas.setPointerCapture(ev.pointerId); }
    else { var p = local(ev); aimFrom(p[0], p[1]); }
  });
  canvas.addEventListener('pointerup', function () {
    if (!down) return;
    var d = down;
    down = null;
    if (d.type === 'mouse') { if (d.btn === 0) drop(); return; }
    if (d.moved < 10 && performance.now() - d.t < 260) turn(); else drop();
  });
  canvas.addEventListener('pointercancel', function () { down = null; });
  canvas.addEventListener('contextmenu', function (ev) { ev.preventDefault(); turn(); });
  canvas.addEventListener('keydown', function (ev) {
    var k = ev.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter', 'r', 'R'].indexOf(k) < 0) return;
    ev.preventDefault();
    takeOver();
    if (phase !== 'aim') return;
    if (k === 'ArrowLeft') { aim.x--; } else if (k === 'ArrowRight') { aim.x++; }
    else if (k === 'ArrowUp') { aim.z--; } else if (k === 'ArrowDown') { aim.z++; }
    else if (k === ' ' || k === 'Enter') { drop(); }
    else if (k === 'r' || k === 'R') { turn(); }
    clampAim();
  });
  document.querySelectorAll('[data-pit]').forEach(function (b) {
    b.addEventListener('click', function () {
      var a = b.getAttribute('data-pit');
      takeOver();
      if (a === 'turn') turn(); else if (a === 'drop') drop(); else reset();
    });
  });

  function resize() {
    var f = I.fit(canvas);
    ctx = f.ctx; cw = f.w; ch = f.h;
    cam.s = Math.min(cw / 5.8, ch / 8.6);
    cam.x = cw / 2;
    cam.y = ch * 0.4;
  }

  var last = 0, on = false;
  function frame(now) {
    if (!on) return;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    bob += dt;
    step(dt);
    render(now);
    requestAnimationFrame(frame);
  }

  function step(dt) {
    var now = performance.now();
    if (mode === 'user' && now - lastInput > 5000 && !down) {
      mode = 'bot';
      if (phase === 'over') reset();
      else if (phase === 'aim') { plan = choose(); planT = 0; }
    }
    if (mode === 'bot') botStep(dt);
    if (phase === 'wipe') {
      wipeT += dt;
      if (wipeT > (reduce ? 1.2 : 0.8)) reset();
    }
    if (shown !== score) {
      shown = shown + (score - shown) * Math.min(1, dt * 5);
      if (Math.abs(score - shown) < 0.5) shown = score;
      elScore.textContent = Math.round(shown);
    }
    ledPulse = Math.max(0, ledPulse - dt * 2.2);
    if (phase === 'fall') {
      fallV += (reduce ? 26 : 70) * dt;
      fallY -= fallV * dt;
      var ly = landing();
      if (fallY <= ly) lock();
    }
    each(function (b, x, y) {
      if (b.vy > y) {
        b.vel += 48 * dt;
        b.vy = Math.max(y, b.vy - b.vel * dt);
        if (b.vy === y) b.vel = 0;
      } else if (b.vy < y) {
        b.vy = Math.min(y, b.vy + Math.max(0.02, (y - b.vy) * dt * 9));
        b.vel = 0;
      }
      if (b.a < 1) b.a = Math.min(1, b.a + dt * 3);
    });
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      p.t += dt; p.vy += 520 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) particles.splice(i, 1);
    }
    shake = Math.max(0, shake - dt * 3.2);
  }

  function render(now) {
    ctx.clearRect(0, 0, cw, ch);
    var sx = cam.x, sy = cam.y;
    var j = shake * shake * 3;
    cam.x = sx + (Math.random() - 0.5) * j;
    cam.y = sy + (Math.random() - 0.5) * j;
    if (window.BP.sky) {
      var r = wrap.getBoundingClientRect(), dh = Math.max(1, document.documentElement.scrollHeight);
      ledColor = window.BP.sky.led(window.BP.sky.pageU((window.scrollY + r.top + r.height / 2) / dh));
    }
    I.plate(ctx, cam, { led: ledColor, glow: 1 + ledPulse });
    var items = [], wk = phase === 'wipe' ? wipeT / (reduce ? 1.2 : 0.8) : 0;
    each(function (b, x, y, z) {
      var f = 0, k = 1;
      if (flashIds[b.id]) f = 0.35 + 0.35 * Math.sin((now - flashIds[b.id]) / 30);
      if (wk) k = Math.max(0, Math.min(1, 1 - (wk * 1.6 - (TOP - y) / TOP * 0.6)));
      if (k <= 0.02) return;
      items.push({ x: x, y: b.vy, z: z, c: b.c, f: f, k: k, a: b.vy < 0 ? Math.max(0, b.a * (1 + b.vy)) : b.a });
    });
    if (piece && (phase === 'aim' || phase === 'fall')) {
      var ly = landing();
      var hover = Math.min(H + 0.7, Math.max(3, maxHeight() + 2.6));
      if (phase === 'fall' && fallY > hover) fallY = hover;
      var py = phase === 'fall' ? fallY : hover + Math.sin(bob * 2.4) * 0.12;
      piece.cells.forEach(function (c) {
        if (phase === 'aim' && mode === 'user') items.push({ x: aim.x + c[0], y: ly + c[1], z: aim.z + c[2], c: piece.c, ghost: true, a: 0.55 });
        items.push({ x: aim.x + c[0], y: py + c[1], z: aim.z + c[2], c: piece.c });
      });
    }
    I.cubes(ctx, items, cam);
    particles.forEach(function (p) {
      ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    });
    ctx.globalAlpha = 1;
    cam.x = sx; cam.y = sy;
  }

  window.addEventListener('resize', resize);
  resize();
  reset();
  render(0);
  I.visible(wrap, function (v) {
    if (v && !on) { on = true; last = 0; requestAnimationFrame(frame); }
    else if (!v) on = false;
  });
})();
