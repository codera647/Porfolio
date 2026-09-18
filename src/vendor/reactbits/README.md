# Vendored: React Bits RotatingText

Copied in rather than installed. React Bits is a copy-in library, not an npm
dependency — `docs/HANDOFF.md` §4 says to reach for it this way.

| | |
|---|---|
| Source | https://github.com/DavidHDev/react-bits — `src/ts-default/TextAnimations/RotatingText/` |
| Component page | https://reactbits.dev/text-animations/rotating-text |
| Variant | TypeScript + plain CSS (the site uses CSS custom properties, not Tailwind) |
| Pulled | 2026-09-14, from `main` |
| Dependency | `motion@^12.23.12` — installed; this is framer-motion's current package name |
| Licence | MIT + Commons Clause, © 2026 David Haz. Use inside a website or product is permitted; selling the component itself is not. |

## Install command, confirmed

`docs/HANDOFF.md` §4 flagged this as unverified. Confirmed against the registry
endpoint (`https://reactbits.dev/r/RotatingText-TS-CSS.json`, HTTP 200), which
lists `motion@^12.23.12` and the two files below:

```bash
npx shadcn@latest add @react-bits/RotatingText-TS-CSS
```

Naming is `@react-bits/<Component>-<TS|JS>-<TW|CSS>`. jsrepo is supported too.
The CLI wants a `components.json` and writes to its own path, so these two files
were taken straight from the repo instead — same bytes, no build config added.

## Files

- `RotatingText.tsx` — unmodified
- `RotatingText.css` — unmodified

Both are kept byte-identical to upstream so they can be re-pulled cleanly.
Project-specific behaviour (the `Engineer` / `Architect` swap, the reserved
width that stops the line reflowing, and the reduced-motion static value) lives
in the wrapper that consumes this, not in here.
