const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const hash = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim();
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
let changed = 0;

pages.forEach(file => {
  const full = path.join(ROOT, file);
  const before = fs.readFileSync(full, 'utf8');
  const after = before.replace(/((?:href|src)="\/?(?:styles\.css|mobile\.css|js\/[\w.-]+\.js))(?:\?v=[\w.-]*)?"/g, `$1?v=${hash}"`);
  if (after !== before) { fs.writeFileSync(full, after); changed++; }
});

console.log(`Stamped ?v=${hash} into ${changed} of ${pages.length} pages.`);
