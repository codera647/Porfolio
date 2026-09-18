"""Cleaned skeleton multigraph + directional pen walk."""
import numpy as np, sigcore as S
from skimage.morphology import skeletonize

BRIDGE_MERGE = 7.0   # native px: chains shorter than this merge their end nodes
SPUR_PRUNE   = 5.0   # native px: dead-end chains shorter than this are dropped

class Edge:
    __slots__ = ('pts', 'a', 'b', 'used', 'idx')
    def __init__(self, pts, a, b, idx):
        self.pts, self.a, self.b, self.idx, self.used = pts, a, b, idx, False
    def length(self): return S.arclen(self.pts)
    def oriented(self, frm):
        """Points ordered so they start at vertex `frm`."""
        return self.pts if frm == self.a else self.pts[::-1]
    def other(self, frm): return self.b if frm == self.a else self.a

class DSU:
    def __init__(self): self.p = {}
    def find(self, x):
        self.p.setdefault(x, x)
        while self.p[x] != x:
            self.p[x] = self.p[self.p[x]]; x = self.p[x]
        return x
    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra != rb: self.p[ra] = rb

def build(sk):
    nodes, chains = S.skeleton_graph(sk)
    geo = [S.to_xy(c) for c in chains]
    dsu = DSU()
    for c in chains:
        dsu.find(c[0]); dsu.find(c[-1])
    # merge node clusters across short bridges
    for c, g in zip(chains, geo):
        ends_deg = [len(S.neighbours(sk, *e)) for e in (c[0], c[-1])]
        if S.arclen(g) < BRIDGE_MERGE and 1 not in ends_deg:
            dsu.union(c[0], c[-1])

    edges, verts = [], {}
    for c, g in zip(chains, geo):
        a, b = dsu.find(c[0]), dsu.find(c[-1])
        L = S.arclen(g)
        if a == b and L < BRIDGE_MERGE:      # swallowed by a cluster
            continue
        e = Edge(g, a, b, len(edges))
        edges.append(e)
        verts.setdefault(a, []).append(e)
        verts.setdefault(b, []).append(e)

    # prune short dead-end spurs, repeatedly
    changed = True
    while changed:
        changed = False
        for e in list(edges):
            if e.used: continue
            if e.length() >= SPUR_PRUNE: continue
            if len(verts.get(e.a, [])) == 1 or len(verts.get(e.b, [])) == 1:
                edges.remove(e)
                for v in (e.a, e.b):
                    if e in verts.get(v, []): verts[v].remove(e)
                    if not verts[v]: del verts[v]
                changed = True
    # vertex positions (mean of incident chain ends at that vertex)
    vpos = {}
    for v, es in sorted(verts.items()):
        pts = [e.pts[0] if e.a == v else e.pts[-1] for e in es]
        vpos[v] = np.mean(pts, axis=0)
    return edges, verts, vpos

def walk(edges, verts, vpos, start_edge, start_vertex):
    """Follow the skeleton, at each vertex preferring the branch that best
    continues the incoming direction. Returns a list of point arrays (run)."""
    run, e, v = [], start_edge, start_vertex
    while True:
        e.used = True
        pts = e.oriented(v)
        run.append(pts)
        v = e.other(v)
        indir = S.direction(pts, at_end=True)
        cands = sorted((x for x in verts.get(v, []) if not x.used), key=lambda e: e.idx)
        if not cands:
            break
        best, bestscore = None, -2.0
        for c in cands:
            out = S.direction(c.oriented(v), at_end=False)
            sc = float(np.dot(indir, out))
            if sc > bestscore: best, bestscore = c, sc
        if bestscore < -0.55:   # a hairpin reversal is not a pen movement
            break
        e = best
    return run

def all_runs(edges, verts, vpos, seed_order=None):
    """Greedy cover: start from leftmost unused endpoint (degree-1), then any."""
    runs = []
    def deg(v): return len([e for e in verts.get(v, []) if not e.used])
    while True:
        ends = sorted((round(float(vpos[v][0]), 3), round(float(vpos[v][1]), 3), v) for v in verts if deg(v) == 1)
        if ends:
            v = ends[0][2]
        else:
            rem = [e for e in edges if not e.used]
            if not rem: break
            e0 = max(rem, key=lambda e: (e.length(), -e.idx))
            v = e0.a
        cand = sorted((e for e in verts[v] if not e.used), key=lambda e: e.idx)
        if not cand: break
        runs.append(walk(edges, verts, vpos, cand[0], v))
    return runs
