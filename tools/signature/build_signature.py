"""Build the three signature SVGs from the source PNG.

    python build_signature.py

Writes assets/signature/abdul-moiz-signature-{animated,light,dark}.svg and
signature.meta.json. Implements the recipe in docs/HANDOFF.md s3 with one
correction: that section assumes several subpaths inside a single masked <path>
reveal in order under stroke-dashoffset. They do not - browsers restart the dash
phase at every subpath, so all of them reveal at once (verified in Chrome). Each
stroke therefore gets its own <path> in the mask, animated on a shared schedule
via animation-delay, which reveals them in the order the brief asks for.
"""
import json, os, numpy as np
import sigcore as S, sigtrace as T, sigstrokes as K

ROOT      = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR   = os.path.join(ROOT, "assets", "signature")
PUBLIC_DIR = os.path.join(ROOT, "public", "signature")
TS_OUT    = os.path.join(ROOT, "src", "lib", "signatureTiming.ts")
W, H      = S.W, S.H
INK_LIGHT = "#F8F8F8"
INK_DARK  = "#0C0C0C"
PEN_WIDTH  = 11         # native px; thickest ink is ~9px, so the mask clears it
PEN_SETTLE = 16         # final pen width; closes sub-pixel slivers at crossings
SETTLE_FROM = 0.040     # s before the end where the pen widens
DRAW        = 2.44      # s, the signature is complete at this point (s3, s5.7)
START_DELAY = 0.12      # s of calm black before the first stroke (s5.7)
HOLD        = 2.60      # s, completed signature holds until here
PATH_LEN  = 1000        # per-path normalised units for stroke-dasharray

LIFT = {"A": 0.0, "crossbar": 0.022, "bdul": 0.022, "m": 0.026,
        "oiz": 0.022, "idot": 0.030, "underline": 0.048}
SPEED_EXP  = 0.75       # <1 keeps short strokes from flashing past
MIN_STROKE = 0.040      # s, floor so the i dot still reads as a tap
EASE_FIRST = (.42, 0, .58, 1)
EASE_MID   = (.38, .04, .58, 1)
EASE_LAST  = (.36, .02, .34, 1)
KF_STOPS   = 6          # keyframe stops emitted per stroke


# ------------------------------------------------------------------ bezier maths
def _cubic_len(p0, p1, p2, p3, n=24):
    t = np.linspace(0, 1, n + 1)[:, None]
    pts = ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * p1 \
        + 3 * (1 - t) * (t ** 2) * p2 + (t ** 3) * p3
    return float(np.sum(np.hypot(*np.diff(pts, axis=0).T)))


def bezier_length(poly):
    """Arc length of the Catmull-Rom curve sigstrokes.to_bezier emits for `poly`."""
    if len(poly) < 3:
        return S.arclen(poly)
    ext = np.vstack([poly[0] + (poly[0] - poly[1]), poly,
                     poly[-1] + (poly[-1] - poly[-2])])
    return sum(_cubic_len(ext[i],
                          ext[i] + (ext[i + 1] - ext[i - 1]) / 6.0,
                          ext[i + 1] - (ext[i + 2] - ext[i]) / 6.0,
                          ext[i + 1])
               for i in range(1, len(ext) - 2))


def bezier_ease(p1x, p1y, p2x, p2y, t, iters=18):
    """Progress of a CSS cubic-bezier easing at input fraction t."""
    t = np.asarray(t, float)
    lo, hi = np.zeros_like(t), np.ones_like(t)
    for _ in range(iters):
        mid = (lo + hi) / 2
        x = 3 * (1 - mid) ** 2 * mid * p1x + 3 * (1 - mid) * mid ** 2 * p2x + mid ** 3
        lo = np.where(x < t, mid, lo)
        hi = np.where(x < t, hi, mid)
    u = (lo + hi) / 2
    return 3 * (1 - u) ** 2 * u * p1y + 3 * (1 - u) * u ** 2 * p2y + u ** 3


