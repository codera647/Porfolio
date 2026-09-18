# Abdul Moiz portfolio, build handoff

Written 2026-09-13. Hand this whole file to Claude in VS Code as the opening message, or keep it in the repo as the spec of record and point Claude at it. It is self contained: everything decided so far, the full design brief, the asset pipeline, and the task list with status.

---

## 0. How to start in VS Code

Paste this as the first message:

> Read `docs/HANDOFF.md` in this repo. It is the complete spec and current state for my portfolio build. We are at Task 1 of the task list in section 7. Start there and work down. Do not relitigate decisions already recorded in sections 2 and 6, ask me first if you think one is wrong.

Everything below assumes the repo root is `D:\Porfolio`.

---

## 1. Project snapshot

Personal portfolio for **Abdul Moiz** (goes by Nex), Islamabad. The whole site is typography led: no avatars, no portraits, no 3D characters, no stock photography.

The core experience, in one line: **a handwritten signature draws itself on a black screen, a rounded split colour hero card opens, and the large centred name responds to the pointer while a soft warm gradient drifts behind it.**

**Stack decided:** Next.js (App Router) + React + TypeScript. Font is **JetBrains Mono** for all site typography, loaded via `next/font/google`. The handwritten signature is brand artwork only, never a heading font.

**Repo state right now:** `D:\Porfolio` contains only `color_theme/` (the palette files) plus whatever this handoff drops in. No app code exists yet. Nothing has been built.

---

## 2. Decisions already made, do not reopen

| Decision | Value | Why it is settled |
|---|---|---|
| Stack | Next.js + React + TypeScript | Chosen deliberately over plain HTML because the full portfolio needs routing and sections |
| Hero name | `ABDUL MOIZ` | Single line on desktop, exactly two centred lines on mobile |
| Split orientation | Near black left ~60%, deep rust right ~40% | Adapted from the v3 reference card |
| Name colour | One pale vertical gradient `#F8F8F8` to `#F0DFD6` across **both** panels | An earlier idea of flipping the name colour at the split was rejected. The brief forbids a hard colour change inside a letter |
| Job title | `Machine Learning Engineer / Architect`, prominent, with **Engineer** and **Architect** swapping via a rotating text animation | Replaces the `[Your role / discipline]` placeholder the brief originally called for. This is Nex's real title, it is not invented |
| Rust panel texture | Subtle static grain/noise, confined to the rust side, clipped to the card radius | Requested directly. Generate once, no per frame cost |
| Build order | Intro + hero fully polished first, lower sections after approval | The brief itself says intro and hero get the most detail |

---

## 3. Assets

### Signature (the critical one)

`assets/signature/abdul-moiz-signature-source.png` is the only signature asset that exists. Everything else must be generated from it.

Measured facts, already verified, do not redo this analysis:

- 564 x 324 px, RGBA, transparent background, black ink
- Ink covers 4.76% of the canvas (8700 px)
- Ink bounding box: x 41 to 563, y 40 to 282
- Max stroke radius 4.5 px (so ~9 px at the thickest), median ink radius 1.0 px (hairline flourishes)
- **The image is clipped at the right edge.** Ink runs to x=563 of 564. The stroke that runs off canvas is the finishing underline flourish, which the brief names as the final stroke. Either close the tail cleanly in the trace, or ask Nex for a re-export with right padding
  - **Fixed 2026-09-14, closed in the trace.** Measuring the last 20 columns showed the clip cuts *two* strokes 8.5px apart: the flat tail leaving frame at y=177 heading down-right, and the curl coming back at y=186 heading up-right, tapering to a fine tip at (556,193). They are the two halves of the flourish's closing curl, whose turn happens just off canvas. Both ends were measured from the alpha channel — sub-pixel centre, exit tangent, perpendicular width — and joined with the minimal G1 cubic, `k` set to what a circular arc of the same chord and turn would use. The reconstruction spans about 3px of missing ink; nothing is invented beyond closing a stroke whose two ends are both visible
  - The canvas is padded to a 41px right margin matching the left, so **the viewBox is now `0 0 607 324`** and the mark is balanced in its own frame — it previously sat hard against the right edge and could not be centred honestly. The flourish is now one unbroken stroke ending in its taper, rather than a stroke plus a severed 13px orphan
  - All of this lives in `tools/signature/sigcore.py` under `CLOSE_TAIL` / `CURL` / `PAD_RIGHT`. **If a padded re-export from Nex ever arrives, set `CLOSE_TAIL = False` and rebuild** — the whole reconstruction drops out and the real ink takes over

Assets to generate from it:

| File | What it is |
|---|---|
| `abdul-moiz-signature-animated.svg` | One shot pen animation, 2.44 s draw |
| `abdul-moiz-signature-light.svg` | Completed state, `#F8F8F8` ink, used for the nav mark and footer |
| `abdul-moiz-signature-dark.svg` | Same, dark ink, for light surfaces |

### The generation pipeline (this is the part that is easy to get wrong)

A PNG cannot be stroke animated. Two passes are needed:

