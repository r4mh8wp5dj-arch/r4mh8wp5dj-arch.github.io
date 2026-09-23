const { webkit } = require('playwright-core');
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'contact.html', 'privacy.html'];
(async () => {
  const b = await webkit.launch();
  let fails = 0;
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    for (const file of pages) {
      const p = await b.newPage({ viewport: { width: w, height: h } });
      await p.goto('http://localhost:8765/' + file, { waitUntil: 'networkidle' });
      await p.waitForTimeout(400);
      const docH = await p.evaluate(() => document.documentElement.scrollHeight);
      const seen = new Map();
      for (let y = 0; y < docH; y += Math.round(h * 0.6)) {
        await p.evaluate(y => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, y); }, y);
        await p.waitForTimeout(350);
        const rows = await p.evaluate(() => {
          function parse(c) { const m = c.match(/[\d.]+/g); return m ? m.map(Number) : [0, 0, 0, 0]; }
          function lum(c) { return 0.2126 * ch(c[0]) + 0.7152 * ch(c[1]) + 0.0722 * ch(c[2]); function ch(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); } }
          function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
          const out = [], sky = window.BP && window.BP.sky, dh = document.documentElement.scrollHeight;
          document.querySelectorAll('body *').forEach(el => {
            if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
            const cs = getComputedStyle(el), r = el.getBoundingClientRect();
            if (cs.display === 'none' || cs.visibility === 'hidden' || r.width === 0 || r.bottom < 0 || r.top > innerHeight) return;
            if (el.closest('[hidden], .vh, [aria-hidden="true"]')) return;
            if (/text/.test(cs.webkitBackgroundClip || cs.backgroundClip)) return;
            let op = 1, layers = [];
            for (let a = el; a && a !== document.documentElement && a !== document.body; a = a.parentElement) {
              const s = getComputedStyle(a);
              op *= parseFloat(s.opacity);
              const c = parse(s.backgroundColor), al = c.length === 4 ? c[3] : 1;
              if (al > 0.02) { layers.push([c[0], c[1], c[2], al]); if (al > 0.98) break; }
            }
            if (op < 0.05) return;
            const pos = cs.position === 'fixed' || el.closest('.bar, .rail') ? r.top + r.height / 2 + scrollY : r.top + r.height / 2 + scrollY;
            let bg = layers.length && layers[layers.length - 1][3] > 0.98 ? layers.pop().slice(0, 3) : (sky ? sky.colorAt(pos / dh) : [0, 0, 0]);
            for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i]; bg = [0, 1, 2].map(k => L[k] * L[3] + bg[k] * (1 - L[3])); }
            let fg = parse(cs.color);
            if (fg.length === 4 && fg[3] === 0) { const st = parse(cs.webkitTextStrokeColor || ''); if (!parseFloat(cs.webkitTextStrokeWidth)) return; fg = st; }
            const fa = (fg[3] == null ? 1 : fg[3]) * op;
            fg = [0, 1, 2].map(i => fg[i] * fa + bg[i] * (1 - fa));
            const size = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight) >= 700, large = size >= 24 || (bold && size >= 18.66);
            const need = large ? 3 : 4.5, cr = ratio(fg, bg);
            out.push({ key: (el.id || el.className || el.tagName) + ': ' + el.textContent.trim().slice(0, 40), cr: Math.round(cr * 100) / 100, need, ok: cr >= need });
          });
          return out;
        });
        rows.forEach(r => { const prev = seen.get(r.key); if (!prev || r.cr < prev.cr) seen.set(r.key, r); });
      }
      const bad = [...seen.values()].filter(r => !r.ok);
      fails += bad.length;
      console.log(`${w} ${file}: ${seen.size} text elements, ${bad.length} below AA`);
      bad.sort((a, b) => a.cr - b.cr).forEach(r => console.log(`   ${r.cr} < ${r.need}  ${r.key}`));
      await p.close();
    }
  }
  await b.close();
  process.exitCode = fails ? 1 : 0;
})();
