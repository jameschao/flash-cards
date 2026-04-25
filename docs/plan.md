---
name: Index Card PWA
overview: "Build a simple Vite + React PWA: named stacks (max 100 cards), rolodex navigation with left/right and up/down swipes plus on-screen and keyboard controls, reorder mode, localStorage with visible save status, iPad-first layout with solid desktop support. Output deployable to GitHub Pages (static `dist/`, correct base path)."
---

## Index Card PWA (stacks, rolodex, localStorage)

### Stack choice: React + Vite (recommended)

A **simple React app** (Vite + TypeScript) is the default:

- **Why**: Clear separation of views (stacks / card / reorder), easier gesture handling, and a **straightforward PWA** story via the ecosystem.
- **Monolithic `index.html` remains optional** if you later want a zero-build artifact; the React path does not preclude that.

**GitHub Pages deploy** (the goal):

- Vite `base` set to the repo’s GitHub Pages path, e.g. `base: '/flash-cards/'` for `https://<user>.github.io/flash-cards/` (adjust to your repo name). Use `import.meta.env.BASE_URL` for asset paths and the PWA manifest so icons and the SW work under a subpath.
- Build output: static **`dist/`** only — no server. Push `dist` via **`gh-pages`**, **`peaceiris/actions-gh-pages`**, or “GitHub Pages from Actions” with `actions/upload-pages-artifact`. Document the chosen `base` in a short `README.md` (deployment note only).
- `npm run build` + `npm run preview` to verify the production bundle locally before push.

### Scope and file layout (React + Vite)

- **`index.html` at repo root** — Vite entry; `src/main.tsx` mounts the app.
- **`src/`** — Components and hooks: stacks list, card rolodex, reorder list, a small data/store layer (e.g. React context or a thin custom hook) for persistence.
- **Styles** — CSS modules or a single `App.css` / layout CSS: warm off-white “paper” page, centered card **aspect-ratio 3/5**, subtle shadow, system UI + readable body font for the card.
- **PWA** — `vite-plugin-pwa` (or equivalent) to generate **manifest** and **service worker** with precache of built assets; **icons** in `public/` (e.g. `pwa-192.png`, `pwa-512.png`). This replaces hand-written `sw.js` while still giving offline install and updates when you bump a cache revision.

### iPad primary, desktop secondary

- **Touch**: Minimum **~44px** tap targets for back, add, prev/next, reorder, font control; use **`env(safe-area-inset-*)`** on notched iPads.
- **No hover-only affordances**: any “rename / delete / overflow” on stacks must work from touch (e.g. ⋮, or a visible affordance on each row), with hover as an enhancement on desktop.
- **Keyboard on desktop** (and optional external keyboard on iPad): **Arrow Left/Right** (and **Up/Down** as aliases for prev/next) when focus is not inside a text field, matching the swipe directions conceptually.
- **Viewport**: Card stays centered; max size using `vmin` + `aspect-ratio: 3 / 5` so it still reads as index-card size on iPad in portrait or landscape.

### Data model and persistence

- **Shape** (JSON in `localStorage` under one key, e.g. `indexCardsApp:v1`):
  - `version: 1`
  - `stacks: Record<stackId, { name: string; cardIds: string[]; fontSizePt: number }>`
  - `cards: Record<cardId, { text: string }>`

- **Rationale**: Stable ids for reorder; **max 100 cards per stack** by capping `cardIds.length` (block or trim with user-visible feedback on paste that would exceed).

- **Save UX**: Fixed **status line** at the bottom: `Saving…` while dirty, then `Saved` after write. **Same** status in all views. Debounce (~300–400ms) and flush on `pagehide` / `visibilitychange` / `beforeunload`.

- **Font size (12–48pt)**: **`fontSizePt` per stack**; range control in the card view chrome.

### Views and behavior

- **Stacks list**: Create stacks, tap to open. Rename/delete from a touch-friendly menu (not hover-only). Delete confirms.
- **Card view**: One centered 3:5 card, tap to edit (paste works). Buttons + keyboard + swipes.
  - **Swipes**: left/right and up/down are both supported, classified by dominant axis, and mapped consistently to prev/next.
  - **Editing**: while textarea is focused, navigation gestures/keys do not flip cards.
- **Reorder**: Drag reorder plus per-row up/down nudges. Done returns to flipping view.

### PWA specifics (Vite + GitHub Pages)

- `vite-plugin-pwa`: register TypeScript, inject manifest, precache `dist` assets, Workbox `cleanupOutdatedCaches`.
- After deploy, PWA is served from **HTTPS** on `*.github.io` — service workers and install work.
- Ensure **`base` + scope** so the SW and `start_url` match the GHP subpath.

### Implementation order

1. Vite + React + TS, `base` for GHP, theme CSS + 3:5 card shell.
2. Data layer + localStorage + debounced save + status bar.
3. Stacks CRUD + routing.
4. Card view: L/R + U/D gestures, buttons, arrow keys, edit/add, font.
5. Reorder mode.
6. PWA plugin + icons + deploy docs / workflow.

