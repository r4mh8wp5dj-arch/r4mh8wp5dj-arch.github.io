const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-proxy-server'] });
  const p = await b.newPage();
  await p.setViewport({ width: 432, height: 144, deviceScaleFactor: 1 });
  for (const lang of ['en', 'tr']) {
    await p.goto(`http://localhost:8765/tools/soon-badge.html?lang=${lang}`, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForSelector('body[data-ready]');
    const out = path.resolve(__dirname, `../assets/img/badges/coming-soon-${lang}.png`);
    await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: 432, height: 144 } });
    console.log('Wrote', path.relative(path.resolve(__dirname, '..'), out));
  }
  await b.close();
})();
