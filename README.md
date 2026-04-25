# Index Cards (PWA)

Minimal index-card stacks that save to `localStorage` and work offline as a PWA.

## Offline behavior

- **Data** lives only in the browser (`localStorage`). There is no server sync; stacks and cards are available whenever the app loads.
- **App shell (JS/CSS)** is precached by the service worker from the production build: `npm run build` runs `scripts/inject-precache.mjs`, which reads hashed asset URLs from `dist/index.html` and writes them into `dist/sw.js` so `cache.addAll` includes the full SPA. Deploy **`dist/` as produced by `npm run build`** so offline installs include bundles.
- **Service worker** ([`public/sw.js`](public/sw.js)): navigations and other requests are network-first when online (fresh deploys), with cache fallback when offline. Cache name bumps (e.g. `index-cards-shell-v4`) drop old entries on activate.
- **`npm run dev`**: Vite serves sources from the dev server; the same `public/sw.js` precache list is empty in source form and is not a substitute for testing offline—use **`npm run build` then `npm run preview`**, load the app once online, then use DevTools “Offline” and reload to confirm.

After `npm run build`, `scripts/verify-dist-precache.mjs` checks that precached URLs and core shell files exist under `dist/`.

Automated warm-cache smoke (starts `vite preview`, fetches `index.html`, hashed assets, and `sw.js`): `npm run offline-smoke`. For true offline behavior in the browser, run `npm run preview` after a build, open the app once online, then toggle DevTools offline and reload.

## Local dev

```bash
npm install
npm run dev
```

## GitHub Pages

This project is configured with Vite `base: './'`, which works well for GitHub Pages project sites.

- Build: `npm run build`
- Deploy the `dist/` folder to GitHub Pages (via `gh-pages` branch or GitHub Actions).

