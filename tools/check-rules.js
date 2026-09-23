const { webkit } = require('playwright-core');
(async () => {
  const b = await webkit.launch();
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await c.route('**/js/play.js*', async r => {
    const res = await r.fetch();
    let body = await res.text();
    body = body.replace("    window.addEventListener('resize', resize);\n    resize();", "    if (canvas.id === 'pit') window.__t = { set: function (g) { grid = g; }, empty: empty, block: block, finalCells: finalCells, endsInOverflow: endsInOverflow, overflow: overflow };\n    window.addEventListener('resize', resize);\n    resize();");
    await r.fulfill({ response: res, body });
  });
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' });
  const out = await p.evaluate(() => {
    const T = window.__t, r = {};
    function build(cols) { const g = T.empty(); cols.forEach(([x, z, list]) => list.forEach((c, y) => { g[x][y][z] = T.block(c, y); })); return g; }
    T.set(build([[1, 1, [0, 1, 2]]]));
    r.landing2x1 = T.finalCells([[0, 0, 0], [1, 0, 0]], 1, 1).map(f => f.slice(0, 3).join(','));
    const tall = [[0, 0, [0, 1, 0, 1, 0, 1, 0, 1]]];
    T.set(build(tall));
    r.overflowNoMatch = T.endsInOverflow([[0, 0, 0]], 2, 0, 0);
    T.set(build(tall));
    r.savedByDirectMatch = T.endsInOverflow([[0, 0, 0]], 1, 0, 0);
    T.set(build([[0, 0, [0, 1, 0, 1, 0, 1, 2, 3]], [1, 0, [3, 1, 0, 1, 0, 1, 3]]]));
    r.savedByMatchBelow = T.endsInOverflow([[0, 0, 0]], 3, 0, 0);
    T.set(build([[0, 0, [0, 1, 0, 1, 0, 1, 2, 3]], [1, 0, [3, 1, 0, 1, 0, 1, 2]]]));
    r.gridUntouchedAfterSim = T.overflow() === false;
    return r;
  });
  console.log(JSON.stringify(out, null, 1), JSON.stringify(errs));
  await b.close();
})();
