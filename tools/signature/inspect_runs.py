"""Contact sheet of the raw pen runs, one tile each, with the rest of the
signature greyed behind it. Run this when sigstrokes.FINGERPRINT stops
matching, to re-read which run id is which letter before editing GROUPS.

    python inspect_runs.py   ->  _runs.png
"""
import numpy as np, sigcore as S, siggraph as G
from skimage.morphology import skeletonize
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt

sk = skeletonize(S.load_mask())
edges, verts, vpos = G.build(sk)
runs = G.all_runs(edges, verts, vpos)
allpts = [np.vstack(r) for r in runs]
n = len(runs); cols = 4; rows = (n + cols - 1)//cols
fig, axes = plt.subplots(rows, cols, figsize=(cols*4.2, rows*2.6), dpi=90)
for i, ax in enumerate(axes.ravel()):
    ax.set_xlim(0,564); ax.set_ylim(324,0); ax.set_aspect('equal'); ax.axis('off')
    if i >= n: continue
    for p in allpts: ax.plot(p[:,0], p[:,1], color='0.88', lw=0.7)
    p = allpts[i]
    d = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(p,axis=0).T))])
    ax.scatter(p[:,0], p[:,1], c=d, cmap='cool', s=2.5)
    ax.plot(*p[0], 'go', ms=5); ax.plot(*p[-1], 'rs', ms=5)
    ax.set_title(f'{i}  len={d[-1]:.0f}  x[{p[:,0].min():.0f},{p[:,0].max():.0f}]', fontsize=9)
fig.tight_layout()
fig.savefig(r'D:/Porfolio/tools/signature/_runs.png', bbox_inches='tight', facecolor='white')
print('ok', n)
