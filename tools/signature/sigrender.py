"""Rasterise SVG path data locally (matplotlib) so traces can be checked."""
import re, numpy as np
from matplotlib.path import Path
from matplotlib.transforms import Affine2D

TOK = re.compile(r'([MLCZmlcz])|(-?\d*\.?\d+(?:e-?\d+)?)')

def parse_d(d):
    """Absolute M/L/C/Z only (what sigtrace emits) -> matplotlib Path."""
    verts, codes = [], []
    cmd = None; nums = []
    def flush():
        nonlocal nums
        nums = []
    i = 0
    toks = [(m.group(1), m.group(2)) for m in TOK.finditer(d)]
    buf = []
    for c, n in toks:
        if c:
            if cmd: apply(cmd, buf)
            cmd, buf = c, []
        else:
            buf.append(float(n))
    if cmd: apply(cmd, buf)
    return Path(np.array(verts), np.array(codes))

def _mk():
    verts, codes = [], []
    return verts, codes

def parse_path(d):
    verts, codes = [], []
    toks = [(m.group(1), m.group(2)) for m in TOK.finditer(d)]
    cmd, buf = None, []

    def emit(c, b):
        if c == 'M':
            for k in range(0, len(b), 2):
                verts.append((b[k], b[k+1]))
                codes.append(Path.MOVETO if k == 0 else Path.LINETO)
        elif c == 'L':
            for k in range(0, len(b), 2):
                verts.append((b[k], b[k+1])); codes.append(Path.LINETO)
        elif c == 'C':
            for k in range(0, len(b), 6):
                verts.extend([(b[k], b[k+1]), (b[k+2], b[k+3]), (b[k+4], b[k+5])])
                codes.extend([Path.CURVE4]*3)
        elif c == 'Z':
            verts.append((0, 0)); codes.append(Path.CLOSEPOLY)

    for c, n in toks:
        if c:
            if cmd: emit(cmd, buf)
            cmd, buf = c.upper(), []
        else:
            buf.append(float(n))
    if cmd: emit(cmd, buf)
    return Path(np.array(verts, float), np.array(codes, np.uint8))

def rasterise(d, w=None, h=None, ss=2):
    """Fill `d` (even-odd) into a boolean array of shape (h, w)."""
    import sigcore as _S
    w = _S.W if w is None else w
    h = _S.H if h is None else h
    import matplotlib; matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from matplotlib.patches import PathPatch
    p = parse_path(d)
    fig = plt.figure(figsize=(w*ss/100, h*ss/100), dpi=100)
    ax = fig.add_axes([0, 0, 1, 1]); ax.set_xlim(0, w); ax.set_ylim(h, 0); ax.axis('off')
    ax.add_patch(PathPatch(p, facecolor='black', edgecolor='none', lw=0, fill=True))
    fig.canvas.draw()
    buf = np.asarray(fig.canvas.buffer_rgba())[..., 0]
    plt.close(fig)
    from PIL import Image
    small = np.array(Image.fromarray(buf).resize((w, h), Image.BOX))
    return small < 128
