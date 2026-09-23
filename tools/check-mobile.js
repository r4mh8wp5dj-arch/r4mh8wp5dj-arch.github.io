const { webkit } = require('playwright-core');
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'contact.html', 'privacy.html'];
(async () => {
  const b = await webkit.launch();
  for (const w of [375, 430]) {
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
        return { overflowX: document.documentElement.scrollWidth - innerWidth, pit: pit ? Math.round(pit.getBoundingClientRect().width) + 'x' + Math.round(pit.getBoundingClientRect().height) : null, small };
      });
      console.log(w, file, JSON.stringify(r), errs.length ? JSON.stringify(errs) : '');
      if (file === 'index.html') await p.screenshot({ path: `tools/out/mobile-${w}.png`, fullPage: false });
      await c.close();
    }
  }
  await b.close();
})();
