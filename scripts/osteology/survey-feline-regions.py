"""Reconocimiento privado: vistas ortogonales completas y por región/semiespacio.

Solo lectura de la anotación. Las mallas de render se construyen en memoria con
subconjuntos de caras fuente; no se guardan. Salida: workbench/inspection/feline-oct31/survey.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
import feline_seg_common as common  # noqa: E402

out = common.ROOT / "workbench/inspection/feline-oct31/survey"
world, tris = common.load_annotation()
topo = common.Topology(world, tris)
everything = np.ones(len(tris), dtype=bool)
labels = topo.components(everything)
sizes = np.bincount(labels)
sizes = np.sort(sizes[sizes > 0])[::-1]
lo, hi = world.min(0), world.max(0)
report = {"sourceSha256": common.SOURCE_SHA256, "triangles": int(len(tris)),
          "weldedComponents": int(len(sizes)), "largestComponents": sizes[:6].tolist(),
          "manifoldAdjacencies": int(len(topo.pairs)), "boundaryEdges": topo.boundary_edges,
          "nonManifoldEdges": topo.nonmanifold_edges, "boundsMin": lo.round(5).tolist(), "boundsMax": hi.round(5).tolist(),
          "renders": []}

scene = common.fresh_scene()
y = topo.centroid[:, 1]
positive = np.flatnonzero(y >= 0)
negative = np.flatnonzero(y < 0)
common.mesh_from_faces("half-y-positive", world, tris, positive, (.85, .55, .25, 1))
common.mesh_from_faces("half-y-negative", world, tris, negative, (.35, .6, .85, 1))
center = (lo + hi) / 2
report["renders"] += common.render_views(scene, out, "full", center, float((hi - lo).max() * 1.1), list(common.VIEWS))
regions = {
    "head": ((-5.4, 0.5, 5.0), 2.6),
    "shoulder": ((-2.6, 0, 4.4), 2.6),
    "forelimb": ((-2.0, 0, 2.2), 5.0),
    "pelvis": ((3.9, 0.2, 4.3), 2.6),
    "hindlimb": ((3.0, 0, 2.4), 5.4),
}
for name, (c, scale) in regions.items():
    report["renders"] += common.render_views(scene, out, name, np.array(c), scale, list(common.VIEWS))
report["note"] = "Colores = semiespacio de escena y>=0 (naranja) / y<0 (azul); no lateralidad anatómica."
common.write_json(out / "survey-report.json", report)
print({k: v for k, v in report.items() if k != "renders"})
