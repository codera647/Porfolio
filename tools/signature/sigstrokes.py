"""Order the pen runs into the stroke sequence the brief calls for.

Group order (docs/HANDOFF.md s3):
    capital A -> crossbar -> b/d/u/l -> m -> o/i/z -> i dot -> finishing underline

Run ids come from the deterministic walk in siggraph.all_runs. Each group lists
its runs with a fingerprint (length, start point) so the mapping fails loudly if
the upstream trace ever changes rather than silently animating the wrong order.
"""
import numpy as np, sigcore as S, siggraph as G
from skimage.morphology import skeletonize

# run id -> (expected length, expected start x, expected start y), rounded
FINGERPRINT = {
    0: (53, 154, 184), 1: (10, 165, 144), 2: (162, 244, 186), 3: (1152, 250, 147),
    4: (156, 179, 144), 5: (147, 276, 140), 6: (10, 296, 154), 7: (69, 314, 144),
    8: (25, 332, 198), 9: (16, 352, 184), 10: (215, 378, 149), 11: (11, 380, 179),
    12: (11, 397, 189), 13: (7, 417, 154), 14: (79, 440, 150), 15: (9, 463, 150),
    16: (6, 481, 136), 17: (182, 496, 168), 18: (422, 484, 184), 19: (161, 124, 145),
    20: (210, 121, 146), 21: (84, 454, 168),
}

# group name -> run ids, in reveal order (left to right within the group)
#
# Run 18 is the z descender, the flat sweep and the closing curl in one pen run;
# splitting it is what separates "the z" from "the finishing underline". Before
# sigcore closed the clipped tail there was a 23rd run - an 13px orphan at the
# frame edge, the severed tip of that curl - which had to be tacked onto the
# underline. The reconstruction absorbs it, so the flourish is now a single
# unbroken stroke ending in its taper.
GROUPS = [
    ("A",         [19, 0, 1]),
    ("crossbar",  [20]),
    ("bdul",      [4, 2, 3, 5, 6, 7, 8]),
    ("m",         [9, 10, 11, 12, 13]),
    ("oiz",       [21, 14, 15, 17, ("18", "head")]),
    ("idot",      [16]),
    ("underline", [("18", "tail")]),
]

TAIL_RUN = 18      # the z descender run, split into z body + finishing flourish
JOIN_EPS = 9.0     # px: consecutive pieces closer than this are drawn as one subpath


def build_runs():
    sk = skeletonize(S.load_mask())
    edges, verts, vpos = G.build(sk)
    runs = [np.vstack(r) for r in G.all_runs(edges, verts, vpos)]
    for i, (L, x, y) in FINGERPRINT.items():
        p = runs[i]
        got = (round(S.arclen(p)), round(p[0, 0]), round(p[0, 1]))
        if abs(got[0] - L) > 2 or abs(got[1] - x) > 2 or abs(got[2] - y) > 2:
            raise SystemExit(f"run {i} changed: expected {(L, x, y)} got {got}. "
                             "Re-inspect with inspect_runs.py and update FINGERPRINT/GROUPS.")
    return runs


def split_tail(pts, flat_deg=22.0, min_flat=20.0, lo=45.0, hi=150.0):
    """Cut the z descender where the loop ends and the finishing flourish begins.

    The flourish is the last sustained near-horizontal stretch plus the closing
    curl after it. Detect the flat stretch by heading rather than by height: the
    run no longer ends on the flat, it ends at the curl's taper tip, so any rule
    anchored on the final point lands in the wrong place."""
    n = len(pts)
    if n < 8:
        raise SystemExit("tail run is too short to split")
    span = 6
    head = np.array([
        np.degrees(np.arctan2(*(pts[min(i + span, n - 1)] - pts[i])[::-1]))
        for i in range(n)
    ])
    flat = np.abs(head) < flat_deg
    seg = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(pts, axis=0).T))])

    runs, i = [], 0
    while i < n:
        if not flat[i]:
            i += 1
            continue
        j = i
        while j + 1 < n and flat[j + 1]:
            j += 1
        if seg[j] - seg[i] >= min_flat:
            runs.append((i, j))
        i = j + 1
    if not runs:
        raise SystemExit("no flat stretch found before the finishing flourish")

    cut = runs[-1][0]
    tail_len = S.arclen(pts[cut:])
    if not (lo <= tail_len <= hi):
        raise SystemExit(f"tail split looks wrong: {tail_len:.1f}px at index {cut}")
    return pts[:cut + 1], pts[cut:]


def ordered_strokes():
    runs = build_runs()
    head, tail = split_tail(runs[TAIL_RUN])
    parts = {("18", "head"): head, ("18", "tail"): tail}
    out = []
    for name, ids in GROUPS:
        pieces = [parts[i] if isinstance(i, tuple) else runs[i] for i in ids]
        out.append((name, pieces))
    return out


def polish(p, step=1.0, ma=7, out_step=7.0):
    """Resample -> smooth -> resample for bezier fitting."""
    q = S.resample(p, step)
    q = S.smooth_ma(q, ma)
    q = S.resample(q, out_step)
    return q


def chain(pieces):
    """Merge consecutive pieces whose endpoints meet, flipping where that helps."""
    subpaths = []
    cur = None
    for p in pieces:
        if len(p) < 2:
            continue
        if cur is None:
            cur = p.copy(); continue
        d_fwd = np.linalg.norm(cur[-1] - p[0])
        d_rev = np.linalg.norm(cur[-1] - p[-1])
        if min(d_fwd, d_rev) <= JOIN_EPS:
            cur = np.vstack([cur, p if d_fwd <= d_rev else p[::-1]])
        else:
            subpaths.append(cur); cur = p.copy()
    if cur is not None:
        subpaths.append(cur)
    return subpaths


def extend_ends(sub, ink, max_ext=9.0, step=0.5):
    """Push each free end along its tangent while it stays on ink.

    Spur pruning shortens the medial axis at pointed ink tips, so the pen's round
    cap can fall short of the real end of a stroke. Walking the tangent back out
    restores the tip without widening the pen anywhere else."""
    h, w = ink.shape
    def on_ink(pt):
        x, y = int(round(pt[0])), int(round(pt[1]))
        return 0 <= x < w and 0 <= y < h and ink[y, x]
    out = sub
    for at_end in (True, False):
        d = S.direction(out, at_end=at_end, span=6)
        base = out[-1] if at_end else out[0]
        grown, t = None, step
        while t <= max_ext:
            cand = base + d * t
            if not on_ink(cand):
                break
            grown, t = cand, t + step
        if grown is not None:
            out = np.vstack([out, grown]) if at_end else np.vstack([grown, out])
    return out


def to_bezier(p, prec=1):
    """Catmull-Rom through the points, emitted as cubic beziers."""
    f = lambda v: f"{v:.{prec}f}".rstrip('0').rstrip('.') or '0'
    if len(p) < 2:
        return ""
    if len(p) == 2:
        return f"M{f(p[0,0])} {f(p[0,1])}L{f(p[1,0])} {f(p[1,1])}"
    ext = np.vstack([p[0] + (p[0] - p[1]), p, p[-1] + (p[-1] - p[-2])])
    d = [f"M{f(p[0,0])} {f(p[0,1])}"]
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i-1], ext[i], ext[i+1], ext[i+2]
        c1 = p1 + (p2 - p0) / 6.0
        c2 = p2 - (p3 - p1) / 6.0
        d.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}")
    return "".join(d)
