const path = require('path');
const puppeteer = require('puppeteer-core');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
(async () => {
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/index.html', { waitUntil: 'networkidle0' });
  await p.addStyleTag({ content: '.bar,.pit-pops{display:none!important}.hero{min-height:630px!important;padding-top:0!important;padding-bottom:0!important;align-items:center}' });
  await new Promise(r => setTimeout(r, 9000));
  await p.screenshot({ path: path.resolve(__dirname, '../assets/img/share.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await b.close();
  console.log('Wrote assets/img/share.png');
})();