1. **Outline pass.** Threshold the alpha channel, upscale ~4x with a smooth resample, then trace to vector. `potrace` gives the nicest beziers (`apt install potrace`, feed it a PBM). If potrace is unavailable, `skimage.measure.find_contours` on the upscaled mask plus even odd fill works and is pure Python. This preserves the calligraphic thick and thin character exactly.
2. **Centreline pass.** `skimage.morphology.skeletonize` on the same binary mask gives the invisible path a pen would travel. Build an 8 connectivity graph over the skeleton pixels, classify nodes as endpoints (degree 1) and junctions (degree 3+), extract the chains between them, then walk the graph starting from the leftmost endpoint, at each junction preferring the branch whose direction best continues the incoming direction. That directional preference is what makes it look like handwriting instead of a random traversal. Smooth each resulting polyline (Chaikin or a spline fit) before emitting.

Then combine: the centreline becomes an SVG `<mask>` with `stroke-width` around 10 to 12 (in the 564 x 324 coordinate space, comfortably wider than the 9 px thickest ink), `stroke-linecap="round"`, `stroke-linejoin="round"`, and the traced outline is filled and masked by it. Animate `stroke-dashoffset` from the full path length to 0.

```
<mask id="pen">
  <path d="<centreline>" fill="none" stroke="#fff" stroke-width="11"
        stroke-linecap="round" stroke-linejoin="round" class="pen"/>
</mask>
<path d="<outline>" fill="#F8F8F8" mask="url(#pen)"/>
```

~~Multiple subpaths in one `d` reveal in order, and the jumps between them are not stroked, so stroke order comes for free from the order you emit them.~~

**Corrected 2026-09-14, this was wrong.** Browsers restart the dash phase at every subpath, so all subpaths in one `d` reveal *simultaneously*, not in order. Verified in Chrome against the real asset. The build instead emits one `<path>` per stroke inside the mask, each with its own `animation-delay` on a shared length-weighted schedule, which gives the ordering the brief asks for and finer control over per-stroke pacing. Two further traps found the same way, both fixed in `tools/signature/build_signature.py`:

- `stroke-linecap="round"` paints a dot wherever a zero-length dash sits, so every pen showed a speck at its start point from frame one. Each pen now stays at `stroke-opacity: 0` until its own window opens.
- A property declared in only one keyframe interpolates against the element's underlying value, so `stroke-opacity: 1` at 0% alone faded each pen back out as it drew. It has to appear at both ends.

**Required stroke order** (from the brief): capital A, crossbar, b/d/u/l, capital M, o/i/z, i dot, finishing underline. Map the traced components onto that order rather than accepting raw left to right output.

**Timing:** total draw must land on **2.44 s**, hold to **2.60 s**. Ease should breathe like writing, not a linear sweep.

**Fallback if the centreline walk comes out messy on the flourishes:** reveal in ordered connected component chunks instead. It still reads correctly.

**Verify by rendering.** Rasterise the SVG at several dash offsets and actually look at the frames before declaring it done. A trace that looks fine as a static outline can reveal in a nonsensical order.

### Reference stills

`assets/references/` contains three frames pulled from the videos Nex supplied:

- `v1-name-hover-detail.jpg` : the oversized name with hairline letters, the pointer nearest letter filled solid and bright, and the warm glow blob behind
- `v2-loader-sequence.jpg` : the signature drawing progression
- `v3-split-card-detail.jpg` : the split colour card with the curved divider

The source videos (v1.mp4, v2.mp4, v3.mp4) live in the chat, not the repo. The stills capture what matters.

---

## 4. Library toolkit

Nex wants these used across builds, not just this one. Reach for them before hand rolling an effect.

| Repo | Use it for | Do not use it for |
|---|---|---|
| https://github.com/pmndrs/react-three-fiber | Substrate for any WebGL in React. Peer dep of ShaderGradient | Not needed on its own. The card entrance is a CSS 3D transform, not three.js |
| https://github.com/ruucm/shadergradient | Ambient gradient behind the contact/footer section | **Not the hero glow.** The hero glow has hard contrast numbers (orange 22%, amber 12%, normal compositing, freezable). Two blurred radial fields in CSS or a small canvas hit those exactly and cost nothing. A WebGL canvas there is heavier and harder to keep in bounds |
| https://github.com/dashersw/liquid-glass-js | Possibly a nav pill or project card hover, later | **Not the hero card.** The brief explicitly rejects excessive glass and anything resembling a floating glass slab |
| https://github.com/collidingScopes/liquid-logo | Footer signature treatment, or a hover state on the small nav signature | **Not the intro.** The intro must be a true pen stroke reveal preserving the letterforms, which liquid metal destroys |

### Rotating job title

Use the ReactBits RotatingText component: https://reactbits.dev/text-animations/rotating-text

Source repo: https://github.com/DavidHDev/react-bits (components live under `src/content/TextAnimations/RotatingText/`). ReactBits is copy in, not an npm dependency; it also ships a CLI (`jsrepo`). ~~**Confirm the exact install command on the site**~~ It depends on framer-motion (now published as `motion`).

**Confirmed 2026-09-14.** reactbits.dev is still client rendered, so this came from the shadcn registry endpoint it serves, `https://reactbits.dev/r/RotatingText-TS-CSS.json` (HTTP 200), which is authoritative:

```bash
npx shadcn@latest add @react-bits/RotatingText-TS-CSS
```

