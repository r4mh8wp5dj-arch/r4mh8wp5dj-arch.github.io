const { webkit } = require('playwright-core');
const puppeteer = require('puppeteer-core');
const { PNG } = (() => { try { return require('pngjs'); } catch (e) { return {}; } })();
const sel = ['.title span', '.tag', '.pitch'];
async function edges(page, isWk) {
  const out = [];
  for (const s of sel) {
    const r = await page.evaluate(q => { const b = document.querySelector(q).getBoundingClientRect(); return { x: Math.max(0, b.left - 20), y: b.top + 2, w: 80, h: Math.min(40, b.height - 4) }; }, s);
    const buf = await page.screenshot({ clip: { x: r.x, y: r.y, width: r.w, height: r.h } });
    const png = PNG.sync.read(Buffer.from(buf));
    let min = 999;
    for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
      const k = (y * png.width + x) * 4, v = png.data[k] + png.data[k + 1] + png.data[k + 2];
      if (v > 420 || (png.data[k] > 180 && png.data[k + 1] < 140) || (png.data[k + 1] > 160 && png.data[k + 2] < 110) || (png.data[k + 2] > 170 && png.data[k] < 90)) { if (x < min) min = x; break; }
    }
    out.push(Math.round((r.x + min) * 10) / 10);
  }
  return out;
}
(async () => {
  const w = await webkit.launch(), c = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  for (const width of [1600, 1280, 390]) {
    const a = await w.newPage({ viewport: { width, height: 860 } }); await a.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle' }); await a.waitForTimeout(400);
    const b = await c.newPage(); await b.setViewport({ width, height: 860 }); await b.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 400));
    console.log(width, 'webkit [title, tag, pitch]', JSON.stringify(await edges(a)), 'chrome', JSON.stringify(await edges(b)));
    await a.close(); await b.close();
  }
  await w.close(); await c.close();
})();
