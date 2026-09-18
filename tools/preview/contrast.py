"""Measure real rendered contrast between the hero name and what sits behind it.

    python tools/preview/contrast.py <with-name.png> <background.png>

The background shot is the same frame with the name hidden, so each ink pixel
can be compared against the exact colour it is actually sitting on - glow, split
and grain included. That is what docs/HANDOFF.md section 8 asks for: measured on
the real rendered state, not assumed.

Bounds from section 5.3:
  * pale peach on rust, normal composite            ~6.1:1
  * with orange at 22% and amber at 12% over rust   ~4.5:1
"""
import sys
import numpy as np
from PIL import Image

FLOOR = 4.5  # the stated bound for the brightest glow over rust


def srgb_to_linear(c):
    c = c / 255.0
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def luminance(rgb):
    lin = srgb_to_linear(rgb.astype(float))
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    hi, lo = np.maximum(la, lb), np.minimum(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def main(with_name: str, background: str):
    fg = np.asarray(Image.open(with_name).convert("RGB"), dtype=np.int16)
    bg = np.asarray(Image.open(background).convert("RGB"), dtype=np.int16)
    if fg.shape != bg.shape:
        raise SystemExit(f"shots differ in size: {fg.shape} vs {bg.shape}")

    # Solid ink only. A contrast bound is about the text colour against the
    # background colour; anti-aliased edges are blends of the two and would
    # report a ratio no one ever reads. The name's gradient runs #F8F8F8 to
    # #F0DFD6, so fully covered ink always has a minimum channel of at least
    # 214 - anything below that is a partially covered edge pixel. The mask is
    # then eroded once so no edge survives on a technicality.
    diff = np.abs(fg - bg).sum(axis=2)
    solid = fg.min(axis=2) >= 210
    ink = (diff > 90) & solid
    ink = (
        ink
        & np.roll(ink, 1, 0) & np.roll(ink, -1, 0)
        & np.roll(ink, 1, 1) & np.roll(ink, -1, 1)
    )
    if ink.sum() < 200:
        raise SystemExit("found almost no ink pixels; are these the right shots?")

    ratios = contrast(fg[ink], bg[ink])
    ys, xs = np.nonzero(ink)
    worst = int(np.argmin(ratios))

    print(f"ink pixels compared : {ink.sum()}")
    print(f"contrast min        : {ratios.min():.2f}:1  at x={xs[worst]} y={ys[worst]}")
    print(f"         median     : {np.median(ratios):.2f}:1")
    print(f"         max        : {ratios.max():.2f}:1")
    print(f"  ink there  RGB {tuple(int(v) for v in fg[ys[worst], xs[worst]])}")
    print(f"  behind it  RGB {tuple(int(v) for v in bg[ys[worst], xs[worst]])}")

    below = ratios < FLOOR
    print(f"\npixels under the {FLOOR}:1 bound: {below.sum()} "
          f"({100 * below.mean():.3f}%)")
    ok = ratios.min() >= FLOOR
    print("PASS" if ok else "FAIL", f"- brightest glow over rust vs the {FLOOR}:1 bound")
    return 0 if ok else 1


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    sys.exit(main(sys.argv[1], sys.argv[2]))