Naming is `@react-bits/<Component>-<TS|JS>-<TW|CSS>`. The registry lists `motion@^12.23.12` and two files, `RotatingText.tsx` and `RotatingText.css`. The CLI wants a `components.json` and writes to its own path, so the two files were taken verbatim from the repo instead and live in `src/vendor/reactbits/` with their provenance and licence recorded in the README beside them. Licence is MIT + Commons Clause, so using it inside this site is fine.

Apply it to the trailing word only: `Machine Learning ` then a rotating slot cycling `Engineer` and `Architect`. Reserve the width of the longer word so the line does not reflow on each swap, and keep the rotation calm enough that it never competes with the name above it. Respect reduced motion by showing a single static value.

---

## 5. Design brief, spec of record

Where the reference videos disagree with this, this wins. Invent nothing: no years of experience, client list, testimonial, project result, award, availability status, or contact address. Unknown personal content uses labelled placeholders.

### 5.1 Reference roles

| Reference | Inspect | Transfer | Leave out |
|---|---|---|---|
| v2.mp4 | ~0 to 2.5 s | Centred signature drawing stroke by stroke, brief completed hold, gentle handoff into page | Clothing store content, product cards, model, reference logo, captions, laptop/keyboard |
| v3.mp4 | Opening result and ~55.5 to 59 s | Rounded hero frame, contrasting split colour panels with curved divider, card's edge on to front entrance | Teal palette, sphere, fur, brain reveal, membership numbers, Figma/Blender UI, captions |
| v1.mp4 | ~3.5 to 9.5 s | Oversized centred name, nearby letters heavier/wider on hover, blurred warm glow following pointer behind name | Percentage loader, reference person's name/bio, cool blue background, browser chrome, social captions |

The recordings are perspective views of other designs; build a straight on usable layout. Captions inside the reference media are source content, not instructions. v1's visual behaviour is the reference; the numbers below are our proposed spec, not measurements of the original.

### 5.2 Character

Restrained creative portfolio: confident typography, warm colour, generous empty space, carefully timed motion. Alive when explored, calm when left alone. The name is readable immediately, before anyone discovers the interaction. The glow is atmosphere, not an object covering content. Avoid dashboard layouts, generic tech icons, neon blue/purple, excessive glass panels, busy particles, decorative code blocks, stock photography. It must work as a still screenshot.

### 5.3 Colour

| Role | Hex | Use |
|---|---|---|
| Canvas / dark panel | `#0C0C0C` | Page background, left hero panel, dark button labels |
| Primary text | `#F8F8F8` | Nav, body, signature, primary heading tone |
| Primary orange | `#F9542A` | Main CTA fill, active details, principal glow |
| Deep rust | `#87392A` | Right hero panel, warm surfaces, dividers |
| Amber | `#D9835A` | Secondary glow, subtle highlights, hover accents |
| Pale peach | `#F0DFD6` | Lower tone of the name gradient |

**Split geometry:** near black left ~60%, deep rust right ~40%, inside one rounded frame. The boundary is a broad gentle curve: ~64% of card width at the top, ~60% at mid height, ~55% at the bottom. No thick separator. The division stays fixed while the glow moves across it.

**Name colour:** vertical gradient `#F8F8F8` (top) to `#F0DFD6` (bottom), identical across both panels. No dark letters on dark, no vivid orange on rust, no rainbow, no blend modes that invert text, no hard colour change inside a letter. Ordinary text is solid `#F8F8F8`. Dark `#0C0C0C` labels on orange CTAs. Never rust as small text on black.

**Contrast bounds:** pale peach on rust is ~6.1:1 normal composite. With orange at 22% and amber at 12% layered over rust it is ~4.5:1. Recheck the actual designed states, especially the brightest glow behind thin letters.

### 5.4 Typography

JetBrains Mono, weights regular / medium / semibold / bold, variable weight for the interactive name. No substitute condensed display font.

| Element | Desktop | Mobile |
|---|---|---|
| Main name | 160 to 180 px, line height 1.0 to 1.05, base weight 250 to 300 | 64 to 76 px, line height 1.05, two lines |
| Section title | 40 to 52 px, weight 600, lh 1.15 | 28 to 34 px, weight 600 |
| Supporting sentence | 15 to 17 px, weight 400, lh 1.6 | 14 to 16 px, lh 1.6 |
| Nav / buttons | 13 to 14 px, weight 500 to 600 | same |
| Eyebrow / metadata | 10 to 12 px, uppercase, tracking 0.10 to 0.14 em | 10 to 11 px |

Desktop name occupies ~82 to 86% of card width. Distinct gap between ABDUL and MOIZ. No vertical stretching. The default state is fine but readable, not a near invisible hairline.

### 5.5 Layout

Journey: intro, hero, selected work, about, approach, contact/footer. Intro and hero get the most detail.

Reference frame 1440 x 900. Outer canvas near black. Hero card inset 24 px from each viewport edge (~1392 x 852), 32 px radius, 1 px off white border at 12 to 16% opacity, subtle shadow that does not read as a floating glass slab. 12 column grid, 48 to 56 px internal side padding. The hero owns roughly the first viewport; on short screens adapt spacing or allow scrolling rather than cropping controls.

**Nav, inside the hero:** static signature upper left ~120 x 40 px. Work, About, Contact upper right in one row, 24 to 28 px gaps. Minimum 44 px hit targets even though the lettering is small. Off white links; on hover a short orange underline plus a restrained colour change; a visible focus outline. No second brand mark, no oversized nav panel, no competing headline above the name.

