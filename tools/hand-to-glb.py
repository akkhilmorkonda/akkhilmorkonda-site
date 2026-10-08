"""GT Medical Robotics hand (PhantomLimb.stl) to a grouped, decimated GLB for the exploded view.

The STL is one mesh, so parts are recovered as connected bodies and named by shape and position:
palm, palm hardware, back plate, thumb base/proximal/distal, and per finger (f1 to f4, from -x to +x) base, proximal,
middle and distal segments. Small hardware bodies join the nearest named part.

  python tools/hand-to-glb.py PhantomLimb.stl public/models/hand.glb
Needs trimesh, numpy, scipy, fast-simplification.
"""
import sys
import numpy as np
import trimesh

src, out = sys.argv[1], sys.argv[2]
KEEP = float(sys.argv[3]) if len(sys.argv) > 3 else .32          # fraction of faces kept on big bodies

mesh = trimesh.load(src)
bodies = mesh.split(only_watertight=False)
bodies.sort(key=lambda b: -len(b.faces))

FINGER_X = [-68.0, -43.0, -15.0, 13.0]
SEG = {3414: 'base', 12178: 'proximal', 10570: 'middle', 10470: 'distal'}
named, small = [], []
for i, b in enumerate(bodies):
    c, n = b.bounds.mean(0), len(b.faces)
    if i == 0:
        named.append(('palm', b))
    elif i == 1:
        named.append(('backplate', b))
    elif n in SEG and c[1] > 95:
        f = int(np.argmin([abs(c[0] - x) for x in FINGER_X])) + 1
        named.append((f'f{f}_{SEG[n]}', b))
    elif n > 5000 and c[2] < -25:                                   # thumb chain runs along +x at the palm's front
        named.append(('thumb', b))
    else:
        small.append(b)

# thumb segments ordered along +x
thumbs = sorted([b for k, b in named if k == 'thumb'], key=lambda b: b.bounds.mean(0)[0])
named = [(k, b) for k, b in named if k != 'thumb'] + list(zip(['thumb_base', 'thumb_proximal', 'thumb_distal'], thumbs))

# hardware joins the named part whose bounding box is closest to its centre
def box_dist(p, b):
    lo, hi = b.bounds
    return np.linalg.norm(np.maximum(0, np.maximum(lo - p, p - hi)))
groups = {k: [b] for k, b in named}
for b in small:
    c = b.bounds.mean(0)
    k = min(named, key=lambda kb: box_dist(c, kb[1]))[0]
    if k == 'palm':
        k = 'palm_hw'                                               # palm hardware explodes on its own
    groups.setdefault(k, []).append(b)

scene = trimesh.Scene()
total = 0
for k, parts in groups.items():
    ms = []
    for b in parts:
        n = len(b.faces)
        if n > 600:
            b = b.simplify_quadric_decimation(face_count=max(300, int(n * KEEP)))
        ms.append(b)
    m = trimesh.util.concatenate(ms)
    m.merge_vertices()
    total += len(m.faces)
    scene.add_geometry(m, node_name=k, geom_name=k)
    print(f'{k:16s} bodies {len(parts):3d}  faces {len(m.faces):6d}')
scene.export(out)
print('total faces', total)
