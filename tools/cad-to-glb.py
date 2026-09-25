"""Convert the MediScan (I2CE VIP, Cluster 4) PCB STEP exports into small, grouped GLBs for the site.

Each output GLB has one mesh per functional group (board, led, pd, esp32, ...), in millimetres,
Y up, centred on the board, so three.js can explode and highlight groups by name.

Not part of the deploy. Needs: pip install cascadio trimesh numpy
Usage: python tools/cad-to-glb.py <path to VIP/2026 folder>
"""
import sys, collections
from pathlib import Path
import numpy as np
import cascadio, trimesh

SRC = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
OUT = Path(__file__).resolve().parent.parent / 'public' / 'models'
BOARDS = {
    'mediscan-naat': SRC / 'naat' / 'NAATModule3DModelV2.step',
    'mediscan-hybrid': SRC / 'hybrid' / 'HybridDevice3DModel.step',
}


def components(glb):
    """Group meshes by the component instance that sits under the PCB assembly."""
    s = trimesh.load(glb)
    par = {e[1]: e[0] for e in s.graph.to_edgelist()}
    comp = collections.defaultdict(list)
    for n in s.graph.nodes_geometry:
        T, g = s.graph[n]
        geo = s.geometry[g]
        if not hasattr(geo, 'faces'):
            continue
        m = geo.copy()
        m.apply_transform(T)
        m.apply_scale(1000)  # metres to mm
        anc, x = [], n
        while x in par:
            x = par[x]
            anc.append(x)
        i = anc.index('PCB') if 'PCB' in anc else -1
        key = anc[i - 2] if i >= 2 else (anc[0] if anc else n)
        comp[key].append((n, anc, m))
    return comp


def classify(name, parts, mesh):
    txt = ' '.join([n for n, _, _ in parts] + [a for _, anc, _ in parts for a in anc[:2]])
    e = mesh.extents
    if e[0] > 15 and e[1] > 50:
        return 'board'
    if 'TEMD6200' in txt or 'Vishay s' in txt:
        return 'pd'
    if 'Lite-On' in txt:
        return 'led'
    if 'Espressif' in txt or ('antenna' in txt and 'shell' in txt):
        return 'esp32'
    if 'USB4085' in txt:
        return 'usbc'
    if 'Silicon Lab' in txt:
        return 'uart'
    if 'Texas' in txt:
        return 'boost'
    if '532611071' in txt or 'Molex' in txt:
        return 'conn'
    if e[0] > 9 and e[1] > 9 and e[2] > 2:
        return 'inductor'
    if 'Vishay logo' in txt and max(e[0], e[1]) > 4:
        return 'power'
    if max(e[0], e[1]) > 5.5 and e[2] > 5.5 and len(mesh.faces) < 50:  # tactile switches are plain boxes
        return 'button'
    if abs(e[0] - 7.6) < .3 or abs(e[0] - 5.6) < .3:
        return 'conn'
    if e[0] > 20 and e[1] < 5:
        return 'display'
    if max(e[0], e[1]) > 4:
        return 'power'
    return 'passive'


def build(key, step):
    raw = OUT / f'{key}.raw.glb'
    cascadio.step_to_glb(str(step), str(raw), tol_linear=0.05, tol_angular=0.5)
    comp = components(raw)
    raw.unlink()
    groups = collections.defaultdict(list)
    for name, parts in comp.items():
        mesh = trimesh.util.concatenate([m for _, _, m in parts])
        g = classify(str(name), parts, mesh)
        if key == 'mediscan-naat' and name == '64':
            g = 'mosfet'
        groups[g].append(mesh)
    merged = {g: trimesh.util.concatenate(ms) for g, ms in groups.items()}
    board = merged['board']
    c = board.bounds.mean(0)
    c[2] = board.bounds[1][2]  # top copper at y = 0
    # CAD is Z up; the site is Y up. Rotate -90 deg about X so the component side faces +Y.
    R = trimesh.transformations.rotation_matrix(-np.pi / 2, [1, 0, 0])
    scene = trimesh.Scene()
    for g, m in merged.items():
        m.apply_translation(-c)
        m.apply_transform(R)
        m.visual = trimesh.visual.ColorVisuals(m)
        scene.add_geometry(m, node_name=g, geom_name=g)
    out = OUT / f'{key}.glb'
    scene.export(out)
    print(key, {g: len(m.faces) for g, m in merged.items()}, f'{out.stat().st_size / 1e6:.2f} MB')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for k, p in BOARDS.items():
        build(k, p)
