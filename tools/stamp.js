const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const hash = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
const langs = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'langs.json'), 'utf8')).languages;
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
langs.filter(l => l.dir).forEach(l => {
  const dir = path.join(ROOT, l.dir);
  if (fs.existsSync(dir)) fs.readdirSync(dir).filter(f => f.endsWith('.html')).forEach(f => pages.push(l.dir + f));
});
let changed = 0;

pages.forEach(file => {
  const full = path.join(ROOT, file);
  const before = fs.readFileSync(full, 'utf8');
  const after = before.replace(/((?:href|src)="(?:\.\.\/)?\/?(?:styles\.css|mobile\.css|js\/[\w.-]+\.js|assets\/img\/(?:favicon-\d+|apple-touch-icon|logo-\d+|icon-\d+|social\/\w+)\.png))(?:\?v=[\w.-]*)?"/g, `$1?v=${hash}"`).replace(/(assets\/img\/share\.jpg)(?:\?v=[\w.-]*)?"/g, `$1?v=${hash}"`);
  if (after !== before) { fs.writeFileSync(full, after); changed++; }
});

console.log(`Stamped ?v=${hash} into ${changed} of ${pages.length} pages.`);
