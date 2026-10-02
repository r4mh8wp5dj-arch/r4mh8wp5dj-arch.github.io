const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'site.config.json'), 'utf8'));
const base = cfg.baseUrl.replace(/\/?$/, '/');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'i18n', 'langs.json'), 'utf8'));
const langs = meta.languages;
const def = langs.find(l => l.code === meta.default);
const PAGES = ['index.html', 'contact.html', 'privacy.html'];

function readJson(file) { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}; }
function esc(s) { return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function depth(dir) { return dir.split('/').filter(Boolean).length; }
function pageUrl(l, page) { return base + l.dir + (page === 'index.html' ? '' : page); }
function relTo(from, to, page) {
  const up = '../'.repeat(depth(from.dir));
  const target = to.dir + (page === 'index.html' ? '' : page);
  return (up + target) || './';
}

function closeOf(html, name, from) {
  const re = new RegExp('<(/?)' + name + '\\b[^>]*>', 'g');
  re.lastIndex = from;
  let level = 1, m;
  while ((m = re.exec(html))) {
    if (m[1]) { level--; if (!level) return { start: m.index, end: re.lastIndex }; }
    else if (!/\/>$/.test(m[0])) level++;
  }
  throw new Error('Unclosed <' + name + '>');
}

const GLOBE = '<svg class="lang-ico" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9.25"/><ellipse cx="12" cy="12" rx="4.1" ry="9.25"/><path d="M2.75 12h18.5M4.4 7.2h15.2M4.4 16.8h15.2"/></svg>';
const CHEV = '<svg class="lang-chev" viewBox="0 0 12 12" width="10" height="10" aria-hidden="true" focusable="false"><path d="M2.5 4.5 6 8l3.5-3.5"/></svg>';
const TICK = '<svg class="lang-tick" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"><path d="m3.5 8.5 3 3 6-7"/></svg>';

function langMenu(cur, page, t) {
  const items = langs.map(l => {
    const here = l.code === cur.code;
    return `<li><a href="${here ? (page === 'index.html' ? './' : page) : relTo(cur, l, page)}" lang="${l.code}" hreflang="${l.code}" data-lang="${l.code}"${here ? ' aria-current="true"' : ''}><span>${l.name}</span>${here ? TICK : ''}</a></li>`;
  }).join('');
  return `<details><summary aria-label="${esc(t['lang.label'])}">${GLOBE}<span class="lang-code">${cur.short}</span>${CHEV}</summary><ul>${items}</ul></details>`;
}

function build(source, page, cur, dict, fallback, issues) {
  const used = new Set();
  const get = (key) => {
    if (key in dict) { used.add(key); return dict[key]; }
    if (cur.code !== def.code) issues.push(`${cur.code}/${page}: missing "${key}"`);
    return fallback[key];
  };
  let out = '', pos = 0;
  const re = /<([a-zA-Z][\w:-]*)\b([^>]*)>/g;
  let m;
  while ((m = re.exec(source))) {
    const name = m[1].toLowerCase();
    let tag = m[0], attrs = m[2];
    if (name === 'script') {
      const c = closeOf(source, 'script', re.lastIndex);
      re.lastIndex = c.end;
      continue;
    }
    const kAttr = /\sdata-i18n-attr="([^"]*)"/.exec(attrs);
    const kText = /\sdata-i18n="([^"]*)"/.exec(attrs);
    const kFile = /\sdata-i18n-file="([^"]*)"/.exec(attrs);
    const isMenu = /\sdata-lang-menu(\s|$|=)/.test(attrs);
    if (!kAttr && !kText && !kFile && !isMenu) continue;
    let innerNew = null;
    if (kAttr && cur.code !== def.code) {
      kAttr[1].split(';').forEach(pair => {
        const [a, key] = pair.split(':');
        const raw = dict[key];
        if (raw === undefined) { issues.push(`${cur.code}/${page}: missing "${key}"`); return; }
        used.add(key);
        const val = esc(raw);
        const ar = new RegExp('(\\s)' + a.replace(/[-]/g, '\\-') + '="[^"]*"');
        tag = ar.test(tag) ? tag.replace(ar, `$1${a}="${val}"`) : tag.replace(/\s*(\/?)>$/, ` ${a}="${val}"$1>`);
      });
    }
    if (isMenu) innerNew = langMenu(cur, page, dict['lang.label'] ? dict : fallback);
    else if (kFile && cur.code !== def.code) {
      const f = path.join(ROOT, 'i18n', cur.code, kFile[1] + '.html');
      if (fs.existsSync(f)) innerNew = '\n' + fs.readFileSync(f, 'utf8').replace(/\n+$/, '\n');
      else issues.push(`${cur.code}/${page}: missing file ${path.relative(ROOT, f)}`);
    } else if (kText && cur.code !== def.code) {
      const raw = dict[kText[1]];
      if (raw === undefined) issues.push(`${cur.code}/${page}: missing "${kText[1]}"`);
      else { used.add(kText[1]); innerNew = raw; }
    }
    out += source.slice(pos, m.index) + tag;
    pos = m.index + m[0].length;
    re.lastIndex = pos;
    if (innerNew !== null) {
      const c = closeOf(source, name, pos);
      out += innerNew;
      pos = c.start;
      re.lastIndex = c.start;
    }
  }
  out += source.slice(pos);
  return { html: out, used };
}

