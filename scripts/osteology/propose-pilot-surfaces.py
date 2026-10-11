"""Private coordinate ROIs for reviewing shaft surfaces; not anatomical bone boundaries."""
import bpy
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
folder = root / "workbench/segmentation/feline/pilot"
folder.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(root / "workbench/segmentation/feline/feline_annotation.blend"))
obj = next(obj for obj in bpy.context.scene.objects if obj.type == "MESH")
attribute = obj.data.attributes["source_face_index"]
# ROIs estimated from inspected technical Y/Z close-ups. Intentionally central
# surfaces; excluded endpoints are NOT claimed anatomical segmentation limits.
regions = [
    ("humeral-shaft-surface", "feline:humerus", "Humerus", "brachium", (-2.6, -1.75), (2.75, 3.2)),
    ("femoral-shaft-surface", "feline:femur", "Os femoris", "pelvic-limb", (2.45, 3.35), (3.3, 3.65)),
    ("tibial-shaft-surface", "feline:tibia", "Tibia", "pelvic-limb", (1.9, 2.25), (1.5, 2.65)),
]
groups = []
claimed = set()
for name, structure, latin, region, x_range, z_range in regions:
    indices = []
    for face in obj.data.polygons:
        center = obj.matrix_world @ face.center
        source_index = attribute.data[face.index].value
        if x_range[0] <= center.x <= x_range[1] and z_range[0] <= center.z <= z_range[1] and source_index not in claimed:
            indices.append(source_index)
            claimed.add(source_index)
    if not indices:
        raise RuntimeError(f"Empty ROI: {name}")
    groups.append({"proposalId": name, "proposedStructureId": structure, "canonicalLatinName": latin,
        "regionId": region, "side": "unknown", "faceIndices": sorted(indices),
        "evidence": [{"citation": "Tavernier GLB + vistas privadas de inspección", "locator": "workbench/segmentation/feline/pilot/*-y.png y *-z.png"}],
        "notes": "ROI geométrica central para revisar hipótesis de identidad. NO límites articulares, NO hueso completo, NO lateralidad comprobada. Selección por centro de cara: cortes arbitrarios solo de propuesta privada, no anatomía reconstruida. No admitir ni publicar automáticamente."})
    print(f"{name}: {len(indices)} source faces; hypothesis only")
record = {"assetId": "feline:tavernier-skeleton", "sourceSha256": obj["sourceSha256"],
          "triangleCount": len(obj.data.polygons), "status": "draft", "reviewer": None, "groups": groups}
with (folder / "surface-proposals.json").open("x", encoding="utf-8") as output:
    json.dump(record, output, indent=2, ensure_ascii=False)
