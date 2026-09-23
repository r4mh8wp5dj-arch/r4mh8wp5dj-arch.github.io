(function () {
  var THEMES = [
    { id: 'dawn', led: '#F28C6B', stars: 0, starAlpha: 0, colors: ['#4E8AD0', '#6FA0D4', '#A8BCC4', '#7E9C58', '#4E6B30'] },
    { id: 'cumulus', led: '#FAA751', stars: 0, starAlpha: 0, colors: ['#2A4C94', '#4A7FC0', '#8FB8DC', '#E8B77A', '#F2A24E'] },
    { id: 'sunset', led: '#FA707A', stars: 0, starAlpha: 0, colors: ['#47296B', '#D9616B', '#FA944D'] },
    { id: 'twilight', led: '#CF78E6', stars: 0.35, starAlpha: 0.55, colors: ['#120F2E', '#331F4D', '#573361'] },
    { id: 'deepspace', led: '#73CCFF', stars: 1, starAlpha: 1, colors: ['#000000', '#0A1A3D', '#1A0D33'] }
  ];
  var BLEND = 0.34;
  var GROUND = 1;

  var root = document.documentElement;
  var range = (root.getAttribute('data-sky') || '0 1').split(' ').map(Number);
  var R0 = range[0], R1 = range[1];

  function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  THEMES.forEach(function (t) { t.pts = t.colors.map(function (c, i) { return [i / (t.colors.length - 1), hex(c)]; }); });

  function toLin(v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
  function toSrgb(v) { v = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055; return Math.max(0, Math.min(255, v * 255)); }
  function toLch(c) {
    var r = toLin(c[0]), g = toLin(c[1]), b = toLin(c[2]);
    var l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    var m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    var s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    var L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    var A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    var B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [L, Math.sqrt(A * A + B * B), Math.atan2(B, A)];
  }
  function fromLch(o) {
    var A = o[1] * Math.cos(o[2]), B = o[1] * Math.sin(o[2]);
    var l = Math.pow(o[0] + 0.3963377774 * A + 0.2158037573 * B, 3);
    var m = Math.pow(o[0] - 0.1055613458 * A - 0.0638541728 * B, 3);
    var s = Math.pow(o[0] - 0.0894841775 * A - 1.291485548 * B, 3);
    return [toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s), toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s), toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)];
  }
  function mix(a, b, f) {
    if (f <= 0) return a.slice();
    if (f >= 1) return b.slice();
    var A = toLch(a), B = toLch(b);
    var la = [A[0], A[1] * Math.cos(A[2]), A[1] * Math.sin(A[2])], lb = [B[0], B[1] * Math.cos(B[2]), B[1] * Math.sin(B[2])];
    var o = [la[0] + (lb[0] - la[0]) * f, la[1] + (lb[1] - la[1]) * f, la[2] + (lb[2] - la[2]) * f];
    return fromLch([o[0], Math.sqrt(o[1] * o[1] + o[2] * o[2]), Math.atan2(o[2], o[1])]);
  }
  function lerp(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
  function soft(t) { t = Math.max(0, Math.min(1, t)); return t * t * t * (t * (t * 6 - 15) + 10); }

  function sampleTheme(i, v) {
    var p = THEMES[i].pts;
    v = Math.max(0, Math.min(1, v));
    for (var k = 1; k < p.length; k++) {
      if (v <= p[k][0]) return lerp(p[k - 1][1], p[k][1], (v - p[k - 1][0]) / (p[k][0] - p[k - 1][0]));
    }
    return p[p.length - 1][1].slice();
  }

  function weights(u) {
    var p = Math.max(0, Math.min(4.9999, u * 5)), i = Math.floor(p), f = p - i;
    if (f < BLEND && i > 0) return { a: i - 1, b: i, w: soft((f + BLEND) / (2 * BLEND)) };
    if (f > 1 - BLEND && i < 4) return { a: i, b: i + 1, w: soft((f - (1 - BLEND)) / (2 * BLEND)) };
    return { a: i, b: i, w: 0 };
  }

  function stripColor(u) {
    var p = Math.max(0, Math.min(4.9999, u * 5)), q = weights(u);
    var a = sampleTheme(q.a, 1 - (p - q.a)), b = sampleTheme(q.b, 1 - (p - q.b));
    return q.w === 0 ? a : mix(a, b, q.w);
  }
  function blendNum(u, key) {
    var q = weights(u);
    return THEMES[q.a][key] + (THEMES[q.b][key] - THEMES[q.a][key]) * q.w;
  }
  function starDensity(u) { return blendNum(u, 'stars'); }
  function starAlpha(u) { return blendNum(u, 'starAlpha'); }
  function led(u) {
    var q = weights(u);
    return mix(hex(THEMES[q.a].led), hex(THEMES[q.b].led), q.w);
  }

  function pageU(t) { return 1 - (R0 + (R1 - R0) * Math.max(0, Math.min(1, t / GROUND))); }
  function colorAt(t) {
    var u = pageU(t), q = weights(u), p = u * 5;
    function v(i) { var x = i + 1 - p; return i === 1 ? 1 - x : x; }
    var a = sampleTheme(q.a, v(q.a));
    return q.w === 0 ? a : mix(a, sampleTheme(q.b, v(q.b)), q.w);
  }
  function lum(c) {
    var l = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  }

  function paintSky() {
    var grad = [];
    for (var i = 0; i <= 160; i++) {
      var c = colorAt(i / 160);
      grad.push('rgb(' + c.map(Math.round).join(',') + ') ' + (i / 1.6).toFixed(3) + '%');
    }
    root.style.background = 'linear-gradient(to bottom,' + grad.join(',') + ')';
  }
  paintSky();

  window.BP = window.BP || {};
  window.BP.sky = {
    colorAt: colorAt, lum: lum, mix: mix, stripColor: stripColor, starDensity: starDensity,
    starAlpha: starAlpha, led: led, pageU: pageU, hex: hex
  };

  document.addEventListener('DOMContentLoaded', function () {
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canvas = document.createElement('canvas');
    canvas.className = 'stars';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var inks = Array.prototype.slice.call(document.querySelectorAll('[data-ink]'));
    var bar = document.querySelector('.bar');
    var W = 0, H = 0, docH = 1, stars = [], last = 0, sy = 0, dirty = true;

    function seed() {
      var n = Math.max(300, Math.min(2400, Math.round(W * H / 700)));
      stars = [];
      for (var i = 0; i < n; i++) {
        var big = Math.random() < 0.12;
        stars.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: big ? 1.1 + Math.random() * 0.7 : 0.45 + Math.random() * 0.35,
          a: big ? 0.75 + Math.random() * 0.25 : 0.35 + Math.random() * 0.35,
          v: 0.2 + Math.random() * 0.3,
          p: Math.random() * 6.28,
          f: 0.5 + Math.random() * 1.4,
          k: Math.random()
        });
      }
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      docH = Math.max(1, document.documentElement.scrollHeight);
      var city = document.querySelector('.city'), foot = document.querySelector('.foot');
      if (city && R1 === 1) {
        var cr = city.getBoundingClientRect(), fh = foot ? foot.offsetHeight : 0;
        GROUND = Math.max(0.5, Math.min(1, (docH - fh - cr.height * 0.45) / docH));
        paintSky();
      }
      seed();
      dirty = true;
      onScroll();
    }

    function draw(now) {
      var dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      ctx.clearRect(0, 0, W, H);
      var bands = [], alphas = [];
      for (var b = 0; b <= 20; b++) {
        var u = pageU((sy + H * b / 20) / docH);
        bands.push(starDensity(u));
        alphas.push(starAlpha(u));
      }
      if (Math.max.apply(null, bands) <= 0.005) return;
      ctx.fillStyle = '#fff';
      var tt = now / 1000;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        if (!reduce) {
          s.x += 0.94 * s.v * dt; s.y += 0.34 * s.v * dt;
          if (s.x > W + 2) s.x -= W + 4;
          if (s.y > H + 2) s.y -= H + 4;
        }
        var bi = Math.max(0, Math.min(20, Math.round(s.y / H * 20))), band = bands[bi];
        if (s.k > band) continue;
        var tw = reduce ? 1 : 0.7 + 0.3 * Math.sin(s.p + tt * s.f);
        ctx.globalAlpha = s.a * tw * alphas[bi] * Math.min(1, (band - s.k) * 12);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    var lastY = 0;
    function onScroll() {
      sy = window.scrollY;
      if (bar && Math.abs(sy - lastY) > 6) {
        bar.classList.toggle('hide', sy > lastY && sy > 200 && !bar.contains(document.activeElement));
        lastY = sy;
      }
      for (var i = 0; i < inks.length; i++) {
        var r = inks[i].getBoundingClientRect();
        inks[i].classList.toggle('on-light', lum(colorAt((sy + r.top + r.height / 2) / docH)) > 0.26);
      }
      if (bar) {
        var br = bar.getBoundingClientRect();
        bar.classList.toggle('on-light', lum(colorAt((sy + br.top + br.height / 2) / docH)) > 0.26);
      }
      if (reduce) draw(performance.now());
    }

    function loop(now) {
      if (now - last > 30 || dirty) { dirty = false; draw(now); }
      requestAnimationFrame(loop);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('load', resize);
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();
    if (!reduce) requestAnimationFrame(loop);
  });
})();
