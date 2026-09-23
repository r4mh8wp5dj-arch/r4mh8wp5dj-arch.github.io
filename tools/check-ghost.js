const { webkit } = require('playwright-core');
(async () => {
  const b = await webkit.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await c.route('**/js/play.js*', async r => {
    const res = await r.fetch();
    let body = await res.text();
    body = body.replace("    window.addEventListener('resize', resize);\n    resize();", "    if (canvas.id === 'pit') window.__t = { stage: function (cols, pc, ax, az) { grid = empty(); cols.forEach(function (col) { col[2].forEach(function (cc, y) { grid[col[0]][y][col[1]] = block(cc, y); }); }); piece = { cells: [[0, 0, 0], [1, 0, 0]], c: pc }; aim = { x: ax, z: az }; phase = 'aim'; plan = null; ghostSim = { key: '', over: false }; } };\n    window.addEventListener('resize', resize);\n    resize();");
    body = body.replace('opts.camTop || (cw < 500', '11 || (cw < 500').replace('opts.hoverCap || (cw < 500', '11.5 || (cw < 500');
    await r.fulfill({ response: res, body });
  });
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  await p.waitForTimeout(600);
  const tall = [[1, 1, [0, 1, 0, 1, 0, 1, 0, 1]], [2, 1, [1, 0]]];
  await p.evaluate(t => window.__t.stage(t, 2, 1, 1), tall);
  await p.waitForTimeout(400);
  await p.locator('.pit-wrap').screenshot({ path: 'tools/out/ghost-overflow.png' });
  await p.evaluate(t => window.__t.stage(t, 1, 1, 1), tall);
  await p.waitForTimeout(400);
  await p.locator('.pit-wrap').screenshot({ path: 'tools/out/ghost-saved.png' });
  console.log(JSON.stringify(errs));
  await b.close();
})();