# ------------------------------------------------------------------ assembly
def build():
    mask = S.load_mask()
    outline = "".join(T.trace_outline(mask, opttolerance=0.35))
    ink_native = S.native_mask()

    groups = []
    for name, pieces in K.ordered_strokes():
        subs = K.chain([K.polish(p) for p in pieces])
        subs = [K.extend_ends(s, ink_native) for s in subs]
        groups.append((name, subs, [bezier_length(s) for s in subs]))

    # ---- time budget: pen lifts are fixed, drawing time is length weighted
    glen = [sum(L) for _, _, L in groups]
    lifts = sum(LIFT[n] for n, _, _ in groups)
    span = DRAW - START_DELAY - lifts
    w = np.array([L ** SPEED_EXP for L in glen], float)
    times = np.maximum(span * w / w.sum(), MIN_STROKE)
    times *= span / times.sum()

    # ---- global schedule: a dense, monotone (time, cumulative length) table
    ts, ls, t, drawn = [], [], START_DELAY, 0.0
    for i, ((name, subs, Ls), dt) in enumerate(zip(groups, times)):
        if LIFT[name] > 0:
            ts += [t, t + LIFT[name]]
            ls += [drawn, drawn]
            t += LIFT[name]
        ez = EASE_FIRST if i == 0 else (EASE_LAST if i == len(groups) - 1 else EASE_MID)
        u = np.linspace(0, 1, 48)
        ts += list(t + u * dt)
        ls += list(drawn + bezier_ease(*ez, u) * sum(Ls))
        t += dt
        drawn += sum(Ls)
    ts, ls = np.array(ts), np.array(ls)
    total = drawn

    # ---- per stroke: its own path, its own window on that schedule
    strokes, at = [], 0.0
    for name, subs, Ls in groups:
        for sub, L in zip(subs, Ls):
            t0 = float(np.interp(at, ls, ts))
            t1 = float(np.interp(at + L, ls, ts))
            stops = []
            for frac in np.linspace(0, 1, KF_STOPS):
                tt = t0 + frac * (t1 - t0)
                done = (float(np.interp(tt, ts, ls)) - at) / L if L > 0 else 1.0
                stops.append((100.0 * frac, PATH_LEN * (1 - min(1.0, max(0.0, done)))))
            strokes.append({"group": name, "d": K.to_bezier(sub), "length": L,
                            "start": t0, "dur": max(t1 - t0, 0.001), "stops": stops})
            at += L

    meta = {
        "source": "assets/signature/abdul-moiz-signature-source.png",
        "viewBox": [0, 0, W, H],
        "drawSeconds": DRAW,
        "startDelaySeconds": START_DELAY,
        "holdSeconds": HOLD,
        "penWidth": PEN_WIDTH,
        "penSettleWidth": PEN_SETTLE,
        "centrelineLength": round(total, 2),
        "strokeCount": len(strokes),
        "groups": [{"name": n, "strokes": len(s), "length": round(sum(L), 2),
                    "startSeconds": round(
                        min(x["start"] for x in strokes if x["group"] == n), 4)}
                   for n, s, L in groups],
        "sourceViewBox": [0, 0, S.SRC_W, S.SRC_H],
        "note": "The source PNG is clipped at x=564: the finishing flourish's "
                "closing curl runs out of frame. tools/signature/sigcore.py "
                "reconstructs that curl from the measured ends and pads the "
                "canvas to a right margin matching the 41px left one, so the "
                "mark is balanced in its own viewBox. Set CLOSE_TAIL=False "
                "there if a padded re-export ever arrives.",
    }
    return outline, strokes, groups, (ts, ls), total, meta


# ------------------------------------------------------------------ svg writing
def svg_animated(outline, strokes):
    settle_pct = 100.0 * (DRAW - SETTLE_FROM) / DRAW
    css = [
        ".am-sig-ink { fill: %s; }" % INK_LIGHT,
        # stroke-width lives on the group so the settle animation can reach every
        # pen by inheritance; declaring it on .am-sig-pen would override it
        ".am-sig-pen {\n"
        "  fill: none; stroke: #fff; stroke-linecap: round; stroke-linejoin: round;\n"
        "  stroke-dasharray: %d;\n"
        "  stroke-dashoffset: %d;\n"
        # a round linecap still paints a dot where a zero-length dash sits, so
        # each pen stays fully transparent until its own window opens
        "  stroke-opacity: 0;\n"
        "  animation-fill-mode: forwards;\n"
        "  animation-timing-function: linear;\n"
        "  animation-duration: 0.001s;\n"
        "}" % (PATH_LEN, PATH_LEN),
    ]
    paths = []
    for i, s in enumerate(strokes):
        # stroke-opacity has to appear at both ends: a property declared in only
        # one keyframe interpolates against the underlying value, which would
        # fade the pen back out as it draws
        last = len(s["stops"]) - 1
        kf = "\n".join("  %.3f%% { stroke-dashoffset: %.2f;%s }"
                       % (p, o, " stroke-opacity: 1;" if j in (0, last) else "")
                       for j, (p, o) in enumerate(s["stops"]))
        css.append("@keyframes am-sig-k%d {\n%s\n}" % (i, kf))
        css.append(".am-sig-s%d { animation-name: am-sig-k%d; "
                   "animation-duration: %.4fs; animation-delay: %.4fs; }"
                   % (i, i, s["dur"], s["start"]))
        paths.append('<path class="am-sig-pen am-sig-s%d" pathLength="%d" d="%s"/>'
                     '<!-- %s -->' % (i, PATH_LEN, s["d"], s["group"]))
    css.append(
        "/* the walk drops sub-pixel slivers where strokes cross; widening every pen\n"
        "   for the final %ss lands the held signature on exactly the shape the static\n"
        "   marks show, with nothing left undrawn */\n"
        "@keyframes am-sig-settle {\n"
        "  0%% { stroke-width: %dpx; }\n"
        "  %.3f%% { stroke-width: %dpx; }\n"
        "  100%% { stroke-width: %dpx; }\n"
        "}\n"
        ".am-sig-settle { stroke-width: %dpx;\n"
        "                 animation: am-sig-settle %ss linear forwards; }\n"
        "@media (prefers-reduced-motion: reduce) {\n"
        "  .am-sig-pen { animation: none !important; stroke-dashoffset: 0;\n"
        "                stroke-opacity: 1; stroke-width: %dpx; }\n"
        "  .am-sig-settle { animation: none !important; }\n"
        "}" % (SETTLE_FROM, PEN_WIDTH, settle_pct, PEN_WIDTH, PEN_SETTLE,
               PEN_WIDTH, DRAW, PEN_SETTLE))

    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
        'height="%d" role="img" aria-labelledby="am-sig-title">\n'
        '<title id="am-sig-title">Abdul Moiz</title>\n'
        '<defs>\n<style>\n%s\n</style>\n'
        '<mask id="am-sig-pen-mask" maskUnits="userSpaceOnUse" x="0" y="0" '
        'width="%d" height="%d">\n<g class="am-sig-settle">\n%s\n</g>\n</mask>\n</defs>\n'
        '<path class="am-sig-ink" fill-rule="evenodd" mask="url(#am-sig-pen-mask)" '
        'd="%s"/>\n</svg>\n'
        % (W, H, W, H, "\n".join(css), W, H, "\n".join(paths), outline))


