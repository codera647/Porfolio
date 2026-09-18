"""Check the built signature SVGs. Nothing here trusts the build; every number
is measured from a render.

    python verify_signature.py            # geometry only
    python verify_signature.py --browser  # also drive Chrome over the animation

Geometry checks (local raster):
  * traced outline vs the source PNG alpha, as IoU
  * every ink pixel is reachable by the pen mask, so nothing stays undrawn

Browser checks (headless Chrome, the animated SVG inlined in a page):
  * nothing is painted before the lead-in ends
  * strokes reveal in the order the brief asks for, sampled across the draw
  * the held signature is pixel identical to the static light mark
  * prefers-reduced-motion renders the complete mark immediately

Writes a frame contact sheet next to this file as _verify_frames.png.
"""
import os
import subprocess
import sys
import tempfile

import numpy as np
from PIL import Image, ImageDraw

import build_signature as B
import sigcore as S
import sigrender as R

HERE = os.path.dirname(os.path.abspath(__file__))
# Chrome overshoots --virtual-time-budget by a few ms, so the pre-lead-in
# samples sit ~20ms clear of the 120ms boundary rather than right on it.
SAMPLES = [60, 100, 300, 600, 900, 1200, 1500, 1750, 1950, 2150, 2350, 2440]
CHROME_CANDIDATES = [
    r"C:/Program Files/Google/Chrome/Application/chrome.exe",
    r"C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    r"C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    r"C:/Program Files/Microsoft/Edge/Application/msedge.exe",
]

fails = []


def check(ok, label, detail=""):
    print("  %s %s%s" % ("PASS" if ok else "FAIL", label,
                         ("  " + detail) if detail else ""))
    if not ok:
        fails.append(label)


# ---------------------------------------------------------------- geometry
def geometry():
    print("geometry")
    outline, strokes, groups, sched, total, meta = B.build()
    src = S.native_mask()
    ink = R.rasterise(outline, w=S.W, h=S.H, ss=3)
    iou = (ink & src).sum() / (ink | src).sum()
    check(iou > 0.97, "outline matches the source ink", "IoU=%.4f" % iou)

    yy, xx = np.mgrid[0:S.H, 0:S.W]
    covered = np.zeros((S.H, S.W), bool)
    rad = B.PEN_SETTLE / 2.0
    for _, subs, _ in groups:
        for sub in subs:
            for x, y in S.resample(sub, 0.5):
                r = int(rad) + 2
                x0, x1 = max(0, int(x - r)), min(S.W, int(x + r + 1))
                y0, y1 = max(0, int(y - r)), min(S.H, int(y + r + 1))
                covered[y0:y1, x0:x1] |= (
                    (xx[y0:y1, x0:x1] - x) ** 2
                    + (yy[y0:y1, x0:x1] - y) ** 2 <= rad * rad)
    missed = int((ink & ~covered).sum())
    check(missed == 0, "pen mask reaches every ink pixel", "%d unreachable" % missed)
    order = [g["name"] for g in meta["groups"]]
    want = ["A", "crossbar", "bdul", "m", "oiz", "idot", "underline"]
    check(order == want, "stroke order matches the brief", " -> ".join(order))
    starts = [g["startSeconds"] for g in meta["groups"]]
    check(starts == sorted(starts), "stroke start times increase")
    check(abs(starts[0] - B.START_DELAY) < 1e-6,
          "first stroke waits for the lead-in", "%.3fs" % starts[0])
    return outline


# ---------------------------------------------------------------- browser
def find_chrome():
    for p in CHROME_CANDIDATES:
        if os.path.exists(p):
            return p
    return None


def shoot(chrome, url, out, ms, reduced=False):
    cmd = [chrome, "--headless", "--disable-gpu", "--force-device-scale-factor=1",
           "--window-size=%d,%d" % (S.W, S.H), "--virtual-time-budget=%d" % ms,
           "--screenshot=%s" % out]
    if reduced:
        cmd.append("--force-prefers-reduced-motion")
    cmd.append(url)
    subprocess.run(cmd, capture_output=True)
    return np.asarray(Image.open(out).convert("L"), int) if os.path.exists(out) else None


def browser():
    print("\nbrowser")
    chrome = find_chrome()
    if not chrome:
        check(False, "a Chrome or Edge binary is available")
        return
    tmp = tempfile.mkdtemp(prefix="sigverify-")
    anim = open(os.path.join(B.OUT_DIR, "abdul-moiz-signature-animated.svg"),
                encoding="utf-8").read()
    light = open(os.path.join(B.OUT_DIR, "abdul-moiz-signature-light.svg"),
                 encoding="utf-8").read()
    page = ('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;'
            'background:#0C0C0C}svg{display:block;width:%dpx;height:%dpx}</style>'
            % (S.W, S.H))
    open(os.path.join(tmp, "anim.html"), "w", encoding="utf-8").write(page + anim)
    open(os.path.join(tmp, "light.html"), "w", encoding="utf-8").write(page + light)
    url = lambda n: "file:///" + os.path.join(tmp, n).replace("\\", "/")

    ref = shoot(chrome, url("light.html"), os.path.join(tmp, "ref.png"), 1500)
    if ref is None:
        check(False, "headless renders at all")
        return

    frames = []
    for ms in SAMPLES:
        a = shoot(chrome, url("anim.html"), os.path.join(tmp, "t%d.png" % ms), ms)
        frames.append((ms, a))

    lead = B.START_DELAY * 1000
    for ms, a in frames:
        if ms < lead:
            check(int((a > 20).sum()) == 0,
                  "nothing painted at %dms (before the %.0fms lead-in)" % (ms, lead))

    ink = [(ms, int((a > 128).sum())) for ms, a in frames if ms >= lead]
    check(all(b >= x for (_, x), (_, b) in zip(ink, ink[1:])),
          "revealed ink only ever grows",
          " ".join("%d:%d" % (m, v) for m, v in ink))

    held = frames[-1][1]
    d = np.abs(held - ref)
    check(int((d > 8).sum()) == 0, "held signature equals the static light mark",
          "%d px differ" % int((d > 8).sum()))

    rm = shoot(chrome, url("anim.html"), os.path.join(tmp, "rm.png"), 300, reduced=True)
    d = np.abs(rm - ref)
    check(int((d > 8).sum()) == 0, "reduced motion shows the complete mark",
          "%d px differ" % int((d > 8).sum()))

    cols, rows = 3, (len(SAMPLES) + 2) // 3
    sheet = Image.new("RGB", (S.W * cols, S.H * rows), (12, 12, 12))
    dr = ImageDraw.Draw(sheet)
    for i, (ms, a) in enumerate(frames):
        x, y = (i % cols) * S.W, (i // cols) * S.H
        sheet.paste(Image.open(os.path.join(tmp, "t%d.png" % ms)).convert("RGB"), (x, y))
        dr.text((x + 10, y + 8), "%d ms" % ms, fill=(249, 84, 42))
    sheet.save(os.path.join(HERE, "_verify_frames.png"))
    print("  wrote _verify_frames.png")


if __name__ == "__main__":
    geometry()
    if "--browser" in sys.argv:
        browser()
    print("\n%s" % ("all checks passed" if not fails
                    else "FAILED: " + "; ".join(fails)))
    sys.exit(1 if fails else 0)
