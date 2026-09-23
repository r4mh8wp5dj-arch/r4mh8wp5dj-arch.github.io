const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const base = cfg.baseUrl.replace(/\/?$/, '/');
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));

function apply(html, file) {
  const url = file === 'index.html' ? base : base + file;
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`);
  html = html.replace(/(<meta (?:property|name)="(?:og|twitter):image" content=")[^"]*?(assets\/[^"]+")/g, `$1${base}$2`);
  html = html.replace(/("url": ")[^"]*(")/g, `$1${url}$2`);
  html = html.replace(/("image": ")[^"]*?(assets\/[^"]+")/g, `$1${base}$2`);
  html = html.replace(/("sameAs": \[")[^"]*(")/, `$1https://www.instagram.com/${cfg.instagram}$2`);
  html = html.replace(/(<a\b[^>]*\bdata-email="(\w+)"[^>]*>)([^<]*)(<\/a>)/g, (m, open, key, text, close) => {
    const addr = cfg.email[key];
    if (!addr) throw new Error(`Unknown email key "${key}" in ${file}`);
    open = open.replace(/href="[^"]*"/, `href="mailto:${addr}"`);
    return open + (/@/.test(text) && !/^@/.test(text.trim()) ? addr : text) + close;
  });
  html = html.replace(/(<a\b[^>]*\bdata-ig\b[^>]*>)([^<]*)(<\/a>)/g, (m, open, text, close) => {
    open = open.replace(/href="[^"]*"/, `href="https://www.instagram.com/${cfg.instagram}"`);
    return open + text.replace(/@[\w.]+/, '@' + cfg.instagram) + close;
  });
  return html;
}

let changed = 0;
pages.forEach(file => {
  const full = path.join(ROOT, file);
  const before = fs.readFileSync(full, 'utf8');
  const after = apply(before, file);
  if (after !== before) { fs.writeFileSync(full, after); changed++; }
});
console.log(`Applied site.config.json (${base}) to ${changed} of ${pages.length} pages.`);
