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
  html = html.replace(/("sameAs": )\[[^\]]*\]/, (m, a) => a + JSON.stringify(Object.values(cfg.social).filter((u) => /^https:/.test(u))).replace(/,/g, ', '));
  html = html.replace(/(<a\b[^>]*\bdata-email="(\w+)"[^>]*>)([^<]*)(<\/a>)/g, (m, open, key, text, close) => {
    const addr = cfg.email[key];
    if (!addr) throw new Error(`Unknown email key "${key}" in ${file}`);
    open = open.replace(/href="[^"]*"/, `href="mailto:${addr}"`);
    return open + (/@/.test(text) && !/^@/.test(text.trim()) ? addr : text) + close;
  });
  html = html.replace(/(<a\b[^>]*\bdata-appstore\b[^>]*href=")[^"]*(")/g, `$1${cfg.appStore}$2`);
  html = html.replace(/(<a\b[^>]*\bdata-social="(\w+)"[^>]*href=")[^"]*(")/g, (m, a, key, b) => {
    if (!cfg.social[key]) throw new Error(`Unknown social key "${key}" in ${file}`);
    return a + cfg.social[key] + b;
  });
  html = html.replace(/(<a\b[^>]*\bdata-ig\b[^>]*href=")[^"]*(")/g, `$1${cfg.social.instagram}$2`);
  return html;
}

let changed = 0;
pages.forEach(file => {
  const full = path.join(ROOT, file);
  const before = fs.readFileSync(full, 'utf8');
  const after = apply(before, file);
  if (after !== before) { fs.writeFileSync(full, after); changed++; }
});
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${base}sitemap.xml\n`);
const urls = ['', 'contact.html', 'privacy.html'].map(p => `  <url><loc>${base}${p}</loc></url>`).join('\n');
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
console.log(`Applied site.config.json (${base}) to ${changed} of ${pages.length} pages.`);
const todo = JSON.stringify(cfg).match(/\[[A-Z_]+\]/g);
if (todo) console.log(`Placeholders still in site.config.json: ${[...new Set(todo)].join(', ')}`);
