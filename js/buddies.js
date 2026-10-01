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

  var SCENES = {
    jet: {
      w: 54, h: 64, still: 3,
      draw: function (f) {
        var P = pal('green'), bob = [0, 0, -1, -2, -3, -3, -2, -1][Math.floor(f / 2) % 8], x = 15, y = 16 + bob;
        [[4, 10], [48, 8], [7, 34], [47, 30]].forEach(function (s, i) { if ((f + i * 3) % 8 < 4) spark(s[0], s[1], WHITE); });
        [11, 39].forEach(function (tx, i) {
          rect(tx, y + 4, 4, 16, '#D5DCEE'); rect(tx, y + 4, 1, 16, '#F3F6FC'); rect(tx + 3, y + 4, 1, 16, '#8E9BB8');
          rect(tx, y + 3, 4, 1, '#8E9BB8'); rect(tx + 1, y + 20, 2, 2, '#5B6680');
          var fh = (f + i) % 2 ? 7 : 5;
          rect(tx + 1, y + 22, 2, fh, '#FF8A3D'); rect(tx + 1, y + 22, 2, Math.max(2, fh - 3), '#FFD25A'); px(tx + 1, y + 22, WHITE);
        });
        for (var k = 0; k < 8; k++) {
          var py = y + 28 + ((f * 2 + k * 5) % 26), pxx = (k % 2 ? 12 : 40) + [-1, 0, 1, 0][k % 4];
          if (py < 62) px(pxx, py, k % 2 ? '#FFD25A' : '#FF8A3D');
        }
        var sw = Math.floor(f / 3) % 2 ? 1 : 0;
        rect(19 + sw, y + 22, 3, 8, P.limb); rect(29 - sw, y + 22, 3, 8, P.limb);
        shoe(18 + sw, y + 30); shoe(28 - sw, y + 30);
        var up = Math.floor(f / 4) % 2;
        line(x + 1, y + 12, 8, y + (up ? 2 : 6) + 2, 3, P.limb); line(x + 22, y + 12, 46, y + (up ? 6 : 2) + 2, 3, P.limb);
        cube(x, y, 24, P);
        var blink = f % 36 >= 34;
        eye(x + 6, y + 7, 4, blink); eye(x + 16, y + 7, 4, blink);
        cheek(x + 2, y + 14); cheek(x + 19, y + 14);
        mouth(x + 10, y + 15, f % 12 < 6 ? 1 : 3);
        glove(8, y + (up ? 2 : 6)); glove(46, y + (up ? 6 : 2));
      }
    },
    ell: {
      w: 64, h: 74, still: 0.3,
      draw: function (f) {
        var P = pal('yellow'), jt = [0, -2, -5, -7, -8, -8, -7, -5, -2, 0, 0, 0][f % 12], px0 = 14, py0 = 25 + jt, hot = jt < -3;
        for (var k = 0; k < 16; k++) {
          var s = 1 + (k % 3), cx = (k * 37 + 11) % 62, cy = ((f * s + k * 13) % 82) - 6;
          if ((f + k) % 7 === 0) continue;
          var col = [HEX.red, HEX.blue, HEX.green, HEX.yellow, HEX.purple, HEX.cyan][k % 6];
          if (k % 2) rect(cx, cy, 2, 2, col); else rect(cx, cy, 1, 3, col);
        }
        shadow(px0 + 18, 72, 38 + jt);
        [px0 + 8, px0 + 26].forEach(function (lx) { rect(lx, py0 + 34, 3, 9, P.limb); shoe(lx - 1, py0 + 43); });
        line(px0 + 1, py0 + 9, hot ? px0 - 9 : px0 - 8, hot ? py0 - 2 : py0 + 7, 3, P.limb);
        line(px0 + 35, py0 + 27, hot ? px0 + 45 : px0 + 44, hot ? py0 + 13 : py0 + 23, 3, P.limb);
        [[0, 0], [0, 1], [1, 1]].forEach(function (c) { cube(px0 + c[0] * 18, py0 + c[1] * 18, 18, P); });
        var ox = px0, oy = py0 + 18, blink = f % 40 >= 38, st = hot ? 'happy' : null;
        eye(ox + 8, oy + 5, 3, blink, st); eye(ox + 26, oy + 5, 3, blink, st);
        cheek(ox + 3, oy + 9); cheek(ox + 31, oy + 9);
        mouth(ox + 16, oy + 11, hot ? 4 : 1);
        glove(hot ? px0 - 9 : px0 - 8, hot ? py0 - 3 : py0 + 7); glove(hot ? px0 + 45 : px0 + 44, hot ? py0 + 12 : py0 + 23);
      }
    },
    domino: {
      w: 66, h: 66, still: 1.4,
      draw: function (f) {
        var P = pal('cyan'), x0 = 15, y0 = 28, t = f / FPS;
        shadow(x0 + 18, 58, 40);
        [x0 + 8, x0 + 26].forEach(function (lx) { rect(lx, y0 + 16, 3, 9, P.limb); shoe(lx - 1, y0 + 25); });
        var a = Math.floor(f / 3) % 2, Lh = [x0 - 8, y0 + 5 - (a ? 3 : 0)], Rh = [x0 + 44, y0 + 5 - (a ? 0 : 3)];
        line(x0 + 1, y0 + 9, Lh[0], Lh[1] + 2, 3, P.limb); line(x0 + 35, y0 + 9, Rh[0], Rh[1] + 2, 3, P.limb);
        cube(x0, y0, 18, P); cube(x0 + 18, y0, 18, P);
        var blink = f % 44 >= 42;
        eye(x0 + 8, y0 + 5, 3, blink); eye(x0 + 26, y0 + 5, 3, blink);
        cheek(x0 + 3, y0 + 9); cheek(x0 + 31, y0 + 9);
        mouth(x0 + 16, y0 + 11, Math.floor(f / 6) % 4 === 0 ? 1 : 0);
        glove(Lh[0], Lh[1]); glove(Rh[0], Rh[1]);
        [HEX.red, HEX.yellow, HEX.green].forEach(function (c, k) {
          var ph = (t / 2.4 + k / 3) % 1, n = Math.floor(ph * 2), u = ph * 2 - n, from = n % 2 ? Rh : Lh, to = n % 2 ? Lh : Rh;
          miniCube(Math.round(lerp(from[0], to[0], u)) - 3, Math.round(lerp(from[1], to[1], u) - 4 * 22 * u * (1 - u)) - 8, c);
        });
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
    var off = document.createElement('canvas');
    off.width = def.w; off.height = def.h;
    var og = off.getContext('2d'), main = null, last = -1, on = false, t0 = 0;
    function render(t) {
      if (!main) return;
      var f = Math.floor(t * FPS);
      if (f === last) return;
      last = f;
      g = og;
      og.setTransform(1, 0, 0, 1, 0, 0);
      og.clearRect(0, 0, def.w, def.h);
      def.draw(f);
      var cw = canvas.width, ch = canvas.height, k = Math.max(1, Math.floor(Math.min(cw / def.w, ch / def.h)));
      main.setTransform(1, 0, 0, 1, 0, 0);
      main.clearRect(0, 0, cw, ch);
      main.imageSmoothingEnabled = false;
      main.drawImage(off, Math.floor((cw - def.w * k) / 2), Math.floor((ch - def.h * k) / 2), def.w * k, def.h * k);
    }
    function resize() {
      main = I.fit(canvas).ctx;
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
