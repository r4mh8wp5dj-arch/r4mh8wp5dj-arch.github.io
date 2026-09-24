(function () {
  var I = window.BP && window.BP.iso;
  if (!I) return;

  var W = 4, D = 4, H = 8, TOP = H + 4, COLORS = 4, PRESSURE_MAX = 8;
  var YAW0 = Math.PI / 4 - 0.22, ELEV = 0.6, VIEW = I.view(YAW0, ELEV), BLK = 0.94;

  function createPit(opts) {
    var canvas = opts.canvas;
    if (!canvas) return;
    var elScore = opts.score || null, scoreCv = opts.scoreCv || null, blobCv = document.createElement('canvas');
    var gauges = opts.gauges, elPops = opts.pops, wrap = canvas.parentNode, reduce = I.reduce;
    var script = opts.script || null, stepIdx = 0, endT = 0, doomT = 0, drops = 0, marks = { key: '', t: 0 };


    var grid, piece, phase, fallY, fallV, score, streak, pressure, pending, nextId, aim, frags, flashes, timers;
    var plan = null, planT = 0, shown = 0, wipeT = 0, clock = 0, freeze = 0, bob = 0;
    var spin = { from: 0, to: 0, t: -10, next: 2.5, dur: 0.7 }, count = { from: 0, to: 0, t: -1 }, flashS = { v: 1, vel: 0, until: -1 };
    var ghostSim = { key: '', over: false }, DANGER_RED = [230, 31, 26];
    var ghost = { key: '', t: -1, from: [0, 0, 0], pos: null }, pressFill = { row: -1, t: 0 }, pressBurst = -1, lastPressure = 0;
    var chan = { gain: 1, from: 1, peak: 1, t: -1, heat: 0, tier: 0, tierT: 0, flow: 0 };
    var streakView = { i: 0, v: 0, pulse: 0, pv: 0, pt: -1 };

    var cam = { M: VIEW, s: 40, x: 0, y: 0, pivot: [2, 2, 2] };
    var ctx, cw = 0, ch = 0;
    var FIRE = { core: [255, 242, 191], mid: [255, 199, 89], deep: [209, 20, 13], low: [255, 107, 15], high: [255, 199, 51], cap: [255, 247, 224] };
    var PAL = {
      cyan: steps([0, 184, 204], [102, 242, 255]),
      lime: steps([76, 187, 23], [184, 245, 66]),
      fire: [[232, 16, 42], [255, 61, 26], [255, 115, 0], [255, 140, 16]],
      ember: steps([255, 42, 26], [255, 224, 77])
    };
    var TIERS = [null, { peak: 1.9, heat: 0.25, speed: 1.5, dur: 0.5 }, { peak: 2.2, heat: 0.5, speed: 3, dur: 1.2 }, { peak: 2.6, heat: 0.75, speed: 6, dur: 2.2 }];

    function steps(a, b) { return [0, 1 / 3, 2 / 3, 1].map(function (t) { return a.map(function (v, i) { return v + (b[i] - v) * t; }); }); }
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function easeIn(t) { return t * t; }
    function easeOutQ(t) { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t); }
    function easeInOut(t) { t = clamp(t, 0, 1); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function rgb(c, a) { return 'rgba(' + c.map(function (v) { return Math.round(clamp(v, 0, 255)); }).join(',') + ',' + (a == null ? 1 : a) + ')'; }

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
    function maxHeight() {
      var m = 0;
      for (var x = 0; x < W; x++) for (var z = 0; z < D; z++) m = Math.max(m, colH(x, z));
      return m;
    }
    function block(c, y) { return { c: c, id: nextId++, vy: y, vel: 0, k: 1, born: clock, sq: null, antic: -1 }; }

    function noClusterFill(cells) {
      cells.forEach(function (p) {
        var bad = {};
        [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].forEach(function (d) {
          var x = p[0] + d[0], y = p[1] + d[1], z = p[2] + d[2];
          if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= TOP) return;
          var n = grid[x][y][z];
          if (n) bad[n.c] = 1;
        });
        var opts = [];
        for (var c = 0; c < COLORS; c++) if (!bad[c]) opts.push(c);
        if (!opts.length) opts = [0, 1, 2, 3];
        grid[p[0]][p[1]][p[2]] = block(opts[Math.floor(Math.random() * opts.length)], p[1]);
      });
    }

    function later(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function reset() {
      (timers || []).forEach(clearTimeout);
      timers = [];
      grid = empty();
      nextId = 1; score = 0; streak = 0; pressure = 0; pending = 0; lastPressure = 0;
      frags = []; flashes = [];
      aim = { x: 1, z: 1 };
      stepIdx = 0; endT = 0; drops = 0;
      if (script) {
        script.grid.forEach(function (col) { col[2].forEach(function (c, y) { grid[col[0]][y][col[1]] = block(c, y); }); });
        pressure = lastPressure = script.pressure;
      } else {
        var cells = [];
        var hs = (opts.heights || [1]).slice(), top = 0;
        for (var i = hs.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = hs[i]; hs[i] = hs[j]; hs[j] = t; }
        hs.forEach(function (h) { top = Math.max(top, h); });
        for (var y = 0; y < top; y++) for (var x = 0; x < W; x++) for (var z = 0; z < D; z++) if (y < (hs[x * D + z] || 1)) cells.push([x, y, z]);
        noClusterFill(cells);
      }
      shown = 0;
      count = { from: 0, to: 0, t: -1 };
      if (elScore) elScore.textContent = '0';
      ghost = { key: '', t: -1, from: [0, 0, 0], pos: null };
      spawn(true);
    }

    function spawn(first) {
      if (!first) {
        pressure += 1;
        if (pressure >= PRESSURE_MAX) {
          pressure = 0;
          pressBurst = clock;
          insertLayer();
          if (overflow()) return wipe();
        }
      }
      if (script) {
        var st = script.steps[stepIdx++];
        if (!st) { piece = null; plan = null; phase = 'end'; endT = 0; return; }
        piece = { cells: st.cells.map(function (c) { return c.slice(); }), c: st.c };
        aim = { x: st.x, z: st.z };
        clampAim();
        phase = 'aim';
        plan = schedule({ r: 0, x: st.x, z: st.z });
        planT = 0;
        return;
      }
      piece = { cells: I.randomShape().cells, c: Math.floor(Math.random() * COLORS) };
      clampAim();
      phase = 'aim';
      plan = choose();
      planT = 0;
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
      for (var x3 = 0; x3 < W; x3++) for (var z3 = 0; z3 < D; z3++) if (hs[x3][z3] < H) cells.push([x3, 0, z3]);
      noClusterFill(cells);
      cells.forEach(function (p) { var b = grid[p[0]][0][p[2]]; b.vy = -1; b.rise = true; });
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
      aim.x = clamp(aim.x, 0, W - 1 - e[0]);
      aim.z = clamp(aim.z, 0, D - 1 - e[1]);
    }
    function landing() {
      var base = 0;
      piece.cells.forEach(function (c) { base = Math.max(base, colH(aim.x + c[0], aim.z + c[2]) - c[1]); });
      return base;
    }
    function hoverY() { return Math.min(opts.hoverCap || (cw < 500 ? 8.2 : 8.9), Math.max(2.8, maxHeight() + 2.2)); }
    function finalCells(cells, ax, az) {
      var cols = {};
      cells.forEach(function (c) { var k = (ax + c[0]) + ',' + (az + c[2]); (cols[k] = cols[k] || []).push(c); });
      var out = [];
      Object.keys(cols).forEach(function (k) {
        var xz = k.split(',').map(Number), h = colH(xz[0], xz[1]);
        cols[k].sort(function (a, b) { return a[1] - b[1]; }).forEach(function (c, i) { out.push([xz[0], h + i, xz[1], c]); });
      });
      return out;
    }

    function orientKey(cells) {
      return cells.map(function (c) { return c.join(','); }).sort().join(';');
    }
    function turn() {
      if (phase !== 'aim') return false;
      var next = I.rotCells(piece.cells);
      if (orientKey(next) === orientKey(piece.cells)) return false;
      piece.cells = next;
      clampAim();
      return true;
    }
    function drop() {
      if (phase !== 'aim') return;
      phase = 'fall';
      fallY = hoverY();
      fallV = 4;
    }

    function lock() {
      drops++;
      ghost = { key: '', t: -1, from: [0, 0, 0], pos: null };
      var y0 = landing(), ids = {};
      piece.cells.forEach(function (c) {
        var b = block(piece.c, y0 + c[1]);
        b.sq = { t: clock, a: 0.04, b: 0.04, i: 0.03, o: 0.07 };
        grid[aim.x + c[0]][y0 + c[1]][aim.z + c[2]] = b;
        ids[b.id] = 1;
      });
      piece = null;
      compact();
      var groups = groupsFor(ids, true);
      if (!groups.length) {
        streak = 0;
        phase = 'wait';
        later(90, next);
      } else {
        phase = 'resolve';
        anticipate(groups);
        later(120, function () { resolve(ids, true, 1); });
      }
    }

    function next() {
      if (script) return spawn(false);
      if (overflow()) return wipe();
      if (maxHeight() >= 7) { phase = 'doom'; doomT = 0; piece = null; plan = null; return; }
      spawn(false);
    }
    function wipe() {
      phase = 'wipe';
      piece = null;
      plan = null;
      wipeT = 0;
      banner('Pit full', 'full', 34);
    }

    function endsInOverflow(cells, c, ax, az) {
      var saved = grid, trigger = {}, external = true, guard = 0;
      grid = saved.map(function (col) { return col.map(function (row) { return row.slice(); }); });
      finalCells(cells, ax, az).forEach(function (f, i) {
        if (f[1] >= TOP) return;
        var id = -1000 - i;
        grid[f[0]][f[1]][f[2]] = { c: c, id: id, vy: f[1] };
        trigger[id] = 1;
      });
      while (guard++ < 20) {
        var groups = groupsFor(trigger, external);
        if (!groups.length) break;
        groups.forEach(function (g) { g.forEach(function (p) { grid[p[0]][p[1]][p[2]] = null; }); });
        var before = pairs();
        compact();
        var after = pairs(), fresh = {};
        Object.keys(after).forEach(function (k) { if (!before[k]) { fresh[after[k][0]] = 1; fresh[after[k][1]] = 1; } });
        trigger = fresh;
        external = false;
      }
      var result = overflow();
      grid = saved;
      return result;
    }

    function evaluate(cells, ax, az) {
      var temp = {}, placed = [], ok = true, top = 0;
      finalCells(cells, ax, az).forEach(function (f, i) {
        if (f[1] >= TOP) { ok = false; return; }
        var id = -1 - i;
        grid[f[0]][f[1]][f[2]] = { c: piece.c, id: id, vy: f[1] };
        temp[id] = 1;
        placed.push(f);
        top = Math.max(top, f[1] + 1);
      });
      var hits = 0;
      if (ok) groupsFor(temp, true).forEach(function (g) { hits += g.length; });
      placed.forEach(function (p) { grid[p[0]][p[1]][p[2]] = null; });
      if (!ok) return -1e9;
      if (top > H && endsInOverflow(cells, piece.c, ax, az)) return -1e8 + hits;
      var sl = clamp((drops - 8) / 10, 0, 1);
      return (hits * 10 + (hits ? 6 : 0)) * (1 - sl) - top * 1.2 * (1 - sl) + top * 1.6 * sl - (hits ? 9 : 0) * sl + Math.random() * 4;
    }
    function choose() {
      var best = null, cells = piece.cells, orients = {}, spots = {};
      for (var r = 0; r < 4; r++) {
        var ok = orientKey(cells);
        if (!orients[ok]) {
          orients[ok] = 1;
          var mx = 0, mz = 0;
          cells.forEach(function (c) { mx = Math.max(mx, c[0]); mz = Math.max(mz, c[2]); });
          for (var ax = 0; ax <= W - 1 - mx; ax++) for (var az = 0; az <= D - 1 - mz; az++) {
            var spot = finalCells(cells, ax, az).map(function (f) { return f.slice(0, 3).join(','); }).sort().join(';');
            if (spots[spot]) continue;
            spots[spot] = 1;
            var v = evaluate(cells, ax, az) - r * 1.5;
            if (!best || v > best.v) best = { v: v, r: r, x: ax, z: az };
          }
        }
        cells = I.rotCells(cells);
      }
      return schedule(best);
    }
    function pause(a, b) { return (a + Math.random() * (b - a)) * (reduce ? 2.2 : 1); }
    function schedule(target) {
      var q = [], x = aim.x, z = aim.z;
      for (var t = 0; t < target.r; t++) q.push({ a: 'turn', w: pause(0.26, 0.38) });
      while (x !== target.x) { x += x < target.x ? 1 : -1; q.push({ a: 'x', v: x, w: pause(0.13, 0.2) + (Math.random() < 0.15 ? 0.25 : 0) }); }
      while (z !== target.z) { z += z < target.z ? 1 : -1; q.push({ a: 'z', v: z, w: pause(0.13, 0.2) + (Math.random() < 0.15 ? 0.25 : 0) }); }
      q.push({ a: 'drop', w: pause(0.25, 0.42) });
      return { q: q, wait: pause(0.45, 0.8), x: target.x, z: target.z };
    }
    function botStep(dt) {
      if (!plan || phase !== 'aim') return;
      planT += dt;
      if (planT < plan.wait) return;
      var act = plan.q[0];
      if (!act) return;
      if (planT < plan.wait + act.w) return;
      plan.q.shift();
      plan.wait = planT;
      if (act.a === 'turn') turn();
      else if (act.a === 'x') { aim.x = act.v; clampAim(); }
      else if (act.a === 'z') { aim.z = act.v; clampAim(); }
      else { aim.x = plan.x; aim.z = plan.z; clampAim(); drop(); }
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
        g.forEach(function (p) { if (trigger[grid[p[0]][p[1]][p[2]].id]) hit = true; else outside = true; });
        if (hit && (!external || outside)) out.push(g);
      });
      return out;
    }
    function anticipate(groups) {
      groups.forEach(function (g) { g.forEach(function (p) { grid[p[0]][p[1]][p[2]].antic = clock; }); });
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
    function impact(n, chain, weight, ceil) { return clamp(Math.min(n, 14) / 4 + Math.max(0, Math.min(chain, 8) - 1) * weight, 0.55, ceil); }

    function resolve(trigger, external, chain) {
      var groups = groupsFor(trigger, external);
      if (!groups.length) {
        if (pending > 0) {
          streak += 1;
          streakView.pt = clock;
          if (streak === 6 || streak === 12 || streak === 18) banner('On fire!', 'fire', 40);
          score += Math.round(pending * multiplier(streak) * 6);
          pending = 0;
        }
        phase = 'wait';
        later(60, next);
        return;
      }
      var gone = {};
      groups.forEach(function (g) {
        var value = sizeValue(g.length) * chainValue(chain), c = [0, 0, 0], color;
        pending += value;
        g.forEach(function (p) {
          var b = grid[p[0]][p[1]][p[2]];
          color = b.c;
          c[0] += p[0]; c[1] += b.vy; c[2] += p[2];
          gone[p.join(',')] = 1;
          vanish(p[0], b.vy, p[2], b.c, g.length, chain);
          grid[p[0]][p[1]][p[2]] = null;
        });
        c = c.map(function (v) { return v / g.length; });
        flash(c, color, impact(g.length, chain, 0.075, 3));
        popScore(Math.round(value * 6), c);
      });
      squashNeighbors(gone);
      if (chain >= 2) banner('Chain x' + chain + '!', chain >= 6 ? 'c3' : chain >= 4 ? 'c2' : 'c1', 28 * (1 + (Math.min(chain, 6) - 2) * 0.15));
      pulseChannel(chain >= 4 ? 3 : chain >= 2 ? 2 : 1);
      if (!reduce) freeze = [0.04, 0.045, 0.05, 0.055, 0.06][Math.min(chain, 5) - 1];
      later(200, function () {
        var before = pairs();
        compact();
        var after = pairs(), fresh = {};
        Object.keys(after).forEach(function (k) { if (!before[k]) { fresh[after[k][0]] = 1; fresh[after[k][1]] = 1; } });
        settle(function () {
          var g2 = groupsFor(fresh, false);
          if (g2.length) anticipate(g2);
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

    var dying = [];
    function vanish(x, y, z, c, n, chain) {
      dying.push({ x: x, y: y, z: z, c: c, t: clock });
      if (reduce) return;
      var t = clamp((impact(n, chain, 0, 5.81) + 5.06 * Math.pow(Math.max(0, Math.min(chain, 8) - 1) / 7, 1.4) - 0.75) / 2.25, 0, 1);
      var count = 6 + Math.round(t * 4);
      for (var i = 0; i < count; i++) {
        var a = Math.random() * 6.2832, sp = 0.9 + Math.random() * 1.6;
        frags.push({
          x: x + 0.5 + (Math.random() - 0.5) * 0.52, y: y + 0.5 + (Math.random() - 0.5) * 0.52, z: z + 0.5 + (Math.random() - 0.5) * 0.52,
          vx: Math.cos(a) * sp, vy: 1.9 + Math.random() * 1.4, vz: Math.sin(a) * sp,
          k: 0.18 + Math.random() * 0.12, c: c, t: 0, life: 0.5 + Math.random() * 0.3,
          rx: (Math.random() - 0.5) * 8, ry: (Math.random() - 0.5) * 8
        });
      }
    }
    function flash(c, color, intensity) {
      if (reduce) return;
      flashes.push({ x: c[0] + 0.5, y: c[1] + 0.5, z: c[2] + 0.5, c: color, i: intensity, t: clock });
    }
    function squashNeighbors(gone) {
      each(function (b, x, y, z) {
        var touch = false;
        [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].forEach(function (d) {
          if (gone[(x + d[0]) + ',' + (y + d[1]) + ',' + (z + d[2])]) touch = true;
        });
        if (gone[x + ',' + (y - 1) + ',' + z]) touch = false;
        if (touch) b.sq = { t: clock, a: 0.04, b: 0.07, i: 0.05, o: 0.1 };
      });
    }
    function pulseChannel(tier) {
      var T = TIERS[tier];
      chan.from = chan.gain; chan.peak = T.peak; chan.t = clock;
      chan.tier = tier; chan.tierT = clock; chan.heat = T.heat;
    }

    var popNext = 0, currentBanner = null;
    function popScore(points, at) {
      if (opts.noPoints) return;
      var now = performance.now(), wait = Math.max(0, popNext - now);
      popNext = now + wait + 420;
      if (wait) { setTimeout(function () { showScore(points, at); }, wait); return; }
      showScore(points, at);
    }
    function showScore(points, at) {
      var tier = points >= 400 ? 3 : points >= 200 ? 2 : points >= 50 ? 1 : 0;
      var hang = [0, 0, 0.18, 0.4][tier], total = (1.3 + hang) * 1000;
      var p = I.project(cam, at[0] + 0.5, at[1] + 1, at[2] + 0.5);
      var el = document.createElement('span'), inner = document.createElement('i'), fill = document.createElement('b');
      el.className = 'pop pop-t' + tier;
      fill.textContent = '+' + points;
      inner.setAttribute('data-t', '+' + points);
      inner.appendChild(fill);
      el.appendChild(inner);
      el.style.left = (p[0] / cw * 100) + '%';
      el.style.top = (p[1] / ch * 100) + '%';
      elPops.appendChild(el);
      if (el.animate && !reduce) {
        el.animate([{ transform: 'translate(-50%,-50%) translateY(0)' }, { transform: 'translate(-50%,-50%) translateY(-55px)' }], { duration: 750, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' });
        var a = 120 / total, b2 = (800 + hang * 1000) / total, c2 = Math.min(1, (1150 + hang * 1000) / total);
        el.animate([{ opacity: 0, offset: 0 }, { opacity: 1, offset: a }, { opacity: 1, offset: b2 }, { opacity: 0, offset: c2 }, { opacity: 0, offset: 1 }], { duration: total, fill: 'forwards' });
        if (tier >= 2) {
          var o = tier === 3 ? 1.25 : 1.18, w = tier === 3 ? 1.4 : 1, sw = o - 1;
          inner.animate([{ transform: 'scale(.72)' }, { transform: 'scale(' + o + ')', offset: 0.29 }, { transform: 'scale(' + (1 - sw * 0.35 * w) + ')', offset: 0.49 }, { transform: 'scale(' + (1 + sw * 0.15 * w) + ')', offset: 0.84 }, { transform: 'scale(1)' }], { duration: 410, easing: 'ease-out' });
        } else if (tier === 1) {
          inner.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.35)', offset: 0.35 }, { filter: 'brightness(1)' }], { duration: 370, delay: 50 });
        }
      }
      setTimeout(function () { el.remove(); }, total + 50);
    }
    function banner(text, look, size) {
      if (currentBanner) currentBanner.remove();
      var el = document.createElement('span'), inner = document.createElement('i'), fill = document.createElement('b');
      el.className = 'pop pop-banner pop-' + look;
      fill.textContent = text;
      inner.setAttribute('data-t', text);
      inner.appendChild(fill);
      el.appendChild(inner);
      el.style.left = '50%';
      el.style.top = '14%';
      el.style.fontSize = Math.round(size * Math.min(1, cw / 420)) + 'px';
      elPops.appendChild(el);
      currentBanner = el;
      if (el.animate && !reduce) {
        el.animate([{ transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.12 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.8 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: look === 'full' ? 900 : 1500, fill: 'forwards', easing: 'ease-out' });
        if (look === 'c1') {
          fill.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.6)', offset: 0.3 }, { filter: 'brightness(1)' }], { duration: 400, delay: 80 });
        } else {
          var o = look === 'c3' ? 1.25 : 1.18, w = look === 'c3' ? 1.4 : 1, sw = o - 1;
          inner.animate([{ transform: 'scale(.72)' }, { transform: 'scale(' + o + ')', offset: 0.29 }, { transform: 'scale(' + (1 - sw * 0.35 * w) + ')', offset: 0.49 }, { transform: 'scale(' + (1 + sw * 0.15 * w) + ')', offset: 0.84 }, { transform: 'scale(1)' }], { duration: 410, easing: 'ease-out' });
        }
      }
      setTimeout(function () { el.remove(); if (currentBanner === el) currentBanner = null; }, look === 'full' ? 950 : 1550);
    }

    function resize() {
      var f = I.fit(canvas);
      ctx = f.ctx; cw = f.w; ch = f.h;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (scoreCv) {
        var sr = scoreCv.getBoundingClientRect();
        scoreCv.width = Math.round(sr.width * dpr); scoreCv.height = Math.round(sr.height * dpr);
      }
      var gr = gauges.getBoundingClientRect();
      gauges.width = Math.round(gr.width * dpr); gauges.height = Math.round(gr.height * dpr);
      gauges.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function sqScale(sq) {
      if (!sq) return null;
      var e = clock - sq.t, tot = sq.i + sq.o;
      if (e >= tot) return null;
      var f = e < sq.i ? easeOutQ(e / sq.i) : 1 - easeOutQ((e - sq.i) / sq.o);
      return { w: 1 + sq.a * f, h: 1 - sq.b * f };
    }

    function step(dt) {
      if (freeze > 0) { freeze -= dt; return; }
      clock += dt;
      bob += dt;
      botStep(dt);
      if (phase === 'doom') {
        doomT += dt;
        if (doomT > 0.8) wipe();
      }
      if (phase === 'wipe') {
        wipeT += dt;
        if (wipeT > 0.95) reset();
      }
      if (script) {
        if (phase === 'end') {
          endT += dt;
          if (endT > script.hold) { reset(); wrap.style.opacity = 0; }
          else wrap.style.opacity = (1 - clamp((endT - script.hold + 0.35) / 0.35, 0, 1)).toFixed(3);
        } else if (wrap.style.opacity !== '' && +wrap.style.opacity < 1) wrap.style.opacity = Math.min(1, +wrap.style.opacity + dt / 0.35).toFixed(3);
      }
      if (score !== count.to) {
        count = { from: shown, to: score, t: clock };
        if (score > 0) flashS.until = clock + 0.4;
        if (elScore) elScore.textContent = score;
      }
      shown = count.t < 0 ? score : count.from + (count.to - count.from) * (1 - Math.pow(1 - clamp((clock - count.t) / 0.4, 0, 1), 3));
      var fw = 2 * Math.PI / 0.22, ftarget = clock < flashS.until ? 1.22 : 1;
      flashS.vel += ((ftarget - flashS.v) * fw * fw - 2 * 0.45 * fw * flashS.vel) * dt;
      flashS.v += flashS.vel * dt;
      if (!reduce && !script && clock >= spin.next && clock - spin.t > spin.dur) spin = { from: spin.to, to: spin.to + Math.PI / 2, t: clock, dur: 0.7, next: clock + 2.5 };
      if (phase === 'fall') {
        fallV += (reduce ? 26 : 70) * dt;
        fallY -= fallV * dt;
        if (fallY <= landing()) lock();
      }
      each(function (b, x, y) {
        if (b.vy > y) {
          b.vel += 48 * dt;
          b.vy = Math.max(y, b.vy - b.vel * dt);
          if (b.vy === y) { b.vel = 0; b.sq = { t: clock, a: 0.02, b: 0.04, i: 0.03, o: 0.07 }; }
        } else if (b.vy < y) {
          b.vy = Math.min(y, b.vy + Math.max(0.02, (y - b.vy) * dt * 9));
        } else if (b.rise) b.rise = false;
      });
      for (var i = frags.length - 1; i >= 0; i--) {
        var f = frags[i];
        f.t += dt;
        if (f.t > f.life) frags.splice(i, 1);
      }
      dying = dying.filter(function (d) { return clock - d.t < 0.13; });
      flashes = flashes.filter(function (f) { return clock - f.t < 0.13; });
      if (!reduce) chan.flow += dt / 8 * (1 + (chan.tier && clock - chan.tierT < TIERS[chan.tier].dur ? TIERS[chan.tier].speed : 0)) * (streak >= 6 ? 2 : 1);
      if (chan.t >= 0) {
        var e = clock - chan.t;
        chan.gain = e < 0.08 ? chan.from + (chan.peak - chan.from) * e / 0.08 : 1 + (chan.peak - 1) * Math.pow(1 - Math.min(1, (e - 0.08) / 0.6), 3);
      }
      if (pressure !== lastPressure) {
        if (pressure > lastPressure) pressFill = { row: PRESSURE_MAX - pressure, t: clock };
        lastPressure = pressure;
      }
      var si = Math.min(1, streak / 6);
      var k = si > streakView.i ? 26 : 14;
      streakView.v += (si - streakView.i) * k * dt - streakView.v * (si > streakView.i ? 8.8 : 7.5) * dt;
      streakView.i += streakView.v * dt;
      streakView.i = clamp(streakView.i, 0, 1.05);
      var pTarget = streakView.pt >= 0 && clock - streakView.pt < 0.16 ? 1 : 0;
      var w0 = 2 * Math.PI / 0.24;
      streakView.pv += ((pTarget - streakView.pulse) * w0 * w0 - 2 * 0.5 * w0 * streakView.pv) * dt;
      streakView.pulse += streakView.pv * dt;
    }

    function channelPalette(led) {
      var rest = [0.55, 0.7, 0.85, 1].map(function (k) { return led.map(function (v) { return v * k; }); });
      if (streak >= 6) rest = PAL.ember;
      if (!chan.tier) return rest;
      var e = clock - chan.tierT, T = TIERS[chan.tier];
      if (e > T.dur) return rest;
      var heat = T.heat * (1 - e / T.dur);
      var hot = heat >= 0.625 ? PAL.fire : heat >= 0.375 ? PAL.lime : heat >= 0.125 ? PAL.cyan : null;
      return hot || rest;
    }

    function render(now) {
      ctx.clearRect(0, 0, cw, ch);
      var sky = window.BP.sky, led = [115, 204, 255];
      if (sky) {
        var r = wrap.getBoundingClientRect(), dh = Math.max(1, document.documentElement.scrollHeight);
        led = sky.led(sky.pageU((window.scrollY + r.top + r.height / 2) / dh));
      }
      var fit = I.fitCam(VIEW, cw, ch, 4, -0.6, opts.camTop || (cw < 500 ? 8.8 : 9.4), cw < 500 ? 0.03 : 0.06, [2, 2, 2]);
      var yaw = YAW0 + spin.from + (spin.to - spin.from) * easeInOut((clock - spin.t) / spin.dur);
      cam.M = I.view(yaw, ELEV); cam.s = fit.s; cam.x = fit.x + cw * (opts.shiftX || 0); cam.y = fit.y; cam.pivot = fit.pivot;
      if (opts.gaugeBeside) {
        var gx = -1e9, gy = 0;
        [[-0.35, -0.35], [4.35, -0.35], [4.35, 4.35], [-0.35, 4.35]].forEach(function (q) { var pp = I.project(cam, q[0], 0, q[1]); if (pp[0] > gx) { gx = pp[0]; gy = pp[1]; } });
        var gl = Math.round(gx + opts.gaugeBeside) + 'px', gt = Math.round(gy - gauges.offsetHeight) + 'px';
        if (gauges.style.left !== gl) gauges.style.left = gl;
        if (gauges.style.top !== gt) gauges.style.top = gt;
      }
      var chanOpts = { led: led, palette: channelPalette(led), gain: chan.gain, flow: chan.flow };
      I.plate(ctx, cam, chanOpts);

      var items = [], wk = phase === 'wipe' ? Math.max(0, (wipeT - 0.5) / 0.45) : 0;
      each(function (b, x, y, z) {
        var k = 1, s = sqScale(b.sq), item;
        if (b.antic >= 0) k = 1 + 0.28 * easeIn(Math.min(1, (clock - b.antic) / 0.12));
        if (clock - b.born < 0.16 && !b.rise) k *= 0.82 + 0.18 * easeOutQ((clock - b.born) / 0.16);
        if (wk) k *= clamp(1 - (wk * 1.6 - (TOP - y) / TOP * 0.6), 0, 1);
        if (k <= 0.02) return;
        item = { x: x, y: b.vy, z: z, c: b.c, k: k * BLK };
        if (s) item.sq = 1 - s.h;
        if (b.rise && b.vy < 0) item.k = k * BLK * Math.max(0.02, 1 + b.vy);
        items.push(item);
      });
      dying.forEach(function (d) {
        var e = (clock - d.t) / 0.13;
        items.push({ x: d.x, y: d.y, z: d.z, c: d.c, k: (1.28 - 1.18 * easeIn(e)) * BLK });
      });

      if (piece && phase === 'aim') {
        var fc = finalCells(piece.cells, aim.x, aim.z), key = fc.map(function (f) { return f.slice(0, 3).join(','); }).join(';');
        var col = I.RGB[piece.c], set = {}, gc = [0, 0, 0], lowest = {};
        var high = fc.some(function (f) { return f[1] >= H; });
        if (key + '|' + piece.c !== ghostSim.key) ghostSim = { key: key + '|' + piece.c, over: high && endsInOverflow(piece.cells, piece.c, aim.x, aim.z) };
        fc.forEach(function (f) {
          set[f.slice(0, 3).join(',')] = 1;
          gc[0] += f[0]; gc[1] += f[1]; gc[2] += f[2];
          var k2 = f[0] + ',' + f[2];
          if (!(k2 in lowest) || f[1] < lowest[k2]) lowest[k2] = f[1];
        });
        gc = gc.map(function (v) { return v / fc.length; });
        if (key !== ghost.key) {
          ghost.from = ghost.pos ? [ghost.pos[0] - gc[0], ghost.pos[1] - gc[1], ghost.pos[2] - gc[2]] : [0, 0, 0];
          ghost.t = ghost.key ? clock : -1;
          ghost.key = key;
        }
        var ge = ghost.t < 0 ? 1 : clamp((clock - ghost.t) / 0.08, 0, 1), gk = 1 - easeOutQ(ge);
        var go = [ghost.from[0] * gk, ghost.from[1] * gk, ghost.from[2] * gk];
        ghost.pos = [gc[0] + go[0], gc[1] + go[1], gc[2] + go[2]];
        var pe = ghost.t < 0 ? 1 : clock - ghost.t;
        var gs = pe < 0.06 ? 1 + 0.16 * easeOutQ(pe / 0.06) : pe < 0.2 ? 1.16 - 0.16 * easeOutQ((pe - 0.06) / 0.14) : 1;
        fc.forEach(function (f) {
          var hide = {};
          I.faces.forEach(function (face, fi) { if (set[(f[0] + face.n[0]) + ',' + (f[1] + face.n[1]) + ',' + (f[2] + face.n[2])]) hide[fi] = true; });
          items.push({ x: f[0] + go[0] + (f[0] - gc[0]) * (gs - 1), y: f[1] + go[1] + (f[1] - gc[1]) * (gs - 1), z: f[2] + go[2] + (f[2] - gc[2]) * (gs - 1), rgb: ghostSim.over && f[1] >= H ? DANGER_RED : col, flat: true, a: 0.32, k: 0.86 * gs, hide: hide });
        });
        Object.keys(lowest).forEach(function (k2) {
          var xz = k2.split(',').map(Number), ty = lowest[k2] + 0.018;
          items.push({ x: xz[0] + go[0], y: ty + go[1] - 0.48, z: xz[1] + go[2], custom: tileDraw(xz[0] + 0.5 + go[0], ty + go[1], xz[1] + 0.5 + go[2], gs, col) });
        });
      }
      if (piece && (phase === 'aim' || phase === 'fall')) {
        var py = phase === 'fall' ? fallY : hoverY() + (reduce ? 0 : Math.sin(bob * 2.4) * 0.12);
        piece.cells.forEach(function (c) { items.push({ x: aim.x + c[0], y: py + c[1], z: aim.z + c[2], c: piece.c, k: BLK }); });
      }

      I.cubes(ctx, items, cam);

      frags.forEach(function (f) {
        var t = f.t, px = f.x + f.vx * t, py2 = f.y + f.vy * t - 3.75 * t * t, pz = f.z + f.vz * t;
        var k = f.k * (t < f.life * 0.6 ? 1 : Math.max(0.001, 1 - (t - f.life * 0.6) / (f.life * 0.4)));
        var p = I.project(cam, px, py2, pz);
        var M = I.mul(cam.M, I.mul(I.rotX(f.rx * t / f.life), I.rotY(f.ry * t / f.life)));
        I.cubes(ctx, [{ x: -0.5, y: -0.5, z: -0.5, c: f.c, k: k }], { M: M, s: cam.s, x: p[0], y: p[1], pivot: [0, 0, 0] });
      });

      flashes.forEach(function (f) {
        var e = clock - f.t, size = 1 + f.i * 0.75, sc, op;
        if (e < 0.03) { sc = 0.35 + (1 - 0.35) * easeOutQ(e / 0.03); op = Math.min(1, 0.75 + f.i * 0.12) * easeOutQ(e / 0.03); }
        else { var u = (e - 0.03) / 0.1; sc = 1 + (1.25 + f.i * 0.1 - 1) * easeIn(u); op = Math.min(1, 0.75 + f.i * 0.12) * (1 - easeIn(u)); }
        var p = I.project(cam, f.x, f.y, f.z), rad = size * sc * cam.s * 0.5, c = I.RGB[f.c];
        var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], rad);
        g.addColorStop(0, rgb(c.map(function (v) { return v + (255 - v) * 0.5; }), op));
        g.addColorStop(0.4, rgb(c, op * 0.55));
        g.addColorStop(1, rgb(c, 0));
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p[0], p[1], rad, 0, 6.2832);
        ctx.fill();
        ctx.restore();
      });

      if (phase === 'wipe' && wipeT < 0.62) {
        var tallest = maxHeight(), pulse = 1 + 0.1 * Math.sin(wipeT * 30);
        for (var tx = 0; tx < W; tx++) for (var tz = 0; tz < D; tz++) {
          if (colH(tx, tz) !== tallest) continue;
          var tp = I.project(cam, tx + 0.5, tallest + 0.6, tz + 0.5);
          ctx.save();
          ctx.font = '700 ' + Math.round(cam.s * 0.9 * pulse) + 'px Nippo';
          ctx.textAlign = 'center';
          ctx.lineJoin = 'round';
          ctx.lineWidth = Math.max(2, cam.s * 0.12);
          ctx.strokeStyle = '#000';
          ctx.strokeText('!!!', tp[0], tp[1]);
          ctx.fillStyle = '#E61F1A';
          ctx.fillText('!!!', tp[0], tp[1]);
          ctx.restore();
        }
      }
      drawMarks();
      drawGauges(now);
      if (scoreCv) drawScore(now);
    }

    var MARKS = { 6: ['!', '#F2CC26'], 7: ['!!', '#F28C1A'], 8: ['!!!', '#E61F1A'] };
    function drawMarks() {
      if (phase === 'wipe') return;
      var tallest = maxHeight(), cols = [];
      if (tallest < 6) { marks.key = ''; return; }
      for (var mx = 0; mx < W; mx++) for (var mz = 0; mz < D; mz++) {
        if (colH(mx, mz) !== tallest) continue;
        var still = true;
        for (var my = 0; my < tallest; my++) { var mb = grid[mx][my][mz]; if (mb && Math.abs(mb.vy - my) > 0.02) still = false; }
        if (still) cols.push([mx, mz]);
      }
      var key = tallest + ':' + cols.join(';');
      if (!cols.length) { marks.key = ''; return; }
      if (key !== marks.key) { marks.key = key; marks.t = clock; }
      var m = MARKS[Math.min(8, tallest)], e = reduce ? 1 : clamp((clock - marks.t) / 0.12, 0, 1);
      var sc = (0.6 + 0.4 * easeOutQ(e)) * (tallest >= 8 && !reduce ? 1 + 0.08 * Math.sin(clock * 12) : 1);
      cols.forEach(function (c) {
        var tp = I.project(cam, c[0] + 0.5, tallest + 0.55, c[1] + 0.5);
        ctx.save();
        ctx.globalAlpha = e;
        ctx.font = '700 ' + Math.round(cam.s * 0.9 * sc) + 'px Nippo';
        ctx.textAlign = 'center';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(2, cam.s * 0.12);
        ctx.strokeStyle = '#000';
        ctx.strokeText(m[0], tp[0], tp[1]);
        ctx.fillStyle = m[1];
        ctx.fillText(m[0], tp[0], tp[1]);
        ctx.restore();
      });
    }

    function keyFrame() {
      reset();
      if (script.keyStreak) {
        streak = script.keyStreak;
        streakView.i = Math.min(1, streak / 6);
        piece = null;
        phase = 'end';
        endT = -1e9;
        return;
      }
      script.steps.slice(0, 3).forEach(function (st) {
        var y = colH(st.x, st.z);
        grid[st.x][y][st.z] = block(st.c, y);
      });
      insertLayer();
      each(function (b, x, y) { b.vy = y; b.rise = false; });
      pressure = lastPressure = 0;
      piece = null;
      phase = 'end';
      endT = -1e9;
    }

    function tileDraw(cx, ty, cz, gs, col) {
      return function (g) {
        var h = 0.395 * gs, rad = 0.13 * gs, pts = [];
        [[1, 1, 0], [-1, 1, 1], [-1, -1, 2], [1, -1, 3]].forEach(function (k) {
          for (var q = 0; q <= 4; q++) {
            var ang = (k[2] + q / 4) * Math.PI / 2;
            pts.push([cx + k[0] * (h - rad) + Math.cos(ang) * rad, ty, cz + k[1] * (h - rad) + Math.sin(ang) * rad]);
          }
        });
        g.save();
        g.globalAlpha = 0.92;
        I.poly(g, cam, pts);
        g.fillStyle = rgb(col, 0.12);
        g.fill();
        g.lineWidth = Math.max(1.2, cam.s * 0.05);
        g.strokeStyle = rgb(col, 0.9);
        g.stroke();
        g.restore();
      };
    }

    var BLOBS = [[350, 0.85], [120, 0.8], [28, 0.88], [155, 0.8], [48, 0.85], [310, 0.78], [210, 0.78]].map(function (b) {
      var h = b[0] / 60, c = b[1], x = c * (1 - Math.abs(h % 2 - 1)), m = 1 - c;
      var r = h < 1 ? [c, x, 0] : h < 2 ? [x, c, 0] : h < 3 ? [0, c, x] : h < 4 ? [0, x, c] : h < 5 ? [x, 0, c] : [c, 0, x];
      return r.map(function (v) { return Math.round((v + m) * 255); });
    });

    function drawScore(now) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2), w = scoreCv.width / dpr, h = scoreCv.height / dpr;
      var g = scoreCv.getContext('2d'), t = reduce ? 3 : now / 1000, text = String(Math.round(shown)), size = Math.min(34, h * 0.62);
      if (blobCv.width !== scoreCv.width || blobCv.height !== scoreCv.height) { blobCv.width = scoreCv.width; blobCv.height = scoreCv.height; }
      var b = blobCv.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      b.globalCompositeOperation = 'source-over';
      b.clearRect(0, 0, w, h);
      b.fillStyle = '#FFE9B0';
      b.fillRect(0, 0, w, h);
      var d = h * 1.2, cycle = w + d * 2, speed = cycle / 10;
      BLOBS.forEach(function (c, i) {
        var raw = ((t * speed + i / BLOBS.length * cycle) % cycle + cycle) % cycle, x = raw - d;
        var y = h / 2 + Math.sin(t * (0.5 + i * 0.07) + i * 1.7) * h * 0.28, pr = Math.cos((raw / cycle - 0.5) * 2 * Math.PI);
        var R = d / 2 + 4, al = 0.55 + 0.45 * (pr + 1) / 2;
        var gr = b.createRadialGradient(x, y, 0, x, y, R);
        gr.addColorStop(0, rgb(c, al)); gr.addColorStop((d / 2 - 4) / R, rgb(c, al)); gr.addColorStop(1, rgb(c, 0));
        b.fillStyle = gr;
        b.beginPath(); b.arc(x, y, R, 0, 6.2832); b.fill();
      });
      b.globalCompositeOperation = 'destination-in';
      b.fillStyle = '#000';
      b.font = '700 ' + size + 'px Nippo';
      b.textAlign = 'center';
      b.textBaseline = 'middle';
      b.save(); b.translate(w / 2, h / 2); b.scale(flashS.v, flashS.v); b.fillText(text, 0, 2); b.restore();
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.save();
      g.translate(w / 2, h / 2); g.scale(flashS.v, flashS.v);
      g.font = '700 ' + size + 'px Nippo';
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 1.5; g.shadowOffsetY = 1;
      g.lineJoin = 'miter'; g.lineWidth = 3.3; g.strokeStyle = '#000';
      g.strokeText(text, 0, 2);
      g.restore();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(blobCv, 0, 0);
    }


    function roundPoly(g, pts, r) {
      g.beginPath();
      for (var i = 0; i < pts.length; i++) {
        var p0 = pts[(i - 1 + pts.length) % pts.length], p1 = pts[i], p2 = pts[(i + 1) % pts.length];
        var d1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
        var r1 = Math.min(r, d1 / 2) / d1, r2 = Math.min(r, d2 / 2) / d2;
        var a = [p1[0] + (p0[0] - p1[0]) * r1, p1[1] + (p0[1] - p1[1]) * r1], b = [p1[0] + (p2[0] - p1[0]) * r2, p1[1] + (p2[1] - p1[1]) * r2];
        if (i) g.lineTo(a[0], a[1]); else g.moveTo(a[0], a[1]);
        g.quadraticCurveTo(p1[0], p1[1], b[0], b[1]);
      }
      g.closePath();
    }

    var FLAME = new Path2D('M0 -30 C 10 -18 16 -10 14 2 C 13 12 7 18 0 18 C -7 18 -13 12 -14 2 C -15 -8 -8 -12 -6 -20 C -2 -14 0 -12 2 -12 C 2 -18 0 -24 0 -30 Z');

    function drawGauges(now) {
      var g = gauges.getContext('2d'), gw = gauges.width / Math.min(window.devicePixelRatio || 1, 2), gh = gauges.height / Math.min(window.devicePixelRatio || 1, 2);
      g.clearRect(0, 0, gw, gh);
      var S = Math.min(gw / 40, (gh - 8) / (opts.pressure === false ? 128 : opts.streak === false ? 104 : 262)), t = now / 1000;
      var edge = 10, dy = edge / 2, dx = edge * Math.cos(Math.PI / 6), inset = 2, cr = edge * 0.12;
      var base = [34, 211, 238], mid = base.map(function (v) { return v * 0.72; });
      var prog = pressure / PRESSURE_MAX, critical = prog >= 0.75;
      var pulseB = critical ? 1.175 + 0.175 * Math.sin(t * 6) : 1;
      var dark = 1;
      var bottom = inset + 2 * dy + 7 * edge + edge;
      if (opts.pressure !== false) {
        g.save();
        g.translate((gw - (2 * dx + 2 * inset) * S) / 2, 4);
        g.scale(S, S);
        g.shadowColor = 'rgba(0,0,0,0.55)';
        g.shadowBlur = 2;
        g.shadowOffsetY = 1;
        function faceFill(pts, top, factor, filled, alpha, fade) {
          roundPoly(g, pts.map(function (p) { return [p[0] + inset, p[1]]; }), cr);
          g.fillStyle = rgb(base.map(function (v) { return v * dark; }), alpha);
          g.fill();
          if (filled) {
            var gr = g.createLinearGradient(0, top + edge, 0, top - dy);
            gr.addColorStop(0, rgb(base.map(function (v) { return v * factor * pulseB; })));
            gr.addColorStop(1, rgb(mid.map(function (v) { return v * factor * pulseB; })));
            g.globalAlpha = fade;
            g.fillStyle = gr;
            g.fill();
            g.globalAlpha = 1;
          }
        }
        for (var row = PRESSURE_MAX - 1; row >= 0; row--) {
          var top = inset + 2 * dy + row * edge, filled = prog * 8 >= (7 - row) + 1;
          var fade = 1;
          if (filled && pressFill.row === row) fade = easeOutQ(Math.min(1, (clock - pressFill.t) / 0.15));
          faceFill([[dx, top], [0, top - dy], [0, top - dy + edge], [dx, top + edge]], top, 0.8, filled, 0.36, fade);
          faceFill([[dx, top], [dx, top + edge], [2 * dx, top - dy + edge], [2 * dx, top - dy]], top, 1, filled, 0.26, fade);
          if (row === 0) {
            roundPoly(g, [[dx + inset, 2 * dy + inset], [2 * dx + inset, dy + inset], [dx + inset, inset], [inset, dy + inset]], cr);
            g.fillStyle = filled ? rgb(mid.map(function (v) { return v * 1.15 * pulseB; }), fade) : rgb(base, 0.18);
            g.fill();
          }
        }
        g.shadowColor = 'transparent';
        g.strokeStyle = 'rgba(0,0,0,0.3)';
        g.lineWidth = 0.75;
        g.beginPath();
        g.moveTo(inset + dx, inset); g.lineTo(inset + 2 * dx, inset + dy); g.lineTo(inset + 2 * dx, bottom - dy); g.lineTo(inset + dx, bottom); g.lineTo(inset, bottom - dy); g.lineTo(inset, inset + dy); g.closePath();
        for (var r2 = 0; r2 < PRESSURE_MAX; r2++) {
          var tp = inset + 2 * dy + r2 * edge - dy;
          g.moveTo(inset, tp); g.lineTo(inset + dx, tp + dy); g.lineTo(inset + 2 * dx, tp);
        }
        g.moveTo(inset + dx, inset + 2 * dy); g.lineTo(inset + dx, bottom);
        g.stroke();
        if (pressBurst >= 0) {
          var be = clock - pressBurst, bo = be < 0.05 ? 1 : Math.max(0, 1 - easeOutQ((be - 0.05) / 0.25));
          if (bo > 0) {
            g.globalCompositeOperation = 'lighter';
            g.fillStyle = 'rgba(255,255,255,' + (bo * 0.35) + ')';
            g.beginPath();
            g.moveTo(inset + dx, inset); g.lineTo(inset + 2 * dx, inset + dy); g.lineTo(inset + 2 * dx, bottom - dy); g.lineTo(inset + dx, bottom); g.lineTo(inset, bottom - dy); g.lineTo(inset, inset + dy); g.closePath();
            g.fill();
            g.globalCompositeOperation = 'source-over';
          }
        }
        g.restore();
      }

      if (opts.streak === false) return;
      var i = clamp(streakView.i, 0, 1), pulse = clamp(streakView.pulse, -0.3, 1.4), T = FIRE;
      var colW = 12, barH = 70, top0 = opts.pressure === false ? 4 : 4 + (bottom + 4) * S + 40 * S;
      g.save();
      g.translate(gw / 2, top0);
      g.scale(S, S);
      g.save();
      g.font = '700 13px Nippo';
      g.textAlign = 'center';
      g.textBaseline = 'top';
      g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 2; g.shadowOffsetY = 1;
      g.translate(0, 8);
      g.scale(1 + 0.35 * pulse, 1 + 0.35 * pulse);
      g.fillStyle = rgb(T.core);
      g.fillText(String(streak), 0, -8);
      g.restore();
      var by = 20;
      g.save();
      g.shadowColor = 'rgba(0,0,0,0.55)'; g.shadowBlur = 2; g.shadowOffsetY = 1;
      capsule(g, -colW / 2, by, colW, barH);
      g.fillStyle = 'rgba(0,0,0,0.3)';
      g.fill();
      g.restore();
      capsule(g, -colW / 2 + 0.5, by + 0.5, colW - 1, barH - 1);
      g.strokeStyle = rgb(T.mid, 0.35);
      g.lineWidth = 1;
      g.stroke();
      if (i > 0.005) {
        var fh = barH * i, fs = 1 + 0.1 * pulse;
        g.save();
        g.translate(0, by + barH);
        g.scale(fs, fs);
        var gr = g.createLinearGradient(0, 0, 0, -fh);
        gr.addColorStop(0, rgb(T.deep)); gr.addColorStop(0.18, rgb(T.deep)); gr.addColorStop(0.45, rgb(T.low));
        gr.addColorStop(0.72, rgb(T.low)); gr.addColorStop(0.93, rgb(T.high)); gr.addColorStop(1, rgb(T.cap));
        g.shadowColor = rgb(T.mid, 0.8);
        g.shadowBlur = 2 + 2 * i;
        capsule(g, -colW / 2, -fh, colW, fh);
        g.fillStyle = gr;
        g.fill();
        g.shadowColor = 'transparent';
        g.fillStyle = rgb(T.core, (Math.sin(t * (1.8 + 1.2 * i)) * 0.5 + 0.5) * 0.22 * i);
        g.fill();
        g.restore();
      }
      var fy = by + barH + 4, fw = 12, fh2 = 15.6, fsc = 1 + 0.1 * pulse;
      g.save();
      g.translate(0, fy + fh2);
      g.scale(fsc * fw / 30, fsc * fh2 / 48);
      g.translate(0, -18);
      var fg = g.createLinearGradient(0, 18, 0, -30);
      fg.addColorStop(0, rgb(T.deep)); fg.addColorStop(0.15, rgb(T.deep)); fg.addColorStop(0.5, rgb(T.low)); fg.addColorStop(0.82, rgb(T.low)); fg.addColorStop(1, rgb(T.high));
      g.fillStyle = fg;
      g.fill(FLAME);
      g.restore();
      var m = multiplier(streak);
      if (m > 1) {
        g.font = '700 10px Nippo';
        g.textAlign = 'center';
        g.textBaseline = 'top';
        g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 2; g.shadowOffsetY = 1;
        g.fillStyle = rgb(T.mid);
        g.fillText('x' + m.toFixed(2), 0, fy + fh2 + 4);
      }
      g.restore();
    }
    function capsule(g, x, y, w, h) {
      var r = Math.min(w, h) / 2;
      g.beginPath();
      g.moveTo(x + r, y);
      g.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
      g.lineTo(x + w, y + h - r);
      g.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
      g.lineTo(x + r, y + h);
      g.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
      g.lineTo(x, y + r);
      g.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
      g.closePath();
    }

    var last = 0, on = false;
    function frame(now) {
      if (!on) return;
      var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      step(dt);
      render(now);
      requestAnimationFrame(frame);
    }


    window.addEventListener('resize', resize);
    resize();
    if (script && reduce) { keyFrame(); render(0); window.addEventListener('resize', function () { render(0); }); return; }
    reset();
    render(0);
    I.visible(wrap, function (v) {
      if (v && !on) { on = true; last = 0; requestAnimationFrame(frame); }
      else if (!v) on = false;
    });
  }

  var HOLD = [
    [0, 0, [2, 3, 0]], [0, 1, [3, 0, 1]], [0, 2, [1, 2]], [0, 3, [3, 0]],
    [1, 0, [3, 2, 1, 0, 2]], [1, 1, [2, 1, 0, 3, 0]], [1, 2, [0, 3, 1]], [1, 3, [2, 1]],
    [2, 0, [0, 1]], [2, 1, [1, 2, 1, 2]], [2, 2, [2, 0, 2, 0]], [2, 3, [0, 2, 1]],
    [3, 0, [2, 0, 2]], [3, 1, [3, 1]], [3, 2, [0, 2]], [3, 3, [2]]
  ];
  createPit({
    canvas: document.getElementById('pit'),
    heights: [1, 1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5],
    score: document.getElementById('hud-score'),
    scoreCv: document.getElementById('hud-score-cv'),
    gauges: document.getElementById('hud-gauges'),
    pops: document.querySelector('.pit-wrap .pit-pops')
  });
  var band = document.querySelector('.band-cv');
  if (band) createPit({
    canvas: band,
    gauges: document.querySelector('.band-gauge'),
    pops: band.parentNode.querySelector('.pit-pops'),
    streak: false,
    camTop: 10.2,
    hoverCap: 10.4,
    noPoints: true,
    shiftX: -0.06,
    gaugeBeside: 10,
    script: {
      grid: HOLD,
      pressure: 5,
      steps: [
        { cells: [[0, 0, 0]], c: 2, x: 1, z: 1 },
        { cells: [[0, 0, 0]], c: 1, x: 1, z: 1 },
        { cells: [[0, 0, 0]], c: 1, x: 3, z: 3 },
        { cells: [[0, 0, 0]], c: 0, x: 2, z: 1 }
      ],
      hold: 2.2
    }
  });
  var streakCv = document.querySelector('.streak-cv');
  if (streakCv) createPit({
    canvas: streakCv,
    gauges: document.querySelector('.streak-gauge'),
    pops: streakCv.parentNode.querySelector('.pit-pops'),
    pressure: false,
    camTop: 6.4,
    shiftX: -0.06,
    gaugeBeside: 14,
    script: {
      grid: [
        [0, 0, [1, 0]], [0, 1, [3, 2]], [0, 2, [1, 0]], [0, 3, [3, 2]],
        [1, 0, [2, 1]], [1, 1, [0, 3]], [1, 2, [2, 1]], [1, 3, [0, 3]],
        [2, 0, [3, 2]], [2, 1, [1, 0]], [2, 2, [3, 2]], [2, 3, [1, 0]],
        [3, 0, [0, 3]], [3, 1, [2, 1]], [3, 2, [0, 3]], [3, 3, [2, 1]]
      ],
      pressure: 0,
      keyStreak: 5,
      steps: [
        { cells: [[0, 0, 0]], c: 3, x: 1, z: 1 },
        { cells: [[0, 0, 0]], c: 2, x: 2, z: 2 },
        { cells: [[0, 0, 0]], c: 0, x: 0, z: 2 },
        { cells: [[0, 0, 0]], c: 1, x: 3, z: 1 },
        { cells: [[0, 0, 0]], c: 3, x: 1, z: 3 },
        { cells: [[0, 0, 0]], c: 2, x: 2, z: 0 },
        { cells: [[0, 0, 0]], c: 3, x: 3, z: 3 }
      ],
      hold: 2.4
    }
  });
})();
