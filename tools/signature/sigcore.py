"""Shared helpers: mask loading, skeleton graph, chain extraction, smoothing."""
import os
import numpy as np
from PIL import Image, ImageDraw
from skimage.morphology import skeletonize

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "assets", "signature", "abdul-moiz-signature-source.png")
UP = 4                # upscale factor for tracing / skeletonising
SRC_W, SRC_H = 564, 324  # the source PNG's own canvas

# ---------------------------------------------------------------- the clipped tail
# The source PNG is cut off at its right edge: two strokes run out of frame at
# x=563, 8.5px apart. They are the two halves of the finishing flourish's closing
# curl, whose turn happens just off canvas. Both ends were measured from the
# alpha channel - sub-pixel centre, exit tangent and perpendicular width - and
# the curl is the minimal G1 cubic that joins them, with k set to the value a
# circular arc of the same chord and turn would use. Nothing is invented beyond
# closing a stroke whose two ends are both visible.
#
# Re-measure with _explore_tail.py if the source is ever re-exported; if a padded
# re-export arrives, set CLOSE_TAIL = False and the whole reconstruction drops out.
CLOSE_TAIL = True
CURL = {
    "p0": (563.0, 177.18), "d0_deg": 27.0, "r0": 1.27 / 2,   # tail leaving frame
    "p1": (563.0, 185.68), "d1_deg": 49.3, "r1": 2.77 / 2,   # curl coming back
    "k": 3.5,
}
# Right hand padding. The source left margin is 41px and its right margin is 0,
# so the mark sat hard against the frame and could not be centred honestly.
# Padding to a matching 41px margin past the closed curl balances the viewBox.
PAD_RIGHT = 43 if CLOSE_TAIL else 0

W, H = SRC_W + PAD_RIGHT, SRC_H  # native coordinate space everything else uses


def _curl_points(n=600):
    """Samples along the reconstructed curl: ((x, y), radius) in native units."""
    p0 = np.array(CURL["p0"], float)
    p1 = np.array(CURL["p1"], float)
    a0, a1 = np.radians(CURL["d0_deg"]), np.radians(CURL["d1_deg"])
    d0 = np.array([np.cos(a0), np.sin(a0)])        # leaves frame, right and down
    d1 = np.array([-np.cos(a1), np.sin(a1)])       # re-enters frame, left and down
    k = CURL["k"]
    c0, c1 = p0 + k * d0, p1 - k * d1
    t = np.linspace(0, 1, n)[:, None]
    pts = ((1 - t) ** 3) * p0 + 3 * ((1 - t) ** 2) * t * c0 \
        + 3 * (1 - t) * (t ** 2) * c1 + (t ** 3) * p1
    rad = CURL["r0"] + (CURL["r1"] - CURL["r0"]) * t[:, 0]
    return pts, rad


def _curl_layer(scale, ss=4):
    """Render the curl alone, anti-aliased, at `scale` x native resolution."""
    pts, rad = _curl_points()
    img = Image.new("L", (W * scale * ss, H * scale * ss), 0)
    d = ImageDraw.Draw(img)
    for (x, y), r in zip(pts, rad):
        s = scale * ss
        d.ellipse([(x - r) * s, (y - r) * s, (x + r) * s, (y + r) * s], fill=255)
    return np.array(img.resize((W * scale, H * scale), Image.BOX))


def source_alpha(scale=1):
    """The padded alpha channel at `scale` x native, curl closed if enabled."""
    a = np.array(Image.open(SRC))[..., 3]
    src = Image.fromarray(a).resize((SRC_W * scale, H * scale), Image.LANCZOS)
    out = np.zeros((H * scale, W * scale), np.uint8)
    out[:, : SRC_W * scale] = np.array(src)
    if CLOSE_TAIL:
        out = np.maximum(out, _curl_layer(scale))
    return out


def native_mask():
    """Binary ink at native resolution, in the padded coordinate space."""
    return source_alpha(1) > 127


def load_mask(up=UP):
    """Binary ink upscaled `up` x, for tracing and skeletonising."""
    return source_alpha(up) > 127

