const { webkit } = require('playwright-core');
(async () => {
  const b = await webkit.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 860 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html?subscribed=1&x=2', { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  console.log(JSON.stringify(await p.evaluate(() => { const m = document.querySelector('#notify .notify-msg'); return { url: location.pathname + location.search, msg: m.hidden ? null : m.textContent }; })), JSON.stringify(errs));
  await b.close();
})();
