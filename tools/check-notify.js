const { webkit } = require('playwright-core');
(async () => {
  const b = await webkit.launch();
  for (const w of [1440, 390]) {
    const p = await b.newPage({ viewport: { width: w, height: 860 }, isMobile: w < 600, hasTouch: w < 600 });
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
    await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, 2500); });
    await p.waitForTimeout(300);
    await p.evaluate(() => scrollTo(0, 2300));
    await p.waitForTimeout(700);
    await p.click('.bar-notify');
    await p.waitForTimeout(1200);
    const st = await p.evaluate(() => ({ formOpen: !document.getElementById('notify-1').hidden, focused: document.activeElement && document.activeElement.id, formTop: Math.round(document.getElementById('notify').getBoundingClientRect().top) }));
    await p.screenshot({ path: `tools/out/notify-jump-${w}.png` });
    const q = await b.newPage({ viewport: { width: w, height: 860 } });
    await q.goto('http://localhost:8765/contact.html', { waitUntil: 'networkidle' });
    await q.click('.bar-notify');
    await q.waitForTimeout(1200);
    const st2 = await q.evaluate(() => ({ url: location.pathname + location.hash, formOpen: !document.getElementById('notify-1').hidden, focused: document.activeElement && document.activeElement.id }));
    console.log(w, JSON.stringify(st), 'from contact:', JSON.stringify(st2), JSON.stringify(errs));
    await p.close(); await q.close();
  }
  await b.close();
})();
