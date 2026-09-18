# Preview and measurement harness

Drives a running dev/production server in headless Chrome over the DevTools
Protocol, at **real wall-clock times**.

```bash
npm run build && npm run start -- --port 3200

node tools/preview/shoot.mjs --url http://localhost:3200 --out .preview \
  --label hero --size 1440x900 --at 500,3000,4200

node tools/preview/probe.mjs --url http://localhost:3200 --at 4200 \
  --expr "document.querySelectorAll('h1 span').length"
```

## Why not `--virtual-time-budget`

Chrome's virtual time advances CSS animations but not JavaScript animation loops
in step with timers. Anything driven by `requestAnimationFrame` — the rotating
title, the pointer field, the name's weight response — screenshots in states it
never actually reaches. It reported the rotating title as permanently stuck on
`Engineer` with an empty slot, and the animated signature as inert inside an
`<img>`. Both were wrong. Every number in this project's verification comes from
this harness instead, or from a local raster.

## shoot.mjs

| Flag | What it does |
|---|---|
| `--at 500,3000` | Screenshot at these times, in ms from navigation |
| `--size 1440x900` | Viewport |
| `--move x,y@t` | Dispatch a real mouse move at `t` ms. `,,` separates several |
| `--reduced` | Run with `prefers-reduced-motion: reduce` |
| `--css "..."` | Inject CSS before navigation, to isolate a layer for measurement |
| `--label`, `--out` | Output naming and directory |

## probe.mjs

Same driver, but evaluates an expression and prints the result — for when a
screenshot cannot tell you *why* something looks wrong. Supports `--move`, plus:

| Flag | What it does |
|---|---|
| `--expr` | Expression to evaluate. Promises are awaited |
| `--keys "Tab,Tab"` | Real key presses before evaluating. `.focus()` does not reliably raise `:focus-visible`, so keyboard reachability has to be driven properly |
| `--init "js"` | Runs before any page script on every document — used to pre-set `sessionStorage` for the intro's once-per-session gate |

## contrast.py

```bash
node tools/preview/shoot.mjs ... --label withName --move "1017,379@4600" --at 5300
node tools/preview/shoot.mjs ... --label bg --move "1017,379@4600" --at 5300 \
  --css "h1{visibility:hidden!important}"
python tools/preview/contrast.py <withName>.png <bg>.png
```

Two shots of the same frame, one with the name hidden, so every ink pixel can be
compared against the colour it is actually sitting on — glow, split and grain
included. That is what `docs/HANDOFF.md` §8 means by *measured on the real
rendered state, not assumed*. It compares solid ink only; anti-aliased glyph
edges are blends of ink and background and would report a ratio nobody reads.
