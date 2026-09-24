const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: process.getuid && process.getuid() === 0 ? ['--no-sandbox', '--no-proxy-server'] : ['--no-proxy-server'] });
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/tools/share.html', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForSelector('body[data-ready]');
  await new Promise(r => setTimeout(r, 300));
  await p.screenshot({ path: path.resolve(__dirname, '../assets/img/share.jpg'), type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await b.close();
  console.log('Wrote assets/img/share.jpg');
})();
