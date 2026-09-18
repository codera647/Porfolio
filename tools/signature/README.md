# Signature asset pipeline

Turns `assets/signature/abdul-moiz-signature-source.png` into the three SVGs the
site uses. Implements the recipe in `docs/HANDOFF.md` §3.

```bash
pip install numpy scipy scikit-image pillow matplotlib potracer
cd tools/signature
python build_signature.py          # writes the SVGs + signature.meta.json
python verify_signature.py --browser
```

`verify_signature.py` measures everything from a render — it never trusts the
build. Without `--browser` it runs the geometry checks only; with it, it drives
headless Chrome (or Edge) across the animation and writes `_verify_frames.png`.

## Outputs, in `assets/signature/`

| File | What it is |
|---|---|
| `abdul-moiz-signature-animated.svg` | Self-contained pen reveal. Calm black to 0.12 s, complete at 2.44 s. |
| `abdul-moiz-signature-light.svg` | Completed mark, `#F8F8F8` ink, for the nav and footer. |
| `abdul-moiz-signature-dark.svg` | Same outline, `#0C0C0C` ink, for light surfaces. |
| `signature.meta.json` | Timings and per-stroke schedule, for the intro component. |

## How it works

| Module | Role |
|---|---|
| `sigcore.py` | Loads the alpha channel, upscales 4×, builds the 8-connected skeleton graph, polyline utilities. |
| `siggraph.py` | Cleans that graph — merges junction clusters, prunes spurs — then walks it, preferring at each junction the branch that best continues the incoming direction. That directional preference is what makes the result read as handwriting. |
| `sigtrace.py` | potrace (pure-Python `potracer`) over the same mask, producing the filled outline as cubic béziers. Keeps the calligraphic thick/thin exactly. |
| `sigstrokes.py` | Maps the walk's runs onto the brief's stroke order, splits the z descender from the finishing flourish, smooths, fits Catmull-Rom béziers. |
| `build_signature.py` | Time budget, keyframes, SVG emission. |
| `inspect_runs.py` | Contact sheet of the raw runs. Run this when the fingerprint check fails. |

## Two things worth knowing before you change it

**Subpaths do not reveal in order.** `docs/HANDOFF.md` §3 suggests putting every
stroke as a subpath inside one masked `<path>` and animating `stroke-dashoffset`.
Browsers restart the dash phase at each subpath, so all twenty reveal at once —
verified in Chrome. Each stroke therefore gets its own `<path>` in the mask, with
its own `animation-delay` on a shared schedule.

**The run ids are pinned.** `sigstrokes.GROUPS` maps run ids to letters, and
`FINGERPRINT` pins each run's length and start point. If the trace ever shifts,
the build stops with a message instead of silently animating the wrong order.
Re-read the runs with `inspect_runs.py`, then update both tables.

## The clipped tail, and what was done about it

The source PNG is cut off at its right edge. Looking at the last twenty columns,
the clip severs *two* strokes 8.5px apart: the flat tail leaving frame at y=177
heading down-right, and the curl coming back at y=186 heading up-right and
tapering to a fine tip at (556,193). They are the two halves of the finishing
flourish's closing curl, whose turn falls just outside the frame.

`sigcore.py` closes it. Both ends are measured from the alpha channel — sub-pixel
centre, exit tangent, perpendicular width — and joined by the minimal G1 cubic,
with `k` set to the value a circular arc of the same chord and turn would use.
About 3px of ink is reconstructed. Nothing is invented beyond closing a stroke
whose two ends are both visible, and `_curl.png` was rendered at several `k`
values and eyeballed before settling on 3.5.

The canvas is then padded to a 41px right margin matching the left one, so the
viewBox is `0 0 607 324` and the mark is balanced in its own frame. Before this
it sat hard against the right edge and could not be centred honestly.

**If a padded re-export ever arrives, set `CLOSE_TAIL = False` in `sigcore.py`
and rebuild.** The reconstruction and the padding both drop out.