# ---------------------------------------------------------------- skeleton graph
N8 = [(-1,-1),(-1,0),(-1,1),(0,-1),(0,1),(1,-1),(1,0),(1,1)]

def neighbours(sk, r, c):
    out = []
    for dr, dc in N8:
        rr, cc = r + dr, c + dc
        if 0 <= rr < sk.shape[0] and 0 <= cc < sk.shape[1] and sk[rr, cc]:
            out.append((rr, cc))
    return out

def skeleton_graph(sk):
    """Return (nodes, chains). nodes = set of (r,c) with degree != 2.
    chains = list of pixel polylines joining two nodes (or a closed loop)."""
    pts = list(zip(*np.nonzero(sk)))
    deg = {p: len(neighbours(sk, *p)) for p in pts}
    nodes = {p for p, d in deg.items() if d != 2}
    chains, seen = [], set()

    def walk(start, first):
        chain = [start, first]
        seen.add(frozenset((start, first)))
        prev, cur = start, first
        while cur not in nodes:
            nxt = [n for n in neighbours(sk, *cur) if n != prev]
            # in an 8-connected skeleton a degree-2 pixel can still list a
            # diagonal shortcut; prefer the unvisited one
            nxt = [n for n in nxt if frozenset((cur, n)) not in seen] or nxt
            if not nxt:
                break
            prev, cur = cur, nxt[0]
            seen.add(frozenset((prev, cur)))
            chain.append(cur)
        return chain

    for n in sorted(nodes):
        for nb in sorted(neighbours(sk, *n)):
            if frozenset((n, nb)) in seen:
                continue
            chains.append(walk(n, nb))
    # pure loops (no node at all): pick any unvisited pixel
    for p in sorted(pts):
        if all(frozenset((p, nb)) in seen for nb in neighbours(sk, *p)):
            continue
        nb = sorted(n for n in neighbours(sk, *p) if frozenset((p, n)) not in seen)
        if nb:
            ch = walk(p, nb[0])
            chains.append(ch)
    return nodes, chains

# ---------------------------------------------------------------- geometry utils
def to_xy(chain, up=UP):
    return np.array([[c / up, r / up] for r, c in chain], float)

def arclen(p):
    return float(np.sum(np.hypot(*np.diff(p, axis=0).T))) if len(p) > 1 else 0.0

def resample(p, step=1.0):
    """Even arc-length resampling."""
    if len(p) < 2:
        return p
    d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(p, axis=0).T))])
    if d[-1] < 1e-9:
        return p[:1]
    n = max(2, int(round(d[-1] / step)) + 1)
    t = np.linspace(0, d[-1], n)
    return np.column_stack([np.interp(t, d, p[:, 0]), np.interp(t, d, p[:, 1])])

def chaikin(p, iters=2, closed=False):
    for _ in range(iters):
        if len(p) < 3:
            return p
        q = [p[0]] if not closed else []
        for i in range(len(p) - 1):
            a, b = p[i], p[i + 1]
            q.append(0.75 * a + 0.25 * b)
            q.append(0.25 * a + 0.75 * b)
        if not closed:
            q.append(p[-1])
        p = np.array(q)
    return p

def smooth_ma(p, k=5):
    """Moving average that pins the endpoints."""
    if len(p) < k + 2:
        return p
    ker = np.ones(k) / k
    pad = k // 2
    q = np.pad(p, ((pad, pad), (0, 0)), mode='edge')
    s = np.column_stack([np.convolve(q[:, 0], ker, 'valid'),
                         np.convolve(q[:, 1], ker, 'valid')])
    s[0], s[-1] = p[0], p[-1]
    return s

def direction(p, at_end=True, span=8):
    """Unit tangent at an end of a polyline."""
    if len(p) < 2:
        return np.array([1.0, 0.0])
    if at_end:
        a, b = p[max(0, len(p) - 1 - span)], p[-1]
    else:
        a, b = p[min(len(p) - 1, span)], p[0]
    v = b - a
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else np.array([1.0, 0.0])
