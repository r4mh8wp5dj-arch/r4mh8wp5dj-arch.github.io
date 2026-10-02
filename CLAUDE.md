# Block Pit site

Static landing page for the Block Pit iOS game, served by GitHub Pages from `main`. No framework and no build step on the server: HTML, `styles.css`, `mobile.css` and plain scripts in `js/`.

## Standing rules

- No comments in code: HTML, CSS or JS.
- Phone-only styles live in `mobile.css`, which every page links with `media="(max-width: 700px), (max-height: 500px) and (orientation: landscape)"` (portrait phones and phones turned sideways). Put phone changes there, inside the matching `@media` block, so they never reach desktop or tablet; `styles.css` keeps the shared and wider layouts.
- Verify every change in WebKit (Safari) first, then Chromium: `npm run capture`.
- No screen shake, and no motion that moves the page layout. Effects stay inside the canvas they belong to.
- No layout shift: reserve space for anything that appears late (canvases, forms, messages).
- Respect `prefers-reduced-motion` in every new animation.
- American spelling in all copy and code (color, not colour).
- Keep visuals faithful to the game in `~/Desktop/projects/kule dikme` (colors, block look, pit plate, light channel, popups). Read the Swift source instead of guessing.
- Reports end with a bulleted `Report:` section.

## Workflow

- `npm install` once (dev tools only; nothing ships from `node_modules`).
- `npm run config` applies `site.config.json` (base URL, emails, App Store and social links) to every page.
- `npm run stamp` writes the current commit hash into asset URLs (`?v=`) so browsers never mix old and new files.
- `npm run build` runs both. Run it before committing a change that touches `js/`, `styles.css`, `mobile.css` or the config.
- `npm run serve` starts a server on `0.0.0.0:8765` for testing from a phone on the same Wi-Fi.
- `npm run capture` saves desktop, mobile and Safari screenshots to `tools/out/`.

## Languages

- English pages in the repo root are the source. `npm run build` runs `tools/i18n.js`, which writes the other languages into folders (`tr/`) and fills the header language menu, `hreflang` links and `og:locale` tags. Never edit `tr/` by hand; it is regenerated.
- Every visible string and every `aria-label`/`alt`/meta text in a source page carries `data-i18n="key"` (inner HTML) or `data-i18n-attr="attr:key;attr2:key2"`. Add the key to `i18n/<code>/strings.json` for every language; the build lists missing and unused keys.
- The privacy policy body and its contents list live as whole fragments in `i18n/<code>/privacy.article.html` and `privacy.toc.html`. Keep section ids identical to English.
- To add a language: add it to `i18n/langs.json`, copy `i18n/tr` to `i18n/<code>`, translate, run `npm run build`. The menu (a scrolling dropdown, so many languages fit), sitemap and `hreflang` pick it up. Do not add language links to the footer. Check that `Nippo` has the glyphs.
- Brand name elements carry `lang="en"` so `text-transform: uppercase` never turns "Pit" into "PİT". Banner strings in the demo come from `data-t-*` attributes on `<body>`.
- `js/lang.js` remembers the choice in `localStorage` (`bpLang`) and, on a first visit to an English page, follows the browser language. A saved choice wins everywhere.
- Write each language natively, never as a sentence-by-sentence translation of the English. Turkish: keep "pit" (the play area) and "Block Pit" untranslated, wrapping "Pit" in `lang="en"` where it can be uppercased; "drop" in counts is "hamle"; the last sky is "Uzay".
- The 404 page and the share image (`share.jpg`) stay English for now.

## Game rules the site must match

- A match is two or more same-colored blocks touching; never write "three or more".
- No level number, progress bar, next-piece preview, trophy or lives anywhere on the site.
- The hero demo is autoplay; the streak multiplier is `min(2.4, 2.4 - 1.5 * 0.8^streak)`.

## Pending (do later, owner will provide the details)

- Privacy policy (`privacy.html`): fill `[DEVELOPER LEGAL NAME]`, `[POSTAL ADDRESS]` and `[ANALYTICS PROVIDER]`, confirm the ad SDK (AdMob) is really in the shipping build, then remove the four `.note` boxes. Effective and last-updated dates are set to October 1, 2026; update them on launch day.
- App Store link: replace `[APP_ID]` in `site.config.json`, then `npm run build`.
- Turkish copy and the Turkish privacy policy (`i18n/tr`) were machine-drafted: have a native reviewer, and for the policy a lawyer, read them before launch. Placeholders such as `[DEVELOPER LEGAL NAME]` are identical in every language, so replace them everywhere.
- Localized App Store badge: Apple supplies a Turkish badge; until `assets/img/badges` has it, every language shows the English badge.
- No Terms page: the game has no purchases or accounts, so Apple's standard license applies.
