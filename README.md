# 🪐 orbit-drop

A tiny **gravity puzzle** in the browser. Slingshot a ball from the white dot and use the pull of the blue gravity wells to curve it into the green ring. Pure vanilla JS + Canvas, **no dependencies, no backend** — just a static page.

Newtonian physics: each well applies `G·m/r²` toward its center (softened near the core). Slingshot power scales with drag distance. Hit a well or fly off-screen and you retry.

## Play locally
```bash
# any static server, e.g.:
bunx serve .      # or: python -m http.server
# open http://localhost:3000
```

## Dev
```bash
bun test          # physics unit tests (physics.js)
```
The physics lives in `physics.js` (pure, unit-tested); `game.js` handles input and rendering; `levels.js` holds the levels.

## Deploy
Static site → **GitHub Pages** via `.github/workflows/pages.yml` (runs the tests, then publishes the repo root). Enable Pages → "GitHub Actions" in repo settings.

MIT.