def svg_static(outline, ink, title_id):
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" '
        'height="%d" role="img" aria-labelledby="%s">\n'
        '<title id="%s">Abdul Moiz</title>\n'
        '<path fill="%s" fill-rule="evenodd" d="%s"/>\n</svg>\n'
        % (W, H, W, H, title_id, title_id, ink, outline))


if __name__ == "__main__":
    outline, strokes, groups, sched, total, meta = build()
    os.makedirs(OUT_DIR, exist_ok=True)
    files = {
        "abdul-moiz-signature-animated.svg": svg_animated(outline, strokes),
        "abdul-moiz-signature-light.svg": svg_static(outline, INK_LIGHT, "am-sig-light-title"),
        "abdul-moiz-signature-dark.svg": svg_static(outline, INK_DARK, "am-sig-dark-title"),
    }
    for name, text in files.items():
        with open(os.path.join(OUT_DIR, name), "w", encoding="utf-8") as f:
            f.write(text)
        print("%-38s %7d bytes" % (name, len(text.encode())))
    with open(os.path.join(OUT_DIR, "signature.meta.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    # keep the app's copies in step: the SVGs it serves and the timings it
    # schedules the intro against both come from this build, never by hand
    if os.path.isdir(os.path.dirname(PUBLIC_DIR)):
        os.makedirs(PUBLIC_DIR, exist_ok=True)
        for name, text in files.items():
            with open(os.path.join(PUBLIC_DIR, name), "w", encoding="utf-8") as f:
                f.write(text)
        print("  mirrored into public/signature/")
    if os.path.isdir(os.path.dirname(TS_OUT)):
        with open(TS_OUT, "w", encoding="utf-8") as f:
            f.write(
                "// Generated by tools/signature/build_signature.py. Do not edit.\n"
                "// Seconds, matching the keyframes baked into the animated SVG.\n\n"
                "export const signatureTiming = {\n"
                "  /** Calm black before the first stroke (s5.7). */\n"
                "  startDelay: %s,\n"
                "  /** The signature is complete at this point. */\n"
                "  draw: %s,\n"
                "  /** Completed signature holds until here, then the intro fades. */\n"
                "  hold: %s,\n"
                "  /** Stroke group start times, for anything that needs to follow along. */\n"
                "  groups: [\n%s  ],\n"
                "} as const;\n"
                % (START_DELAY, DRAW, HOLD,
                   "".join('    { name: "%s", startSeconds: %s },\n'
                           % (g["name"], g["startSeconds"]) for g in meta["groups"])))
        print("  wrote src/lib/signatureTiming.ts")
    print("\nstroke schedule:")
    for g in meta["groups"]:
        print("  %-10s start=%.3fs  len=%7.1f  paths=%d"
              % (g["name"], g["startSeconds"], g["length"], g["strokes"]))
    print("  %d mask paths, centreline %.1fpx, draw %ss, hold to %ss"
          % (meta["strokeCount"], meta["centrelineLength"], DRAW, HOLD))