function localize(html, page, cur, dict) {
  const shift = '../'.repeat(depth(cur.dir));
  if (shift) html = html.replace(/((?:href|src)=")(assets\/|js\/|styles\.css|mobile\.css|site\.webmanifest)/g, `$1${shift}$2`);
  html = html.replace(/<html lang="[^"]*"/, `<html lang="${cur.code}"`);
  html = html.replace(/\n[ \t]*<link rel="alternate" hreflang="[^"]*" href="[^"]*">/g, '');
  html = html.replace(/\n[ \t]*<meta property="og:locale(?::alternate)?" content="[^"]*">/g, '');
  const alts = langs.map(l => `\n  <link rel="alternate" hreflang="${l.code}" href="${pageUrl(l, page)}">`).join('') + `\n  <link rel="alternate" hreflang="x-default" href="${pageUrl(def, page)}">`;
  html = html.replace(/(<link rel="canonical" href="[^"]*">)/, `$1${alts}`);
  const loc = `\n  <meta property="og:locale" content="${cur.locale}">` + langs.filter(l => l !== cur).map(l => `\n  <meta property="og:locale:alternate" content="${l.locale}">`).join('');
  html = html.replace(/(<meta property="og:site_name" content="[^"]*">)/, `$1${loc}`);
  if (cur.code !== def.code && dict['ld.description']) {
    html = html.replace(/(<script type="application\/ld\+json">[\s\S]*?"description": ")[^"]*(")/, `$1${dict['ld.description'].replace(/"/g, '\\"')}$2`);
  }
  return html;
}

const issues = [];
const fallback = readJson(path.join(ROOT, 'i18n', def.code, 'strings.json'));
langs.forEach(cur => {
  const dict = Object.assign({}, cur.code === def.code ? {} : fallback, readJson(path.join(ROOT, 'i18n', cur.code, 'strings.json')));
  const outDir = path.join(ROOT, cur.dir);
  if (cur.dir) { fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true }); }
  const usedAll = new Set();
  PAGES.forEach(page => {
    const source = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const r = build(source, page, cur, dict, fallback, issues);
    r.used.forEach(k => usedAll.add(k));
    const html = localize(r.html, page, cur, dict);
    fs.writeFileSync(path.join(outDir, page), html);
  });
  if (cur.code !== def.code) {
    Object.keys(dict).filter(k => !usedAll.has(k) && k !== 'ld.description' && k !== 'lang.label').forEach(k => issues.push(`${cur.code}: unused key "${k}"`));
  }
});
console.log(`Localized ${PAGES.length} pages into ${langs.length} languages (${langs.map(l => l.code).join(', ')}).`);
if (issues.length) { console.log(issues.join('\n')); process.exitCode = 1; }
