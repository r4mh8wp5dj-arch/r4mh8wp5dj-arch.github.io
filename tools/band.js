const { webkit } = require('playwright-core');
const [,, w = '1440', tag = 'band', times = '0.3,1.0,1.5,2.4,3.7,4.1,4.9,5.5'] = process.argv;
(async () => {
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: +w, height: 900 }, deviceScaleFactor: 2, isMobile: +w < 700, hasTouch: +w < 700 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  const el = p.locator('.band');
  await el.scrollIntoViewIfNeeded();
  const start = Date.now();
  await p.waitForTimeout(150);
  let i = 0;
  for (const t of times.split(',').map(Number)) {
    const wait = t * 1000 - (Date.now() - start);
    if (wait > 0) await p.waitForTimeout(wait);
    await el.screenshot({ path: `tools/out/${tag}-${i++}.png` });
  }
  console.log(errs.length ? errs.join(' | ') : 'no errors');
  await b.close();
})();
