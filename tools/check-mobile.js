const { webkit } = require('playwright-core');
const fs = require('fs');
const args = process.argv.slice(2);
const outDir = (args.find(a => a.startsWith('--out=')) || '--out=tools/out/mobile').slice(6);
const pages = args.filter(a => !a.startsWith('--')).length ? args.filter(a => !a.startsWith('--')) : ['index.html', 'contact.html', 'privacy.html', '404.html'];
fs.mkdirSync(outDir, { recursive: true });
(async () => {
  const b = await webkit.launch();
  for (const w of [375, 390, 430]) {
    for (const file of pages) {
      const c = await b.newContext({ viewport: { width: w, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
      const p = await c.newPage();
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto('http://localhost:8765/' + file, { waitUntil: 'networkidle' });
      await p.waitForTimeout(600);
      const r = await p.evaluate(() => {
        const small = [];
        document.querySelectorAll('a, button, input, [role="button"]').forEach(el => {
          const cs = getComputedStyle(el), rc = el.getBoundingClientRect();
          if (cs.display === 'none' || cs.visibility === 'hidden' || el.closest('[hidden]') || rc.width === 0) return;
          if (rc.height < 44 || rc.width < 44) small.push((el.className || el.tagName) + ' "' + (el.textContent || el.placeholder || '').trim().slice(0, 18) + '" ' + Math.round(rc.width) + 'x' + Math.round(rc.height));
        });
        const pit = document.getElementById('pit');
        const over = [];
        document.querySelectorAll('body *').forEach(el => { const rc = el.getBoundingClientRect(); if (rc.width && (rc.right > innerWidth + 0.5 || rc.left < -0.5) && getComputedStyle(el).position !== 'fixed' && !el.closest('.sprite')) over.push((el.className || el.tagName) + ' ' + Math.round(rc.left) + '..' + Math.round(rc.right)); });
        return { overflowX: document.documentElement.scrollWidth - innerWidth, outside: over.slice(0, 6), pit: pit ? Math.round(pit.getBoundingClientRect().width) + 'x' + Math.round(pit.getBoundingClientRect().height) : null, small };
      });
      console.log(w, file, JSON.stringify(r), errs.length ? JSON.stringify(errs) : '');
      await p.screenshot({ path: `${outDir}/${file.replace('.html', '')}-${w}.png`, fullPage: true });
      await c.close();
    }
  }
  await b.close();
})();
