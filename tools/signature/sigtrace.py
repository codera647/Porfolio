"""Outline pass: potrace the upscaled mask into cubic bezier subpaths."""
import numpy as np, potrace, sigcore as S

def fmt(v):
    s = f"{v:.2f}".rstrip('0').rstrip('.')
    return '0' if s in ('-0', '', '-') else s

def trace_outline(mask, up=S.UP, alphamax=1.0, opttolerance=0.2, turdsize=3):
    # potracer inverts its input internally, so hand it the complement
    bmp = potrace.Bitmap(~mask.astype(bool))
    path = bmp.trace(turdsize=turdsize, alphamax=alphamax,
                     opticurve=True, opttolerance=opttolerance)
    out = []
    for curve in path:
        sp = curve.start_point
        d = [f"M{fmt(sp.x/up)} {fmt(sp.y/up)}"]
        for seg in curve:
            e = seg.end_point
            if seg.is_corner:
                c = seg.c
                d.append(f"L{fmt(c.x/up)} {fmt(c.y/up)}L{fmt(e.x/up)} {fmt(e.y/up)}")
            else:
                a, b = seg.c1, seg.c2
                d.append(f"C{fmt(a.x/up)} {fmt(a.y/up)} {fmt(b.x/up)} {fmt(b.y/up)} "
                         f"{fmt(e.x/up)} {fmt(e.y/up)}")
        d.append("Z")
        out.append("".join(d))
    return out