**Centre composition,** centred on the whole card not either half:

1. Eyebrow: `PERSONAL PORTFOLIO / ABDUL MOIZ`
2. H1: `ABDUL MOIZ`, single line desktop, ~180 px tall, near the vertical midpoint
3. 28 to 36 px below it, the sentence `Ideas, built with intention.`
4. Below that, the prominent rotating title: `Machine Learning Engineer / Architect` (see section 4)
5. Centred two button row, 12 to 16 px gap: `View work ↗` (orange fill, dark label) and `Let's talk ↗` (transparent fill, off white outline ~30%, off white label). Both ~48 px high, one consistent corner treatment repeated across the page

No slogan across the middle of the name; keep the letter interaction unobstructed.

**Bottom edge:** lower left `SELECTED WORK & IDEAS` in small off white metadata. Lower centre `Scroll to explore` with a down arrow and a generous hit area. Lower right `LinkedIn ↗` and `GitHub ↗` as editable placeholders, no invented URLs. This utility row sits 36 to 44 px above the card bottom, quiet and separate from the CTA row.

### 5.6 Intro

Intro fills the viewport with `#0C0C0C`. Signature centred, ~320 to 380 px wide desktop, ~240 to 280 px mobile, surrounding space empty, ink `#F8F8F8`. A true stroke reveal, not a typewriter and not a wipe over finished lettering.

Completes at 2.44 s, holds to 2.60 s, then crossfades into the hero entrance. No percentage counter, fake progress, spinning logo, sound, or second loader. A quiet `Skip intro` control lower right, reachable by keyboard and touch; skip goes straight to a stable readable hero. Play once per browsing session (sessionStorage). Never trap the user behind a slow or failed asset request.

### 5.7 Entrance choreography

| Time | Behaviour |
|---|---|
| 0.00 to 0.12 s | Calm black, no flash of content |
| 0.12 to 2.44 s | Signature draws |
| 2.44 to 2.60 s | Completed signature holds |
| 2.60 to 2.95 s | Intro layer and signature fade |
| 2.60 to 3.40 s | Hero card reveals from nearly edge on and settles front on |
| 2.98 to 3.32 s | Nav and eyebrow fade in with 8 to 12 px upward travel |
| 3.04 to 3.58 s | Name reveals from a baseline mask with small left to right letter offsets |
| 3.25 to 3.65 s | Sentence, rotating title, CTA row, bottom details, in that order |
| After 3.65 s | Stable hero; pointer interaction becomes the primary motion |

Card entrance: perspective ~1200 px, X rotation ~65 to 72 deg, scale ~0.88, opacity 0, ending at 0 deg / scale 1 / opacity 1 over ~800 ms, `cubic-bezier(0.22, 1, 0.36, 1)`. It opens once and never keeps rotating. Text runs on a separate schedule so nothing is read while distorted. The name rises 20 to 28 px through a mask with 28 to 35 ms between letters and settles without overshoot. Supporting text moves only 10 to 14 px. The glow increases gently as the card settles.

### 5.8 Name pointer behaviour

At rest every letter sits at weight 250 to 300 with a slightly narrow stance. The pointer nearest letter moves toward weight 750 to 800 and widens modestly; immediate neighbours move toward 450 to 550, giving a soft wave of emphasis. Falloff radius ~140 to 180 px at desktop size, strongest at the pointer, fading smoothly with distance. Horizontal glyph scale 0.88 at rest to 1.03 at maximum. Reserve per glyph space so the line width, word gap and CTA positions never move. Approach the target state over ~180 to 260 ms, ease back over 350 to 450 ms on departure.

Fixed baseline and letter height. No jumping, overlapping, shuffling, illegible compression, autonomous pulsation, or name replacement. The pale gradient is preserved throughout; weight and modest width carry the feedback. Transforms apply only to the name, nothing else reflows. Normal cursor, the name is not a button.

JetBrains Mono keeps fixed character advances under weight change, so express the width emphasis as a small local glyph transform. Do not claim a font width axis it does not have.

States to check: all at rest; pointer near ABD on the dark panel; pointer near MOIZ on the rust panel; and the boundary case where an emphasised letter crosses the split.

### 5.9 Pointer gradient

Layered above the two base panels and below every text and control layer, clipped to the card's rounded corners. The split stays visible through it.

- Primary field: `#F9542A`, ~380 to 460 px across desktop, smooth radial falloff to transparent, max normal composite opacity ~22% over the panels
- Secondary field: `#D9835A`, ~220 to 300 px, up to 12%, offset ~60 to 100 px from the primary centre for depth and asymmetry

Edges blurred and diffuse: no visible circular outline, no rectangular texture seam. A restrained darker rust may soften the tail. No blue, teal, purple, particle trail, liquid splash, or ball like object.

On movement, map the pointer into hero local space. The primary follows with ~180 to 260 ms of eased lag, the secondary ~300 to 450 ms. Damped, so fast movement produces a short lag rather than a trail of blobs. It crosses the split naturally while the panels stay fixed. Stay inside the contrast bounds; avoid additive and screen blending unless the result is separately verified. It never receives input or blocks controls.

