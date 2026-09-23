# Block Pit site

Static landing page for the Block Pit iOS game, served by GitHub Pages from `main`. No framework and no build step on the server: HTML, `styles.css` and plain scripts in `js/`.

## Standing rules

- No comments in code: HTML, CSS or JS.
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
- `npm run build` runs both. Run it before committing a change that touches `js/`, `styles.css` or the config.
- `npm run serve` starts a server on `0.0.0.0:8765` for testing from a phone on the same Wi-Fi.
- `npm run capture` saves desktop, mobile and Safari screenshots to `tools/out/`.

## Game rules the site must match

- A match is two or more same-colored blocks touching; never write "three or more".
- No level number, progress bar, next-piece preview, trophy or lives anywhere on the site.
- The hero demo is autoplay; the streak multiplier is `min(2.4, 2.4 - 1.5 * 0.8^streak)`.
