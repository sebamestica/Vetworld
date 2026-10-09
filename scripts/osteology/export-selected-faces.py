"""Run in Blender's Text Editor on the annotation workspace after manual selection."""
import bpy
import hashlib
import json
from pathlib import Path

obj = bpy.context.active_object
if obj is None or obj.type != "MESH" or "source_face_index" not in obj.data.attributes:
    candidates = [item for item in bpy.context.scene.objects if item.type == "MESH" and "source_face_index" in item.data.attributes]
    if len(candidates) != 1:
        raise RuntimeError("Activate the mesh of feline_annotation.blend")
    obj = candidates[0]
obj.update_from_editmode()
attribute = obj.data.attributes["source_face_index"]
indices = sorted(attribute.data[face.index].value for face in obj.data.polygons if face.select)
if not indices or len(indices) == len(obj.data.polygons):
    raise RuntimeError("Select a proper subset manually; do not label the whole animal as a bone")
workspace = Path(bpy.data.filepath).resolve().parent
if workspace.name != "feline" or workspace.parent.name != "segmentation" or workspace.parent.parent.name != "workbench":
    raise RuntimeError("Use the private annotation workspace")
signature = hashlib.sha256(json.dumps(indices).encode()).hexdigest()
target = workspace / f"selected-faces-{signature}.json"
with target.open("x", encoding="utf-8") as output:
    json.dump({"sourceSha256": obj["sourceSha256"], "faceIndices": indices,
               "identityStatus": "manual_selection_requires_identification_and_review"}, output, indent=2)
print(f"Private selection exported: {target}")