At rest, keep a very faint glow near 62% width / 43% height with a slow 10 to 14 s drift of 30 to 50 px. On pointer leave, return gently over ~800 to 1200 ms. Reduced motion freezes the field. Touch devices get a static or very gentle ambient treatment. The letters react faster than the glow; that difference is deliberate.

### 5.10 Responsive

**Desktop 1440 x 900 and 1280 x 800:** single line name, full width rounded card, centred composition, fluid heading sizes, all top and bottom controls visible. At very wide sizes add breathing space rather than enlarging small copy.

**Tablet 834 x 1194:** 20 px outer margins, 26 to 28 px radius, 28 to 36 px internal padding. The name may wrap to two lines. CTAs side by side where they fit. Glow diameter reduced proportionally. Touch first even if a pointer exists.

**Mobile 390 x 844, checked at 360 px:** 12 px outer margins, 20 to 24 px corners, 22 to 24 px internal side padding. Static signature top left, compact `Menu` top right. Name on exactly two centred lines, ABDUL then MOIZ, ~64 to 76 px adjusted to fit at 360 px, never split inside a word. Visible curved split, ~65% width at top to ~45% at bottom, no third stripe. Eyebrow above the title, then the sentence and rotating title beneath. CTAs stack if needed, full width, 48 to 52 px high. Reduce the bottom metadata row, keep the scroll affordance, move profile links to the footer if space is tight. Respect browser chrome and safe areas, allow scrolling on short displays. Replace the perspective entrance with a 450 to 600 ms fade and small rise, show the name at a stable medium weight, and never require dragging a touch across letters. The menu opens a simple high contrast panel with Work, About, Contact and a clear Close, designed as its own state.

### 5.11 Lower sections (after the hero is approved)

**Selected work:** 96 to 120 px below the hero. Heading `Selected work`, optional `01 / WORK` label, three entries, the first spanning the full grid and the next two sharing a row. Each has a 16:10 preview area, `[Project title]`, `[Project type]`, `[Your contribution]`, `[Year]`. Use abstract palette based previews if real screenshots are absent. Invent no case studies, client identities or performance claims. Hover: image scale ~1.02, subtle border highlight, small arrow movement. Stack on mobile. Include a project detail template with overview, role, process and outcome placeholders.

**About:** `A little about me` with `[Short professional bio]` and a tidy `[Skills / disciplines]` list. Desktop 5/7 column split, a small orange divider, no portrait. Stack on mobile.

**Approach:** Understand, Explore, Build, Refine as four compact editorial rows with editable one sentence descriptions. No skill meters, no invented statistics. Staggered reveal 40 to 60 ms between items when motion is allowed.

**Contact and footer:** `Have something in mind?` with a `Let's talk ↗` button, `[Email address]` and editable profile links. Generous near black section with a restrained rust curve or orange line echoing the hero. Footer carries the static signature, Abdul Moiz, a year placeholder and `Back to top ↑`. No working contact form and no imaginary contact details.

### 5.12 Interaction and accessibility

`View work` and `Scroll to explore` lead to Selected work. `About` and `Contact` target their sections. `Let's talk` targets Contact. `Back to top` returns to the hero without replaying the intro. Gentle anchor scrolling when motion is allowed; no scroll hijacking, no snapping through whole sections, no custom scroll physics.

Buttons need default, hover, pressed and keyboard focus states, with a 2 px amber or off white focus outline that stays visible on both panel colours. Text links need a non colour only hover and focus cue. Interactive targets at least ~44 x 44 px; small visible lettering must not imply a tiny hit target.

Keep one accessible `<h1>` reading "Abdul Moiz" even though the animation splits it into letters. Decorative duplicates and glow layers must not become duplicate reading content. Ship a complete reduced motion hero: signature shown immediately or briefly crossfaded, no 3D card rotation, static name, frozen glow, direct section navigation. The name must read without hover, without JS motion and without background effects. The static design is a complete state, not a loading placeholder.

---

## 6. Things already tried, so you do not repeat them

- **The name colour flip at the split was rejected.** Rendering the name twice, clipped either side of the curve, with different colours per side, was proposed and then ruled out by the brief. One pale gradient across both panels is the answer.
- **ShaderGradient was considered for the hero glow and rejected** on contrast and performance grounds. See section 4.
- **`device_bash` on this machine cannot mount the project folder** (a Windows update from 2026-09-08 broke the Plan9 share). That is why the build moved to VS Code. Files can still be written to the folder from the Claude desktop session, but nothing can be executed there.
- ~~The ReactBits install command could not be verified from the previous session; confirm it on the site.~~ Confirmed 2026-09-14, see section 4.

### Added 2026-09-14

