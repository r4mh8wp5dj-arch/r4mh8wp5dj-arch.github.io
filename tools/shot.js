const { webkit } = require('playwright-core');
const [,, file = 'index.html', sel = 'body', w = '1440', out = 'shot', dpr = '2'] = process.argv;
(async () => {
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: +dpr, isMobile: +w < 700, hasTouch: +w < 700 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/' + file, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const el = p.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await el.screenshot({ path: `tools/out/${out}.png` });
  if (errs.length) console.log('Page errors:', errs.join(' | '));
  await b.close();
})();
