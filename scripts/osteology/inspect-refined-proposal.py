"""Reinspección del GLB privado refinado (2026-10-31): conteos por nodo, suma, render y .blend reabierto.

Uso: blender --background --factory-startup --python-exit-code 1 --python scripts/osteology/inspect-refined-proposal.py -- <glb relativo>
No modifica el GLB ni el original; las etiquetas son hipótesis privadas.
"""
import bpy
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import numpy as np  # noqa: E402
import feline_seg_common as common  # noqa: E402

args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
if len(args) != 1:
    raise RuntimeError("Indicar ruta relativa del GLB de propuesta")
glb = (common.ROOT / args[0]).resolve()
work = common.ROOT / "workbench/segmentation/feline/refined-2026-10-31"
review = json.loads((work / "proposals.json").read_text(encoding="utf-8-sig"))
expected = {f"proposal-{g['proposalId']}": len(g["faceIndices"]) for g in review["groups"]}
expected["unidentified-remainder"] = common.TRIANGLES - sum(expected.values())
glb_sha = common.sha256(glb)
if glb.name != f"proposal-{glb_sha}.glb":
    raise RuntimeError("El nombre no coincide con el SHA-256 del GLB")
source_sha = common.sha256(common.SOURCE)
if source_sha != common.SOURCE_SHA256:
    raise RuntimeError("Original alterado")

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(glb))
counts = {o.name: len(o.data.polygons) for o in bpy.context.scene.objects if o.type == "MESH"}
if counts != expected:
    raise RuntimeError(f"Conteos por nodo distintos: {counts} vs {expected}")
assert sum(counts.values()) == common.TRIANGLES
palette = [(.15, .45, .85, 1), (.9, .45, .1, 1), (.2, .75, .4, 1), (.8, .2, .5, 1), (.6, .4, .9, 1), (.95, .8, .15, 1), (.1, .7, .75, 1)]
scene = bpy.context.scene
for i, obj in enumerate(sorted((o for o in scene.objects if o.type == "MESH"), key=lambda o: o.name)):
    material = bpy.data.materials.new(obj.name + "-review")
    material.diffuse_color = (.6, .6, .6, 1) if obj.name == "unidentified-remainder" else palette[i % len(palette)]
    obj.data.materials.clear()
    obj.data.materials.append(material)
    obj["identityStatus"] = "proposal_not_approved"
    obj["side"] = "unknown"
scene["scientificReview"] = "pending"
scene["sourceSha256"] = common.SOURCE_SHA256
scene["proposalGlbSha256"] = glb_sha
scene.render.engine = "BLENDER_WORKBENCH"
scene.display.shading.color_type = "MATERIAL"
scene.display.shading.light = "STUDIO"
scene.display.shading.show_cavity = True
scene.display.shading.background_type = "WORLD"
if scene.world is None:
    scene.world = bpy.data.worlds.new("review-world")
scene.world.color = (.08, .08, .08)
scene.render.resolution_x = scene.render.resolution_y = 1000
scene.render.resolution_percentage = 100
points = np.array([list(o.matrix_world @ v.co) for o in scene.objects if o.type == "MESH" for v in o.data.vertices])
lo, hi = points.min(0), points.max(0)
renders = common.render_views(scene, common.ROOT / "workbench/inspection/feline-oct31/export-check", "export", (lo + hi) / 2,
                              float((hi - lo).max() * 1.08), ["from-neg-y", "from-pos-y", "from-pos-z", "from-neg-x"])
target = work / "refined-surface-proposals.blend"
if target.exists():
    raise RuntimeError("Escena existente preservada; borrar manualmente para regenerar")
bpy.ops.wm.save_as_mainfile(filepath=str(target))
bpy.ops.wm.open_mainfile(filepath=str(target))
reopened = {o.name: len(o.data.polygons) for o in bpy.context.scene.objects if o.type == "MESH"}
assert reopened == expected, reopened
assert bpy.context.scene["scientificReview"] == "pending"
report = {"glb": common.rel(glb), "glbSha256": glb_sha, "glbBytes": glb.stat().st_size, "sourceSha256": source_sha,
          "nodeFaces": counts, "sum": sum(counts.values()), "blend": common.rel(target), "blendSha256": common.sha256(target),
          "savedAndReopened": True, "renders": renders, "newAnatomyGenerated": False, "anatomicallyAcceptedBones": 0,
          "previewOnly": True, "side": "unknown"}
common.write_json(work / "export-inspection.json", report)
print(json.dumps({k: v for k, v in report.items() if k != "renders"}, indent=1))