- **Do not verify motion with `chrome --headless --virtual-time-budget`.** It advances CSS animations but not JavaScript animation loops in step with timers, so anything driven by `requestAnimationFrame` screenshots in states it never reaches. It reported the rotating title as permanently stuck on `Engineer` with an empty slot, and the animated signature as inert inside an `<img>`. Both were wrong: in real time both are correct. Use `node tools/preview/shoot.mjs`, which drives Chrome over the DevTools Protocol at real wall clock times and can dispatch real mouse moves (`--move x,y@t`). The hero's pointer work in task 4 needs that anyway.
- **`animatePresenceMode="sync"` on RotatingText was tried and reverted.** It was meant to close the ~250 ms gap `wait` leaves while one word exits before the next mounts. With only two texts the AnimatePresence keys alternate 0,1,0,1, and a repeating key collides with the copy still exiting: after the second swap the slot stays empty for good. `wait` with a short tween (260 ms) is what ships, and the gap is brief enough to read as a handover rather than a flicker.
- **The signature centreline cannot come from a naive left to right traversal.** The `Abdul,moiz` ink is six connected components, and the largest fuses A, b, d, the two tall ascender loops and the crossbar into one 1150 px run. The stroke order the brief asks for comes from walking the skeleton with a directional preference at each junction, then mapping the resulting runs onto named groups by hand. Those mappings are pinned by fingerprint in `tools/signature/sigstrokes.py` so the build fails loudly rather than silently animating the wrong order.

---

## 7. Task list

