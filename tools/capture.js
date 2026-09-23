const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer-core');
const { webkit } = require('playwright-core');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 8766;
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(__dirname, 'out');
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html'];
const TARGETS = [
  { name: 'desktop', engine: 'chromium', width: 1440, height: 900 },
  { name: 'mobile', engine: 'chromium', width: 390, height: 844, mobile: true },
  { name: 'safari-desktop', engine: 'webkit', width: 1440, height: 900 },
  { name: 'safari-mobile', engine: 'webkit', width: 390, height: 844, mobile: true }
];

function up(url) {
  return new Promise(resolve => {
    http.get(url, res => { res.resume(); resolve(res.statusCode === 200); }).on('error', () => resolve(false));
  });
}

async function server() {
  if (await up(`http://localhost:${PORT}/index.html`)) return null;
  const child = spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await up(`http://localhost:${PORT}/index.html`)); i++) await new Promise(r => setTimeout(r, 100));
  return child;
}

async function shoot(page, target, file, errors) {
  page.on('pageerror', e => errors.push(`${target.name} ${file}: ${e.message}`));
  await page.goto(`http://localhost:${PORT}/${file}`, { waitUntil: target.engine === 'webkit' ? 'networkidle' : 'networkidle0' });
  await new Promise(r => setTimeout(r, 1500));
  const base = path.join(OUT, `${file.replace(/\.html$/, '')}-${target.name}`);
  await page.screenshot({ path: `${base}-top.png` });
  await page.screenshot({ path: `${base}-full.png`, fullPage: true });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const child = await server();
  const errors = [];
  try {
    const chrome = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
    const wk = await webkit.launch();
    for (const file of pages) {
      for (const t of TARGETS) {
        if (t.engine === 'chromium') {
          const p = await chrome.newPage();
          await p.setViewport({ width: t.width, height: t.height, isMobile: !!t.mobile, hasTouch: !!t.mobile });
          await shoot(p, t, file, errors);
          await p.close();
        } else {
          const ctx = await wk.newContext({ viewport: { width: t.width, height: t.height }, isMobile: !!t.mobile, hasTouch: !!t.mobile, deviceScaleFactor: t.mobile ? 2 : 1 });
          const p = await ctx.newPage();
          await shoot(p, t, file, errors);
          await ctx.close();
        }
      }
    }
    await chrome.close();
    await wk.close();
  } finally {
    if (child) child.kill();
  }
  console.log(`Screenshots saved to ${path.relative(ROOT, OUT)}/`);
  console.log(errors.length ? `Page errors:\n${errors.join('\n')}` : 'No page errors.');
  process.exitCode = errors.length ? 1 : 0;
})();
