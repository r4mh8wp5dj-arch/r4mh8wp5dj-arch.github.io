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

- The site is in "coming soon" mode: every App Store badge is replaced by `assets/img/badges/coming-soon-<lang>.png` (made with `tools/soon-badge.html` and `tools/soon-badge.js`), and the header and dock buttons say "Join the beta" and jump to the end section with the beta form (`#join`). On launch day, restore the App Store badges and the "Get the app" buttons, fill `[APP_ID]` in `site.config.json`, regenerate `share.jpg` with the App Store badge, and run `npm run build`.
- Privacy policy (`privacy.html`, `i18n/tr/privacy.article.html`, `i18n/tr/privacy.toc.html`): rewritten on October 12, 2026 to describe only what really happens: the App sends nothing today (local saves, local notifications, Apple's opt-in crash sharing and TestFlight), the Website (GitHub Pages logs, no cookies, language in localStorage), email via Google Workspace, no ads, Firebase only as planned, one legal basis per activity (KVKK Art. 5), concrete retention (emails up to 12 months). The developer is Emir Kaladağ, İzmir, Türkiye (no street address by the owner's choice). Before Firebase or a beta signup form goes live, update Sections 3, 7, 8 and 10 with the exact events, identifiers, retention, basis and opt-out, and add the form's provider. Keep section ids identical in both languages; `#contact-and-data-requests` is linked from the contact page.
- Closed beta signup: the form at the end of the home page (`js/beta.js`) posts to Formspree form `mbgdawja` with fetch; reCAPTCHA must stay off in Formspree for AJAX, spam is handled by the `_gotcha` honeypot and Formspree's filter. Each signup carries `language`, `notice_version` (hidden input) and `submitted_at` as the consent record; whenever the visible `beta.note` text changes in any language, bump `notice_version` to the new date. Privacy Sections 6, 10 and 11 describe it; keep them in sync if the fields change. Signups are open to ages 16+ (beta only, not the game).
- Beta signup deletion (privacy Section 11), done by hand: within 30 days after the beta ends or after a request, and at the latest 12 months after each signup, delete the Formspree submission, the Formspree notification emails and any tester list copy, and remove the tester from TestFlight.
- Transfers abroad (privacy Section 10) are unresolved: GitHub, Google and Formspree process data in the US, and the KVKK Art. 9 safeguard for each is not in place yet. Section 10 says so openly. Have a lawyer decide the mechanism, then name it in Section 10 (both languages).
- Turkish copy and the Turkish privacy policy (`i18n/tr`) were machine-drafted: have a native reviewer, and for the policy a lawyer, read them before launch.
- No Terms page: the game has no purchases or accounts, so Apple's standard license applies.
- The project folder sits in iCloud Drive; `node_modules` files can be evicted and time out on read. Run the npm tools from a copy outside iCloud or keep the folder downloaded.