Status as of handoff. Nothing is built yet.

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | **Generate animated signature SVG assets** | **Done 2026-09-14** | All three SVGs plus `signature.meta.json` are in `assets/signature/`, viewBox `0 0 607 324` (the clipped tail is closed and the canvas balanced, see section 3). Pipeline and its README are in `tools/signature/`; `python verify_signature.py --browser` re-checks everything from a render. Outline IoU vs the source PNG 0.978, every ink pixel reachable by the pen, stroke order A / crossbar / b-d-u-l / m / o-i-z / i dot / finishing underline, nothing painted before 0.12 s, held state pixel identical to the static light mark, reduced motion complete and static. Two spec corrections recorded in section 3. |
| 2 | **Pull ReactBits RotatingText source** | **Done 2026-09-14** | Install command confirmed, see section 4. Component vendored verbatim into `src/vendor/reactbits/`; the project wrapper is `src/components/hero/RotatingTitle.tsx`. Swap verified in a real browser over several cycles: both words render, the slot reserves `9ch` (`Architect`, the longer word) so nothing reflows, and reduced motion shows the full static `Machine Learning Engineer / Architect` |
| 3 | **Scaffold Next.js project** | **Done 2026-09-14** | Next 16.3.5 / React 19.2.8 / TS, App Router, `src/`, `@/*` alias, no Tailwind. JetBrains Mono variable via `next/font/google` (no weight list, so the name's 250-800 pointer response has a real axis to drive). Tokens in `src/styles/tokens.css`, base layer in `src/app/globals.css`. `npm run build` and `npm run lint` both clean. `src/app/page.tsx` is a placeholder that task 4 replaces |
| 4 | **Build intro loader and hero** | **Done 2026-09-14** | All of it, in `src/components/intro/` and `src/components/hero/`. The animated signature is inlined into the HTML rather than linked, so the intro cannot be blocked by a failed request (s5.6); the static nav mark is still a normal request because its alt text is a complete fallback. Intro gating is a pre-paint script in `layout.tsx` plus a CSS rule, so a repeat visit never flashes the black layer. Skip (button or Escape) hands over to an already stable hero rather than into another second of choreography |
| 5 | **Responsive and reduced motion states** | **Done 2026-09-14** | Checked at 1440, 1280, 834, 390 and 360. Two line name at 360 with no word split and no horizontal overflow; the mobile name gets its own clamp because the desktop one bottoms out at 64px and left the card looking empty. Menu panel verified as its own state: `role=dialog`, `aria-modal`, focus moves to Close, body scroll locked. Reduced motion renders the complete settled hero from CSS alone, with no JavaScript involved |
| 6 | **Verify contrast, timings and deliver** | **Done 2026-09-14** | See the record below. Every number measured from a real render. The lower sections (section 5.11) are now the next phase |

---

### Hero changes requested by Nex, 2026-09-14

Made on request, after the hero was first signed off. Several depart from
section 5, so they are recorded here rather than silently applied.

| Change | Note |
|---|---|
| Word gap in the name tightened, `0.72em` to `0.3em` | The name now spans **77.9%** of card width, under section 5.4's 82-86%. That band was the reason for the wide gap. Tracking could take it back up if you want both |
| Eyebrow `PERSONAL PORTFOLIO / ABDUL MOIZ` removed | Replaced in that position by the role line |
| Role line moved above the name, sized up to 20-32px, rotating word set in a filled block | It now leads the composition. The block reserves `9ch` so a swap still cannot reflow anything |
| Supporting sentence enlarged to 16-22px and dropped further below the name | |
| Nav `Work` / `About` / `Contact` removed, replaced by a `Let's talk` bracket button | |
| Mobile `Menu` panel removed | It existed only to hold those three links |
| `View work` CTA removed | |
| `Scroll to explore` removed | |
| `LinkedIn` / `GitHub` text replaced by marks | Destinations are still `#contact` placeholders - no URLs invented (s5.5). Each carries an accessible name, since an icon is not a label |

Second round of changes, same day:

| Change | Note |
|---|---|
| Mobile name centred | The base `.line` rule uses `align-items: baseline`, which in a column direction falls back to start and packed both words against the left edge. Now explicitly centred |
| Profile marks sized up and given an outline chip; 52px on mobile | The outline is what keeps them legible wherever the split leaves them - one can sit on near black while the other sits on rust |
| Bottom left `SELECTED WORK & IDEAS` replaced by `Ideas, built with intention.` | Briefly appeared twice; the copy under the name was removed in the third round below, so it now reads once |
| The divider is now a wave | Section 5.3's three anchors are nearly collinear and read as a straight diagonal. The endpoints still honour the stated drift - 64% at the top, 55% at the bottom desktop, 65% to 45% mobile - but the line now sways around it, anchored at 64 / 58.5 / 65.5 / 57.5 / 55%. Catmull-Rom through those anchors, which is what keeps the reversals smooth rather than kinked. The generator is a few lines of Python; regenerate with different anchors if the amplitude needs tuning |

Third round, same day:

| Change | Note |
|---|---|
| The divider is now a **broad moving sine** | One gentle period and a bit down the card, replacing the tight multi-reversal S. Five keyframes are the same sine at 0/90/180/270/360 degrees of phase, so the last frame equals the first and the loop is seamless - it reads as a wave travelling rather than a shape morphing |
| `Ideas, built with intention.` removed from under the name | It now appears once, as the bottom left metadata. That resolves the duplication flagged below |
| Grain moved inside the rust element | It was a sibling clipped by the same path. Now the parent's clip carries it, so a moving divider cannot leave the grain behind |

**How the wave animates.** The first attempt animated the clip path's `d`
between phase-shifted keyframes. That was wrong twice over: CSS interpolates each
control point along a straight line, so the motion kinked at every keyframe and
the amplitude pulsed between them - which is what read as glitching and as the
loop stopping and restarting - and it re-rasterised the clip every frame, costing
about a third of the frame budget.

The shipped version never changes shape. The wave element is four card-heights
tall with exactly one sine period per card height, and it translates up by
exactly one period before looping, so the visible window is identical at both
ends of the cycle. Nothing interpolates, so the speed is constant by
construction, and the motion is a plain transform the compositor can carry.

Measured, headless with `--disable-gpu`: the wave now costs about 2fps against
its own frozen baseline (29 vs 31), where the `d` version cost 13 (27 vs 40).
Isolating the wave - rotating title and glow held still - a frame at t and a
frame at t plus one 18s cycle are **pixel identical**, which is the real proof
the loop does not restart.

The trade is the 64% to 55% drift: a shape cannot both tile and drift, so the
wave now swings around a constant 60% centre on desktop (55% on mobile), which
keeps it inside the same band section 5.3 describes. Since the divider moves, its
position at the top and bottom edges was never fixed once it animated anyway.

This also overrides section 5.3's "the division stays fixed while the glow moves
across it". The division now moves too. Reduced motion freezes it at phase zero -
verified pixel identical across seven seconds.

Fourth round: the tech strip.

A band of brand marks crossing the gap between the bottom-left line and the
profile marks, biggest at the centre of that gap and fading out at both ends -
a dialer, from Nex's sketch. Icons only, no names.

| Decision | Why |
|---|---|
| **Departs from section 5.2**, which says avoid generic tech icons | Requested directly and confirmed. Mitigated by pitching it as a quiet credit strip: monochrome, 22px at the centre, peak opacity 0.72, slow |
| Sixteen marks | A middle ground between a tight dozen and the full stack, weighted to the AI/ML work the CV leads with. Every one is on the CV |
| One shared pair of keyframes, staggered per mark | Every mark travels the same path, so one animation describes the whole effect and mark `i` simply starts `-(i/16)` of a cycle into it. No JavaScript, nothing measures the band, nothing recalculates on resize, and the browser composites it. Measured cost: **0fps** (29 with, 29 paused) |
| Two animations, not one | Travel belongs to a wrapper as wide as the band, so a percentage translate is band-relative and the keyframes can name the borders and the centre without measuring. Scale belongs to the mark, because scaling a full-width wrapper would move the icon sideways as well as resize it. They share a duration and a delay |
| Fade and scale, not blur | A real dialer blur needs per icon `filter: blur()` recomputed each frame, and would muddle against the glow |
| Icons vendored, not an npm dependency | Sixteen paths inlined from simple-icons v16.31.0 (CC0). No runtime cost, no request that can fail. Regenerate with `tools/techstack/fetch_icons.py` |
| **OpenAI and AWS are absent on purpose** | Both resolved over the CDN's `@latest` alias but 404 in the package itself - a stale edge cache. Brands do get pulled from simple-icons over trademark policy, so they were substituted (Google Cloud, which the CV backs explicitly) rather than scraped from an older build. The fetch script fails loudly on this |

The band is 620px, centred in the gap rather than stretched across it, so it
reads as a contained strip rather than filler. **It is dropped entirely below
900px** - that is where the bottom-left line disappears, so there is no gap left
for it to sit between and the whole idea stops working. Same call section 5.10
makes about the metadata line.

Note the visible count does not change with the band's width: travel is twice the
band and there are sixteen marks, so eight are always inside it and narrowing
just packs them closer. At 620px that is 78px apart; to thin it out, drop marks
or lengthen the travel, not the width.

Verified rather than eyeballed, at 620px: seven marks visible, gaps of
78/77/78/77/78/77px, widths tapering 17.0 to 21.9 and back. Even spread,
symmetric taper.

Accessibility: sixteen unlabelled shapes announced one by one would be noise, so
the marks are hidden from assistive tech and one `sr-only` line carries the names.

**A knock-on worth knowing about.** Putting the rotating role in a filled block
made its swap gap visible: `animatePresenceMode="wait"` holds the next word until
the current one has left, and with a pale block behind it that gap reads as an
empty white box rather than merely absent text. Two separate screenshots caught
it by chance, which is how it surfaced. It is now **80ms, down from 260ms**, via
a near-instant exit tween and a much tighter character stagger - the stagger
mattered because each character starts transparent, so it was reading as part of
the gap rather than as arrival. The arriving word still slides in over the full
duration, and that is the gesture the eye follows. Eliminating the gap entirely
would mean replacing the vendored component's swap, which section 4 asks us to
use, so it was left at 80ms.

**On the repeated sentence:** `Ideas, built with intention.` reading twice on one
screen is worth a second look, both as composition and because section 5.12 asks
that duplicates not become duplicate reading content - a screen reader now hears
it twice. Removing either copy is a one line change; the request was taken
literally so the reversible version shipped.

**The one consequence worth planning around:** nothing in the hero now points at
the lower sections. Section 5.12 routed `View work` and `Scroll to explore` to
Selected work, and `About` / `Contact` to their sections; all four are gone. When
section 5.11 gets built it will need its own way in - most likely the nav coming
back in some form, or the scroll affordance returning. `Button.tsx` is kept,
unused for now, because the contact section still calls for that button language.

---

### Verification record, 2026-09-14

Measured, not assumed. Reproduce with `tools/signature/verify_signature.py --browser`
and the `tools/preview/` harness; see the README beside each.

| Check | Result |
|---|---|
| Name spelled `ABDUL MOIZ`, JetBrains Mono, loader uses the signature | Yes. Variable font, no weight list, so the 250-800 axis is real |
| Split structure + pointer responsive typography and background | Yes |
| Full name fits at 360px without breaking a word | Two lines, no word split, no horizontal overflow |
| Brightest glow over rust clears the section 5.3 bounds | **5.40:1 minimum** on solid ink over the brightest glow, against the 4.5:1 bound. Median 7.22:1 |
| Resting state with no pointer looks finished | Yes, faint glow drifting near 62% / 43% |
| Intro plays once per session, skip works by keyboard, a failed asset never blocks | Gate verified both ways; skip button reachable by Tab and not inside an `aria-hidden` subtree, Escape also skips; the only thing that advances the page is a timer, and the signature is inlined so there is no request to fail |
| Reduced motion gives a complete static hero | Pixel identical across 3.5s; entirely CSS |
| Nothing reflows when letters change weight | Layout byte identical between weights 280 and 778. Only the transformed box of the letters under the pointer changes, which is the feedback itself |
| Interactive targets clear ~44 x 44px | All of them, at 1440 and at 360. The utility row keeps its small lettering and grows its hit area with an overlay |
| Focus ring visible on both panels | 2px amber, 3px offset |

Two things worth knowing:

- **The intro replays on every load in development.** Once per session is right
  for visitors and unusable while building: `sessionStorage` survives reloads in
  the same tab, so after one load the intro would never show again without
  opening a new tab. In development it therefore always plays. **Production is
  exactly as the brief specifies** - verified against a real build, where the
  inlined gate script still reads `sessionStorage`, and in development compiles
  to a constant `false`. `?intro` and `?intro=0` force it on or off in either
  build, so the shipped gate is still testable in dev with `?intro=0`.
  All of it lives in `src/lib/introGate.ts`, which holds both copies of the
  decision - the pre-paint inline script and the component side check -
  deliberately adjacent so they cannot drift.
- **The gate script needs `suppressHydrationWarning` on `<html>`.** It stamps
  `data-intro-played` before React hydrates, so the server HTML and the client
  DOM legitimately differ and React reports a mismatch without it. Left
  unsuppressed React may also drop the attribute, which would let the intro
  layer paint for a frame on a repeat visit - the exact flash the script exists
  to prevent. The suppression applies only to that element's own attributes, so
  it cannot mask a real mismatch anywhere else in the tree.


- **The name needed tracking to hit its width.** JetBrains Mono at the 180px cap
  only reaches ~77% of card width, and section 5.4 wants 82-86%. `letter-spacing:
  0.045em` plus a wide word gap brought it to 83.4%. The gap has since been
  tightened on request, putting it back at 77.9% - see the change table above.
  Advances stay fixed either way, so the pointer response cannot reflow it.
- **The divider reads as a clean diagonal, not an obvious curve.** That is what
  the stated geometry gives: 64% / 60% / 55% at top, middle and bottom are very
  nearly collinear, so any curve through them is almost straight. Built to the
  numbers. Say the word if you want the bow exaggerated.

---

## 8. Verification checklist before calling the hero done

- Name is spelled `ABDUL MOIZ`, site font is JetBrains Mono, the loader uses the handwritten signature
- The hero has both the split structure and the pointer responsive typography and background
- The full name fits at 360 px width without breaking a word
- The brightest glow over the rust panel still clears the contrast bounds in section 5.3, measured on the real rendered state, not assumed
- The resting state with no pointer present looks finished, not like something waiting for input
- The intro plays once per session, the skip control works by keyboard, and a failed asset never blocks the hero
- Reduced motion gives a complete static hero
- Nothing in the hero reflows when letters change weight
